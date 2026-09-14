from sqlalchemy.orm import Session

from app.models.day_list_item import DayListItem


def create(db: Session, day_list_id: int, text: str) -> DayListItem:
    item = DayListItem(day_list_id=day_list_id, text=text)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_by_id_for_list(db: Session, day_list_id: int, item_id: int) -> DayListItem | None:
    return (
        db.query(DayListItem)
        .filter(DayListItem.id == item_id, DayListItem.day_list_id == day_list_id)
        .first()
    )


def update(db: Session, item: DayListItem, **fields) -> DayListItem:
    for key, value in fields.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def delete(db: Session, item: DayListItem) -> None:
    db.delete(item)
    db.commit()
