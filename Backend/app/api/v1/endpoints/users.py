"""
User-specific endpoints for profile management, dashboard, and settings.
Accessible by authenticated users (both user and admin roles).
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.crud import crud_user
from app.models.user import User
from app.schemas.user import User as UserSchema, VerifyPassword

router = APIRouter()

# Schema for profile update
class ProfileUpdate(BaseModel):
    full_name: str
    avatar_url: Optional[str] = None

# Schema for password change
class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user information.
    """
    return current_user

@router.get("/dashboard")
def get_user_dashboard(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_user),
) -> Any:
    """
    Get user's personal dashboard statistics from the database.
    """
    from app.models.history import History
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # 1. Base Stats (Now using History table for source of truth)
    total_images = db.query(History).filter(History.user_id == current_user.id).count()
    total_anomalies = db.query(History).filter(
        History.user_id == current_user.id, 
        History.status == "Anomaly"
    ).count()
    
    # 2. Daily Inspections (Last 7 Days)
    today = datetime.now().date()
    start_date = today - timedelta(days=6)
    
    recent_history = db.query(History).filter(
        History.user_id == current_user.id,
        History.created_at >= start_date
    ).all()
    
    stats_map = {}
    for h in recent_history:
        if isinstance(h.created_at, str):
            d_str = h.created_at.split(' ')[0]
        else:
            d_str = str(h.created_at.date())
        stats_map[d_str] = stats_map.get(d_str, 0) + 1
    
    history_chart = []
    for i in range(7):
        day = start_date + timedelta(days=i)
        day_str = str(day)
        history_chart.append({
            "name": day.strftime('%a'),
            "count": stats_map.get(day_str, 0)
        })

    # 3. Anomaly Distribution
    dist_history = db.query(History).filter(History.user_id == current_user.id).all()
    dist_counts = {"Minor": 0, "Major": 0, "Critical": 0}
    
    for h in dist_history:
        s = h.score
        if 0.5 <= s < 0.75:
            dist_counts["Minor"] += 1
        elif 0.75 <= s < 0.9:
            dist_counts["Major"] += 1
        elif s >= 0.9:
            dist_counts["Critical"] += 1
            
    distribution = [
        {"name": "Minor", "value": dist_counts["Minor"]},
        {"name": "Major", "value": dist_counts["Major"]},
        {"name": "Critical", "value": dist_counts["Critical"]},
    ]
    
    return {
        "totalImages": total_images,
        "anomaliesDetected": total_anomalies,
        "normalImages": total_images - total_anomalies,
        "accuracy": 98.5,
        "history": history_chart,
        "distribution": distribution,
        "userId": current_user.id
    }

@router.put("/profile", response_model=UserSchema)
def update_user_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_data: ProfileUpdate,
    current_user: User = Depends(deps.require_user),
) -> Any:
    """
    Update user's own profile (name and avatar).
    """
    updated_user = crud_user.update_user_profile(
        db, 
        user_id=current_user.id, 
        full_name=profile_data.full_name,
        avatar_url=profile_data.avatar_url
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=500,
            detail="Failed to update profile",
        )
    
    return updated_user

@router.put("/change-password")
def change_user_password(
    *,
    db: Session = Depends(deps.get_db),
    password_data: PasswordChange,
    current_user: User = Depends(deps.require_user),
) -> Any:
    """
    Change user's own password.
    Requires current password for verification.
    """
    from app.core import security
    
    # Verify current password
    if not security.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect current password",
        )
    
    # Update to new password
    updated_user = crud_user.update_user_password(
        db, user_id=current_user.id, new_password=password_data.new_password
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=500,
            detail="Failed to update password",
        )
    
    return {"message": "Password updated successfully"}
@router.post("/verify-password")
def verify_user_password(
    *,
    db: Session = Depends(deps.get_db),
    verify_data: VerifyPassword,
    current_user: User = Depends(deps.require_user),
) -> Any:
    """
    Verify if the provided password matches the current user's password.
    Useful for "Confirm current password" flows before allowing sensitive changes.
    """
    from app.core import security
    
    if not security.verify_password(verify_data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect password",
        )
    
    return {"message": "Password verified successfully"}
