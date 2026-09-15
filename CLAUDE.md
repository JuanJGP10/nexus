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
  **⚠️ Ver aviso en "Infraestructura / despliegue" abajo — `docker-compose.yml`
  añadió un servicio `cloudflared` que parece contradecir esto. Sin resolver.**
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

**Nota (ver "Estado actual" abajo)**: en la práctica el proyecto ya superó V1
— Notes, DayLists/calendario, PWA y un primer despliegue ya existen — sin que
este roadmap se haya revisado formalmente. Pendiente actualizarlo con calma,
no a la carrera.

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

**Última actualización**: 2026-09-16 (ver esa sesión más abajo). Regenerado
originalmente el 2026-09-15 desde un grafo de
conocimiento del código (`/graphify`, ver `graphify-out/GRAPH_REPORT.md` y
`graphify-out/graph.html`) en vez de seguir acumulando entradas
cronológicas. El historial detallado de bugs/decisiones de sesiones
anteriores a esta reescritura puede recuperarse con `git log` /
`git show CLAUDE.md` si hace falta el detalle exacto; aquí se prioriza que
la siguiente sesión sepa **qué hay, qué no hay, y qué está pendiente**, no
una bitácora completa de cada comando ejecutado.

**Fase real vs. roadmap**: el código ya está bastante más allá de "V1" del
roadmap de arriba (Notes, DayLists/calendario, PWA, tema oscuro/pastel y un
primer despliegue ya existen). El roadmap por fases sigue sin revisar
formalmente — no se ha decidido saltar de fase, simplemente el documento no
se actualizó al mismo ritmo que el código.

### Qué existe — backend (`nexus-backend/app/`)

- **Auth**: `User` + JWT (`POST /auth/register`, `POST /auth/login`,
  `GET /auth/me`). bcrypt fijado a `4.0.1` (incompatible con passlib en
  versiones más nuevas), mitigación de timing-attack en login
  (`pwd_context.dummy_verify()`), password con límites `8–72` chars,
  `get_current_user` no revienta con un JWT `sub` corrupto (401, no 500)
- **Tasks**: CRUD + `priority` (low/medium/high) + `day_of_week` opcional
  (enum, sin default) + trash/soft-delete (`is_trashed`/`trashed_at`,
  `GET /tasks/trash`, `restore`, `permanent`) + filtros/orden en
  `GET /tasks` (`is_done`, `priority`, `sort_by`, `order`,
  `include_trashed`)
- **Subtasks**: checklist anidado en `Task` (no es un `Task`
  autorreferenciado, es un modelo propio simple), cascade delete
- **Folders**: árbol vía `parent_id` autorreferenciado, detección de
  ciclos al mover, conflicto de nombre → 409 (cubre raíz, donde
  `NULL != NULL` en Postgres no detecta duplicados por defecto — chequeo
  explícito), inserción concurrente protegida contra `IntegrityError` sin
  manejar
- **Files**: subida/descarga/búsqueda/papelera. Un `File` puede
  vincularse, de forma independiente y opcional, a `Folder` **y/o**
  `Task` **y/o** `DayListItem` (tres FKs nullable, sin exclusión mutua).
  `stored_name` es un UUID generado por el servidor — nunca derivado del
  nombre que sube el usuario (evita path traversal). Disco organizado por
  `storage/{user_id}/...`, bind mount en Docker
- **Notes**: CRUD completo (`app/models/note.py` + repositorio/servicio/
  router/schemas) — no estaba reflejado en este archivo hasta esta
  reescritura
- `GET /tasks?day_of_week=...` existía ya pero solo se usaba puntualmente;
  ahora también lo consume el frontend para "tareas de este día de la
  semana" desde el modal de día del calendario (ver sesión 2026-09-16)
- **DayList / DayListItem**: listas tipo checklist, "sueltas" (sección
  "Listas") o ancladas a un día de calendario. Los items pueden llevar
  archivos adjuntos (vía `File.day_list_item_id`)
- CORS configurado (`cors_origins` en `.env`), manejador global de
  excepciones (`@app.exception_handler(Exception)` → 500 controlado, no
  traceback crudo), 11 migraciones Alembic generadas y aplicadas (salvo
  las dos más recientes, ver "Pendiente" abajo)
- Todas las queries están scopeadas por `user_id`: un recurso ajeno da
  404, nunca 403 (no filtra existencia) — patrón consistente en
  Tasks/Subtasks/Folders/Files/Notes/DayLists

### Qué existe — frontend (`nexus-frontend/src/`)

- Vite + React 19 (JS, sin TypeScript) + Tailwind CSS v4 + react-router-dom
- Páginas: `AuthPage`, `DashboardPage` (widgets: `CalendarWidget`,
  `FileExplorer`, `NotesWidget`, `StatusWidget`, `TasksWidget`),
  `TasksPage`, `ListsPage`, `SchedulePage` (`/schedule`, nav "Horario" —
  ver sesión 2026-09-16)
