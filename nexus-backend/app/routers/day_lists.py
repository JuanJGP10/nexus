from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.day_list import (
    DayListCreate,
    DayListItemCreate,
    DayListItemOut,
    DayListItemUpdate,
    DayListOut,
    DayListUpdate,
)
from app.services import day_list_item_service, day_list_service

router = APIRouter(prefix="/day-lists", tags=["day-lists"])


@router.post("", response_model=DayListOut, status_code=status.HTTP_201_CREATED)
def create_day_list(
    payload: DayListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return day_list_service.create_day_list(
        db, user_id=current_user.id, date=payload.date, title=payload.title
    )


@router.get("", response_model=list[DayListOut])
def list_day_lists(
    date: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return day_list_service.list_day_lists(db, user_id=current_user.id, date=date)


@router.get("/dates", response_model=list[date])
def list_dates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return day_list_service.list_dates(db, user_id=current_user.id)


@router.patch("/{day_list_id}", response_model=DayListOut)
def update_day_list(
    day_list_id: int,
    payload: DayListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return day_list_service.update_day_list(
            db, user_id=current_user.id, day_list_id=day_list_id, **payload.model_dump(exclude_unset=True)
        )
    except day_list_service.DayListNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")


@router.delete("/{day_list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_day_list(
    day_list_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        day_list_service.delete_day_list(db, user_id=current_user.id, day_list_id=day_list_id)
    except day_list_service.DayListNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")


@router.post("/{day_list_id}/items", response_model=DayListItemOut, status_code=status.HTTP_201_CREATED)
def create_item(
    day_list_id: int,
    payload: DayListItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return day_list_item_service.create_item(
            db, user_id=current_user.id, day_list_id=day_list_id, text=payload.text
        )
    except day_list_service.DayListNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")


@router.patch("/{day_list_id}/items/{item_id}", response_model=DayListItemOut)
def update_item(
    day_list_id: int,
    item_id: int,
    payload: DayListItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return day_list_item_service.update_item(
            db,
            user_id=current_user.id,
            day_list_id=day_list_id,
            item_id=item_id,
            **payload.model_dump(exclude_unset=True),
        )
    except day_list_service.DayListNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    except day_list_item_service.DayListItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


@router.delete("/{day_list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    day_list_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        day_list_item_service.delete_item(db, user_id=current_user.id, day_list_id=day_list_id, item_id=item_id)
    except day_list_service.DayListNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    except day_list_item_service.DayListItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
