
import sys
import os

# Add Backend to path
sys.path.append(os.path.join(os.getcwd(), "Backend"))

from app.db.session import SessionLocal
from app.crud import crud_user
from app.core import security
from app.core.config import settings

def test_login_logic(email, password):
    db = SessionLocal()
    try:
        print(f"Testing login for {email}...")
        user = crud_user.get_user_by_email(db, email=email)
        if not user:
            print("User not found")
            return
        
        print(f"User found: {user.email}, hashed_password: {user.hashed_password[:10]}...")
        
        is_valid = security.verify_password(password, user.hashed_password)
        print(f"Password valid: {is_valid}")
        
        if is_valid:
            token = security.create_access_token(
                subject=user.email,
                user_id=user.id,
                role=user.role
            )
            print(f"Token generated successfully: {token[:20]}...")
        
    except Exception as e:
        print(f"Error during login logic: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    # Test with one of the known users from list_app_users.py
    # umerm8809@gmail.com
    # Note: I don't know the password, but I can test if the verification logic even runs without crashing.
    test_login_logic("umerm8809@gmail.com", "any_password")
