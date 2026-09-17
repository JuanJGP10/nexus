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
- **Acceso remoto**: Cloudflare Tunnel (servicio `cloudflared` en
  `docker-compose.yml`) **+ Cloudflare Access con Google SSO**, restringido a
  dos cuentas (el usuario y su pareja). Nadie de fuera llega ni siquiera al
  login. Por eso **no hay endpoint de registro**: la app es solo para ellos dos
  y los usuarios se crean a mano.
  **Access solo cubre lo que entra por el túnel** — ver el aviso de los `ports`
  publicados en "Pendiente"
- **IA futura**: vía API (Anthropic/OpenAI/Ollama) con capa de herramientas
  tipo MCP — no acceso directo del modelo a la base de datos

## Entorno de desarrollo

- Desarrollo: PC con Windows (Docker Desktop, backend WSL2)
- Despliegue: portátil con Omarchy (Arch + Hyprland), accedido por SSH,
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

## Roadmap (NO avanzar de fase sin permiso explícito)

Ya hecho y fuera del roadmap: Auth + JWT, Tasks con subtareas y papelera,
Files con carpetas/papelera/búsqueda/copiar-mover, relación Files↔Tasks,
Notes, DayLists y calendario, horario de clases, PWA y el despliegue en
Docker. Lo que queda:

- **Fase A (siguiente)**: etiquetas, proyectos, favoritos, versiones de archivos
- **Fase B**: asistente IA con herramientas controladas (estilo MCP)
- **Fase C**: automatizaciones (watchers de carpetas, resúmenes semanales,
  clasificación)

Antes de empezar una fase nueva toca cerrar la deuda de "Pendiente" (tests y
`jwt_secret_key`, sobre todo ahora que el sitio está publicado).

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

**Última actualización**: 2026-09-17. Regenerado
originalmente el 2026-09-15 desde un grafo de
conocimiento del código (`/graphify`, ver `graphify-out/GRAPH_REPORT.md` y
`graphify-out/graph.html`) en vez de seguir acumulando entradas
cronológicas. El historial detallado de bugs/decisiones de sesiones
anteriores a esta reescritura puede recuperarse con `git log` /
`git show CLAUDE.md` si hace falta el detalle exacto; aquí se prioriza que
la siguiente sesión sepa **qué hay, qué no hay, y qué está pendiente**, no
una bitácora completa de cada comando ejecutado.

### Qué existe — backend (`nexus-backend/app/`)

