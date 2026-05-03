from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas.history import History as HistorySchema
from app.crud import crud_history

router = APIRouter()

@router.get("", response_model=List[HistorySchema])
@router.get("/", response_model=List[HistorySchema])
def read_history(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role == "admin":
        history_records = crud_history.get_all_history(db, skip=skip, limit=limit)
    else:
        history_records = crud_history.get_history_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    
    result = []
    for record in history_records:
        item = {
            "id": record.id,
            "user_id": record.user_id,
            "filename": record.filename,
            "file_path": record.file_path,
            "status": record.status,
            "score": record.score,
            "heatmap_path": record.heatmap_path,
            "hot_map_path": getattr(record, 'hot_map_path', None),
            "contour_path": getattr(record, 'contour_path', None),
            "comparison_path": getattr(record, 'comparison_path', None),
            "threshold": record.threshold,
            "model_version": record.model_version,
            "category": getattr(record, 'category', 'bottle'),
            "upload_date": record.created_at
        }
        result.append(item)
        
    return result
