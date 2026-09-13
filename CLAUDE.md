# MySpace (nombre provisional) — Contexto del proyecto

> Este archivo lo lee Claude Code automáticamente al empezar cada sesión.
> Actualiza la sección "Estado actual" al final de cada sesión de trabajo.

## Visión

App personal, self-hosted, que empieza como gestor de archivos + tareas y
evoluciona con el tiempo hacia un asistente tipo Jarvis con acceso controlado
a mi contexto (archivos, tareas, notas, calendario) vía herramientas/MCP.
No es un proyecto de portfolio: la prioridad es disfrutar programando y
aprender progresivamente Python/FastAPI a fondo.

## Stack decidido (NO cambiar sin motivo justificado)

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy + Alembic + Pydantic
- **Auth**: JWT (python-jose + passlib para hashing)
- **Base de datos**: PostgreSQL
- **Frontend**: React + JavaScript (NO TypeScript, decisión consciente) + Vite + Tailwind CSS
- **Infraestructura**: Docker / Docker Compose
- **Storage**: disco local del portátil-servidor, sin AWS/S3/servicios de pago
- **Acceso remoto**: Tailscale (VPN mesh privada). NO exponer el servidor a
  internet público, nada de abrir puertos del router directamente
- **IA futura**: vía API (Anthropic/OpenAI/Ollama) con capa de herramientas
  tipo MCP — no acceso directo del modelo a la base de datos

## Entorno de desarrollo

- Desarrollo: PC con Windows (Docker Desktop, backend WSL2)
- Despliegue: portátil con Omarchy (Arch + Hyprland), accedido vía Tailscale/SSH,
  nunca tocado físicamente durante el desarrollo
- Git con `core.autocrlf=input` o `.gitattributes` (`* text=auto eol=lf`) para
  evitar problemas de saltos de línea entre Windows y Linux

## Arquitectura por capas (obligatoria, no saltarse)

```
Router (controller) → Service → Repository (SQLAlchemy) → Schema (Pydantic) → Model (entity)
```

- El Router no sabe nada de SQLAlchemy
- El Service no sabe nada de HTTP
- El Repository no sabe nada de validación de entrada

## Roadmap por fases (NO avanzar de fase sin permiso explícito)

- **V1 (fase actual)**: Login + Files (carpetas, subida, descarga, papelera,
  búsqueda) + Tasks (CRUD, prioridad, subtareas, archivos asociados) +
  relación Files↔Tasks
- Fase 2: Notas, etiquetas, calendario, proyectos, favoritos, versiones de archivos
- Fase 3: Sincronización entre dispositivos, PWA / app móvil
- Fase 4: Asistente IA con herramientas controladas (estilo MCP)
- Fase 5: Automatizaciones (watchers de carpetas, resúmenes semanales, clasificación)

Orden interno acordado dentro de V1: Auth (User + JWT) → Tasks (CRUD puro,
para fijar el patrón de capas) → Files (añade complejidad de storage/disco).

## Cómo trabajar conmigo en este proyecto

- No propongas cambiar de tecnología, librería o arquitectura salvo que se
  pida explícitamente o haya un problema real explicado antes de aplicarlo
- No sobrearquitecturar. Preferir código simple y entendible
- No avanzar de fase aunque parezca fácil añadir algo de una fase posterior
- Explicar el **porqué** de las decisiones técnicas, no solo el qué (el
  usuario está aprendiendo Python/FastAPI a fondo)
- Si hay un problema serio en una decisión ya tomada, decirlo directamente
  con argumentos, pero la decisión final es del usuario
- Priorizar que el proyecto siga siendo divertido de programar

## Contexto personal

Estudiante de DAW, con base previa de Java. El proyecto es en Python a
propósito, para aprenderlo a fondo. Portátil personal como servidor, sin
presupuesto para hosting de pago.

---

## Estado actual

**Última actualización**: 2026-09-13

**Hecho hasta ahora**:
- Esqueleto del repo creado: `nexus-backend/` (FastAPI) + `nexus-frontend/`
  (solo README, sin Vite iniciado todavía) + `docker-compose.yml` (servicios
  `db` Postgres 16 + `backend` FastAPI)
- Estructura de capas vacía creada en `nexus-backend/app/`:
  `routers/ services/ repositories/ schemas/ models/`
- Endpoint `GET /health` funcionando (`routers/health.py`), devuelve
  `{"status": "ok"}`
- `docker compose up --build` probado y funcionando: `db` + `backend`
  levantan correctamente, `/health` responde, Swagger UI en
  `http://localhost:8000/docs`
