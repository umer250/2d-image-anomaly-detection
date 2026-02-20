from sqlalchemy import text
from app.db.session import engine

def migrate():
    print("Starting SQLAlchemy migration for PostgreSQL...")
    with engine.connect() as conn:
        try:
            # Add avatar_url
            print("  - Checking 'avatar_url'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR"))
            
            # Add reset_token
            print("  - Checking 'reset_token'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR"))
            
            # Add reset_token_expiry
            print("  - Checking 'reset_token_expiry'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE"))
            
            # Add index for reset_token
            print("  - Creating index for 'reset_token'...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_reset_token ON users (reset_token)"))
            
            conn.commit()
            print("Migration completed successfully.")
        except Exception as e:
            print(f"Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
