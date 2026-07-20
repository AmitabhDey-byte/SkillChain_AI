from functools import lru_cache
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_async_database_url(database_url: str) -> str:
    normalized = database_url.strip()
    for prefix in ("postgres://", "postgresql://", "postgresql+psycopg2://", "postgresql+psycopg://"):
        if normalized.startswith(prefix):
            normalized = f"postgresql+asyncpg://{normalized[len(prefix):]}"
            break

    parts = urlsplit(normalized)
    query = []
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "channel_binding":
            continue
        query.append(("ssl" if key == "sslmode" else key, value))
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


class Settings(BaseSettings):
    app_name: str = "SkillChain AI API"
    app_version: str = "0.1.0"
    environment: Literal["development", "test", "staging", "production"] = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173"]
    allowed_hosts: list[str] = ["localhost", "127.0.0.1", "testserver"]
    max_request_body_bytes: int = 1_048_576
    database_url: SecretStr = SecretStr("postgresql+asyncpg://postgres:postgres@localhost:5432/skillchain")
    auth_session_secret: SecretStr = SecretStr("development-only-change-this-session-secret")
    auth_token_minutes: int = 720
    auth_challenge_minutes: int = 5
    admin_wallets: list[str] = []
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
    vercel_url: str | None = None
    vercel_project_production_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def docs_enabled(self) -> bool:
        return self.environment != "production" or self.debug

    @property
    def async_database_url(self) -> str:
        return normalize_async_database_url(self.database_url.get_secret_value())

    @property
    def security_enforced(self) -> bool:
        return self.environment in {"staging", "production"}

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        generated_hosts = [
            host.strip().lower()
            for host in (self.vercel_url, self.vercel_project_production_url)
            if host and host.strip()
        ]
        self.allowed_hosts = list(dict.fromkeys([*self.allowed_hosts, *generated_hosts]))
        if self.security_enforced:
            secret = self.auth_session_secret.get_secret_value()
            if len(secret) < 32 or secret == "development-only-change-this-session-secret":
                raise ValueError("AUTH_SESSION_SECRET must contain at least 32 unique production characters.")
            if not self.allowed_hosts or "*" in self.allowed_hosts:
                raise ValueError("ALLOWED_HOSTS must explicitly list production hosts.")
        self.admin_wallets = [wallet.strip().upper() for wallet in self.admin_wallets if wallet.strip()]
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