- **Auth**: `User` + JWT (`POST /auth/login`, `GET /auth/me`).
  **No hay endpoint de registro**: el router solo expone login y me (se quitó
  en `e4ddb22`, y con el sitio publicado es lo correcto — nadie puede darse de
  alta desde fuera). `auth_service.register_user()` sigue existiendo pero ya no
  lo llama nadie: para crear un usuario hay que hacerlo a mano. bcrypt fijado a `4.0.1` (incompatible con passlib en
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
  manejar. Añadidos `GET /folders/{id}/path` (ancestros, para las migas de
  pan al saltar a una carpeta arbitraria), `POST /folders/{id}/copy` (copia
  recursiva de subcarpetas y archivos) y `DELETE /folders/{id}?recursive=true`
  (borra la jerarquía y manda sus archivos a la papelera, desvinculándolos
  antes porque `files.folder_id` no tiene `ON DELETE`)
- **`app/services/storage.py`** y **`app/services/naming.py`**: primitivas de
  disco (`make_stored_name`, `duplicate_blob`) y nombres libres de colisión.
  Están en módulos propios porque los necesitan `file_service` y
  `folder_service` a la vez, y `file_service` ya importa `folder_service`
  (importarlo al revés sería un ciclo)
- **Files**: subida/descarga/búsqueda/papelera/**copia**. `POST /files/{id}/copy`
  duplica registro + bytes en disco; `DELETE /files/trash` vacía la papelera
  entera. Al subir, mover o renombrar dentro de una carpeta el backend
  desambigua el nombre (`a.txt` -> `a (1).txt`), así que ya no hay dos archivos
  con el mismo nombre en la misma carpeta. Un `File` puede
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
  traceback crudo), 11 migraciones Alembic generadas y todas aplicadas
  (`alembic current` → `95d6c53da2c8 (head)`)
- Todas las queries están scopeadas por `user_id`: un recurso ajeno da
  404, nunca 403 (no filtra existencia) — patrón consistente en
  Tasks/Subtasks/Folders/Files/Notes/DayLists

### Qué existe — frontend (`nexus-frontend/src/`)

- Vite + React 19 (JS, sin TypeScript) + Tailwind CSS v4 + react-router-dom
- Páginas: `AuthPage`, `DashboardPage` (widgets: `CalendarWidget`,
  `FileExplorer`, `NotesWidget`, `StatusWidget`, `TasksWidget`),
  `FilesPage` (`/files`, nav "Archivos"), `TasksPage`, `ListsPage`,
  `SchedulePage` (`/schedule`, nav "Horario" — ver sesión 2026-09-16)
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
- **Explorador de archivos** (`components/files/`): `FileExplorer.jsx` es el
  orquestador (estado, atajos, arrastre, portapapeles) y a su alrededor hay
  piezas presentacionales — `ExplorerToolbar`, `ExplorerItems` (fila, celda y
  cabecera de columnas), `ContextMenu`, `ConfirmDialog`, `FolderPickerModal`,
  `TaskLinkModal`, `ShortcutsHelp`, `icons.jsx`. Lógica compartida en
  `utils/files.js` (orden, tipo por extensión, lectura de un drop del sistema)
  y `hooks/useFileClipboard.js` (portapapeles a nivel de módulo, sobrevive al
  cambio de pantalla). Ver la sesión del gestor de archivos abajo
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

El acceso público por `cloudflared` es una decisión tomada (2026-09-16):
sustituye a la idea original de Tailscale, que queda descartada.
`CLOUDFLARE_TUNNEL_TOKEN` va en `.env` y no está versionado; sin esa variable
el servicio arranca roto, así que en desarrollo se levanta solo el resto:
`docker compose up -d --build db backend frontend`.

### Secretos (el repositorio de GitHub es PÚBLICO)

`github.com/JuanJGP10/nexus` es público: **nada que vaya al código es secreto**.
Comprobado que `.env` nunca se ha commiteado (`.gitignore:158`) y que el
`CLOUDFLARE_TUNNEL_TOKEN` no aparece en el historial.

- `jwt_secret_key` **no tiene valor por defecto** en `core/config.py`: sin la
  variable, pydantic lanza `ValidationError` al importar y el backend no arranca.
  Antes tenía `dev-secret-change-in-production` hardcodeado, que al ser público
  equivalía a no tener autenticación para quien pudiera hablar con la API
- `docker-compose.yml` usa `${JWT_SECRET_KEY:?...}`, sin fallback: si falta,
  `docker compose` falla antes de levantar nada, con un mensaje que apunta a
  `.env.example`
- `.env.example` trae la clave vacía y el comando para generarla, para que
  copiarlo no reintroduzca un secreto conocido
- Ese valor `dev-secret-change-in-production` sigue en el historial público de
  git. Cualquier despliegue que lo estuviera usando debe cambiarlo, no basta con
  el commit que lo quita

### Pendiente / conocido y sin arreglar

- **⚠️ Falta poner `JWT_SECRET_KEY` en el `.env` del portátil de despliegue.**
  El código ya no tiene ningún secreto (ver "Secretos" abajo), pero hasta que no
  se ponga esa variable ahí, `docker compose` se negará a levantar el backend en
  producción. Generar uno con
  `python -c "import secrets; print(secrets.token_urlsafe(48))"`, meterlo en el
  `.env` de esa máquina y recrear el backend. Efecto secundario: se cierran las
  sesiones abiertas, nada más — las contraseñas son bcrypt y no dependen del JWT
- No hay tests automatizados (pytest) todavía — todo verificado a mano
- **⚠️ Los tres servicios se publican en el host y eso salta Cloudflare Access**:
  `docker-compose.yml` tiene `db: 5432:5432`, `backend: 8000:8000` y
  `frontend: 5173:80`. Access solo filtra lo que entra por el túnel, así que
  cualquiera en la red local del portátil-servidor abre `http://<ip>:5173` y
  tiene la app entera, `:8000` para la API cruda y `:5432` para la base de datos
  con `nexus/nexus`. En producción esos mapeos sobran: el backend llega a `db`
  y nginx llega a `backend` por la red interna de compose. Solo hacen falta en
  desarrollo
- Sin rate limiting en `POST /auth/login`. Con Access delante no es explotable
  desde internet, solo desde la red local del portátil (mismo punto de arriba)
- `.env.example` trae `JWT_SECRET_KEY=dev-secret-change-in-production`: copiarlo
  tal cual reintroduce el problema
- Comprobar si las dos migraciones de `day_of_week` y `day_list_item_id`
  siguen sin trackear en git (aplicadas sí están: `alembic current` devuelve
  `95d6c53da2c8 (head)`)
- Búsqueda de archivos no escapa `%`/`_` de `ILIKE` (solo afecta a qué
  coincide la búsqueda, no es inyección SQL)
- Sin límite de tamaño de subida en FastAPI. En el despliegue real sí hay uno:
  `client_max_body_size 100M` en `nexus-frontend/nginx.conf`, que es por donde
  pasa todo el tráfico del túnel. Solo se saltaría pegándole directo al :8000
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

### Sesión de hoy (2026-09-17) — temas nuevos y presentación del panel

Todo frontend. Sin backend, sin migraciones, sin dependencias nuevas.

- **Tres temas nuevos** a partir de paletas que dio el usuario, con el mismo
  patrón que `dark`/`pastel` (bloque `:root[data-theme='X']` en `index.css`,
  id en `THEMES` de `theme.js`, entrada en `THEME_OPTIONS` de
  `ThemeSwitcher.jsx`): `mono` (negro/gris), `ocean` ("Océano", grafito +
  azules) y `candy` ("Caramelo", pasteles). En los tres, `success` y `danger`
  se quedan fuera de la paleta a propósito: son señales de estado, no
  decoración. En `ocean` el `accent-contrast` blanco sobre `#568ea3` da 3.6:1,
  por debajo del 4.5:1 de WCAG AA para texto pequeño — asumido, arreglarlo
  obliga a oscurecer el accent y dejaría de ser el color pedido
- **Logotipo de la cabecera rehecho**: era un `<span>` en mono 400 a `text-sm`
  con `tracking-[0.35em]`, del color de acento, y se perdía contra la barra de
  navegación. Ahora es un `<h1>` con `NavLink` a `/` (la marca navega al panel,
  y la página gana el `h1` que le faltaba en la jerarquía de encabezados) con
  clase `.brand-mark` en `index.css`: mono **700**, 16/18px, halo
  `text-shadow` con `color-mix` del acento y una barra vertical de 3px delante.
  Para el peso 700 se importa `@fontsource/ibm-plex-mono/latin-700.css` en
  `main.jsx` — mismo paquete que ya estaba, no es dependencia nueva
- **Huecos raros del panel arreglados**: las tres columnas del dashboard
  terminaban a alturas distintas. `NotesWidget` tenía `max-h-80` que le impedía
  crecer aunque fuera `flex-1` (`lg:max-h-none`), la columna derecha no tenía
  `lg:min-h-0`, y `CalendarWidget` no estiraba (`lg:flex-1` + cuerpo
  `lg:justify-center`, que centra el bloque de días en vez de separar las
  semanas). `StatusWidget` pasa a `shrink-0`
- **Halo del logotipo permanente**, no solo en hover: tres capas de
  `text-shadow` (6/20/40px), la corta con `accent-hover` para que las letras se
  vean encendidas en reposo. El hover solo sube la intensidad. El color sale de
  `--brand` / `--brand-strong`, definidas en `.brand-mark`, para que un tema
  pueda cambiarlas sin tocar su acento: `mono` lo hace (`#fffbfc`), porque su
  acento gris dejaba la marca apagada sobre el negro
- **Tarjetas de lista con alto según contenido** (`ListGrid.jsx`): tenían
  `h-64` fijo y la `<ul>` con `overflow-auto`, así que una lista de 3 elementos
  scrolleaba dentro de una caja de 256px. Ahora `min-h-64` sin scroll interno:
  256px es el mínimo, no el tope. Las tarjetas de una misma fila siguen
  igualando altura (comportamiento normal del grid); `items-start` lo quitaría
- **`/files` centrado y con ancho tope**, como `SchedulePage`: `mx-auto w-full
  max-w-5xl` en `FilesPage.jsx`, y el `Panel` de `FileExplorer` pasa de `h-full`
  fijo a `max-h-[calc(100dvh-9rem)]` solo en `variant="page"` (el widget del
  panel conserva `h-full`). Alto según contenido, y al pasarse scrollea la lista
  por dentro, no la página
- **`DayListModal` repasado** (el modal de un día del calendario). Antes no era
  un diálogo para el navegador: sin `role="dialog"`/`aria-modal`, sin foco
  inicial, el tabulador se escapaba a la página de detrás, la rueda del ratón
  movía el panel del fondo y `Escape` cerraba a la vez el modal de día y el de
  tarea que hubiera encima. Ahora: diálogo etiquetado por su `<h2>`, foco al
  abrir y devuelto al elemento que lo abrió (la celda del calendario),
  `overflow: hidden` en `body` mientras está abierto, trampa de foco con Tab,
  `Escape` ignorado cuando `openTaskId` está puesto, y cerrar al hacer clic
  fuera solo si el gesto **empezó** fuera (antes, soltar el ratón fuera tras
  seleccionar texto dentro lo cerraba). Visualmente: cabecera con el día
  destacado + mes + distintivo "Hoy", secciones con regla y contador
  (`SectionHeading`), icono SVG en vez del glifo `✕`, y `env(safe-area-inset-bottom)`
  abajo. En móvil el día nunca se recorta: se recorta el mes
- **Repaso de móvil a 390px** (las cinco pantallas y los modales, medido en un
  `<iframe>` de 390px porque `resize_window` sigue sin redimensionar esta
  ventana). Ninguna pantalla tiene scroll horizontal
  (`scrollWidth === clientWidth` en `/`, `/files`, `/tasks`, `/lists`,
  `/schedule`). Corregido lo que sí fallaba:
  - Tarjetas de lista: el `min-h-64` pasó a `sm:min-h-64`. En una sola columna
    una lista de dos elementos ocupaba 256px y solo cabía una por pantalla;
    ahora entran tres. El botón "Nueva lista" baja a `min-h-32` en móvil
  - Zonas de toque: las filas de `TasksWidget`/`NotesWidget` medían 17–20px de
    alto. Ahora `py-2.5` en móvil (fila de 40px) y el título de la tarea lleva
    `-my-2 py-2`, que agranda el área sin mover la fila (36px de 40). Mismo
    tratamiento en `TasksPage` (título 40px de 48) y en las tareas del
    `DayListModal`. "Ver todas", "+ Nueva" y "Borrar" pasan de 17px a 33px
- Limpiezas: `index.html` tenía `lang="en"` en una app en español;
  `TasksIcon` en `Layout.jsx` tenía un `<circle r="0">` muerto
- Verificado en el navegador a 1568px y a 390px (iframe): sin scroll
  horizontal (`scrollWidth === clientWidth`), logotipo en IBM Plex Mono 700

**Trampa que costó tiempo**: `docker-compose.yml` ya **no publica puertos**
(commit `21ed41e`). Para desarrollo hay que usar el otro archivo, que es
completo, no un overlay:
`docker compose -f docker-compose.dev.yml up -d --build db backend frontend`.
Y el **service worker de la PWA sirve el CSS/JS antiguo** después de cada
`--build`: hay que desregistrarlo y vaciar `caches` (DevTools → Application →
Service Workers → Unregister, o Ctrl+Shift+R con "Disable cache") o parece que
los cambios no se han aplicado.

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
  De ahí salió la contradicción entre la política de acceso remoto escrita
  aquí y el servicio `cloudflared` real (resuelta el 2026-09-16 a favor de
  `cloudflared`)

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

### Sesión de hoy (2026-09-16) — calendario y horario

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

### Sesión de hoy (2026-09-16) — gestor de archivos completo

Objetivo: que el explorador se parezca a un gestor de archivos de verdad, con
teclado, ratón y móvil. Backend y frontend, **sin migraciones** (no cambia el
esquema: copiar es crear filas nuevas, no columnas nuevas).

**Backend**
- `POST /files/{id}/copy`, `POST /folders/{id}/copy` (recursiva),
  `GET /folders/{id}/path`, `DELETE /folders/{id}?recursive=true`,
  `DELETE /files/trash` (vaciar papelera)
- `app/services/storage.py` (primitivas de disco) y `app/services/naming.py`
  (`nombre (1).ext`) extraídos para evitar el ciclo
  `file_service` ↔ `folder_service`
- Borrado recursivo: subcarpetas fuera, archivos a la papelera y con
  `folder_id = NULL` (si no, la FK sin `ON DELETE` reventaría al borrar la fila
  de la carpeta). Restaurarlos los deja en la raíz
- Verificado con un script contra SQLite en memoria (copia recursiva, choques
  de nombre, mover a descendiente rechazado, papelera, ancestros, aislamiento
  por usuario): 10/10. **El script era temporal, no está en el repo** — sigue
  sin haber pytest

**Frontend — `components/files/`**
- Navegación: historial atrás/adelante, subir, migas de pan (que además son
  destino de arrastre), recargar
- Selección múltiple: clic, Ctrl+clic, Mayús+clic, Ctrl+A, Mayús+flechas y
  **recuadro de selección** arrastrando en el hueco (solo ratón)
- Portapapeles real: Ctrl+C / Ctrl+X / Ctrl+V, lo cortado se ve atenuado, y
  vive en un módulo para que copiar en el panel y pegar en `/files` funcione
- Arrastrar y soltar: entre carpetas (con Ctrl copia en vez de mover), sobre
  las migas de pan, y **desde el escritorio** — soltar una carpeta entera
  recrea su árbol vía `webkitGetAsEntry`, reutilizando las carpetas que ya
  existan en vez de chocar con el 409
- Menú contextual (clic derecho en escritorio, pulsación larga en móvil),
  renombrado en línea con F2 (preselecciona el nombre sin la extensión),
  vistas lista/cuadrícula, orden por nombre/tamaño/fecha, filtro instantáneo
  local y búsqueda global con Enter (con "Ir a la carpeta" en los resultados)
- Papelera con restaurar / eliminar definitivamente / vaciar; ya no se borra
  en dos pasos a escondidas como antes
- Teclado completo: flechas (en cuadrícula se mide cuántas columnas hay),
  Inicio/Fin, RePág/AvPág, Enter, Retroceso, Supr, Mayús+Supr,
  Ctrl+Mayús+N, Ctrl+F, Escape y **type-ahead** (escribir salta al nombre).
  `?` abre la chuleta de atajos
- Móvil: toque abre, pulsación larga da menú, modo selección con casillas,
  barra de acciones inferior y modal "Mover a… / Copiar a…" (arrastrar no
  existe con el dedo, así que sin ese modal no habría forma de mover nada)
- El `<select>` de "vincular a tarea" de la cabecera pasó a ser
  `TaskLinkModal` (cabe la lista entera y se puede buscar)
- Nueva pestaña **Archivos** (`/files`) con el explorador a pantalla completa;
  el widget del panel sigue existiendo, es el mismo componente con
  `variant="widget"`

**Sin verificar en navegador**: Docker Desktop no estaba arrancado en esta
sesión, así que no se pudo levantar la app. `vite build` y `oxlint` pasan, y la
lógica de backend está probada, pero **el explorador no se ha tocado a mano
todavía**. Probar sobre todo: arrastrar una carpeta del escritorio, pegar entre
el panel y `/files`, y la pulsación larga en móvil.

**Servicios levantados al final de la sesión**: `db`, `backend` y `frontend`
vía `docker compose up -d --build`. `cloudflared` se dejó parado porque
`CLOUDFLARE_TUNNEL_TOKEN` no está en el `.env` de desarrollo. Migraciones ya
en `head`. `/files/{id}/copy`, `/folders/{id}/copy`, `/folders/{id}/path` y
`DELETE /files/trash` responden en el OpenAPI; frontend sirve 200 en :5173.

### Sesión de hoy (2026-09-16) — adjuntos en línea y responsive del gestor

**Listas: adjuntos visibles en la propia fila.** Antes cada elemento tenía un
clip que abría un popover: no se sabía qué llevaba cada elemento sin ir
abriéndolos uno a uno, y con varias listas los popovers se tapaban entre sí.
Ahora cada adjunto es un chip en la misma línea del texto (icono por tipo,
nombre truncado, clic abre la preview, ✕ lo desvincula). El texto encoge y los
chips no, así que con un archivo todo cabe en una línea. El clip ahora abre
directamente el selector de archivos. Una sola `FilePreviewModal` para todo el
grid en vez de una por elemento.

- Backend: **`GET /files?day_list_id=X`** (`file_repository.list_for_day_list`,
  JOIN con `day_list_items`). Sin él harían falta tantas peticiones como
  elementos tenga la lista. Sin migración. Probado contra SQLite
- `FileKindIcon` extraído a `components/files/icons.jsx` y compartido entre el
  explorador y los chips de las listas

**Responsive del explorador**, verificado a 390px de ancho (las media queries
se probaron metiendo la app en un `<iframe>` de 390px desde la consola del
navegador: `resize_window` no funcionaba en esa ventana):

- **Menú contextual = hoja inferior en móvil** (`< 640px`). Flotando medía más
  de 400px de alto: en un móvil tapaba media pantalla y el recorte contra los
  bordes lo mandaba arriba del todo, lejos de donde se había pulsado. Lleva
  fondo oscurecido, asa, filas de 44px y sin la columna de atajos
- **Detección de toque por `pointerdown`, no por el click**: Chrome Android
  reporta `pointerType: 'mouse'` en el evento click, así que un toque se
  trataba como clic de ratón (seleccionaba en vez de abrir). Se guarda el
  `pointerType` del `pointerdown`, que sí es correcto. Doble toque ya no abre
  dos veces
- **`draggable` desactivado en pantallas táctiles** (`isCoarsePointer()`): en
  iOS una pulsación larga sobre un elemento arrastrable arranca el arrastre
  nativo y pisaba nuestro menú contextual. Más `-webkit-touch-callout: none`
  para que iOS no saque su propio menú encima
- **Filas con segunda línea** (tamaño · fecha) en móvil: las columnas de la
  vista de escritorio están ocultas ahí y un archivo no decía nada más que su
  nombre
- **Barra de acciones de selección**: desbordaba 48px en 390px. Etiquetas más
  cortas ("Renom."), menos padding y sin barra de scroll visible
  (`.no-scrollbar`). Ahora mide justo el ancho disponible
- Botones de la barra de herramientas a 40px de lado en móvil (7 en
  escritorio). "Subir una carpeta" oculto en móvil (`webkitdirectory` no existe
  ahí) y "Atajos de teclado" también (no sirven con el dedo)
- `pb-[env(safe-area-inset-bottom)]` en los modales pegados abajo
- Alto del widget del panel en móvil subido a `min-h-[420px]`

**Nota**: `npx prettier` reformateó `ContextMenu.jsx` a sus defaults (comillas
dobles, punto y coma), que no es el estilo del proyecto. Se reescribió a mano.
**El proyecto no tiene config de prettier: no lo ejecutes sobre estos archivos.**
