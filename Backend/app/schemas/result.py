from typing import Optional, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ResultBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    image_id: int
    anomaly_score: float
    threshold: float = 0.6
    is_anomaly: bool
    heatmap_path: Optional[str] = None
    model_version: str = "v1.0"
    details: Optional[Any] = None


class ResultCreate(ResultBase):
    pass


class ResultUpdate(ResultBase):
    pass


class Result(ResultBase):
    id: int
    created_at: datetime

    filename: Optional[str] = None
    upload_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
