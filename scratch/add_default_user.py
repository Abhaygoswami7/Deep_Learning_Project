import sqlite3
import os
import hashlib

def hash_password(password: str) -> str:
    salt = "padhatke_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

db_path = os.path.join("backend", "platform.db")
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = ?", ("123",))
        if cursor.fetchone():
            print("User '123' already exists.")
        else:
            cursor.execute(
                "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)",
                ("123", "123@test.com", hash_password("123"), "Default User")
            )
            conn.commit()
            print("Successfully added user '123' with password '123'.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
