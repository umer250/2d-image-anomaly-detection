
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
    Create new user with strict validation.
    - Email must be @gmail.com
    - Password must be at least 8 chars, 1 uppercase, 1 number, 1 special.
    """
    import re
    
    # 1. Email Validation (@gmail.com only)
    if not user_in.email.lower().endswith("@gmail.com"):
        raise HTTPException(
            status_code=400,
            detail="Registration currently only supports @gmail.com addresses."
        )
    
    # 2. Strong Password Validation
    password = user_in.password
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")

    # Check if user with this email already exists
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Create new user
    user = crud_user.create_user(db=db, user=user_in)
    return user

@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    request_data: ResetPasswordRequest,
) -> Any:
    """
    Generate a 6-digit numeric OTP and send it via email (mocked).
    OTP expires in 5 minutes.
    """
    import random
    user = crud_user.get_user_by_email(db, email=request_data.email)
    
    if user:
        # Generate 6-digit OTP
        otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
        # Set expiry to 5 minutes
        expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
        crud_user.set_user_reset_token(db, user_id=user.id, token=otp, expiry=expiry)
        
        # In a real app, send actual email. Here we mock it and print to console.
        send_reset_password_email(email_to=user.email, email=user.email, token=otp)
        print(f"\n[SECURITY] OTP for {user.email}: {otp} (Expires in 5 mins)\n")
        
    return {"message": "If this email exists, a 6-digit OTP has been sent."}

@router.post("/verify-otp")
def verify_otp(
    *,
    db: Session = Depends(deps.get_db),
    email: str = Query(...),
    otp: str = Query(...),
) -> Any:
    """
    Verify if the 6-digit OTP is valid and not expired.
    """
    user = crud_user.get_user_by_email(db, email=email)
    
    if not user or user.reset_token != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    if user.reset_token_expiry and datetime.now(timezone.utc) > user.reset_token_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    return {"message": "OTP verified successfully", "token": otp}

@router.get("/verify-token")
def verify_token(
    *,
    db: Session = Depends(deps.get_db),
    token: str = Query(...),
) -> Any:
    """
    Keep legacy verify-token for compat but internally it checks OTP
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
    Reset user password using a valid OTP token.
    Updates password and clears the token.
    """
    user = crud_user.get_user_by_reset_token(db, token=reset_data.token)
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired session")
        
    if user.reset_token_expiry and datetime.now(timezone.utc) > user.reset_token_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Session has expired")
    
    # Update password and clear token
    crud_user.update_user_password(db, user_id=user.id, new_password=reset_data.new_password)
    crud_user.clear_user_reset_token(db, user_id=user.id)
    
    return {"message": "Password reset successful. Please login with your new password."}

