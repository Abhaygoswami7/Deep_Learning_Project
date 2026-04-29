import sqlite3
import os

db_path = os.path.join("backend", "platform.db")
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
else:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username FROM users")
        users = cursor.fetchall()
        print("Users in database:")
        for user in users:
            print(f"- {user['username']}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
