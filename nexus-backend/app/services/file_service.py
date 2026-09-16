from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.file import File
from app.repositories import file_repository
from app.services import day_list_item_service, day_list_service, folder_service, naming, storage, task_service


class FileRecordNotFoundError(Exception):
    pass


class FileNotTrashedError(Exception):
    pass


def get_file_path(file: File) -> Path:
    return storage.path_for(file.user_id, file.stored_name)


def create_file(
    db: Session,
    user_id: int,
    upload: UploadFile,
    folder_id: int | None,
    task_id: int | None,
    day_list_item_id: int | None = None,
) -> File:
    if folder_id is not None:
        folder_service.get_folder(db, user_id, folder_id)
    if task_id is not None:
        task_service.get_task(db, user_id, task_id)
    if day_list_item_id is not None:
        day_list_item_service.get_item_for_user(db, user_id, day_list_item_id)

    stored_name = storage.make_stored_name(upload.filename or "file")
    destination = storage.user_dir(user_id) / stored_name
    size_bytes = 0
    with destination.open("wb") as out:
        while chunk := upload.file.read(1024 * 1024):
            size_bytes += len(chunk)
            out.write(chunk)

    filename = upload.filename or stored_name
    if folder_id is not None or (task_id is None and day_list_item_id is None):
        # Solo desambiguamos dentro de una carpeta del explorador; un adjunto de
        # tarea o de item de lista puede repetir nombre sin molestar a nadie.
        taken = file_repository.list_names_in_folder(db, user_id, folder_id)
        filename = naming.unique_name(taken, filename)

    return file_repository.create(
        db,
        user_id=user_id,
        filename=filename,
        stored_name=stored_name,
        content_type=upload.content_type,
        size_bytes=size_bytes,
        folder_id=folder_id,
        task_id=task_id,
        day_list_item_id=day_list_item_id,
    )


def get_file(db: Session, user_id: int, file_id: int) -> File:
    file = file_repository.get_by_id_for_user(db, user_id, file_id)
    if file is None:
        raise FileRecordNotFoundError(file_id)
    return file


def list_files(
    db: Session,
    user_id: int,
    folder_id: int | None,
    task_id: int | None,
    include_trashed: bool,
    day_list_item_id: int | None = None,
    day_list_id: int | None = None,
) -> list[File]:
    if day_list_id is not None:
        day_list_service.get_day_list(db, user_id, day_list_id)
        return file_repository.list_for_day_list(db, user_id, day_list_id, include_trashed)
    if day_list_item_id is not None:
        day_list_item_service.get_item_for_user(db, user_id, day_list_item_id)
        return file_repository.list_for_day_list_item(db, user_id, day_list_item_id, include_trashed)
    if task_id is not None:
        task_service.get_task(db, user_id, task_id)
        return file_repository.list_for_task(db, user_id, task_id, include_trashed)
    if folder_id is not None:
        folder_service.get_folder(db, user_id, folder_id)
    return file_repository.list_for_user(db, user_id, folder_id, include_trashed)


def list_trash(db: Session, user_id: int) -> list[File]:
    return file_repository.list_trashed_for_user(db, user_id)


def search_files(db: Session, user_id: int, query_text: str, include_trashed: bool) -> list[File]:
    return file_repository.search_for_user(db, user_id, query_text, include_trashed)


def update_file(db: Session, user_id: int, file_id: int, **fields) -> File:
    file = get_file(db, user_id, file_id)
    if fields.get("folder_id") is not None:
        folder_service.get_folder(db, user_id, fields["folder_id"])
    if fields.get("task_id") is not None:
        task_service.get_task(db, user_id, fields["task_id"])
    if fields.get("day_list_item_id") is not None:
        day_list_item_service.get_item_for_user(db, user_id, fields["day_list_item_id"])

    # Mover o renombrar dentro del explorador: evitar dos nombres iguales en la
    # misma carpeta añadiendo " (n)", igual que haría un gestor de archivos real.
    if "filename" in fields or "folder_id" in fields:
        target_folder_id = fields["folder_id"] if "folder_id" in fields else file.folder_id
        target_name = fields.get("filename", file.filename)
        taken = file_repository.list_names_in_folder(db, user_id, target_folder_id)
        if target_folder_id == file.folder_id:
            taken.discard(file.filename)  # el propio archivo no colisiona consigo mismo
        fields["filename"] = naming.unique_name(taken, target_name)

    return file_repository.update(db, file, **fields)


def copy_file(db: Session, user_id: int, file_id: int, folder_id: int | None) -> File:
    """Duplica un archivo (registro + bytes en disco) dentro de la carpeta destino."""
    source = get_file(db, user_id, file_id)
    if folder_id is not None:
        folder_service.get_folder(db, user_id, folder_id)

    taken = file_repository.list_names_in_folder(db, user_id, folder_id)
    new_stored_name = storage.duplicate_blob(user_id, source.stored_name)

    return file_repository.create(
        db,
        user_id=user_id,
        filename=naming.unique_name(taken, source.filename),
        stored_name=new_stored_name,
        content_type=source.content_type,
        size_bytes=source.size_bytes,
        folder_id=folder_id,
        task_id=None,
        day_list_item_id=None,
    )


def trash_file(db: Session, user_id: int, file_id: int) -> File:
    file = get_file(db, user_id, file_id)
    if file.is_trashed:
        return file
    return file_repository.update(db, file, is_trashed=True, trashed_at=datetime.now(timezone.utc))


def restore_file(db: Session, user_id: int, file_id: int) -> File:
    file = get_file(db, user_id, file_id)
    if not file.is_trashed:
        return file
    return file_repository.update(db, file, is_trashed=False, trashed_at=None)


def permanently_delete_file(db: Session, user_id: int, file_id: int) -> None:
    file = get_file(db, user_id, file_id)
    if not file.is_trashed:
        raise FileNotTrashedError("File must be trashed before it can be permanently deleted")
    get_file_path(file).unlink(missing_ok=True)
    file_repository.delete(db, file)


def empty_trash(db: Session, user_id: int) -> int:
    """Borra definitivamente todo lo que hay en la papelera. Devuelve cuántos archivos."""
    trashed = file_repository.list_trashed_for_user(db, user_id)
    for file in trashed:
        get_file_path(file).unlink(missing_ok=True)
        file_repository.delete(db, file)
    return len(trashed)
