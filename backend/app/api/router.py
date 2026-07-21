from fastapi import APIRouter

from backend.app.api.routes import activity, admin, assistant, assessments, auth, credentials, github, health, marketplace, notifications, users


api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(marketplace.router, prefix="/marketplace", tags=["marketplace"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(credentials.router, prefix="/credentials", tags=["credentials"])
