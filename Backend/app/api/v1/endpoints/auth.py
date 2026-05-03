
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
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
limiter = Limiter(key_func=get_remote_address)

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login_access_token(
    request: Request,
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
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
@limiter.limit("5/minute")
def create_user_signup(
    request: Request,
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    import re
    
    if not user_in.email.lower().endswith("@gmail.com"):
        raise HTTPException(
            status_code=400,
            detail="Registration currently only supports @gmail.com addresses."
        )
    
    password = user_in.password
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")

    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = crud_user.create_user(db=db, user=user_in)
    return user

@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    *,
    db: Session = Depends(deps.get_db),
    request_data: ResetPasswordRequest,
) -> Any:
    import random
    user = crud_user.get_user_by_email(db, email=request_data.email)
    
    if user:
        otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
        expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
        crud_user.set_user_reset_token(db, user_id=user.id, token=otp, expiry=expiry)
        
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
    user = crud_user.get_user_by_reset_token(db, token=reset_data.token)
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired session")
        
    if user.reset_token_expiry and datetime.now(timezone.utc) > user.reset_token_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Session has expired")
    
    crud_user.update_user_password(db, user_id=user.id, new_password=reset_data.new_password)
    crud_user.clear_user_reset_token(db, user_id=user.id)
    
    return {"message": "Password reset successful. Please login with your new password."}

