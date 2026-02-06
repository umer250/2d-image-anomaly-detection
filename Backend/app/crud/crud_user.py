
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

def get_user(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users with pagination (admin only)."""
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user."""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    """Update user details (admin only)."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Hash password if being updated
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    """Soft delete user by setting is_active to False."""
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db_user.is_active = False
    db.commit()
    return True

def update_user_password(db: Session, user_id: int, new_password: str) -> Optional[User]:
    """Update user password."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    db_user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_profile(db: Session, user_id: int, full_name: str) -> Optional[User]:
    """Update user profile (name only)."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    db_user.full_name = full_name
    db.commit()
    db.refresh(db_user)
    return db_user
