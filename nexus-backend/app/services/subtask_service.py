from sqlalchemy.orm import Session

from app.models.subtask import Subtask
from app.repositories import subtask_repository
from app.services.task_service import get_task


class SubtaskNotFoundError(Exception):
    pass


def create_subtask(db: Session, user_id: int, task_id: int, title: str) -> Subtask:
    get_task(db, user_id, task_id)
    return subtask_repository.create(db, task_id=task_id, title=title)


def list_subtasks(db: Session, user_id: int, task_id: int) -> list[Subtask]:
    get_task(db, user_id, task_id)
    return subtask_repository.list_for_task(db, task_id)


def get_subtask(db: Session, user_id: int, task_id: int, subtask_id: int) -> Subtask:
    get_task(db, user_id, task_id)
    subtask = subtask_repository.get_by_id_for_task(db, task_id, subtask_id)
    if subtask is None:
        raise SubtaskNotFoundError(subtask_id)
    return subtask


def update_subtask(db: Session, user_id: int, task_id: int, subtask_id: int, **fields) -> Subtask:
    subtask = get_subtask(db, user_id, task_id, subtask_id)
    return subtask_repository.update(db, subtask, **fields)


def delete_subtask(db: Session, user_id: int, task_id: int, subtask_id: int) -> None:
    subtask = get_subtask(db, user_id, task_id, subtask_id)
    subtask_repository.delete(db, subtask)