- Entorno de desarrollo (Windows) resuelto: WSL2 no estaba instalado
  (`wsl --install`, reboot), Docker Desktop configurado con motor WSL2
  (Hyper-V no disponible por ser Windows Home; Docker VMM quedó como
  alternativa no usada)
- Esqueleto ya commiteado ("Python backend skeleton done")
- Auth (User + JWT), primer paso: `app/core/config.py` (Settings con
  pydantic-settings, lee `DATABASE_URL` de env/`.env`), `app/database.py`
  (engine, `SessionLocal`, `Base`, `get_db`), modelo `User` en
  `app/models/user.py` (id, email único, hashed_password, is_active,
  created_at)
- Alembic inicializado en `nexus-backend/` (`alembic.ini` + `alembic/`),
  `env.py` apunta a `Base.metadata` y a `settings.database_url`
- Migración inicial generada y aplicada: tabla `users` creada en Postgres
- **Bug de entorno detectado y evitado**: `psycopg2` desde el venv de
  Windows no puede autenticar contra el Postgres del contenedor vía
  `localhost:5432` (falla SCRAM/decodificación de error localizado en
  español, mensaje de libpq en latin-1 que psycopg2 intenta decodificar
  como utf-8 y revienta antes de mostrar el error real). Funciona sin
  problema dentro de la red de Docker. Solución adoptada: alembic se
  ejecuta dentro del contenedor `backend` (se montaron `alembic.ini` y
  `alembic/` como volúmenes en `docker-compose.yml`), con
  `docker exec nexus-backend-1 alembic <comando>`. El venv de Windows
  sigue sirviendo para editores/type-checking, no para tocar la DB
  directamente
- `nexus-backend/.env` y `.env.example` creados (`DATABASE_URL` para uso
  local fuera de Docker); `.env` ya cubierto por `.gitignore`
- Docker Desktop WSL2 confirmado operativo (`docker info` → kernel
  `...-microsoft-standard-WSL2`); `wsl --install -d Ubuntu` se quedó
  colgado en background esperando crear usuario/password interactivo
  (sin tty) — no bloqueaba Docker, se dejó pendiente a propósito
