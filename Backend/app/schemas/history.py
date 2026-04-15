from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class HistoryBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    filename: Optional[str] = None
    file_path: Optional[str] = None
    status: Optional[str] = None
    score: Optional[float] = None
    heatmap_path: Optional[str] = None
    threshold: Optional[float] = None
    model_version: Optional[str] = None
    category: Optional[str] = None


class HistoryCreate(HistoryBase):
    user_id: int
    filename: str
    file_path: str
    status: str
    score: float
    heatmap_path: Optional[str] = None
    threshold: Optional[float] = None
    model_version: Optional[str] = None
    category: Optional[str] = "unknown"


class HistoryUpdate(HistoryBase):
    pass


class History(HistoryBase):
    id: int
    user_id: int
    upload_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    @classmethod
    def from_orm(cls, obj):
        data = super().from_orm(obj)
        if hasattr(obj, "created_at"):
            data.upload_date = obj.created_at
        return data
