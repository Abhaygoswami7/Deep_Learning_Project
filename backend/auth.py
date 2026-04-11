"""
Authentication module — JWT-based auth system.
Shared identity across PadHatke and BuyHatke.
"""
import hashlib
import hmac
import json
import time
import os
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from database import get_db
from models import SignupRequest, LoginRequest, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

# JWT secret — in production use env var
SECRET_KEY = os.environ.get("JWT_SECRET", "padhatke_buyhatke_secret_key_2026")
TOKEN_EXPIRY = 86400  # 24 hours


# ==================== JWT HELPERS ====================
def _b64_encode(data: bytes) -> str:
    """URL-safe base64 encode without padding."""
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64_decode(s: str) -> bytes:
    """URL-safe base64 decode with padding restore."""
    import base64
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_token(user_id: int, username: str) -> str:
    """Create a JWT token."""
    header = _b64_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload_data = {
        "user_id": user_id,
        "username": username,
        "exp": int(time.time()) + TOKEN_EXPIRY,
        "iat": int(time.time()),
    }
    payload = _b64_encode(json.dumps(payload_data).encode())
    signature_input = f"{header}.{payload}".encode()
    signature = _b64_encode(
        hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
    )
    return f"{header}.{payload}.{signature}"


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, payload, signature = parts

        # Verify signature
        signature_input = f"{header}.{payload}".encode()
        expected_sig = _b64_encode(
            hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
        )
        if not hmac.compare_digest(signature, expected_sig):
            return None

        # Decode payload
        payload_data = json.loads(_b64_decode(payload))

        # Check expiry
        if payload_data.get("exp", 0) < time.time():
            return None

        return payload_data
    except Exception:
        return None


def hash_password(password: str) -> str:
    """Hash password using SHA-256 + salt. In production, use bcrypt."""
    salt = "padhatke_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Extract user from Authorization header."""
    if not authorization:
        return None
    try:
        scheme, token = authorization.split(" ", 1)
        if scheme.lower() != "bearer":
            return None
        return verify_token(token)
    except Exception:
        return None


# ==================== ROUTES ====================
@router.post("/signup", response_model=TokenResponse)
def signup(req: SignupRequest):
    """Create a new account."""
    db = get_db()

    # Check if username or email already exists
    existing = db.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        (req.username, req.email)
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    password_hash = hash_password(req.password)
    display_name = req.display_name or req.username

    cursor = db.execute(
        "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)",
        (req.username, req.email, password_hash, display_name)
    )
    db.commit()

    user_id = cursor.lastrowid
    token = create_token(user_id, req.username)

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            username=req.username,
            email=req.email,
            display_name=display_name,
        )
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """Login with username and password."""
    db = get_db()

    user = db.execute(
        "SELECT * FROM users WHERE username = ?",
        (req.username,)
    ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user["password_hash"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_token(user["id"], user["username"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            display_name=user["display_name"] or user["username"],
            avatar_url=user["avatar_url"] or "",
            bio=user["bio"] or "",
        )
    )


@router.get("/me", response_model=UserResponse)
def get_me(authorization: Optional[str] = Header(None)):
    """Get current authenticated user."""
    user_data = get_current_user(authorization)
    if not user_data:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_data["user_id"],)).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        display_name=user["display_name"] or user["username"],
        avatar_url=user["avatar_url"] or "",
        bio=user["bio"] or "",
        created_at=str(user["created_at"]) if user["created_at"] else "",
    )
