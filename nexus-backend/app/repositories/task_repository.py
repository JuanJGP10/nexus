from sqlalchemy import case
from sqlalchemy.orm import Session, selectinload

from app.models.task import Task, TaskPriority

_PRIORITY_RANK = case(
    (Task.priority == TaskPriority.low, 0),
    (Task.priority == TaskPriority.medium, 1),
    (Task.priority == TaskPriority.high, 2),
)


def create(db: Session, user_id: int, title: str, description: str | None, priority: TaskPriority) -> Task:
    task = Task(user_id=user_id, title=title, description=description, priority=priority)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_by_id_for_user(db: Session, user_id: int, task_id: int) -> Task | None:
    return (
        db.query(Task)
        .options(selectinload(Task.subtasks))
        .filter(Task.id == task_id, Task.user_id == user_id)
        .first()
    )


def list_for_user(
    db: Session,
    user_id: int,
    is_done: bool | None = None,
    priority: TaskPriority | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
    include_trashed: bool = False,
) -> list[Task]:
    query = db.query(Task).options(selectinload(Task.subtasks)).filter(Task.user_id == user_id)
    if not include_trashed:
        query = query.filter(Task.is_trashed.is_(False))
    if is_done is not None:
        query = query.filter(Task.is_done == is_done)
    if priority is not None:
        query = query.filter(Task.priority == priority)

    sort_column = _PRIORITY_RANK if sort_by == "priority" else Task.created_at
    sort_column = sort_column.asc() if order == "asc" else sort_column.desc()
    return query.order_by(sort_column).all()


def list_trashed_for_user(db: Session, user_id: int) -> list[Task]:
    return (
        db.query(Task)
        .options(selectinload(Task.subtasks))
        .filter(Task.user_id == user_id, Task.is_trashed.is_(True))
        .order_by(Task.trashed_at.desc())
        .all()
    )


def update(db: Session, task: Task, **fields) -> Task:
    for key, value in fields.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def delete(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
