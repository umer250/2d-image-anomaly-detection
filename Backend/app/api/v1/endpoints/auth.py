
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.crud import crud_user
from app.api import deps
from app.core import security
from app.core.config import settings
from app.schemas.token import Token
from app.schemas.user import User, UserCreate, ResetPasswordRequest, ResetPasswordConfirm
from app.utils.email import send_reset_password_email

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    JWT token includes user_id and role for role-based access control.
    """
    user = crud_user.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.email,
        user_id=user.id,
        role=user.role,
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/signup", response_model=User)
def create_user_signup(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in.
    User should be redirected to /login after successful signup.
    Email must be unique - duplicate emails will be rejected.
    """
    # Check if user with this email already exists
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Create new user (password will be hashed in crud_user.create_user)
    user = crud_user.create_user(db=db, user=user_in)
    return user

@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    request_data: ResetPasswordRequest,
) -> Any:
    """
    Generate a secure reset token and send it via email (mocked).
    Token expires in 30 minutes.
    """
    user = crud_user.get_user_by_email(db, email=request_data.email)
    
    # Always return success message for security to prevent email enumeration
    if user:
        token = str(uuid.uuid4())
        expiry = datetime.now(timezone.utc) + timedelta(minutes=30)
        crud_user.set_user_reset_token(db, user_id=user.id, token=token, expiry=expiry)
        
        # Send reset email
        send_reset_password_email(email_to=user.email, email=user.email, token=token)
        print(f"DEBUG: Password reset token for {user.email}: {token}")
        
    return {"message": "If this email exists, a reset link has been sent."}

@router.get("/verify-token")
def verify_token(
    *,
    db: Session = Depends(deps.get_db),
    token: str = Query(...),
) -> Any:
    """
    Verify if a reset token is valid and not expired.
    """
    user = crud_user.get_user_by_reset_token(db, token=token)
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    if user.reset_token_expiry and datetime.now(timezone.utc) > user.reset_token_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Token has expired")
        
    return {"message": "Token is valid", "email": user.email}

@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    reset_data: ResetPasswordConfirm,
) -> Any:
    """
    Reset user password using a valid token.
    Updates password and clears the token.
    User should be redirected to /login after successful reset.
    """
    user = crud_user.get_user_by_reset_token(db, token=reset_data.token)
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    if user.reset_token_expiry and datetime.now(timezone.utc) > user.reset_token_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Token has expired")
    
    # Update password and clear token
    crud_user.update_user_password(db, user_id=user.id, new_password=reset_data.new_password)
    crud_user.clear_user_reset_token(db, user_id=user.id)
    
    return {"message": "Password reset successful. Please login with your new password."}
