from datetime import date as date_type
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.day_list_item import DayListItem


class DayList(Base):
    __tablename__ = "day_lists"

    id: Mapped[int] = mapped_column(primary_key=True)
    # NULL = lista suelta (sección "Listas"), con fecha = lista anclada al calendario
    date: Mapped[date_type | None] = mapped_column(Date, nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    items: Mapped[list["DayListItem"]] = relationship(
        "DayListItem", back_populates="day_list", cascade="all, delete-orphan", order_by="DayListItem.id"
    )
