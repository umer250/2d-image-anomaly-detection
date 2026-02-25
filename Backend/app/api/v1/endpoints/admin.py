"""
Admin endpoints for user management, image monitoring, and analytics.
Only accessible by users with admin role.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
import logging

from app.api import deps
from app.crud import crud_user
from app.models.user import User
from app.models.history import History
from app.models.image import Image
from app.models.result import Result
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
import shutil
import os

router = APIRouter()

@router.get("/users", response_model=List[UserSchema])
def get_all_users(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Retrieve all users (Admin only).
    Supports pagination with skip and limit parameters.
    """
    users = crud_user.get_all_users(db, skip=skip, limit=limit)
    return users

@router.post("/users", response_model=UserSchema)
def create_user_by_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Create new user (Admin only).
    Admin can set the user's role (user or admin).
    """
    # Check if user with this email already exists
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = crud_user.create_user(db=db, user=user_in)
    return user

@router.put("/users/{user_id}", response_model=UserSchema)
def update_user_by_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Update user details (Admin only).
    Can update name, email, role, and password.
    """
    user = crud_user.update_user(db, user_id=user_id, user_update=user_in)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    return user

@router.delete("/users/{user_id}")
def delete_user_by_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Delete user (Admin only).
    Cannot delete yourself.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account",
        )
    
    success = crud_user.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    
    return {"message": "User deleted successfully"}

