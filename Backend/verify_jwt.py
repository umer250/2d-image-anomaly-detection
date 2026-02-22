from app.core.config import settings
from app.core import security
from jose import jwt

def verify_secret():
    print(f"SECRET_KEY: '{settings.SECRET_KEY}'")
    
    # Test token
    to_encode = {"sub": "test@example.com", "user_id": 1, "role": "admin"}
    token = security.create_access_token(subject="test@example.com", user_id=1, role="admin")
    print(f"Generated token: {token[:20]}...")
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        print("Successfully decoded own token.")
        print(f"Payload: {payload}")
    except Exception as e:
        print(f"Failed to decode own token: {e}")

if __name__ == "__main__":
    verify_secret()
