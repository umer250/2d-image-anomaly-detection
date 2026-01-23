
from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User

router = APIRouter()

@router.get("/", response_model=List[dict])
def read_results(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve results.
    """
    # Placeholder: In real app, query Result model
    # results = crud.result.get_multi(db, skip=skip, limit=limit)
    # return results
    return [{"id": 1, "status": "Normal", "image_id": 123, "score": 0.05}]
