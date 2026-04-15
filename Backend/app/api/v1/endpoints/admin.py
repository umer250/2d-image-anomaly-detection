"""
Admin endpoints: user management, image monitoring, analytics, stats, categories.
All endpoints require admin role.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import logging
import os
import shutil

from app.api import deps
from app.crud import crud_user
from app.crud.crud_category import (
    get_all_categories,
    seed_default_categories,
)
from app.models.user import User
from app.models.history import History
from app.models.image import Image
from app.models.result import Result
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.schemas.category import Category as CategorySchema

router = APIRouter()

# ── Valid categories (MVTec AD) ───────────────────────────────────────────────
VALID_CATEGORIES = [
    "bottle", "bottle_latest", "bottle_v2", "cable", "capsule", "carpet", "grid",
    "hazelnut", "leather", "metal_nut", "pill", "screw",
    "tile", "toothbrush", "transistor", "wood", "zipper",
]


# ═══════════════════════════════════════════════════════════════════════════════
# STATS  (TASK 4)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/stats")
def get_stats(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Return dashboard summary stats.

    Response shape:
    {
      total_users, total_predictions, anomaly_count, normal_count,
      anomaly_rate,
      predictions_per_category: { <name>: {count, anomaly_count} },
      activity_last_7_days: [ {date, count} × 7 ]
    }
    """
    try:
        total_users = db.query(User).count()
        total_predictions = db.query(History).count()
        anomaly_count = db.query(History).filter(History.status == "Anomaly").count()
        normal_count = db.query(History).filter(History.status == "Normal").count()
        anomaly_rate = (
            round((anomaly_count / total_predictions) * 100, 2)
            if total_predictions > 0
            else 0.0
        )

        # Per-category breakdown
        predictions_per_category: dict = {}
        for cat in VALID_CATEGORIES:
            cat_total = (
                db.query(History).filter(History.category == cat).count()
            )
            cat_anomaly = (
                db.query(History)
                .filter(History.category == cat, History.status == "Anomaly")
                .count()
            )
            predictions_per_category[cat] = {
                "count": cat_total,
                "anomaly_count": cat_anomaly,
            }

        # Activity last 7 days
        now = datetime.utcnow()
        activity_last_7_days = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            count = (
                db.query(History)
                .filter(func.date(History.created_at) == day)
                .count()
            )
            activity_last_7_days.append({"date": str(day), "count": count})

        return {
            "total_users": total_users,
            "total_predictions": total_predictions,
            "anomaly_count": anomaly_count,
            "normal_count": normal_count,
            "anomaly_rate": anomaly_rate,
            "predictions_per_category": predictions_per_category,
            "activity_last_7_days": activity_last_7_days,
        }

    except Exception as e:
        import traceback
        logging.error(f"get_stats error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORIES  (TASK 5)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/categories", response_model=List[CategorySchema])
def list_categories(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """
    Return all categories with their training status, AUROC scores, and model paths.
    Auto-seeds default MVTec categories if the table is empty.
    """
    try:
        # Seed defaults on first call if table is empty
        seed_default_categories(db)
        return get_all_categories(db)
    except Exception as e:
        import traceback
        logging.error(f"list_categories error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# USERS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/users", response_model=List[UserSchema])
def get_all_users(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Retrieve all users (Admin only). Supports pagination."""
    return crud_user.get_all_users(db, skip=skip, limit=limit)


@router.post("/users", response_model=UserSchema)
def create_user_by_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Create new user (Admin only)."""
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )
    return crud_user.create_user(db=db, user=user_in)


@router.put("/users/{user_id}", response_model=UserSchema)
def update_user_by_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Update user details (Admin only)."""
    user = crud_user.update_user(db, user_id=user_id, user_update=user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/users/{user_id}")
def delete_user_by_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Delete user (Admin only). Cannot delete yourself."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    success = crud_user.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


# ═══════════════════════════════════════════════════════════════════════════════
# IMAGES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/images")
def get_all_images(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Get all uploaded images from all users (Admin only)."""
    from sqlalchemy.orm import joinedload

    try:
        images_objs = (
            db.query(Image)
            .options(joinedload(Image.results))
            .offset(skip)
            .limit(limit)
            .all()
        )
        serialized = []
        for img in images_objs:
            up_date = img.upload_date
            if up_date and not isinstance(up_date, str):
                up_date = up_date.isoformat()
            serialized.append(
                {
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
                            "heatmap_path": r.heatmap_path,
                        }
                        for r in img.results
                    ],
                }
            )
        return {"total": len(serialized), "images": serialized}
    except Exception as e:
        import traceback
        logging.error(f"get_all_images error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS  (existing — kept intact)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/analytics")
