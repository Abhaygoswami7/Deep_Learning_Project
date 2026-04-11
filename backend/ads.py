"""
Ad system module — Ad serving, click tracking, and CTR analytics.
Ads appear in PadHatke feed and redirect to BuyHatke product pages.
"""
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/ads", tags=["Ads"])


# ==================== GET ADS FOR FEED ====================
@router.get("/feed")
def get_feed_ads(
    limit: int = Query(5, ge=1, le=20),
    authorization: Optional[str] = Header(None),
):
    """
    Get ads for feed interleaving.
    Personalized by user category preferences if logged in.
    """
    db = get_db()
    user_data = get_current_user(authorization)

    if user_data:
        # Get user's preferred categories
        prefs = db.execute("""
            SELECT category, score FROM user_preferences
            WHERE user_id = ?
            ORDER BY score DESC
            LIMIT 3
        """, (user_data["user_id"],)).fetchall()

        preferred_categories = [p["category"] for p in prefs] if prefs else []

        if preferred_categories:
            # Import products CSV to match ads with categories
            import pandas as pd
            import os
            base_dir = os.path.dirname(os.path.abspath(__file__))
            try:
                products_df = pd.read_csv(os.path.join(base_dir, "../data/products.csv"))
                preferred_product_ids = products_df[
                    products_df["category"].isin(preferred_categories)
                ]["id"].tolist()

                if preferred_product_ids:
                    placeholders = ",".join("?" * len(preferred_product_ids))
                    ads = db.execute(f"""
                        SELECT * FROM ads
                        WHERE is_active = 1 AND product_id IN ({placeholders})
                        ORDER BY RANDOM()
                        LIMIT ?
                    """, (*preferred_product_ids, limit)).fetchall()

                    if len(ads) < limit:
                        existing_ids = [a["id"] for a in ads]
                        extra_placeholders = ",".join("?" * len(existing_ids)) if existing_ids else "0"
                        more = db.execute(f"""
                            SELECT * FROM ads
                            WHERE is_active = 1 AND id NOT IN ({extra_placeholders})
                            ORDER BY RANDOM()
                            LIMIT ?
                        """, (*existing_ids, limit - len(ads))).fetchall()
                        ads = list(ads) + list(more)
                else:
                    ads = db.execute(
                        "SELECT * FROM ads WHERE is_active = 1 ORDER BY RANDOM() LIMIT ?",
                        (limit,)
                    ).fetchall()
            except Exception:
                ads = db.execute(
                    "SELECT * FROM ads WHERE is_active = 1 ORDER BY RANDOM() LIMIT ?",
                    (limit,)
                ).fetchall()
        else:
            ads = db.execute(
                "SELECT * FROM ads WHERE is_active = 1 ORDER BY RANDOM() LIMIT ?",
                (limit,)
            ).fetchall()
    else:
        ads = db.execute(
            "SELECT * FROM ads WHERE is_active = 1 ORDER BY RANDOM() LIMIT ?",
            (limit,)
        ).fetchall()

    return {
        "status": "success",
        "ads": [
            {
                "id": ad["id"],
                "product_id": ad["product_id"],
                "title": ad["title"],
                "description": ad["description"] or "",
                "image_url": ad["image_url"] or "",
                "target_url": ad["target_url"] or f"/buyhatke/product/{ad['product_id']}",
                "impressions": ad["impressions"],
                "clicks": ad["clicks"],
                "ctr": round(ad["ctr"], 4),
            }
            for ad in ads
        ]
    }


# ==================== TRACK AD CLICK ====================
@router.post("/{ad_id}/click")
def track_ad_click(ad_id: int, authorization: Optional[str] = Header(None)):
    """Track an ad click. Updates click count and CTR."""
    db = get_db()
    user_data = get_current_user(authorization)

    ad = db.execute("SELECT * FROM ads WHERE id = ?", (ad_id,)).fetchone()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")

    new_clicks = ad["clicks"] + 1
    new_impressions = max(ad["impressions"], 1)
    new_ctr = new_clicks / new_impressions

    db.execute(
        "UPDATE ads SET clicks = ?, ctr = ? WHERE id = ?",
        (new_clicks, new_ctr, ad_id)
    )

    # Also log as a behavior event
    user_id = user_data["user_id"] if user_data else 0
    db.execute("""
        INSERT INTO events (user_id, event_type, target_type, target_id, platform)
        VALUES (?, 'click', 'ad', ?, 'padhatke')
    """, (user_id, ad_id))

    db.commit()

    return {
        "status": "success",
        "ad_id": ad_id,
        "product_id": ad["product_id"],
        "clicks": new_clicks,
        "ctr": round(new_ctr, 4),
    }


# ==================== TRACK AD IMPRESSION ====================
@router.post("/{ad_id}/impression")
def track_ad_impression(ad_id: int):
    """Track an ad impression."""
    db = get_db()
    db.execute(
        "UPDATE ads SET impressions = impressions + 1 WHERE id = ?",
        (ad_id,)
    )
    # Recalculate CTR
    db.execute("""
        UPDATE ads SET ctr = CAST(clicks AS REAL) / MAX(impressions, 1)
        WHERE id = ?
    """, (ad_id,))
    db.commit()

    return {"status": "success", "ad_id": ad_id}


# ==================== AD ANALYTICS ====================
@router.get("/analytics")
def get_ad_analytics():
    """Get ad performance analytics."""
    db = get_db()
    ads = db.execute("""
        SELECT id, product_id, title, impressions, clicks, ctr, is_active
        FROM ads
        ORDER BY ctr DESC
    """).fetchall()

    total_impressions = sum(a["impressions"] for a in ads)
    total_clicks = sum(a["clicks"] for a in ads)
    avg_ctr = total_clicks / max(total_impressions, 1)

    return {
        "status": "success",
        "summary": {
            "total_ads": len(ads),
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "average_ctr": round(avg_ctr, 4),
        },
        "ads": [
            {
                "id": a["id"],
                "product_id": a["product_id"],
                "title": a["title"],
                "impressions": a["impressions"],
                "clicks": a["clicks"],
                "ctr": round(a["ctr"], 4),
                "is_active": bool(a["is_active"]),
            }
            for a in ads
        ]
    }
