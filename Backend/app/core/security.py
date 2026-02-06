import bcrypt
from datetime import datetime, timedelta
from typing import Any, Union, Optional
from jose import jwt, JWTError
from app.core.config import settings

ALGORITHM = "HS256"

def create_access_token(
    subject: Union[str, Any], 
    user_id: int,
    role: str,
    expires_delta: timedelta = None
) -> str:
    """
    Create JWT access token with user information.
    
    Args:
        subject: User email
        user_id: User ID
        role: User role (admin or user)
        expires_delta: Token expiration time
    
    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "user_id": user_id,
        "role": role
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode JWT token and extract user information.
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary with user info (sub, user_id, role) or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(
        password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')
