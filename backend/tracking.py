"""
Behavior Tracking module — Advanced user intent tracking.
Tracks clicks, hovers, scroll depth, view time, pause behavior, and engagement signals.
Computes user preference profiles from accumulated events.
"""
import json
import time
from fastapi import APIRouter, Header
from typing import Optional

from database import get_db
from auth import get_current_user
from models import TrackEventRequest, BatchTrackRequest

router = APIRouter(prefix="/track", tags=["Behavior Tracking"])

# Signal weights for preference scoring
SIGNAL_WEIGHTS = {
    "click": 3.0,
    "hover": 1.5,
    "scroll": 0.5,
    "view": 2.0,
    "pause": 1.0,
    "like": 5.0,
    "share": 5.0,
    "comment": 4.0,
    "ad_click": 4.0,
}

# Category extraction uses product data
_products_df = None


def _get_products_df():
    """Lazy-load products dataframe."""
    global _products_df
    if _products_df is None:
        import pandas as pd
        import os
        base_dir = os.path.dirname(os.path.abspath(__file__))
        try:
            _products_df = pd.read_csv(os.path.join(base_dir, "../data/products.csv"))
        except Exception:
            _products_df = None
    return _products_df


def _get_category_for_target(target_type: str, target_id: int) -> str:
    """Get category for a target item (product or ad)."""
    if target_type == "product":
        df = _get_products_df()
        if df is not None:
            product = df[df["id"] == target_id]
            if len(product) > 0:
                return product.iloc[0]["category"]
    elif target_type == "ad":
        db = get_db()
        ad = db.execute("SELECT product_id FROM ads WHERE id = ?", (target_id,)).fetchone()
        if ad:
            return _get_category_for_target("product", ad["product_id"])
    return ""


def _update_user_preferences(user_id: int, category: str, weight: float):
    """Update user preference score for a category."""
    if not category or user_id <= 0:
        return

    db = get_db()
    existing = db.execute(
        "SELECT score FROM user_preferences WHERE user_id = ? AND category = ?",
        (user_id, category)
    ).fetchone()

    if existing:
        # Additive scoring with diminishing returns
        new_score = existing["score"] + weight * 0.8
        db.execute(
            "UPDATE user_preferences SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND category = ?",
            (round(new_score, 3), user_id, category)
        )
    else:
        db.execute(
            "INSERT INTO user_preferences (user_id, category, score) VALUES (?, ?, ?)",
            (user_id, category, round(weight, 3))
        )


# ==================== SINGLE EVENT ====================
@router.post("/event")
def track_event(
    req: TrackEventRequest,
    authorization: Optional[str] = Header(None),
):
    """Log a single behavior event."""
    db = get_db()
    user_data = get_current_user(authorization)
    user_id = user_data["user_id"] if user_data else 0

    db.execute("""
        INSERT INTO events (user_id, session_id, event_type, target_type, target_id,
                           duration_ms, scroll_depth, metadata, platform)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, req.session_id, req.event_type, req.target_type,
        req.target_id, req.duration_ms, req.scroll_depth,
        req.metadata, req.platform,
    ))

    # Update preferences if user is logged in and target has a category
    if user_id > 0 and req.target_type in ("product", "ad"):
        category = _get_category_for_target(req.target_type, req.target_id)
        weight = SIGNAL_WEIGHTS.get(req.event_type, 1.0)

        # Bonus weight for longer durations
        if req.duration_ms > 5000:
            weight *= 1.5
        elif req.duration_ms > 2000:
            weight *= 1.2

        _update_user_preferences(user_id, category, weight)

    db.commit()

    return {"status": "success", "event_type": req.event_type}


# ==================== BATCH EVENTS ====================
@router.post("/batch")
def track_batch(
    req: BatchTrackRequest,
    authorization: Optional[str] = Header(None),
):
    """Log multiple behavior events in a single request (performance optimization)."""
    db = get_db()
    user_data = get_current_user(authorization)
    user_id = user_data["user_id"] if user_data else 0

    logged = 0
    for event in req.events:
        try:
            db.execute("""
                INSERT INTO events (user_id, session_id, event_type, target_type, target_id,
                                   duration_ms, scroll_depth, metadata, platform)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, event.session_id, event.event_type, event.target_type,
                event.target_id, event.duration_ms, event.scroll_depth,
                event.metadata, event.platform,
            ))

            # Update preferences
            if user_id > 0 and event.target_type in ("product", "ad"):
                category = _get_category_for_target(event.target_type, event.target_id)
                weight = SIGNAL_WEIGHTS.get(event.event_type, 1.0)
                if event.duration_ms > 5000:
                    weight *= 1.5
                elif event.duration_ms > 2000:
                    weight *= 1.2
                _update_user_preferences(user_id, category, weight)

            logged += 1
        except Exception:
            continue

    db.commit()

    return {"status": "success", "events_logged": logged, "total_sent": len(req.events)}


