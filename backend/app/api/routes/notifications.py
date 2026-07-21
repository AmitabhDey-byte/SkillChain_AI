from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, require_matching_wallet, require_wallet_identity
from backend.app.core.errors import AppError
from backend.app.db.models import Notification
from backend.app.db.session import get_database_session
from backend.app.schemas.credential import WALLET_PATTERN
from backend.app.schemas.notification import NotificationListResponse, NotificationReadAllResponse, NotificationResponse


router = APIRouter()


@router.get("", response_model=NotificationListResponse, summary="List wallet notifications")
async def list_notifications(
    wallet: Annotated[str, Query(pattern=WALLET_PATTERN)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
) -> NotificationListResponse:
    require_matching_wallet(identity, wallet)
    statement = (
        select(Notification)
        .where(Notification.recipient_wallet == wallet.upper())
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    result = await session.scalars(statement)
    notifications = list(result.all())
    return NotificationListResponse(
        notifications=notifications,
        total=len(notifications),
        unread_count=sum(item.read_at is None for item in notifications),
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse, summary="Mark a notification as read")
async def read_notification(
    notification_id: UUID,
    wallet: Annotated[str, Query(pattern=WALLET_PATTERN)],
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
) -> Notification:
    require_matching_wallet(identity, wallet)
    notification = await session.get(Notification, notification_id)
    if notification is None:
        raise AppError("Notification was not found.", "notification_not_found", 404)
    if notification.recipient_wallet.upper() != wallet.upper():
        raise AppError("This notification belongs to another wallet.", "notification_forbidden", 403)
    if notification.read_at is None:
        notification.read_at = datetime.now(UTC)
        await session.commit()
        await session.refresh(notification)
    return notification


@router.post("/read-all", response_model=NotificationReadAllResponse, summary="Mark all wallet notifications as read")
async def read_all_notifications(
    wallet: Annotated[str, Query(pattern=WALLET_PATTERN)],
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
) -> NotificationReadAllResponse:
    require_matching_wallet(identity, wallet)
    result = await session.scalars(
        select(Notification).where(
            Notification.recipient_wallet == wallet.upper(),
            Notification.read_at.is_(None),
        )
    )
    notifications = list(result.all())
    read_at = datetime.now(UTC)
    for notification in notifications:
        notification.read_at = read_at
    if notifications:
        await session.commit()
    return NotificationReadAllResponse(updated=len(notifications))
