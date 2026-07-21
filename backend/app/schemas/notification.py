from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from backend.app.db.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: UUID
    recipient_wallet: str
    notification_type: NotificationType
    title: str
    message: str
    application_id: UUID | None
    read_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread_count: int


class NotificationReadAllResponse(BaseModel):
    updated: int
