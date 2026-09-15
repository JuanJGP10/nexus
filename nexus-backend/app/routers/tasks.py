from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.task import DayOfWeek, TaskPriority
from app.models.user import User
from app.schemas.subtask import SubtaskCreate, SubtaskOut, SubtaskUpdate
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate
from app.services import subtask_service, task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return task_service.create_task(
        db,
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        day_of_week=payload.day_of_week,
    )


@router.get("", response_model=list[TaskOut])
def list_tasks(
    is_done: bool | None = None,
    priority: TaskPriority | None = None,
    day_of_week: DayOfWeek | None = None,
    sort_by: Literal["created_at", "priority"] = "created_at",
    order: Literal["asc", "desc"] = "desc",
    include_trashed: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return task_service.list_tasks(
        db,
        user_id=current_user.id,
        is_done=is_done,
        priority=priority,
        day_of_week=day_of_week,
        sort_by=sort_by,
        order=order,
        include_trashed=include_trashed,
    )


@router.get("/trash", response_model=list[TaskOut])
def list_trash(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_service.list_trash(db, user_id=current_user.id)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return task_service.get_task(db, user_id=current_user.id, task_id=task_id)
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return task_service.update_task(
            db, user_id=current_user.id, task_id=task_id, **payload.model_dump(exclude_unset=True)
        )
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.delete("/{task_id}", response_model=TaskOut)
def delete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return task_service.trash_task(db, user_id=current_user.id, task_id=task_id)
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.post("/{task_id}/restore", response_model=TaskOut)
def restore_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return task_service.restore_task(db, user_id=current_user.id, task_id=task_id)
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.delete("/{task_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def permanently_delete_task(
    task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        task_service.permanently_delete_task(db, user_id=current_user.id, task_id=task_id)
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    except task_service.TaskNotTrashedError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{task_id}/subtasks", response_model=SubtaskOut, status_code=status.HTTP_201_CREATED)
def create_subtask(
    task_id: int,
    payload: SubtaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return subtask_service.create_subtask(db, user_id=current_user.id, task_id=task_id, title=payload.title)
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.get("/{task_id}/subtasks", response_model=list[SubtaskOut])
def list_subtasks(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return subtask_service.list_subtasks(db, user_id=current_user.id, task_id=task_id)
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.patch("/{task_id}/subtasks/{subtask_id}", response_model=SubtaskOut)
def update_subtask(
    task_id: int,
    subtask_id: int,
    payload: SubtaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return subtask_service.update_subtask(
            db,
            user_id=current_user.id,
            task_id=task_id,
            subtask_id=subtask_id,
            **payload.model_dump(exclude_unset=True),
        )
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    except subtask_service.SubtaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")


@router.delete("/{task_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtask(
    task_id: int,
    subtask_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        subtask_service.delete_subtask(db, user_id=current_user.id, task_id=task_id, subtask_id=subtask_id)
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    except subtask_service.SubtaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")
