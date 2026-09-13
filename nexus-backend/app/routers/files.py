from fastapi import APIRouter, Depends, File as FileParam, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.file import FileOut, FileUpdate
from app.services import file_service, folder_service, task_service

router = APIRouter(prefix="/files", tags=["files"])


@router.post("", response_model=FileOut, status_code=status.HTTP_201_CREATED)
def upload_file(
    upload: UploadFile = FileParam(...),
    folder_id: int | None = Form(None),
    task_id: int | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return file_service.create_file(
            db, user_id=current_user.id, upload=upload, folder_id=folder_id, task_id=task_id
        )
    except folder_service.FolderNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.get("/search", response_model=list[FileOut])
def search_files(
    q: str,
    include_trashed: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return file_service.search_files(db, user_id=current_user.id, query_text=q, include_trashed=include_trashed)


@router.get("/trash", response_model=list[FileOut])
def list_trash(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return file_service.list_trash(db, user_id=current_user.id)


@router.get("", response_model=list[FileOut])
def list_files(
    folder_id: int | None = None,
    include_trashed: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return file_service.list_files(
            db, user_id=current_user.id, folder_id=folder_id, include_trashed=include_trashed
        )
    except folder_service.FolderNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")


@router.get("/{file_id}", response_model=FileOut)
def get_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return file_service.get_file(db, user_id=current_user.id, file_id=file_id)
    except file_service.FileRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")


@router.get("/{file_id}/download")
def download_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        file = file_service.get_file(db, user_id=current_user.id, file_id=file_id)
    except file_service.FileRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    path = file_service.get_file_path(file)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File content missing on disk")
    return FileResponse(path, filename=file.filename, media_type=file.content_type or "application/octet-stream")


@router.patch("/{file_id}", response_model=FileOut)
def update_file(
    file_id: int,
    payload: FileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return file_service.update_file(
            db, user_id=current_user.id, file_id=file_id, **payload.model_dump(exclude_unset=True)
        )
    except file_service.FileRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    except folder_service.FolderNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    except task_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.delete("/{file_id}", response_model=FileOut)
def trash_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return file_service.trash_file(db, user_id=current_user.id, file_id=file_id)
    except file_service.FileRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")


@router.post("/{file_id}/restore", response_model=FileOut)
def restore_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return file_service.restore_file(db, user_id=current_user.id, file_id=file_id)
    except file_service.FileRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")


@router.delete("/{file_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def permanently_delete_file(
    file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        file_service.permanently_delete_file(db, user_id=current_user.id, file_id=file_id)
    except file_service.FileRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    except file_service.FileNotTrashedError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
