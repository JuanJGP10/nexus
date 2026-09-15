from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FileUpdate(BaseModel):
    filename: str | None = Field(default=None, min_length=1, max_length=255)
    folder_id: int | None = None
    task_id: int | None = None
    day_list_item_id: int | None = None


class FileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    content_type: str | None
    size_bytes: int
    folder_id: int | None
    task_id: int | None
    day_list_item_id: int | None
    is_trashed: bool
    trashed_at: datetime | None
    created_at: datetime
