from app.db.session import SessionLocal
from app.crud import crud_user
from app.core.security import get_password_hash

def reset_admin_password():
    db = SessionLocal()
    try:
        user = crud_user.get_user_by_email(db, "admin@example.com")
        if user:
            print(f"Found admin user: {user.email}")
            user.hashed_password = get_password_hash("Admin@123")
            db.commit()
            print("Password reset to 'Admin@123' successfully.")
        else:
            print("Admin user not found.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password()
