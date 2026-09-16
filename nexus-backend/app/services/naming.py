"""Generación de nombres únicos al copiar archivos y carpetas.

Vive en su propio módulo porque lo necesitan `file_service` y `folder_service`,
y `file_service` ya importa `folder_service` (importarlo al revés sería un ciclo).
"""

from pathlib import Path

MAX_NAME_LENGTH = 255


def _truncate(name: str) -> str:
    return name if len(name) <= MAX_NAME_LENGTH else name[:MAX_NAME_LENGTH]


def unique_name(taken: set[str], name: str, keep_extension: bool = True) -> str:
    """Devuelve `name`, o `name (1)`, `name (2)`… hasta que no colisione con `taken`.

    `keep_extension=True` inserta el sufijo antes de la extensión
    (`notas.txt` -> `notas (1).txt`), que es lo que hace un gestor de archivos real.
    """
    if name not in taken:
        return _truncate(name)

    if keep_extension:
        stem, extension = Path(name).stem, Path(name).suffix
    else:
        stem, extension = name, ""

    counter = 1
    while True:
        candidate = _truncate(f"{stem} ({counter}){extension}")
        if candidate not in taken:
            return candidate
        counter += 1
