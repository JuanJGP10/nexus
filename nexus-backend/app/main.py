import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers import auth, day_lists, files, folders, health, notes, tasks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexus")

app = FastAPI(title="Nexus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Content-Disposition no está en la lista de cabeceras "seguras" que el navegador
    # deja leer a fetch() en peticiones cross-origin por defecto: sin esto, el frontend
    # nunca ve el filename real y el navegador descarga con nombre genérico sin extensión.
    expose_headers=["Content-Disposition"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(folders.router)
app.include_router(files.router)
app.include_router(day_lists.router)
app.include_router(notes.router)