- Auth (User + JWT) completo: `app/core/security.py` (hash/verify con
  passlib+bcrypt, create/decode JWT con python-jose), schemas
  `UserCreate`/`UserOut` (`schemas/user.py`) y `Token`/`LoginRequest`
  (`schemas/token.py`), `repositories/user_repository.py`
  (get_by_email, create), `services/auth_service.py` (register_user,
  authenticate_user, login), `routers/auth.py` con
  `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `app/dependencies.py`: `get_current_user` (OAuth2PasswordBearer +
  decode JWT + lookup en DB) — dependencia reutilizable para proteger
  rutas de Tasks/Files más adelante
- Probado end-to-end con curl: register, register duplicado (409),
  login ok, login credenciales inválidas (401), `/auth/me` con y sin
  token (200/401)
- **Bug de dependencias detectado y evitado**: `passlib==1.7.4` +
  `bcrypt==5.0.0` incompatibles (passlib lee `bcrypt.__about__`,
  eliminado en bcrypt≥4.1 → `AttributeError`/`ValueError` al hashear).
  Fix: `bcrypt` fijado a `4.0.1` en `requirements.txt`. Si en el futuro
  se sube bcrypt, revisar este pin
- Añadido `email-validator` a `requirements.txt` (requerido por
  `pydantic.EmailStr`, usado en `UserCreate`/`UserOut`)
- **Segunda pasada de revisión sobre Auth (código sensible, se revisó a
  fondo)** — 3 bugs reales encontrados y arreglados:
  1. Timing attack / enumeración de emails en login: si el email no
     existía, no se ejecutaba bcrypt y la respuesta era casi instantánea
     vs. lenta con password incorrecta → filtraba qué emails están
     registrados. Fix: `pwd_context.dummy_verify()` en
     `core/security.py` cuando no hay usuario, mismo coste de tiempo
     siempre
  2. `get_current_user` podía devolver 500 en vez de 401 si el JWT
     traía un `sub` no numérico. Fix: try/except alrededor de
     `int(user_id)` en `app/dependencies.py`
  3. `UserCreate.password` sin límites — aceptaba vacías/cortas y
     >72 bytes (bcrypt trunca en silencio, dos passwords distintas
     podían generar el mismo hash). Fix: `Field(min_length=8,
     max_length=72)` en `schemas/user.py`
  Todo vuelto a probar end-to-end en el contenedor tras los fixes
  (validaciones 422, timing de login, token con `sub` corrupto → 401)

- Tasks (CRUD puro) completo: modelo `Task` en `app/models/task.py`
  (title, description, `TaskPriority` enum low/medium/high, is_done,
  user_id FK a users, created_at, updated_at), relación
  `User.tasks` ↔ `Task.owner` (cascade delete-orphan). Schemas
  `TaskCreate`/`TaskUpdate`/`TaskOut` en `schemas/task.py`,
  `repositories/task_repository.py` y `services/task_service.py`
  (`TaskNotFoundError`), router `routers/tasks.py` con
  `POST/GET /tasks`, `GET/PATCH/DELETE /tasks/{id}`, todo protegido con
  `get_current_user`
- Todas las queries de tasks van scopeadas por `user_id` — una tarea
  ajena da 404 (no 403, no leak de existencia), igual que se hizo en
  auth. Probado con dos usuarios: aislamiento en list, get, patch y
  delete confirmado
- Migración `1c6344726140_create_tasks_table.py` generada y aplicada;
  se corrigió a mano el `downgrade()` (autogenerate no borra el tipo
  enum `task_priority` de Postgres al hacer `drop_table`, quedaba
  huérfano y rompía un downgrade+upgrade posterior) — probado el ciclo
  downgrade→upgrade completo, limpio
- **Corregido más tarde** (ver bloque de Files más abajo): el PATCH de
  Tasks/Subtasks filtraba campos `None`, lo que impedía poner
  `description` a `null` explícitamente. Se cambió a
  `payload.model_dump(exclude_unset=True)` en los routers + servicios
  ya no filtran `None`, así que ahora sí se puede

- **Subtareas** añadidas a Tasks (pedidas explícitamente por el usuario
  para hacer listas de tareas tipo checklist): modelo `Subtask` en
  `app/models/subtask.py` (title, is_done, task_id FK a tasks,
  created_at), relación `Task.subtasks` ↔ `Subtask.task` (cascade
  delete-orphan). Es un modelo propio y simple (checklist), no un
  `Task` autorreferenciado — se descartó anidar Tasks para no meter
  complejidad de árboles/profundidad sin necesidad real
  - Schemas en `schemas/subtask.py`, `repositories/subtask_repository.py`,
    `services/subtask_service.py` (`SubtaskNotFoundError`), endpoints
    anidados en `routers/tasks.py`:
    `POST/GET /tasks/{task_id}/subtasks`,
    `PATCH/DELETE /tasks/{task_id}/subtasks/{subtask_id}`
  - `TaskOut.subtasks` incluye las subtareas anidadas; `task_repository`
    usa `selectinload(Task.subtasks)` para evitar N+1 en list/get
  - Toda operación de subtask primero valida ownership de la task
    padre (`task_service.get_task`) → 404 si no es tuya, mismo patrón
    que el resto. Probado: aislamiento entre usuarios y cascade delete
    (borrar la task borra sus subtasks, verificado en DB, 0 huérfanas)

- **Files completo** (carpetas, subida/descarga, papelera, búsqueda,
  relación con Tasks):
  - `Folder` (`app/models/folder.py`): árbol simple vía `parent_id`
    autorreferenciado (nullable = raíz), `UniqueConstraint(user_id,
    parent_id, name)`
  - `File` (`app/models/file.py`): `filename` (nombre mostrado) +
    `stored_name` (UUID generado por el server, nunca derivado del
    nombre del usuario — evita path traversal), `content_type`,
    `size_bytes`, `folder_id`/`task_id` nullable, `is_trashed` +
    `trashed_at` (papelera = soft delete)
  - Contenido en disco bajo `STORAGE_ROOT` (`app/core/config.py`,
    default `/data/storage`), organizado por `storage/{user_id}/...`.
    En Docker Compose es bind mount `./nexus-backend/storage` →
    `/data/storage`; añadido a `.gitignore`
  - `routers/folders.py`: CRUD de carpetas +
    `services/folder_service.py` con detección de ciclos al mover
    (`InvalidFolderMoveError`, camina la cadena de `parent_id` hacia
    arriba) y bloqueo de borrado si tiene subcarpetas o archivos
    (`FolderNotEmptyError`)
  - `routers/files.py`: `POST /files` (multipart upload), listar por
    carpeta, `GET /files/search?q=`, `GET /files/trash`,
    `GET /files/{id}/download` (`FileResponse`, Content-Disposition
    correcto), `PATCH /files/{id}` (rename/mover/vincular a task),
    `DELETE /files/{id}` (mueve a papelera), `POST
    /files/{id}/restore`, `DELETE /files/{id}/permanent` (solo si ya
    está en papelera — borra fichero de disco + fila en DB)
  - Migración `68c93b4a8fc4_create_folders_and_files_tables.py`
    generada y aplicada (sin enums, downgrade limpio sin ajuste manual)
  - **Bug real encontrado y arreglado**: el `UniqueConstraint` de
    Postgres en `folders(user_id, parent_id, name)` NO detecta
    duplicados cuando `parent_id` es `NULL` (carpetas raíz), porque en
    SQL `NULL != NULL` — se pudieron crear dos carpetas "Documentos" en
    la raíz sin error. Fix: chequeo explícito en
    `folder_service.create_folder`/`update_folder`
    (`folder_repository.get_by_name_and_parent`) que cubre raíz y
    anidado, nuevo `FolderNameConflictError` → 409. Verificado: ahora
    sí da 409 en raíz y en anidado
  - **Fix general de PATCH aplicado a todo el proyecto** (Tasks,
    Subtasks, Folders, Files): antes los routers hacían
    `payload.model_dump()` y el service filtraba valores `None`, lo
    que hacía imposible mandar explícitamente `null` a un campo
    nullable (p. ej. mover un archivo/carpeta a la raíz, o desvincular
    una task de un file). Cambiado a
    `payload.model_dump(exclude_unset=True)` en los routers; los
    services ya no filtran `None`. Probado explícitamente: mover
    archivo/carpeta a raíz y desvincular `task_id` de un file con
    `null` explícito, funciona
  - Probado end-to-end completo: carpetas anidadas, nombre duplicado
    (409 raíz y anidado), mover carpeta dentro de sí misma/de su
    descendiente (400), renombrar, borrar no vacía (400 por
    subcarpetas y por archivos, incluso trashed), subida a carpeta
    ajena/inexistente (404), descarga (contenido íntegro, headers
    correctos), búsqueda por nombre, ciclo completo de papelera
    (trash → aparece en `/files/trash` y desaparece del listado normal
    → restore → permanent delete exige estar trasheado primero (400 si
    no) → borra de disco y de DB), vínculo File↔Task y desvinculación,
    aislamiento entre usuarios en todos los endpoints (404, no leak)
  - Limitación conocida aceptada: nombres de archivo duplicados en la
    misma carpeta no están bloqueados (a diferencia de folders, no se
    añadió `UniqueConstraint`/chequeo — revisar si hace falta cuando
    se use de verdad)

- **Segunda pasada de revisión sobre Subtasks/Files** (releído todo el
  código a fondo buscando bugs, igual que se hizo con Auth):
  - Bug real encontrado: el chequeo de nombre duplicado en
    `folder_service.create_folder`/`update_folder` es check-then-insert
    (no atómico) — dos requests concurrentes podían colar un
    `IntegrityError` crudo (500) si chocaban contra el
    `UniqueConstraint` de Postgres. Fix: try/except `IntegrityError` +
    `db.rollback()` alrededor de las llamadas a
    `folder_repository.create`/`update`, convertido en
    `FolderNameConflictError` → 409 igual que el chequeo normal
  - Verificado (no eran bugs, quedó confirmado con pruebas): renombrar
    una carpeta a su propio nombre actual no dispara el 409 (el
    chequeo excluye `existing.id != folder_id`); un `filename` de
    upload con comillas/`;` inyectadas no rompe la cabecera
    `Content-Disposition` en la descarga — Starlette codifica el
    nombre en RFC 5987 (`filename*=utf-8''%22evil%22...`, todo
    percent-encoded), no hay inyección de cabecera posible
  - Revisado y descartado como no-bug: `db.get`/ORM `== None` en
    SQLAlchemy compila a `IS NULL` correctamente (carpetas/archivos
    raíz con `parent_id`/`folder_id` `None` listan bien, confirmado);
    no hay import circular entre `subtask_service`↔`task_service` ni
    `file_service`↔`folder_service`
  - Limitaciones de bajo riesgo anotadas sin arreglar (no
    sobrearquitecturar en una app personal de un solo usuario): sin
    límite de tamaño de subida (posible llenar disco), búsqueda de
    archivos no escapa `%`/`_` de `ILIKE` (solo afecta a qué coincide
    la búsqueda, no es inyección SQL), un frontend que mande
    `folder_id=""` en el form-data de upload daría 422 en vez de
    tratarlo como `None` (a tener en cuenta al construir el frontend)

- **Endurecido más allá de CRUD simple** (pedido explícito del usuario:
  "meter cosas que pueda necesitar más adelante"). Se propusieron
  varias opciones concretas y justificadas (no features especulativas
  random) y el usuario eligió 4:
  - **CORS**: `app/core/config.py` tiene `cors_origins` (string,
    separado por comas, default `http://localhost:5173` = puerto por
    defecto de Vite). `CORSMiddleware` añadido en `main.py`. Probado:
    origen permitido recibe `access-control-allow-origin`, uno no
    permitido no lo recibe (bloqueado por el navegador)
  - **Filtros/orden en Tasks**: `GET /tasks` acepta `is_done`,
    `priority`, `sort_by` (`created_at`|`priority`), `order`
    (`asc`|`desc`), `include_trashed`. Ordenar por prioridad usa un
    `case()` de SQLAlchemy para mapear low/medium/high a 0/1/2 (el
    orden alfabético del enum no sirve). Probado: asc/desc por
    prioridad y filtro por `priority`/`is_done`
  - **Manejador global de errores**: `@app.exception_handler(Exception)`
    en `main.py` — loguea con `logger.exception(...)` y devuelve
    `{"detail": "Internal server error"}` (500) en vez de dejar pasar
    un traceback crudo. Verificado que NO interfiere con los
    `HTTPException` normales (404/400/409 en todos los endpoints
    siguen funcionando igual tras añadirlo — FastAPI resuelve por
    coincidencia de tipo más específica primero)
  - **Trash/soft-delete en Tasks** (para igualar a Files): añadidas
    columnas `is_trashed`/`trashed_at` a `Task`. `DELETE /tasks/{id}`
    ahora mueve a papelera (200, devuelve la task) en vez de borrar
    directo; nuevos `GET /tasks/trash`, `POST /tasks/{id}/restore`,
    `DELETE /tasks/{id}/permanent` (exige estar trasheada, 400 si no).
    `GET /tasks` excluye trasheadas por defecto. Servicio/router
    calcados del patrón ya usado en `file_service`/`routers/files.py`
  - **Bug real encontrado de rebote al añadir esto**: `permanently_delete_task`
    podía violar la FK `files.task_id → tasks.id` (sin `ON DELETE`)
    si había archivos vinculados a esa task — habría dado 500 (o
    peor, sin el manejador global, un traceback). Fix: FK cambiada a
    `ondelete="SET NULL"` en `File.task_id` (`app/models/file.py`),
    migración con `ALTER CONSTRAINT`. Probado explícitamente: crear
    file vinculado a una task, borrarla permanentemente, el file
    sobrevive con `task_id=null`
  - Migración `9dad73a98018_...` generada; autogenerate avisó que no
    podía nombrar el constraint a dropear en el `downgrade()` (mismo
    tipo de problema que el enum de antes) — corregido a mano con el
    nombre real de Postgres (`files_task_id_fkey`), verificado el
    ciclo downgrade→upgrade completo, limpio