# ==================== USER PROFILE ====================
@router.get("/user/{user_id}/profile")
def get_user_profile(user_id: int):
    """
    Get computed user behavior profile.
    Returns category preferences, interaction stats, and recent activity.
    """
    db = get_db()

    # Category preferences
    preferences = db.execute("""
        SELECT category, score FROM user_preferences
        WHERE user_id = ?
        ORDER BY score DESC
    """, (user_id,)).fetchall()

    # Interaction stats
    stats = db.execute("""
        SELECT event_type, COUNT(*) as count, AVG(duration_ms) as avg_duration
        FROM events
        WHERE user_id = ?
        GROUP BY event_type
        ORDER BY count DESC
    """, (user_id,)).fetchall()

    # Recent events (last 20)
    recent = db.execute("""
        SELECT event_type, target_type, target_id, duration_ms, scroll_depth, platform, created_at
        FROM events
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    """, (user_id,)).fetchall()

    # Total engagement time
    total_time = db.execute(
        "SELECT SUM(duration_ms) as total FROM events WHERE user_id = ?",
        (user_id,)
    ).fetchone()

    return {
        "status": "success",
        "user_id": user_id,
        "preferences": [
            {"category": p["category"], "score": round(p["score"], 2)}
            for p in preferences
        ],
        "interaction_stats": [
            {
                "event_type": s["event_type"],
                "count": s["count"],
                "avg_duration_ms": round(s["avg_duration"] or 0, 0),
            }
            for s in stats
        ],
        "total_engagement_ms": total_time["total"] or 0,
        "recent_events": [
            {
                "event_type": r["event_type"],
                "target_type": r["target_type"],
                "target_id": r["target_id"],
                "duration_ms": r["duration_ms"],
                "scroll_depth": r["scroll_depth"],
                "platform": r["platform"],
                "created_at": str(r["created_at"]) if r["created_at"] else "",
            }
            for r in recent
        ],
    }


# ==================== PLATFORM STATS ====================
@router.get("/stats")
def get_tracking_stats():
    """Get overall tracking statistics."""
    db = get_db()

    total_events = db.execute("SELECT COUNT(*) as count FROM events").fetchone()["count"]
    unique_users = db.execute("SELECT COUNT(DISTINCT user_id) as count FROM events WHERE user_id > 0").fetchone()["count"]

    by_platform = db.execute("""
        SELECT platform, COUNT(*) as count
        FROM events
        GROUP BY platform
    """).fetchall()

    by_type = db.execute("""
        SELECT event_type, COUNT(*) as count
        FROM events
        GROUP BY event_type
        ORDER BY count DESC
    """).fetchall()

    return {
        "status": "success",
        "total_events": total_events,
        "unique_users_tracked": unique_users,
        "by_platform": {r["platform"]: r["count"] for r in by_platform},
        "by_event_type": {r["event_type"]: r["count"] for r in by_type},
    }
