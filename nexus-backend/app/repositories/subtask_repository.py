from sqlalchemy.orm import Session

from app.models.subtask import Subtask


def create(db: Session, task_id: int, title: str) -> Subtask:
    subtask = Subtask(task_id=task_id, title=title)
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask


def get_by_id_for_task(db: Session, task_id: int, subtask_id: int) -> Subtask | None:
    return db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.task_id == task_id).first()


def list_for_task(db: Session, task_id: int) -> list[Subtask]:
    return db.query(Subtask).filter(Subtask.task_id == task_id).order_by(Subtask.id).all()


def update(db: Session, subtask: Subtask, **fields) -> Subtask:
    for key, value in fields.items():
        setattr(subtask, key, value)
    db.commit()
    db.refresh(subtask)
    return subtask


def delete(db: Session, subtask: Subtask) -> None:
    db.delete(subtask)
    db.commit()
