import sqlite3
import os

db_path = os.path.join("backend", "platform.db")
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        # Delete all users EXCEPT '123'
        cursor.execute("DELETE FROM users WHERE username != ?", ("123",))
        # Optional: Delete related data iforphaned, but for now just cleanup users
        conn.commit()
        print(f"Purged all users except '123'. Total users left: {cursor.execute('SELECT COUNT(*) FROM users').fetchone()[0]}")
    except Exception as e:
        print(f"Error during purge: {e}")
    finally:
        conn.close()
