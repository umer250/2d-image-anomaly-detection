from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User
from app.schemas.result import Result as ResultSchema
from app.crud import crud_result

router = APIRouter()

@router.get("/", response_model=List[ResultSchema])
def read_results(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve results.
    Users see their own results, admins see all.
    """
    if current_user.role == "admin":
        results = crud_result.get_all_results(db, skip=skip, limit=limit)
    else:
        results = crud_result.get_results_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    
    # Manually populate the extra fields from the relationship
    # (Since Pydantic from_attributes works on attributes, but we need to flatten the nested Image object)
    for res in results:
        # Get the associated image using CRUD or relying on lazy loading if relationship exists
        # In this codebase, Result model has relationships? Let's check crud_result.py or models/result.py
        # It seems Result has foreign key but maybe no relationship property defined yet.
        # Let's rely on Image relationship if it exists, otherwise query it.
        # Ideally, we should add relationship to Result model.
        # For now, let's look at crud_result logic.
        from app.models.image import Image
        img = db.query(Image).filter(Image.id == res.image_id).first()
        if img:
            res.filename = img.filename
            res.upload_date = img.upload_date
            
    return results
