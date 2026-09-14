from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate
from app.services import note_service

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return note_service.create_note(db, user_id=current_user.id, title=payload.title, content=payload.content)


@router.get("", response_model=list[NoteOut])
def list_notes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return note_service.list_notes(db, user_id=current_user.id)


@router.get("/{note_id}", response_model=NoteOut)
def get_note(note_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return note_service.get_note(db, user_id=current_user.id, note_id=note_id)
    except note_service.NoteNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return note_service.update_note(
            db, user_id=current_user.id, note_id=note_id, **payload.model_dump(exclude_unset=True)
        )
    except note_service.NoteNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        note_service.delete_note(db, user_id=current_user.id, note_id=note_id)
    except note_service.NoteNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
