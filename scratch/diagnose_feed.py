import sqlite3

conn = sqlite3.connect("backend/platform.db")
conn.row_factory = sqlite3.Row

posts_count = conn.execute("SELECT COUNT(*) as c FROM posts").fetchone()["c"]
users = conn.execute("SELECT id FROM users").fetchall()
post_users = conn.execute("SELECT DISTINCT user_id FROM posts").fetchall()
joined = conn.execute("SELECT p.id FROM posts p JOIN users u ON p.user_id = u.id").fetchall()
ads = conn.execute("SELECT COUNT(*) as c FROM ads").fetchone()["c"]

print(f"Total posts in DB: {posts_count}")
print(f"User IDs in users table: {[u['id'] for u in users]}")
print(f"User IDs referenced by posts: {[p['user_id'] for p in post_users]}")
print(f"Posts that survive JOIN with users: {len(joined)}")
print(f"Total ads in DB: {ads}")

conn.close()
