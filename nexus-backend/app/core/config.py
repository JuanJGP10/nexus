from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str = "${JWT_SECRET_KEY}"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    storage_root: str = "/data/storage"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
