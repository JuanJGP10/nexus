from sqlalchemy.orm import Session

from app.models.day_list_item import DayListItem
from app.repositories import day_list_item_repository
from app.services.day_list_service import get_day_list


class DayListItemNotFoundError(Exception):
    pass


def create_item(db: Session, user_id: int, day_list_id: int, text: str) -> DayListItem:
    get_day_list(db, user_id, day_list_id)
    return day_list_item_repository.create(db, day_list_id=day_list_id, text=text)


def get_item(db: Session, user_id: int, day_list_id: int, item_id: int) -> DayListItem:
    get_day_list(db, user_id, day_list_id)
    item = day_list_item_repository.get_by_id_for_list(db, day_list_id, item_id)
    if item is None:
        raise DayListItemNotFoundError(item_id)
    return item


def update_item(db: Session, user_id: int, day_list_id: int, item_id: int, **fields) -> DayListItem:
    item = get_item(db, user_id, day_list_id, item_id)
    return day_list_item_repository.update(db, item, **fields)


def delete_item(db: Session, user_id: int, day_list_id: int, item_id: int) -> None:
    item = get_item(db, user_id, day_list_id, item_id)
    day_list_item_repository.delete(db, item)