- Tema oscuro + pastel intercambiable (`ThemeSwitcher.jsx`, `theme.js`),
  ajustes responsive/mobile en los modales principales (Calendar,
  DayList, FileExplorer, Note, Task)
- Preview de archivos en modal (`FilePreviewModal.jsx` + hook
  `useFilePreview`) en vez de descarga automática al hacer click: imagen/
  pdf/vídeo/audio/texto se muestran inline con botón Descargar; el resto
  (docx, zip…) sigue descargando directo porque el navegador no puede
  renderizarlo. Usado en `FileExplorer`, `TaskDetailModal` y `ListGrid`
- `DaySubjects.jsx`: lista de asignaturas de un día lectivo, compartida
  entre `SchedulePage` y `DayListModal` (agrupa bloques de 2h consecutivos
  de la misma asignatura en una sola fila vía `buildDayBlocks` en
  `data/schedule.js`, para no listar la misma clase dos veces)
- PWA con manifest + iconos (`vite-plugin-pwa`) — el bug de iconos con
  doble extensión (`.png.png`) ya está arreglado
- Capa API centralizada: `ApiClient` (`api/client.js`) — token JWT en
  `localStorage`, hook `onUnauthorized` → logout automático en 401,
  parsea errores de Pydantic (string o array) en `ApiError`, `download()`
  para blobs con `Content-Disposition` (soporta `filename*=UTF-8''...`)
- `AuthContext` + `ProtectedRoute` para las rutas autenticadas

### Infraestructura / despliegue

`docker-compose.yml` define: `db` (Postgres 16), `backend` (FastAPI),
`frontend` (build de Vite servido por nginx, `nexus-frontend/nginx.conf`
+ `Dockerfile`), y **`cloudflared`** (Cloudflare Tunnel), todos con
`restart: unless-stopped`.

**⚠️ Contradicción sin resolver, detectada por el grafo de conocimiento
de esta sesión**: la sección "Stack decidido" de arriba dice
explícitamente que el acceso remoto es solo por Tailscale y que el
servidor **no** debe exponerse a internet público. El commit
`14b37a2` ("Website ready") añadió el servicio `cloudflared`
(`docker-compose.yml`), que expone el sitio vía túnel de Cloudflare —
justo lo contrario de la política declarada. No está claro si fue un
cambio de postura deliberado (¿se decidió exponerlo públicamente para el
"primer despliegue"?) o un añadido rápido sin repasar la decisión de
arquitectura original. **Pendiente que el usuario lo aclare** antes de
seguir tocando `docker-compose.yml` o la política de acceso remoto.

### Pendiente / conocido y sin arreglar

- Dos migraciones (`78d87219eadd_add_day_of_week_to_tasks.py`,
  `95d6c53da2c8_add_day_list_item_id_to_files.py`) siguen sin trackear en
  git (aparecen como `??` en `git status`) y, según la última nota de
  sesión que las tocó, sin aplicar (`docker exec nexus-backend-1 alembic
  upgrade head` pendiente). No reverificado en esta sesión — sin acceso a
  Docker para comprobarlo
- No hay tests automatizados (pytest) todavía — todo verificado a mano
- `jwt_secret_key` (`core/config.py`) sigue con el default de desarrollo
  (`dev-secret-change-in-production`) — pendiente uno real vía `.env`
  antes de cualquier despliegue real (más urgente si `cloudflared`
  termina confirmándose como acceso público)
- Nombres de archivo duplicados en la misma carpeta no están bloqueados
  (a diferencia de `Folder`, sin `UniqueConstraint`/chequeo)
- Búsqueda de archivos no escapa `%`/`_` de `ILIKE` (solo afecta a qué
  coincide la búsqueda, no es inyección SQL)
- Sin límite de tamaño de subida de archivos
- `nexus-backend/storage/` es bind mount a disco del host — al migrar al
  portátil-servidor de despliegue, confirmar que la ruta existe y tiene
  espacio/permisos correctos
- **⚠️ `nexus-frontend/src/pages/SchedulePage.jsx` se ha corrompido solo,
  dos veces en la sesión 2026-09-16**: el modal de detalle de día
  (`DayDetailModal`, su `useState` de `openDay` y su render al final del
  componente) desapareció del archivo entre turnos sin que el asistente
  lo tocara, dejando `onClick={() => setOpenDay(d)}` referenciando una
  función inexistente (rompe al hacer click en un día, aunque `vite build`
  no lo detecta por ser solo error en runtime). Se restauró dos veces.
  Causa sin confirmar — no se sabe si es edición manual del usuario,
  autoguardado de algún plugin/editor, o un bug del propio Claude Code.
  **Si vuelve a pasar, revisar antes de seguir editando ese archivo**

### Sesión de hoy (2026-09-15, continuación)

