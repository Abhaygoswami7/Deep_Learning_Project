"""
Feed module — PadHatke social feed API.
Posts CRUD, likes, comments, and feed with interleaved ads.
"""
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional

from database import get_db
from auth import get_current_user
from models import CreatePostRequest, CommentRequest

router = APIRouter(prefix="/feed", tags=["Feed & Posts"])


# ==================== FEED ====================
@router.get("")
def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    authorization: Optional[str] = Header(None),
):
    """
    Get paginated feed with posts and interleaved ads.
    Ads appear every 5th position.
    """
    db = get_db()
    user_data = get_current_user(authorization)
    user_id = user_data["user_id"] if user_data else 0
    offset = (page - 1) * limit

    # Fetch posts ordered by engagement + recency
    posts = db.execute("""
        SELECT p.*, u.username, u.display_name, u.avatar_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY (p.likes_count * 2 + p.comments_count + p.shares_count) DESC,
                 p.created_at DESC
        LIMIT ? OFFSET ?
    """, (limit, offset)).fetchall()

    # Fetch ads to interleave
    ads = db.execute("""
        SELECT * FROM ads WHERE is_active = 1
        ORDER BY RANDOM()
        LIMIT ?
    """, (max(1, limit // 5),)).fetchall()

    # Get user's liked posts
    liked_post_ids = set()
    if user_id:
        likes = db.execute(
            "SELECT post_id FROM post_interactions WHERE user_id = ? AND type = 'like'",
            (user_id,)
        ).fetchall()
        liked_post_ids = {r["post_id"] for r in likes}

    # Build feed with interleaved ads
    feed_items = []
    ad_index = 0

    for i, post in enumerate(posts):
        feed_items.append({
            "type": "post",
            "id": post["id"],
            "user_id": post["user_id"],
            "username": post["username"],
            "display_name": post["display_name"] or post["username"],
            "avatar_url": post["avatar_url"] or "",
            "content": post["content"],
            "image_url": post["image_url"] or "",
            "link_url": post["link_url"] or "",
            "likes_count": post["likes_count"],
            "comments_count": post["comments_count"],
            "shares_count": post["shares_count"],
            "is_liked": post["id"] in liked_post_ids,
            "created_at": str(post["created_at"]) if post["created_at"] else "",
        })

        # Insert ad every 5th position
        if (i + 1) % 5 == 0 and ads and ad_index < len(ads):
            ad = ads[ad_index]
            feed_items.append({
                "type": "ad",
                "id": ad["id"],
                "product_id": ad["product_id"],
                "title": ad["title"],
                "description": ad["description"] or "",
                "image_url": ad["image_url"] or "",
                "target_url": ad["target_url"] or "",
                "impressions": ad["impressions"],
                "clicks": ad["clicks"],
            })
            # Track impression
            db.execute(
                "UPDATE ads SET impressions = impressions + 1 WHERE id = ?",
                (ad["id"],)
            )
            ad_index += 1

    db.commit()

    total = db.execute("SELECT COUNT(*) as count FROM posts").fetchone()["count"]

    return {
        "status": "success",
        "feed": feed_items,
        "page": page,
        "total_posts": total,
        "has_more": offset + limit < total,
    }


# ==================== CREATE POST ====================
@router.post("/posts")
def create_post(
    req: CreatePostRequest,
    authorization: Optional[str] = Header(None),
):
    """Create a new post (auth required)."""
    user_data = get_current_user(authorization)
    if not user_data:
        raise HTTPException(status_code=401, detail="Login required to post")

    db = get_db()
    cursor = db.execute(
        "INSERT INTO posts (user_id, content, image_url, link_url) VALUES (?, ?, ?, ?)",
        (user_data["user_id"], req.content, req.image_url or "", req.link_url or "")
    )
    db.commit()

    post_id = cursor.lastrowid
    post = db.execute("""
        SELECT p.*, u.username, u.display_name, u.avatar_url
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    """, (post_id,)).fetchone()

    return {
        "status": "success",
        "post": {
            "id": post["id"],
            "user_id": post["user_id"],
            "username": post["username"],
            "display_name": post["display_name"] or post["username"],
            "avatar_url": post["avatar_url"] or "",
            "content": post["content"],
            "image_url": post["image_url"] or "",
            "link_url": post["link_url"] or "",
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "is_liked": False,
            "created_at": str(post["created_at"]) if post["created_at"] else "",
        }
    }


# ==================== LIKE POST ====================
@router.post("/posts/{post_id}/like")
def like_post(post_id: int, authorization: Optional[str] = Header(None)):
    """Toggle like on a post."""
    user_data = get_current_user(authorization)
    if not user_data:
        raise HTTPException(status_code=401, detail="Login required")

    db = get_db()
    user_id = user_data["user_id"]

    # Check if already liked
    existing = db.execute(
        "SELECT id FROM post_interactions WHERE user_id = ? AND post_id = ? AND type = 'like'",
        (user_id, post_id)
    ).fetchone()

    if existing:
        # Unlike
        db.execute(
            "DELETE FROM post_interactions WHERE user_id = ? AND post_id = ? AND type = 'like'",
            (user_id, post_id)
        )
        db.execute(
            "UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?",
            (post_id,)
        )
        db.commit()
        return {"status": "success", "action": "unliked", "post_id": post_id}
    else:
        # Like
        db.execute(
            "INSERT OR IGNORE INTO post_interactions (user_id, post_id, type) VALUES (?, ?, 'like')",
            (user_id, post_id)
        )
        db.execute(
            "UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?",
            (post_id,)
        )
        db.commit()
        return {"status": "success", "action": "liked", "post_id": post_id}


# ==================== COMMENT ====================
@router.post("/posts/{post_id}/comment")
def add_comment(
    post_id: int,
    req: CommentRequest,
    authorization: Optional[str] = Header(None),
):
    """Add a comment to a post."""
    user_data = get_current_user(authorization)
    if not user_data:
        raise HTTPException(status_code=401, detail="Login required")

    db = get_db()
    db.execute(
        "INSERT INTO post_interactions (user_id, post_id, type, comment_text) VALUES (?, ?, 'comment', ?)",
        (user_data["user_id"], post_id, req.text)
    )
    db.execute(
        "UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?",
        (post_id,)
    )
    db.commit()

    return {"status": "success", "post_id": post_id, "comment": req.text}


@router.get("/posts/{post_id}/comments")
def get_comments(post_id: int):
    """Get comments for a post."""
    db = get_db()
    comments = db.execute("""
        SELECT pi.*, u.username, u.display_name, u.avatar_url
        FROM post_interactions pi
        JOIN users u ON pi.user_id = u.id
        WHERE pi.post_id = ? AND pi.type = 'comment'
        ORDER BY pi.created_at DESC
    """, (post_id,)).fetchall()

    return {
        "status": "success",
        "comments": [
            {
                "id": c["id"],
                "user_id": c["user_id"],
                "username": c["username"],
                "display_name": c["display_name"] or c["username"],
                "avatar_url": c["avatar_url"] or "",
                "text": c["comment_text"],
                "created_at": str(c["created_at"]) if c["created_at"] else "",
            }
            for c in comments
        ]
    }


# ==================== SHARE ====================
@router.post("/posts/{post_id}/share")
def share_post(post_id: int, authorization: Optional[str] = Header(None)):
    """Share a post."""
    user_data = get_current_user(authorization)
    user_id = user_data["user_id"] if user_data else 0

    db = get_db()
    if user_id:
        db.execute(
            "INSERT OR IGNORE INTO post_interactions (user_id, post_id, type) VALUES (?, ?, 'share')",
            (user_id, post_id)
        )
    db.execute(
        "UPDATE posts SET shares_count = shares_count + 1 WHERE id = ?",
        (post_id,)
    )
    db.commit()

    return {"status": "success", "post_id": post_id}
