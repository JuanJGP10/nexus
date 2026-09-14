from sqlalchemy.orm import Session

from app.models.note import Note
from app.repositories import note_repository


class NoteNotFoundError(Exception):
    pass


def create_note(db: Session, user_id: int, title: str, content: str) -> Note:
    return note_repository.create(db, user_id=user_id, title=title, content=content)


def list_notes(db: Session, user_id: int) -> list[Note]:
    return note_repository.list_for_user(db, user_id)


def get_note(db: Session, user_id: int, note_id: int) -> Note:
    note = note_repository.get_by_id_for_user(db, user_id, note_id)
    if note is None:
        raise NoteNotFoundError(note_id)
    return note


def update_note(db: Session, user_id: int, note_id: int, **fields) -> Note:
    note = get_note(db, user_id, note_id)
    return note_repository.update(db, note, **fields)


def delete_note(db: Session, user_id: int, note_id: int) -> None:
    note = get_note(db, user_id, note_id)
    note_repository.delete(db, note)
