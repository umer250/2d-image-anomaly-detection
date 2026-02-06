"""
Seed script to create the first admin user.
Run this script once to create an admin account.

Usage:
    python seed_admin.py
"""

from app.db.session import SessionLocal
from app.crud import crud_user
from app.schemas.user import UserCreate

def create_admin_user():
    """Create the first admin user if it doesn't exist."""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        admin_email = "admin@example.com"
        existing_admin = crud_user.get_user_by_email(db, email=admin_email)
        
        if existing_admin:
            print(f"Admin user already exists: {admin_email}")
            return
        
        # Create admin user
        admin_data = UserCreate(
            email=admin_email,
            password="Admin@123",  # Change this password after first login!
            full_name="System Administrator",
            role="admin",
            is_active=True,
            is_superuser=True
        )
        
        admin_user = crud_user.create_user(db, user=admin_data)
        print(f"✅ Admin user created successfully!")
        print(f"Email: {admin_user.email}")
        print(f"Password: Admin@123")
        print(f"Role: {admin_user.role}")
        print(f"\n⚠️  IMPORTANT: Change the default password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating admin user...")
    create_admin_user()
