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
        total_users = len(crud_user.get_all_users(db, skip=0, limit=10000))
        total_images = db.query(Image).count()
        total_anomalies = db.query(Result).filter(Result.is_anomaly == True).count()
        logging.info(f"get_analytics: Stats fetched - Users: {total_users}, Images: {total_images}, Anomalies: {total_anomalies}")
        
        # Daily History (Last 7 Days)
        today = datetime.now().date()
        seven_days_ago = today - timedelta(days=6)
        daily_stats = db.query(
            func.date(Image.upload_date).label('day'),
            func.count(Image.id).label('count')
        ).filter(Image.upload_date >= seven_days_ago).group_by(func.date(Image.upload_date)).all()
        
        history_map = {str(s.day): s.count for s in daily_stats}
        weekly_activity = []
        for i in range(7):
            day = seven_days_ago + timedelta(days=i)
            weekly_activity.append(history_map.get(str(day), 0))

        # Monthly History (Placeholder)
        monthly_activity = [0] * 12
        
        # Anomaly Trends (Last 12 intervals)
        recent_results = db.query(Result).order_by(Result.created_at.desc()).limit(100).all()
        trend_data = [0] * 12
        if recent_results:
            import math
            chunk_size = math.ceil(len(recent_results) / 12)
            for i in range(12):
                start = i * chunk_size
                end = start + chunk_size
                chunk = recent_results[start:end]
                anomalies = sum(1 for r in chunk if r.is_anomaly)
                trend_data[i] = anomalies * 5

        return {
            "total_users": total_users,
            "total_images": total_images,
            "total_anomalies_detected": total_anomalies,
            "active_users": total_users,
            "weekly_activity": weekly_activity,
            "monthly_activity": monthly_activity,
            "anomaly_trends": trend_data,
            "model_version": "v1.0"
        }
    except Exception as e:
        import traceback
        logging.error(f"get_analytics: Error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
