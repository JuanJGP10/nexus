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
- Nada de esto está commiteado todavía (todo sigue como untracked en git,
  solo existe el "Initial commit" vacío)

**Siguiente paso concreto**: Auth (User + JWT) — primer feature real,
siguiendo el orden acordado (Auth → Tasks → Files). Empezar por el modelo
`User` (SQLAlchemy) + Alembic init/migración inicial.

**Notas / decisiones pendientes**:
- Falta primer commit real con el esqueleto (CLAUDE.md, docker-compose.yml,
  nexus-backend/, nexus-frontend/)
- Frontend (Vite + React + Tailwind) todavía sin iniciar