def get_analytics(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    logging.info("get_analytics: Started")

    try:
        total_users = db.query(User).filter(User.role != "admin").count()
        total_images = db.query(History).count()
        total_anomalies = db.query(History).filter(History.status == "Anomaly").count()

        now = datetime.now()

        # Hourly activity (last 24 h)
        daily_activity = []
        for i in range(23, -1, -1):
            t = now - timedelta(hours=i)
            count = db.query(History).filter(
                func.extract("hour", History.created_at) == t.hour,
                func.extract("day", History.created_at) == t.day,
                func.extract("month", History.created_at) == t.month,
                func.extract("year", History.created_at) == t.year,
            ).count()
            daily_activity.append(count)

        # Weekly activity (last 7 days)
        weekly_activity = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            count = db.query(History).filter(func.date(History.created_at) == day).count()
            weekly_activity.append(count)

        # Monthly activity (last 12 months)
        monthly_activity = []
        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year + (now.month - i - 1) // 12
            count = db.query(History).filter(
                func.extract("month", History.created_at) == month,
                func.extract("year", History.created_at) == year,
            ).count()
            monthly_activity.append(count)

        # Anomaly trends (last 12 months)
        anomaly_trends = []
        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year + (now.month - i - 1) // 12
            count = db.query(History).filter(
                History.status == "Anomaly",
                func.extract("month", History.created_at) == month,
                func.extract("year", History.created_at) == year,
            ).count()
            anomaly_trends.append(count)

        # Type distribution
        critical = db.query(History).filter(History.score >= 0.85).count()
        minor = db.query(History).filter(History.score >= 0.6, History.score < 0.85).count()
        noise = db.query(History).filter(History.score < 0.6).count()

        # High-risk notifications
        recent_high_risk = []
        from app.models.settings import UserSettings

        settings_obj = (
            db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        )
        show_notifications = settings_obj.notification_enabled if settings_obj else 1

        if show_notifications:
            subquery = (
                db.query(
                    History.user_id,
                    func.max(History.created_at).label("max_created_at"),
                )
                .filter(History.score >= 0.85)
                .group_by(History.user_id)
                .subquery()
            )
            high_risk_records = (
                db.query(History, User)
                .join(User, History.user_id == User.id)
                .join(
                    subquery,
                    (History.user_id == subquery.c.user_id)
                    & (History.created_at == subquery.c.max_created_at),
                )
                .order_by(History.created_at.desc())
                .limit(5)
                .all()
            )
            for record, user_obj in high_risk_records:
                recent_high_risk.append(
                    {
                        "id": record.id,
                        "user": user_obj.full_name,
                        "email": user_obj.email,
                        "score": round(record.score * 100, 1),
                        "timestamp": (
                            record.created_at.isoformat() if record.created_at else None
                        ),
                    }
                )

        return {
            "total_users": total_users,
            "total_images": total_images,
            "total_anomalies_detected": total_anomalies,
            "active_users": db.query(User)
            .filter(User.role != "admin", User.is_active == True)
            .count(),
            "daily_activity": daily_activity,
            "weekly_activity": weekly_activity,
            "monthly_activity": monthly_activity,
            "anomaly_trends": anomaly_trends,
            "type_distribution": {"critical": critical, "minor": minor, "noise": noise},
            "recent_high_risk": recent_high_risk,
            "model_version": "v2.5.0-LTS",
        }
    except Exception as e:
        import traceback
        logging.error(f"get_analytics error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/reset-system")
def reset_system(
    *,
    db: Session = Depends(deps.get_db),
    password: str,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Delete all history/images/results and physical uploads. Password: 12345."""
    if password != "12345":
        raise HTTPException(status_code=400, detail="Invalid system password.")
    try:
        db.query(Result).delete()
        db.query(Image).delete()
        db.query(History).delete()
        db.commit()

        for d in ["uploads", "heatmaps", "static/uploads", "static/heatmaps"]:
            if os.path.exists(d):
                for f in os.listdir(d):
                    fp = os.path.join(d, f)
                    try:
                        if os.path.isfile(fp) or os.path.islink(fp):
                            os.unlink(fp)
                    except Exception as err:
                        logging.error(f"Failed to delete {fp}: {err}")

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
    """Delete all non-admin users. Password: 12345."""
    if password != "12345":
        raise HTTPException(status_code=400, detail="Invalid system password.")
    try:
        deleted_count = db.query(User).filter(User.role != "admin").delete()
        db.commit()
        return {"message": f"Successfully wiped {deleted_count} users."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Wipe failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/settings")
def get_admin_settings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Get system settings for the current admin."""
    from app.models.settings import UserSettings

    settings = (
        db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    )
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

    settings = (
        db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    )
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    if "notification_enabled" in settings_in:
        settings.notification_enabled = 1 if settings_in["notification_enabled"] else 0

    db.commit()
    return {"message": "Settings updated"}
