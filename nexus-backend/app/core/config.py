from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    # Sin valor por defecto a propósito: este repositorio es público, así que un
    # default usable aquí sería un secreto publicado. Sin la variable, el backend
    # no arranca (ValidationError al importar) en vez de arrancar inseguro en
    # silencio. Genera uno con: python -c "import secrets; print(secrets.token_urlsafe(48))"
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    storage_root: str = "/data/storage"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
