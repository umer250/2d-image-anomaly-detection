from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.result import Result
from app.schemas.result import ResultCreate
from app.models.image import Image

def create_result(db: Session, result: ResultCreate) -> Result:
    db_result = Result(
        image_id=result.image_id,
        anomaly_score=result.anomaly_score,
        threshold=result.threshold,
        is_anomaly=result.is_anomaly,
        heatmap_path=result.heatmap_path,
        model_version=result.model_version,
        details=result.details
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_result(db: Session, result_id: int) -> Optional[Result]:
    return db.query(Result).filter(Result.id == result_id).first()

def get_results_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Result]:
    return db.query(Result).join(Image).filter(Image.user_id == user_id).offset(skip).limit(limit).all()

def get_all_results(db: Session, skip: int = 0, limit: int = 100) -> List[Result]:
    return db.query(Result).offset(skip).limit(limit).all()
