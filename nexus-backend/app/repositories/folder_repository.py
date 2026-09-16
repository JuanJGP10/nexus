from sqlalchemy.orm import Session

from app.models.folder import Folder


def create(db: Session, user_id: int, name: str, parent_id: int | None) -> Folder:
    folder = Folder(user_id=user_id, name=name, parent_id=parent_id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


def get_by_id_for_user(db: Session, user_id: int, folder_id: int) -> Folder | None:
    return db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()


def list_for_user(db: Session, user_id: int, parent_id: int | None) -> list[Folder]:
    return (
        db.query(Folder)
        .filter(Folder.user_id == user_id, Folder.parent_id == parent_id)
        .order_by(Folder.name)
        .all()
    )


def update(db: Session, folder: Folder, **fields) -> Folder:
    for key, value in fields.items():
        setattr(folder, key, value)
    db.commit()
    db.refresh(folder)
    return folder


def delete(db: Session, folder: Folder) -> None:
    db.delete(folder)
    db.commit()


def has_children(db: Session, user_id: int, folder_id: int) -> bool:
    return db.query(Folder).filter(Folder.user_id == user_id, Folder.parent_id == folder_id).first() is not None


def get_by_name_and_parent(db: Session, user_id: int, parent_id: int | None, name: str) -> Folder | None:
    return (
        db.query(Folder)
        .filter(Folder.user_id == user_id, Folder.parent_id == parent_id, Folder.name == name)
        .first()
    )


def list_names_in_parent(db: Session, user_id: int, parent_id: int | None) -> set[str]:
    """Nombres de las subcarpetas de un padre, para resolver colisiones al copiar."""
    rows = db.query(Folder.name).filter(Folder.user_id == user_id, Folder.parent_id == parent_id).all()
    return {row[0] for row in rows}
