
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

def _get_system_password() -> str:
    pwd = os.getenv("SYSTEM_PASSWORD", "")
    if not pwd:
        raise HTTPException(
            status_code=503,
            detail="SYSTEM_PASSWORD environment variable is not configured.",
        )
    return pwd

VALID_CATEGORIES = [
    "bottle", "cable", "capsule", "carpet", "grid",
    "hazelnut", "leather", "metal_nut", "pill", "screw",
    "tile", "toothbrush", "transistor", "wood", "zipper",
]


@router.get("/stats")
def get_stats(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
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


@router.get("/categories", response_model=List[CategorySchema])
def list_categories(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    try:
        seed_default_categories(db)
        return get_all_categories(db)
    except Exception as e:
        import traceback
        logging.error(f"list_categories error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users", response_model=List[UserSchema])
def get_all_users(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    return crud_user.get_all_users(db, skip=skip, limit=limit)


@router.post("/users", response_model=UserSchema)
def create_user_by_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: User = Depends(deps.require_admin),
) -> Any:
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
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    success = crud_user.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


@router.get("/images")
def get_all_images(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_admin),
) -> Any:
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

            history_record = (
                db.query(History)
                .filter(History.file_path == img.file_path)
                .order_by(History.created_at.desc())
                .first()
            )

            serialized.append(
                {
                    "id": img.id,
                    "filename": img.filename,
                    "file_path": img.file_path,
                    "upload_date": up_date,
                    "user_id": img.user_id,
                    "category": getattr(history_record, 'category', None) or 'bottle',
                    "results": [
                        {
                            "id": r.id,
                            "anomaly_score": r.anomaly_score,
                            "is_anomaly": r.is_anomaly,
                            "heatmap_path": r.heatmap_path,
                            "threshold": getattr(history_record, 'threshold', None),
                            "model_version": getattr(history_record, 'model_version', None),
                            "hot_map_path": getattr(history_record, 'hot_map_path', None),
                            "contour_path": getattr(history_record, 'contour_path', None),
                            "comparison_path": getattr(history_record, 'comparison_path', None),
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

        weekly_activity = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            count = db.query(History).filter(func.date(History.created_at) == day).count()
            weekly_activity.append(count)

        monthly_activity = []
        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year + (now.month - i - 1) // 12
            count = db.query(History).filter(
                func.extract("month", History.created_at) == month,
                func.extract("year", History.created_at) == year,
            ).count()
            monthly_activity.append(count)

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

        critical = db.query(History).filter(History.score >= 0.85).count()
        minor = db.query(History).filter(History.score >= 0.6, History.score < 0.85).count()
        noise = db.query(History).filter(History.score < 0.6).count()

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


@router.post("/reset-system")
def reset_system(
    *,
    db: Session = Depends(deps.get_db),
    password: str,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    if password != _get_system_password():
        raise HTTPException(status_code=400, detail="Invalid system password.")
    try:
        deleted_files = 0
        for d in ["uploads", "heatmaps", "static/uploads", "static/heatmaps"]:
            if os.path.exists(d):
                for f in os.listdir(d):
                    fp = os.path.join(d, f)
                    try:
                        if os.path.isfile(fp) or os.path.islink(fp):
                            os.unlink(fp)
                            deleted_files += 1
                    except Exception as err:
                        logging.error(f"Failed to delete {fp}: {err}")

        return {
            "message": f"System reset successful. {deleted_files} physical files removed. Database records preserved."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")


@router.post("/wipe-all-users")
def wipe_all_users(
    *,
    db: Session = Depends(deps.get_db),
    password: str,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    if password != _get_system_password():
        raise HTTPException(status_code=400, detail="Invalid system password.")
    try:
        deactivated = (
            db.query(User)
            .filter(User.role != "admin", User.is_active == True)
            .all()
        )
        count = len(deactivated)
        for u in deactivated:
            u.is_active = False
        db.commit()
        return {"message": f"Successfully deactivated {count} non-admin users. Records preserved in database."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Wipe failed: {str(e)}")


@router.get("/system-params")
def get_system_params(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    from app.ml.model_loader import model_loader
    from app.ml.preprocess import VALID_CATEGORIES

    params = {}
    for cat in VALID_CATEGORIES:
        if model_loader.is_model_available(cat):
            params[cat] = {
                "threshold": model_loader.get_threshold(cat),
                "is_trained": True,
            }

    settings = (
        db.query(__import__('app.models.settings', fromlist=['UserSettings']).UserSettings)
        .filter(__import__('app.models.settings', fromlist=['UserSettings']).UserSettings.user_id == current_user.id)
        .first()
    )

    return {
        "categories": params,
        "notification_enabled": settings.notification_enabled if settings else 1,
        "model_version": "PatchCore-WideResNet50-v1",
    }


@router.put("/system-params")
def update_system_params(
    *,
    db: Session = Depends(deps.get_db),
    params_in: dict,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    from app.ml.model_loader import model_loader

    updated = {}

    if "threshold" in params_in and "category" in params_in:
        cat = params_in["category"]
        new_thresh = float(params_in["threshold"])
        if not (0.0 < new_thresh < 1.0):
            raise HTTPException(status_code=400, detail="Threshold must be between 0 and 1")
        model_loader.update_threshold(cat, new_thresh)
        updated["threshold"] = new_thresh
        updated["category"] = cat

    if "notification_enabled" in params_in:
        from app.models.settings import UserSettings
        settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        if not settings:
            settings = UserSettings(user_id=current_user.id)
            db.add(settings)
        settings.notification_enabled = 1 if params_in["notification_enabled"] else 0
        db.commit()
        updated["notification_enabled"] = settings.notification_enabled

    return {"message": "System parameters updated", "updated": updated}


@router.get("/settings")
def get_admin_settings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    from app.models.settings import UserSettings

    settings = (
        db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    )
    if not settings:
        settings = UserSettings(user_id=current_user.id, notification_enabled=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "id": settings.id,
        "user_id": settings.user_id,
        "theme": settings.theme,
        "notification_enabled": settings.notification_enabled,
        "default_model": settings.default_model,
    }


@router.put("/settings")
def update_admin_settings(
    *,
    db: Session = Depends(deps.get_db),
    settings_in: dict,
    current_user: User = Depends(deps.require_admin),
) -> Any:
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
