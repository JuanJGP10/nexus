from sqlalchemy.orm import Session

from app.models.note import Note


def create(db: Session, user_id: int, title: str, content: str) -> Note:
    note = Note(user_id=user_id, title=title, content=content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_by_id_for_user(db: Session, user_id: int, note_id: int) -> Note | None:
    return db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()


def list_for_user(db: Session, user_id: int) -> list[Note]:
    return db.query(Note).filter(Note.user_id == user_id).order_by(Note.updated_at.desc()).all()


def update(db: Session, note: Note, **fields) -> Note:
    for key, value in fields.items():
        setattr(note, key, value)
    db.commit()
    db.refresh(note)
    return note


def delete(db: Session, note: Note) -> None:
    db.delete(note)
    db.commit()
