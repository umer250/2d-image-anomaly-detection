from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HistoryBase(BaseModel):
    filename: Optional[str] = None
    file_path: Optional[str] = None
    status: Optional[str] = None
    score: Optional[float] = None
    heatmap_path: Optional[str] = None
    threshold: Optional[float] = None
    model_version: Optional[str] = None

class HistoryCreate(HistoryBase):
    user_id: int
    filename: str
    file_path: str
    status: str
    score: float
    heatmap_path: Optional[str] = None
    threshold: Optional[float] = None
    model_version: Optional[str] = None

class HistoryUpdate(HistoryBase):
    pass

class History(HistoryBase):
    id: int
    user_id: int
    upload_date: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        # Map created_at to upload_date for frontend consistency
        data = super().from_orm(obj)
        if hasattr(obj, 'created_at'):
            data.upload_date = obj.created_at
        return data