- UI: rediseñado el selector de día de la semana en
  `TaskDetailModal.jsx` (antes 7 botones con nombre completo en
  `flex-wrap`, quedaba irregular con "Miércoles" rompiendo la fila —
  ahora `grid-cols-7` con etiquetas cortas Lun–Dom y aria-label con el
  nombre completo; el botón de quitar día se movió de la fila de pills a
  la cabecera de la sección, mismo patrón que el resto de secciones del
  modal) y el popover de adjuntar archivo a un elemento de lista en
  `ListGrid.jsx` (emoji 📎 → SVG inline, contenedor sin `relative` hacía
  que el popover se anclara al `<li>` en vez de al botón, ancho fijo
  arriesgaba desbordar en la columna derecha del grid → `right-0`,
  añadido cierre al hacer click fuera)
- Actualizados los plugins de Claude Code: `caveman`
  (`ef6050c5e184`→`2.7.0`), `ui-ux-pro-max` (`2.5.0`→`2.13.0`, vía
  `claude plugin update`), `graphify` (`0.8.14`→`0.9.62`, vía
  `uv tool upgrade graphifyy` + `graphify install`)
- Grafo de conocimiento del proyecto completo generado con `/graphify`
  (733 nodos, 1571 aristas, 67 comunidades) en `graphify-out/` — usado
  para reescribir esta sección "Estado actual" a partir de lo que el
  código realmente contiene en vez de la memoria de sesiones anteriores.
  El hallazgo de la contradicción `cloudflared`/Tailscale de arriba salió
  directamente de ese grafo (edge `AMBIGUOUS` entre el nodo de política
  declarada en este archivo y el servicio en `docker-compose.yml`)

**Siguiente paso concreto**: aclarar la contradicción `cloudflared` vs.
Tailscale-only antes de tocar más infraestructura. Si Docker está
disponible en la sesión: aplicar las dos migraciones pendientes y probar
a mano en navegador (día de semana en tareas, adjuntar archivo a un
elemento de lista, ambos ya arreglados en UI hoy).

**Notas / decisiones pendientes**:
- `react-router-dom` se añadió al frontend sin pedir permiso explícito en
  su momento (infraestructura básica para una SPA con varias pantallas)
  — sigue sin confirmarse si eso está bien como precedente para el
  futuro
- Migraciones y comandos de alembic: siempre vía
  `docker exec nexus-backend-1 alembic ...`, nunca desde el venv de
  Windows (bug de psycopg2 + Windows: falla al decodificar el error de
  autenticación de Postgres, aunque la conexión en sí funcione bien
  dentro de la red de Docker)

### Sesión de hoy (2026-09-16)

Todo en frontend, sin tocar backend ni Docker.

- **Preview de archivos en vez de descarga automática**: nuevo hook
  `useFilePreview` + componente `FilePreviewModal` (imagen/pdf/vídeo/
  audio/texto se ven en un modal con botón Descargar; el resto descarga
  directo). Cableado en `FileExplorer`, `TaskDetailModal` y `ListGrid`
  (este último no tenía ni click en el nombre del archivo antes)
- **Horario de clases**: pestaña nueva "Horario" (`SchedulePage`,
  `/schedule`) con los datos estáticos del horario 2CFS DAW que dio el
  usuario (`data/schedule.js`), reloj en vivo Europe/Madrid
  (`utils/schedule.js`) y resaltado de la clase actual. Es una vista de
  solo lectura, sin modelo en el backend — dato fijo, no CRUD
- **Integración calendario del Dashboard ↔ horario de clases**: al hacer
  click en un día del `CalendarWidget` del panel, el modal (`DayListModal`)
  ahora muestra tres secciones — **Materias** (asignaturas de ese día
  lectivo, componente `DaySubjects` compartido con `SchedulePage`),
  **Tareas** (las que tengan ese `day_of_week`) y **Listas** (lo que ya
  había). En fin de semana, Materias muestra "Fin de semana, sin clase."
  en vez de ocultarse (antes desaparecía del todo y parecía un bug)
- **Bug de recurrencia en `day_of_week` arreglado**: una tarea con
  `day_of_week: "saturday"` marcaba y listaba en *todos* los sábados del
  calendario. `day_of_week` no lleva fecha propia (es solo un día de la
  semana), así que ahora se ancla siempre al **próximo** sábado desde hoy
  (`getNextOccurrence` en `utils/calendar.js`) — el punto verde del
  calendario y el listado de "Tareas" del modal solo aparecen en esa
  fecha concreta, no en todas las que caen ese día de semana
- Filas de `DaySubjects` fusionadas cuando son bloques de 2h de la misma
  asignatura (antes listaba la misma clase dos veces seguidas) — reduce
  la altura del modal de día lo suficiente para verse sin scroll en
  pantallas normales
- Ver aviso de `SchedulePage.jsx` corrompiéndose solo en "Pendiente"
  arriba — no resuelto, solo parcheado dos veces

**Siguiente paso concreto**: si `SchedulePage.jsx` se rompe una tercera
vez, investigar causa antes de seguir parcheando a ciegas. Pendiente
también decidir si la pestaña "Horario" standalone se queda o se quita
ahora que el calendario del Dashboard ya muestra lo mismo por día.
