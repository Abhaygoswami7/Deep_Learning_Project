import sqlite3
import hashlib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = r"c:\Users\Abhay\Deep Learning Project\backend\platform.db"

def hash_password(password: str) -> str:
    salt = "padhatke_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def check_users():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    users = cursor.execute("SELECT id, username, password_hash FROM users").fetchall()
    
    print(f"{'ID':<4} | {'Username':<15} | {'Hash Match (test123)':<10}")
    print("-" * 40)
    
    for user in users:
        actual_hash = user['password_hash']
        expected_hash = hash_password("test123")
        matches = actual_hash == expected_hash
        print(f"{user['id']:<4} | {user['username']:<15} | {str(matches):<10}")

    conn.close()

if __name__ == "__main__":
    check_users()
