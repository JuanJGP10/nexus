from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_id: int | None = None


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    parent_id: int | None = None


class FolderCopy(BaseModel):
    """Carpeta padre donde se pega la copia. `None` = raíz."""

    parent_id: int | None = None


class FolderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    parent_id: int | None
    created_at: datetime
