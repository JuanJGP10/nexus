from sqlalchemy.orm import Session

from app.models.day_list_item import DayListItem
from app.models.file import File


def create(
    db: Session,
    user_id: int,
    filename: str,
    stored_name: str,
    content_type: str | None,
    size_bytes: int,
    folder_id: int | None,
    task_id: int | None,
    day_list_item_id: int | None = None,
) -> File:
    file = File(
        user_id=user_id,
        filename=filename,
        stored_name=stored_name,
        content_type=content_type,
        size_bytes=size_bytes,
        folder_id=folder_id,
        task_id=task_id,
        day_list_item_id=day_list_item_id,
    )
    db.add(file)
    db.commit()
    db.refresh(file)
    return file


def get_by_id_for_user(db: Session, user_id: int, file_id: int) -> File | None:
    return db.query(File).filter(File.id == file_id, File.user_id == user_id).first()


def list_for_user(db: Session, user_id: int, folder_id: int | None, include_trashed: bool) -> list[File]:
    query = db.query(File).filter(File.user_id == user_id, File.folder_id == folder_id)
    if not include_trashed:
        query = query.filter(File.is_trashed.is_(False))
    return query.order_by(File.filename).all()


def list_for_task(db: Session, user_id: int, task_id: int, include_trashed: bool) -> list[File]:
    query = db.query(File).filter(File.user_id == user_id, File.task_id == task_id)
    if not include_trashed:
        query = query.filter(File.is_trashed.is_(False))
    return query.order_by(File.filename).all()


def list_for_day_list_item(db: Session, user_id: int, day_list_item_id: int, include_trashed: bool) -> list[File]:
    query = db.query(File).filter(File.user_id == user_id, File.day_list_item_id == day_list_item_id)
    if not include_trashed:
        query = query.filter(File.is_trashed.is_(False))
    return query.order_by(File.filename).all()


def list_for_day_list(db: Session, user_id: int, day_list_id: int, include_trashed: bool) -> list[File]:
    """Adjuntos de todos los elementos de una lista, en una sola consulta.

    El explorador de listas necesita pintar los archivos de cada elemento a la
    vez; pedirlos item por item serían tantas peticiones como elementos tenga
    la lista.
    """
    query = (
        db.query(File)
        .join(DayListItem, File.day_list_item_id == DayListItem.id)
        .filter(File.user_id == user_id, DayListItem.day_list_id == day_list_id)
    )
    if not include_trashed:
        query = query.filter(File.is_trashed.is_(False))
    return query.order_by(File.filename).all()


def list_trashed_for_user(db: Session, user_id: int) -> list[File]:
    return (
        db.query(File)
        .filter(File.user_id == user_id, File.is_trashed.is_(True))
        .order_by(File.trashed_at.desc())
        .all()
    )


def search_for_user(db: Session, user_id: int, query_text: str, include_trashed: bool) -> list[File]:
    query = db.query(File).filter(File.user_id == user_id, File.filename.ilike(f"%{query_text}%"))
    if not include_trashed:
        query = query.filter(File.is_trashed.is_(False))
    return query.order_by(File.filename).all()


def has_files_in_folder(db: Session, user_id: int, folder_id: int) -> bool:
    return db.query(File).filter(File.user_id == user_id, File.folder_id == folder_id).first() is not None


def update(db: Session, file: File, **fields) -> File:
    for key, value in fields.items():
        setattr(file, key, value)
    db.commit()
    db.refresh(file)
    return file


def delete(db: Session, file: File) -> None:
    db.delete(file)
    db.commit()


def list_names_in_folder(db: Session, user_id: int, folder_id: int | None) -> set[str]:
    """Nombres visibles (no en papelera) de una carpeta, para resolver colisiones al copiar."""
    rows = (
        db.query(File.filename)
        .filter(File.user_id == user_id, File.folder_id == folder_id, File.is_trashed.is_(False))
        .all()
    )
    return {row[0] for row in rows}


def detach_and_trash_in_folder(db: Session, user_id: int, folder_id: int, trashed_at) -> int:
    """Manda a la papelera los archivos de una carpeta y los desvincula de ella.

    Hay que soltar el `folder_id` porque justo después se borra la fila de la
    carpeta: la FK `files.folder_id` no tiene ON DELETE, así que dejarla apuntando
    reventaría con IntegrityError. Al restaurarlos desde la papelera aparecen en
    la raíz, que es lo esperable si su carpeta ya no existe.
    """
    count = (
        db.query(File)
        .filter(File.user_id == user_id, File.folder_id == folder_id)
        .update(
            {File.folder_id: None, File.is_trashed: True, File.trashed_at: trashed_at},
            synchronize_session=False,
        )
    )
    db.commit()
    return count
