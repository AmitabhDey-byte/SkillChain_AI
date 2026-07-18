from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SkillChain AI API"
    app_version: str = "0.1.0"
    environment: Literal["development", "test", "staging", "production"] = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173"]
    database_url: SecretStr = SecretStr("postgresql+asyncpg://postgres:postgres@localhost:5432/skillchain")
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: float = 45
    github_client_id: str | None = None
    github_client_secret: SecretStr | None = None
    github_token: SecretStr | None = None
    github_api_version: str = "2026-03-10"
    stellar_network: Literal["testnet", "mainnet"] = "testnet"
    stellar_rpc_url: str = "https://soroban-testnet.stellar.org"
    stellar_contract_id: str | None = None
    stellar_issuer_secret: SecretStr | None = None
    stellar_transaction_timeout_seconds: int = 45
    credential_attestation_secret: SecretStr | None = None
    admin_api_key: SecretStr | None = None

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def docs_enabled(self) -> bool:
        return self.environment != "production" or self.debug


@lru_cache
def get_settings() -> Settings:
    return Settings()
