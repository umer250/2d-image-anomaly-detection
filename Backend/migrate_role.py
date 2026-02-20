from sqlalchemy import text
from app.db.session import engine

def migrate():
    print("Adding missing 'role' column to PostgreSQL...")
    with engine.connect() as conn:
        try:
            # Check if role exists
            print("  - Checking 'role'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user'"))
            
            conn.commit()
            print("Migration completed successfully.")
        except Exception as e:
            print(f"Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
