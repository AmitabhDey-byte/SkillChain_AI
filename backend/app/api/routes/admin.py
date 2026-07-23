import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, get_optional_identity
from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.db.models import Feedback, InteractionType, User, UserStatus, WalletInteraction
from backend.app.db.session import get_database_session
from backend.app.schemas.activity import AdminActivityItem, AdminOverviewResponse, AdminUserDirectoryResponse, AdminUserItem
from backend.app.schemas.feedback import AdminFeedbackItem, AdminFeedbackResponse


router = APIRouter()


def require_admin_key(
    x_admin_key: Annotated[str | None, Header(alias="X-Admin-Key")] = None,
    identity: WalletIdentity | None = Depends(get_optional_identity),
    settings: Settings = Depends(get_settings),
) -> None:
    if identity and identity.wallet_address.upper() in settings.admin_wallets:
        return
    if settings.security_enforced:
        raise AppError("Administrative wallet authorization is required.", "admin_unauthorized", 401)
    if not settings.admin_api_key or not settings.admin_api_key.get_secret_value():
        raise AppError("Administrative access is not configured.", "admin_not_configured", 503)
    if not x_admin_key or not hmac.compare_digest(x_admin_key, settings.admin_api_key.get_secret_value()):
        raise AppError("Administrative credentials are invalid.", "admin_unauthorized", 401)


def serialize_activity(item: WalletInteraction) -> AdminActivityItem:
    return AdminActivityItem(
        id=str(item.id),
        wallet_address=item.wallet_address,
        interaction_type=item.interaction_type.value,
        network=item.network,
        transaction_hash=item.transaction_hash,
        ledger_sequence=item.ledger_sequence,
        success=item.success,
        interaction_data=item.interaction_data,
        created_at=item.created_at,
    )


def serialize_user(user: User) -> AdminUserItem:
    return AdminUserItem(
        id=str(user.id),
        wallet_address=user.wallet_address,
        role=user.role.value,
        display_name=user.display_name,
        headline=user.headline,
        location=user.location,
        organization=user.organization,
        avatar_url=user.avatar_url,
        github_username=user.github_username,
        skills=user.skills,
        onboarding_complete=user.onboarding_complete,
        created_at=user.created_at,
    )


def serialize_feedback(entry: Feedback) -> AdminFeedbackItem:
    return AdminFeedbackItem(
        id=str(entry.id),
        wallet_address=entry.wallet_address,
        rating=entry.rating,
        category=entry.category,
        message=entry.message,
        page=entry.page,
        created_at=entry.created_at,
    )


@router.get(
    "/overview",
    response_model=AdminOverviewResponse,
    dependencies=[Depends(require_admin_key)],
    summary="Read private platform activity metrics",
)
async def admin_overview(session: AsyncSession = Depends(get_database_session)) -> AdminOverviewResponse:
    unique_wallets = await session.scalar(
        select(func.count(func.distinct(WalletInteraction.wallet_address))).where(
            WalletInteraction.interaction_type == InteractionType.WALLET_CONNECTED
        )
    )
    wallet_connections = await session.scalar(
        select(func.count()).select_from(WalletInteraction).where(
            WalletInteraction.interaction_type == InteractionType.WALLET_CONNECTED
        )
    )
    credentials_issued = await session.scalar(
        select(func.count()).select_from(WalletInteraction).where(
            WalletInteraction.interaction_type == InteractionType.CREDENTIAL_ISSUED
        )
    )
    credentials_verified = await session.scalar(
        select(func.count()).select_from(WalletInteraction).where(
            WalletInteraction.interaction_type == InteractionType.CREDENTIAL_VERIFIED
        )
    )
    activity_result = await session.scalars(
        select(WalletInteraction).order_by(WalletInteraction.created_at.desc()).limit(50)
    )
    transaction_result = await session.scalars(
        select(WalletInteraction)
        .where(WalletInteraction.transaction_hash.is_not(None))
        .order_by(WalletInteraction.created_at.desc())
        .limit(50)
    )

    return AdminOverviewResponse(
        unique_wallets=unique_wallets or 0,
        wallet_connections=wallet_connections or 0,
        credentials_issued=credentials_issued or 0,
        credentials_verified=credentials_verified or 0,
        recent_activity=[serialize_activity(item) for item in activity_result.all()],
        recent_transactions=[serialize_activity(item) for item in transaction_result.all()],
    )


@router.get(
    "/users",
    response_model=AdminUserDirectoryResponse,
    dependencies=[Depends(require_admin_key)],
    summary="List completed platform user profiles",
)
async def list_admin_users(
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_database_session),
) -> AdminUserDirectoryResponse:
    statement = select(User).where(
        User.status == UserStatus.ACTIVE,
        User.onboarding_complete.is_(True),
    )
    total = await session.scalar(select(func.count()).select_from(statement.subquery()))
    users = await session.scalars(statement.order_by(User.created_at.desc()).limit(limit))
    return AdminUserDirectoryResponse(total=total or 0, users=[serialize_user(user) for user in users.all()])


@router.get(
    "/feedback",
    response_model=AdminFeedbackResponse,
    dependencies=[Depends(require_admin_key)],
    summary="List product feedback for administrators",
)
async def list_admin_feedback(
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_database_session),
) -> AdminFeedbackResponse:
    total = await session.scalar(select(func.count()).select_from(Feedback))
    entries = await session.scalars(select(Feedback).order_by(Feedback.created_at.desc()).limit(limit))
    return AdminFeedbackResponse(total=total or 0, feedback=[serialize_feedback(entry) for entry in entries.all()])
