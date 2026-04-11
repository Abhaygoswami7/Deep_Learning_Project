"""
Database module — SQLite setup + schema initialization.
Centralized database for both PadHatke and BuyHatke platforms.
"""
import sqlite3
import os
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "platform.db")

# Thread-local storage for connections
_local = threading.local()


def get_db() -> sqlite3.Connection:
    """Get a thread-local database connection."""
    if not hasattr(_local, "connection") or _local.connection is None:
        _local.connection = sqlite3.connect(DB_PATH)
        _local.connection.row_factory = sqlite3.Row
        _local.connection.execute("PRAGMA journal_mode=WAL")
        _local.connection.execute("PRAGMA foreign_keys=ON")
    return _local.connection


def close_db():
    """Close the thread-local database connection."""
    if hasattr(_local, "connection") and _local.connection:
        _local.connection.close()
        _local.connection = None


def init_db():
    """Initialize database tables."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    -- Users table (shared auth across both platforms)
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Posts table (PadHatke social posts)
    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        image_url TEXT DEFAULT '',
        link_url TEXT DEFAULT '',
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Post interactions (likes, comments, shares)
    CREATE TABLE IF NOT EXISTS post_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL REFERENCES posts(id),
        type TEXT NOT NULL CHECK(type IN ('like', 'comment', 'share')),
        comment_text TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id, type) ON CONFLICT IGNORE
    );

    -- Ads table (products promoted in PadHatke feed)
    CREATE TABLE IF NOT EXISTS ads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        target_url TEXT DEFAULT '',
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        ctr REAL DEFAULT 0.0,
        is_active INTEGER DEFAULT 1,
        budget REAL DEFAULT 1000.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Behavior events (advanced tracking)
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 0,
        session_id TEXT DEFAULT '',
        event_type TEXT NOT NULL,
        target_type TEXT DEFAULT '',
        target_id INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0,
        scroll_depth REAL DEFAULT 0.0,
        metadata TEXT DEFAULT '{}',
        platform TEXT DEFAULT 'buyhatke' CHECK(platform IN ('padhatke', 'buyhatke')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- User preference scores (computed from behavior events)
    CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        score REAL DEFAULT 0.0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, category)
    );

    -- Shopping Cart
    CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
    );

    -- Ratings
    CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        product_id INTEGER NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
    );

    -- Reviews
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        product_id INTEGER NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        helpful_votes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_target ON events(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_post ON post_interactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_user ON post_interactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);
    CREATE INDEX IF NOT EXISTS idx_prefs_user ON user_preferences(user_id);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_product ON ratings(product_id);
    """)

    conn.commit()
    print("[OK] Database initialized successfully!")


if __name__ == "__main__":
    init_db()
    print(f"[DB] Database at: {DB_PATH}")
