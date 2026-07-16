from fastapi import APIRouter

from backend.app.api.routes import assessments, github, health


api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
