from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CategoryBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str
    model_path: Optional[str] = None
    threshold: Optional[float] = None
    i_auroc: Optional[float] = None
    p_auroc: Optional[float] = None
    is_trained: bool = False


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    model_path: Optional[str] = None
    threshold: Optional[float] = None
    i_auroc: Optional[float] = None
    p_auroc: Optional[float] = None
    is_trained: Optional[bool] = None


class Category(CategoryBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
