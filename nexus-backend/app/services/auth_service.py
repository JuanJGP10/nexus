from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories import user_repository


class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


def register_user(db: Session, email: str, password: str) -> User:
    if user_repository.get_by_email(db, email):
        raise EmailAlreadyRegisteredError(email)
    return user_repository.create(db, email=email, hashed_password=hash_password(password))


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = user_repository.get_by_email(db, email)
    password_ok = verify_password(password, user.hashed_password if user else None)
    if not user or not password_ok:
        raise InvalidCredentialsError()
    return user


def login(db: Session, email: str, password: str) -> str:
    user = authenticate_user(db, email, password)
    return create_access_token(subject=str(user.id))
