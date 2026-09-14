from datetime import date as date_type

from sqlalchemy.orm import Session, selectinload

from app.models.day_list import DayList


def create(db: Session, user_id: int, date: date_type | None, title: str) -> DayList:
    day_list = DayList(user_id=user_id, date=date, title=title)
    db.add(day_list)
    db.commit()
    db.refresh(day_list)
    return day_list


def get_by_id_for_user(db: Session, user_id: int, day_list_id: int) -> DayList | None:
    return (
        db.query(DayList)
        .options(selectinload(DayList.items))
        .filter(DayList.id == day_list_id, DayList.user_id == user_id)
        .first()
    )


def list_for_user_and_date(db: Session, user_id: int, date: date_type | None) -> list[DayList]:
    return (
        db.query(DayList)
        .options(selectinload(DayList.items))
        .filter(DayList.user_id == user_id, DayList.date.is_(date) if date is None else DayList.date == date)
        .order_by(DayList.id)
        .all()
    )


def list_dates_for_user(db: Session, user_id: int) -> list[date_type]:
    rows = (
        db.query(DayList.date)
        .filter(DayList.user_id == user_id, DayList.date.isnot(None))
        .distinct()
        .all()
    )
    return [row[0] for row in rows]


def update(db: Session, day_list: DayList, **fields) -> DayList:
    for key, value in fields.items():
        setattr(day_list, key, value)
    db.commit()
    db.refresh(day_list)
    return day_list


def delete(db: Session, day_list: DayList) -> None:
    db.delete(day_list)
    db.commit()
