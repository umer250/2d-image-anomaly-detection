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
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate

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
    
    from app.models.image import Image
    from app.models.result import Result
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    try:
        total_users = db.query(User).count()
        total_images = db.query(Image).count()
        total_anomalies = db.query(Result).filter(Result.is_anomaly == True).count()
        
        # 1. Hourly Activity (Last 24 Hours)
        daily_activity = []
        now = datetime.now()
        for i in range(23, -1, -1):
            target_time = now - timedelta(hours=i)
            count = db.query(Image).filter(
                func.extract('hour', Image.upload_date) == target_time.hour,
                func.extract('day', Image.upload_date) == target_time.day,
                func.extract('month', Image.upload_date) == target_time.month,
                func.extract('year', Image.upload_date) == target_time.year
            ).count()
            daily_activity.append(count)

        # 2. Weekly Activity (Last 7 Days)
        weekly_activity = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            count = db.query(Image).filter(func.date(Image.upload_date) == day).count()
            weekly_activity.append(count)

        # 3. Monthly Activity (Last 12 Months)
        monthly_activity = []
        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year + (now.month - i - 1) // 12
            count = db.query(Image).filter(
                func.extract('month', Image.upload_date) == month,
                func.extract('year', Image.upload_date) == year
            ).count()
            monthly_activity.append(count)

        # 4. Anomaly Trends (Last 12 Months)
        anomaly_trends = []
        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year + (now.month - i - 1) // 12
            count = db.query(Result).join(Image).filter(
                Result.is_anomaly == True,
                func.extract('month', Image.upload_date) == month,
                func.extract('year', Image.upload_date) == year
            ).count()
            anomaly_trends.append(count)

        # 5. Type Distribution
        critical = db.query(Result).filter(Result.anomaly_score >= 0.85).count()
        minor = db.query(Result).filter(Result.anomaly_score >= 0.6, Result.anomaly_score < 0.85).count()
        noise = db.query(Result).filter(Result.anomaly_score < 0.6).count()

        return {
            "total_users": total_users,
            "total_images": total_images,
            "total_anomalies_detected": total_anomalies,
            "active_users": db.query(User).filter(User.is_active == True).count(),
            "daily_activity": daily_activity,
            "weekly_activity": weekly_activity,
            "monthly_activity": monthly_activity,
            "anomaly_trends": anomaly_trends,
            "type_distribution": {
                "critical": critical,
                "minor": minor,
                "noise": noise
            },
            "model_version": "v2.5.0-LTS"
        }
    except Exception as e:
        import traceback
        logging.error(f"get_analytics: Error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
