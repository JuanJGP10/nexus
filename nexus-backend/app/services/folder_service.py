from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.folder import Folder
from app.repositories import file_repository, folder_repository
from app.services import naming, storage

MAX_TREE_DEPTH = 40


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


def get_folder_path(db: Session, user_id: int, folder_id: int) -> list[Folder]:
    """Cadena de ancestros desde la raíz hasta `folder_id`, ambos incluidos.

    Lo usa el frontend para pintar las migas de pan cuando salta a una carpeta
    arbitraria (desde el árbol lateral o desde un resultado de búsqueda) en vez
    de haber llegado hasta ella navegando paso a paso.
    """
    chain: list[Folder] = []
    current = get_folder(db, user_id, folder_id)
    while current is not None and len(chain) <= MAX_TREE_DEPTH:
        chain.append(current)
        if current.parent_id is None:
            break
        current = folder_repository.get_by_id_for_user(db, user_id, current.parent_id)
    chain.reverse()
    return chain


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


def _copy_contents(db: Session, user_id: int, source_id: int, target_id: int, depth: int) -> None:
    """Copia recursivamente archivos y subcarpetas de `source_id` dentro de `target_id`."""
    if depth > MAX_TREE_DEPTH:
        raise InvalidFolderMoveError("Folder tree is too deep to copy")

    for file in file_repository.list_for_user(db, user_id, source_id, include_trashed=False):
        file_repository.create(
            db,
            user_id=user_id,
            filename=file.filename,
            stored_name=storage.duplicate_blob(user_id, file.stored_name),
            content_type=file.content_type,
            size_bytes=file.size_bytes,
            folder_id=target_id,
            task_id=None,
            day_list_item_id=None,
        )

    for child in folder_repository.list_for_user(db, user_id, source_id):
        new_child = folder_repository.create(db, user_id=user_id, name=child.name, parent_id=target_id)
        _copy_contents(db, user_id, child.id, new_child.id, depth + 1)


def copy_folder(db: Session, user_id: int, folder_id: int, parent_id: int | None) -> Folder:
    """Duplica una carpeta entera (subcarpetas y archivos) dentro de `parent_id`."""
    source = get_folder(db, user_id, folder_id)
    _ensure_parent_valid(db, user_id, folder_id=folder_id, parent_id=parent_id)

    taken = folder_repository.list_names_in_parent(db, user_id, parent_id)
    name = naming.unique_name(taken, source.name, keep_extension=False)
    copy = folder_repository.create(db, user_id=user_id, name=name, parent_id=parent_id)
    # Los nombres dentro de la copia parten de cero, así que no hay colisiones que resolver.
    _copy_contents(db, user_id, source.id, copy.id, depth=1)
    return copy


def _delete_tree(db: Session, user_id: int, folder: Folder, trashed_at: datetime, depth: int) -> None:
    if depth > MAX_TREE_DEPTH:
        raise FolderNotEmptyError("Folder tree is too deep to delete")
    for child in folder_repository.list_for_user(db, user_id, folder.id):
        _delete_tree(db, user_id, child, trashed_at, depth + 1)
    # Los archivos van a la papelera (recuperables); solo desaparece la jerarquía.
    file_repository.detach_and_trash_in_folder(db, user_id, folder.id, trashed_at)
    folder_repository.delete(db, folder)


def delete_folder(db: Session, user_id: int, folder_id: int, recursive: bool = False) -> None:
    folder = get_folder(db, user_id, folder_id)
    has_subfolders = folder_repository.has_children(db, user_id, folder_id)
    has_files = file_repository.has_files_in_folder(db, user_id, folder_id)

    if not recursive:
        if has_subfolders:
            raise FolderNotEmptyError("Folder has subfolders")
        if has_files:
            raise FolderNotEmptyError("Folder has files")
        folder_repository.delete(db, folder)
        return

    _delete_tree(db, user_id, folder, datetime.now(timezone.utc), depth=1)


def is_empty(db: Session, user_id: int, folder_id: int) -> bool:
    return not folder_repository.has_children(db, user_id, folder_id) and not file_repository.has_files_in_folder(
        db, user_id, folder_id
    )
