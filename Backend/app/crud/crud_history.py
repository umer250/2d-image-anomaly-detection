from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.history import History
from app.schemas.history import HistoryCreate


def create_history(db: Session, history: HistoryCreate) -> History:
    db_history = History(
        user_id=history.user_id,
        filename=history.filename,
        file_path=history.file_path,
        status=history.status,
        score=history.score,
        heatmap_path=history.heatmap_path,
        threshold=history.threshold,
        model_version=history.model_version,
        category=history.category,
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history


def get_history_by_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> List[History]:
    return (
        db.query(History)
        .filter(History.user_id == user_id)
        .order_by(History.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_all_history(db: Session, skip: int = 0, limit: int = 100) -> List[History]:
    return (
        db.query(History)
        .order_by(History.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
