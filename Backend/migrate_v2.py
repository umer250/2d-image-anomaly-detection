import sqlite3
import os

# Path to the database
db_path = "anomaly_detection_db.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Updating 'users' table schema...")
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if "avatar_url" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
        print("  - Added 'avatar_url' column")
    
    if "reset_token" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
        print("  - Added 'reset_token' column")
        # Add index for reset_token
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_reset_token ON users (reset_token)")
        print("  - Added index for 'reset_token'")
        
    if "reset_token_expiry" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME")
        print("  - Added 'reset_token_expiry' column")

    conn.commit()
    print("Database schema updated successfully.")
    
except Exception as e:
    print(f"Error updating database: {e}")
    conn.rollback()
finally:
    conn.close()
