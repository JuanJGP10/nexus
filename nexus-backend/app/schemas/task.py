from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import DayOfWeek, TaskPriority
from app.schemas.subtask import SubtaskOut


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    priority: TaskPriority = TaskPriority.medium
    day_of_week: DayOfWeek | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    priority: TaskPriority | None = None
    day_of_week: DayOfWeek | None = None
    is_done: bool | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    priority: TaskPriority
    day_of_week: DayOfWeek | None
    is_done: bool
    is_trashed: bool
    trashed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    subtasks: list[SubtaskOut] = []
