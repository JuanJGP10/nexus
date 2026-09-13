from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.task import Task, TaskPriority
from app.repositories import task_repository


class TaskNotFoundError(Exception):
    pass


class TaskNotTrashedError(Exception):
    pass


def create_task(
    db: Session, user_id: int, title: str, description: str | None, priority: TaskPriority
) -> Task:
    return task_repository.create(db, user_id=user_id, title=title, description=description, priority=priority)


def list_tasks(
    db: Session,
    user_id: int,
    is_done: bool | None = None,
    priority: TaskPriority | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
    include_trashed: bool = False,
) -> list[Task]:
    return task_repository.list_for_user(
        db,
        user_id,
        is_done=is_done,
        priority=priority,
        sort_by=sort_by,
        order=order,
        include_trashed=include_trashed,
    )


def list_trash(db: Session, user_id: int) -> list[Task]:
    return task_repository.list_trashed_for_user(db, user_id)


def get_task(db: Session, user_id: int, task_id: int) -> Task:
    task = task_repository.get_by_id_for_user(db, user_id, task_id)
    if task is None:
        raise TaskNotFoundError(task_id)
    return task


def update_task(db: Session, user_id: int, task_id: int, **fields) -> Task:
    task = get_task(db, user_id, task_id)
    return task_repository.update(db, task, **fields)


def trash_task(db: Session, user_id: int, task_id: int) -> Task:
    task = get_task(db, user_id, task_id)
    if task.is_trashed:
        return task
    return task_repository.update(db, task, is_trashed=True, trashed_at=datetime.now(timezone.utc))


def restore_task(db: Session, user_id: int, task_id: int) -> Task:
    task = get_task(db, user_id, task_id)
    if not task.is_trashed:
        return task
    return task_repository.update(db, task, is_trashed=False, trashed_at=None)


def permanently_delete_task(db: Session, user_id: int, task_id: int) -> None:
    task = get_task(db, user_id, task_id)
    if not task.is_trashed:
        raise TaskNotTrashedError("Task must be trashed before it can be permanently deleted")
    task_repository.delete(db, task)
