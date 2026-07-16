from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from backend.app.core.config import Settings, get_settings
from backend.app.schemas.health import DependencyStatus, LiveResponse, ReadyResponse


router = APIRouter()


@router.get("/live", response_model=LiveResponse, summary="Check API liveness")
async def live(settings: Settings = Depends(get_settings)) -> LiveResponse:
    return LiveResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        timestamp=datetime.now(UTC),
    )


@router.get("/ready", response_model=ReadyResponse, summary="Check service readiness")
async def ready(settings: Settings = Depends(get_settings)) -> ReadyResponse:
    dependencies = DependencyStatus(
        database="configured" if settings.database_url.get_secret_value() else "missing",
        gemini="configured" if settings.gemini_api_key and settings.gemini_api_key.get_secret_value() else "pending",
        stellar="configured" if settings.stellar_rpc_url else "missing",
    )
    status = "ready" if dependencies.database == "configured" and dependencies.stellar == "configured" else "degraded"
    return ReadyResponse(status=status, environment=settings.environment, dependencies=dependencies)

