
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.crud import crud_user
from app.api import deps
from app.core import security
from app.core.config import settings
from app.schemas.token import Token
from app.schemas.user import User, UserCreate

router = APIRouter()

# Schema for reset password request
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

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

@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    reset_data: ResetPasswordRequest,
) -> Any:
    """
    Reset user password.
    Verifies email exists and updates password.
    User should be redirected to /login after successful reset.
    """
    # Check if user exists
    user = crud_user.get_user_by_email(db, email=reset_data.email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User with this email does not exist.",
        )
    
    # Update password
    updated_user = crud_user.update_user_password(
        db, user_id=user.id, new_password=reset_data.new_password
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=500,
            detail="Failed to update password.",
        )
    
    return {"message": "Password reset successful. Please login with your new password."}
