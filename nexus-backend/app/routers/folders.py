from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.folder import FolderCreate, FolderOut, FolderUpdate
from app.services import folder_service

router = APIRouter(prefix="/folders", tags=["folders"])


@router.post("", response_model=FolderOut, status_code=status.HTTP_201_CREATED)
def create_folder(
    payload: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return folder_service.create_folder(
            db, user_id=current_user.id, name=payload.name, parent_id=payload.parent_id
        )
    except folder_service.FolderNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")
    except folder_service.FolderNameConflictError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A folder with that name already exists here")


@router.get("", response_model=list[FolderOut])
def list_folders(
    parent_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.list_folders(db, user_id=current_user.id, parent_id=parent_id)


@router.get("/{folder_id}", response_model=FolderOut)
def get_folder(folder_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return folder_service.get_folder(db, user_id=current_user.id, folder_id=folder_id)
    except folder_service.FolderNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")


@router.patch("/{folder_id}", response_model=FolderOut)
def update_folder(
    folder_id: int,
    payload: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return folder_service.update_folder(
            db, user_id=current_user.id, folder_id=folder_id, **payload.model_dump(exclude_unset=True)
        )
    except folder_service.FolderNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    except folder_service.InvalidFolderMoveError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except folder_service.FolderNameConflictError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A folder with that name already exists here")


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(folder_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        folder_service.delete_folder(db, user_id=current_user.id, folder_id=folder_id)
    except folder_service.FolderNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    except folder_service.FolderNotEmptyError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
