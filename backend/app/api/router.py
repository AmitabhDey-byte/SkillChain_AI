from fastapi import APIRouter

from backend.app.api.routes import github, health


api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
