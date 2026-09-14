from datetime import date as date_type

from sqlalchemy.orm import Session

from app.models.day_list import DayList
from app.repositories import day_list_repository


class DayListNotFoundError(Exception):
    pass


def create_day_list(db: Session, user_id: int, date: date_type | None, title: str) -> DayList:
    return day_list_repository.create(db, user_id=user_id, date=date, title=title)


def list_day_lists(db: Session, user_id: int, date: date_type | None) -> list[DayList]:
    return day_list_repository.list_for_user_and_date(db, user_id, date)


def list_dates(db: Session, user_id: int) -> list[date_type]:
    return day_list_repository.list_dates_for_user(db, user_id)


def get_day_list(db: Session, user_id: int, day_list_id: int) -> DayList:
    day_list = day_list_repository.get_by_id_for_user(db, user_id, day_list_id)
    if day_list is None:
        raise DayListNotFoundError(day_list_id)
    return day_list


def update_day_list(db: Session, user_id: int, day_list_id: int, **fields) -> DayList:
    day_list = get_day_list(db, user_id, day_list_id)
    return day_list_repository.update(db, day_list, **fields)


def delete_day_list(db: Session, user_id: int, day_list_id: int) -> None:
    day_list = get_day_list(db, user_id, day_list_id)
    day_list_repository.delete(db, day_list)
