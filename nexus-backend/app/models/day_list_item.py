from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.day_list import DayList


class DayListItem(Base):
    __tablename__ = "day_list_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    is_done: Mapped[bool] = mapped_column(default=False, nullable=False)
    day_list_id: Mapped[int] = mapped_column(ForeignKey("day_lists.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    day_list: Mapped["DayList"] = relationship("DayList", back_populates="items")
