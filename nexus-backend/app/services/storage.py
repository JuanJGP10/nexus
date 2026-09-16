"""Primitivas de disco para los archivos subidos.

Separado de `file_service` porque `folder_service` también necesita copiar bytes
(al copiar una carpeta entera) y no puede importar `file_service`: sería un ciclo,
ya que `file_service` importa `folder_service` para validar la carpeta destino.
"""

import re
import shutil
import uuid
from pathlib import Path

from app.core.config import settings

_SAFE_EXTENSION = re.compile(r"^\.[A-Za-z0-9]{1,10}$")


def user_dir(user_id: int) -> Path:
    path = Path(settings.storage_root) / str(user_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def make_stored_name(original_filename: str) -> str:
    """Nombre en disco: UUID + extensión saneada. Nunca deriva del nombre que sube el usuario."""
    extension = Path(original_filename).suffix
    if not _SAFE_EXTENSION.match(extension):
        extension = ""
    return f"{uuid.uuid4().hex}{extension}"


def path_for(user_id: int, stored_name: str) -> Path:
    return Path(settings.storage_root) / str(user_id) / stored_name


def duplicate_blob(user_id: int, stored_name: str) -> str:
    """Copia el contenido en disco bajo un `stored_name` nuevo y lo devuelve."""
    source = path_for(user_id, stored_name)
    new_stored_name = make_stored_name(stored_name)
    destination = user_dir(user_id) / new_stored_name
    if source.is_file():
        shutil.copy2(source, destination)
    else:
        # El registro existe pero el blob se perdió: creamos uno vacío en vez de
        # reventar, para que copiar una carpeta no se quede a medias.
        destination.touch()
    return new_stored_name