@router.get("/images")
def get_all_images(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Get all uploaded images from all users (Admin only).
    """
    from app.models.image import Image
    from app.models.result import Result
    from sqlalchemy.orm import joinedload
    import logging

    try:
        # Eager load results using class attribute
        images_objs = db.query(Image).options(joinedload(Image.results)).offset(skip).limit(limit).all()
        
        serialized_images = []
        for img in images_objs:
            # Safe date conversion
            up_date = img.upload_date
            if up_date and not isinstance(up_date, str):
                up_date = up_date.isoformat()
                
            serialized_images.append({
                "id": img.id,
                "filename": img.filename,
                "file_path": img.file_path,
                "upload_date": up_date,
                "user_id": img.user_id,
                "results": [
                    {
                        "id": r.id,
                        "anomaly_score": r.anomaly_score,
                        "is_anomaly": r.is_anomaly,
                        "heatmap_path": r.heatmap_path
                    } for r in img.results
                ]
            })
        
        # Hardcoded success response for UI with explicit headers if middleware fails
        # NOTE: In production, rely on CORSMiddleware. This is for local stabilization.
        return {
            "total": len(serialized_images),
            "images": serialized_images
        }
    except Exception as e:
        import traceback
        logging.error(f"Error fetching admin images: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/analytics")
def get_analytics(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    logging.info("get_analytics: Started")
    
    from app.models.history import History
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    try:
        # Task 3: Exclude admins from user count
        total_users = db.query(User).filter(User.role != "admin").count()
        total_images = db.query(History).count()
        total_anomalies = db.query(History).filter(History.status == "Anomaly").count()
        
        # 1. Hourly Activity (Last 24 Hours)
        daily_activity = []
        now = datetime.now()
        for i in range(23, -1, -1):
            target_time = now - timedelta(hours=i)
            count = db.query(History).filter(
                func.extract('hour', History.created_at) == target_time.hour,
                func.extract('day', History.created_at) == target_time.day,
                func.extract('month', History.created_at) == target_time.month,
                func.extract('year', History.created_at) == target_time.year
            ).count()
            daily_activity.append(count)

        # 2. Weekly Activity (Last 7 Days)
        weekly_activity = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            count = db.query(History).filter(func.date(History.created_at) == day).count()
            weekly_activity.append(count)

        # 3. Monthly Activity (Last 12 Months)
        monthly_activity = []
        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year + (now.month - i - 1) // 12
            count = db.query(History).filter(
                func.extract('month', History.created_at) == month,
                func.extract('year', History.created_at) == year
            ).count()
            monthly_activity.append(count)

        # 4. Anomaly Trends (Last 12 Months)
        anomaly_trends = []
        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year + (now.month - i - 1) // 12
            count = db.query(History).filter(
                History.status == "Anomaly",
                func.extract('month', History.created_at) == month,
                func.extract('year', History.created_at) == year
            ).count()
            anomaly_trends.append(count)

        # 5. Type Distribution
        critical = db.query(History).filter(History.score >= 0.85).count()
        minor = db.query(History).filter(History.score >= 0.6, History.score < 0.85).count()
        noise = db.query(History).filter(History.score < 0.6).count()

        # 6. Recent High Risk Anomalies (Real-time data for notifications)
        # Task 4: Ensure high risk notification appears only once per user (unique)
        recent_high_risk = []
        
        # Task 6: Check if notifications are enabled for this admin
        from app.models.settings import UserSettings
        settings_obj = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        show_notifications = settings_obj.notification_enabled if settings_obj else 1

        if show_notifications:
            # Subquery to find the most recent high risk anomaly for each user
            subquery = db.query(
                History.user_id,
                func.max(History.created_at).label('max_created_at')
            ).filter(History.score >= 0.85).group_by(History.user_id).subquery()

            high_risk_records = db.query(History, User).join(User, History.user_id == User.id)\
                .join(subquery, (History.user_id == subquery.c.user_id) & (History.created_at == subquery.c.max_created_at))\
                .order_by(History.created_at.desc())\
                .limit(5).all()
            
            for record, user_obj in high_risk_records:
                recent_high_risk.append({
                    "id": record.id,
                    "user": user_obj.full_name,
                    "email": user_obj.email,
                    "score": round(record.score * 100, 1),
                    "timestamp": record.created_at.isoformat() if record.created_at else None
                })

        return {

            "total_users": total_users,
            "total_images": total_images,
            "total_anomalies_detected": total_anomalies,
            "active_users": db.query(User).filter(User.role != "admin", User.is_active == True).count(),
            "daily_activity": daily_activity,
            "weekly_activity": weekly_activity,
            "monthly_activity": monthly_activity,
            "anomaly_trends": anomaly_trends,
            "type_distribution": {
                "critical": critical,
                "minor": minor,
                "noise": noise
            },
            "recent_high_risk": recent_high_risk,
            "model_version": "v2.5.0-LTS"
        }
    except Exception as e:
        import traceback
        logging.error(f"get_analytics: Error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-system")
def reset_system(
    *,
    db: Session = Depends(deps.get_db),
    password: str,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Delete all records in history, images, and results tables + physical uploads.
    Requires DB password '12345'.
    """
    if password != "12345":
        raise HTTPException(status_code=400, detail="Invalid system password.")
    
    try:
        from app.models.history import History
        from app.models.image import Image
        from app.models.result import Result
        import os

        # Delete records
        db.query(Result).delete()
        db.query(Image).delete()
        db.query(History).delete()
        db.commit()
        
        # Delete physical files
        dirs_to_clear = ["uploads", "heatmaps", "static/uploads", "static/heatmaps"]
        for d in dirs_to_clear:
            if os.path.exists(d):
                for f in os.listdir(d):
                    f_path = os.path.join(d, f)
                    try:
                        if os.path.isfile(f_path):
                            os.unlink(f_path)
                        elif os.path.islink(f_path):
                            os.unlink(f_path)
                    except Exception as e:
                        logging.error(f"Failed to delete {f_path}: {e}")
        
        return {"message": "System reset successful. All data and uploads cleared."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@router.post("/wipe-all-users")
def wipe_all_users(
    *,
    db: Session = Depends(deps.get_db),
    password: str,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Delete all users except admins.
    Requires DB password '12345'.
    """
    if password != "12345":
        raise HTTPException(status_code=400, detail="Invalid system password.")
    
    try:
        # Delete non-admin users
        deleted_count = db.query(User).filter(User.role != 'admin').delete()
        db.commit()
        return {"message": f"Successfully wiped {deleted_count} users."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Wipe failed: {str(e)}")

@router.get("/settings")
def get_admin_settings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Get system settings for the current admin."""
    from app.models.settings import UserSettings
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id, notification_enabled=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings")
def update_admin_settings(
    *,
    db: Session = Depends(deps.get_db),
    settings_in: dict,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Update system settings for the current admin."""
    from app.models.settings import UserSettings
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
    
    if "notification_enabled" in settings_in:
        settings.notification_enabled = 1 if settings_in["notification_enabled"] else 0
    
    db.commit()
    return {"message": "Settings updated"}