**Siguiente paso concreto**: V1 (Auth → Tasks → Files, ya endurecido)
queda funcionalmente completo a nivel de API. Falta por decidir con el
usuario: (a) empezar el frontend (Vite + React + Tailwind), o (b)
seguir afinando backend (tests automatizados con pytest, que de
momento son manuales con curl). Recordar hacer el primer commit real
del trabajo de esta sesión (nada está commiteado todavía).

**Notas / decisiones pendientes**:
- Frontend (Vite + React + Tailwind) todavía sin iniciar
- Migraciones y comandos de alembic: siempre vía
  `docker exec nexus-backend-1 alembic ...`, no desde el venv de Windows
  (bug de psycopg2+Windows, ver arriba)
- `jwt_secret_key` en `core/config.py` tiene default de desarrollo
  (`dev-secret-change-in-production`) — pendiente definir uno real vía
  `.env` antes de cualquier despliegue
- No hay tests automatizados (pytest) todavía — todo verificado a mano
  con curl en cada sesión. Considerar añadir pytest + una DB de test
  antes de que el proyecto crezca más
- `nexus-backend/storage/` es bind mount a disco del host — al migrar
  al portátil-servidor de despliegue, asegurarse de que esa ruta existe
  y tiene espacio/permisos correctos
- Subtareas y relación Tasks↔Files (mencionadas en la visión de V1)
  quedaron fuera de este primer CRUD a propósito, para no
  sobrearquitecturar antes de tener el patrón de capas asentado