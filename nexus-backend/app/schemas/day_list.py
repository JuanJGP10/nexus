from datetime import date as date_type
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DayListItemCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class DayListItemUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=500)
    is_done: bool | None = None


class DayListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    is_done: bool
    created_at: datetime


class DayListCreate(BaseModel):
    date: date_type | None = None
    title: str = Field(min_length=1, max_length=255)


class DayListUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)


class DayListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date_type | None
    title: str
    created_at: datetime
    items: list[DayListItemOut] = []
