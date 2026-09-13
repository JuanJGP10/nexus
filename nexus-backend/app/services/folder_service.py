from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.folder import Folder
from app.repositories import file_repository, folder_repository


class FolderNotFoundError(Exception):
    pass


class FolderNotEmptyError(Exception):
    pass


class InvalidFolderMoveError(Exception):
    pass


class FolderNameConflictError(Exception):
    pass


def _ensure_parent_valid(db: Session, user_id: int, folder_id: int | None, parent_id: int | None) -> None:
    if parent_id is None:
        return
    parent = folder_repository.get_by_id_for_user(db, user_id, parent_id)
    if parent is None:
        raise FolderNotFoundError(parent_id)
    if folder_id is None:
        return
    if parent_id == folder_id:
        raise InvalidFolderMoveError("A folder cannot be its own parent")
    current = parent
    while current.parent_id is not None:
        if current.parent_id == folder_id:
            raise InvalidFolderMoveError("Cannot move a folder into its own descendant")
        current = folder_repository.get_by_id_for_user(db, user_id, current.parent_id)


def create_folder(db: Session, user_id: int, name: str, parent_id: int | None) -> Folder:
    _ensure_parent_valid(db, user_id, folder_id=None, parent_id=parent_id)
    if folder_repository.get_by_name_and_parent(db, user_id, parent_id, name) is not None:
        raise FolderNameConflictError(name)
    try:
        return folder_repository.create(db, user_id=user_id, name=name, parent_id=parent_id)
    except IntegrityError:
        db.rollback()
        raise FolderNameConflictError(name)


def list_folders(db: Session, user_id: int, parent_id: int | None) -> list[Folder]:
    return folder_repository.list_for_user(db, user_id, parent_id)


def get_folder(db: Session, user_id: int, folder_id: int) -> Folder:
    folder = folder_repository.get_by_id_for_user(db, user_id, folder_id)
    if folder is None:
        raise FolderNotFoundError(folder_id)
    return folder


def update_folder(db: Session, user_id: int, folder_id: int, **fields) -> Folder:
    folder = get_folder(db, user_id, folder_id)
    if "parent_id" in fields:
        _ensure_parent_valid(db, user_id, folder_id=folder_id, parent_id=fields["parent_id"])
    if "name" in fields or "parent_id" in fields:
        target_name = fields.get("name", folder.name)
        target_parent_id = fields["parent_id"] if "parent_id" in fields else folder.parent_id
        existing = folder_repository.get_by_name_and_parent(db, user_id, target_parent_id, target_name)
        if existing is not None and existing.id != folder_id:
            raise FolderNameConflictError(target_name)
    try:
        return folder_repository.update(db, folder, **fields)
    except IntegrityError:
        db.rollback()
        raise FolderNameConflictError(fields.get("name", folder.name))


def delete_folder(db: Session, user_id: int, folder_id: int) -> None:
    folder = get_folder(db, user_id, folder_id)
    if folder_repository.has_children(db, user_id, folder_id):
        raise FolderNotEmptyError("Folder has subfolders")
    if file_repository.has_files_in_folder(db, user_id, folder_id):
        raise FolderNotEmptyError("Folder has files")
    folder_repository.delete(db, folder)
