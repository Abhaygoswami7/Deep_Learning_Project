"""
Pydantic models for request/response validation.
Shared across all API modules.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ==================== AUTH ====================
class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    display_name: Optional[str] = None
    avatar_url: str = ""
    bio: str = ""
    created_at: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== POSTS ====================
class CreatePostRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    image_url: Optional[str] = ""
    link_url: Optional[str] = ""


class CommentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=300)


class PostResponse(BaseModel):
    id: int
    user_id: int
    username: str = ""
    display_name: str = ""
    avatar_url: str = ""
    content: str
    image_url: str = ""
    link_url: str = ""
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    is_liked: bool = False
    created_at: str = ""


# ==================== ADS ====================
class AdResponse(BaseModel):
    id: int
    product_id: int
    title: str
    description: str = ""
    image_url: str = ""
    target_url: str = ""
    impressions: int = 0
    clicks: int = 0
    ctr: float = 0.0


# ==================== TRACKING ====================
class TrackEventRequest(BaseModel):
    event_type: str  # click, hover, scroll, view, pause, like, share
    target_type: str = ""  # post, product, ad
    target_id: int = 0
    duration_ms: int = 0
    scroll_depth: float = 0.0
    metadata: str = "{}"
    platform: str = "buyhatke"
    session_id: str = ""


class BatchTrackRequest(BaseModel):
    events: List[TrackEventRequest]


# ==================== RECOMMENDATIONS ====================
class RecommendationItem(BaseModel):
    id: int
    name: str
    category: str
    image: str
    price: int
    score: float = 0.0
    reason: str = ""
