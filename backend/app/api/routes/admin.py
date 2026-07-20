import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, get_optional_identity
from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.db.models import InteractionType, WalletInteraction
from backend.app.db.session import get_database_session
from backend.app.schemas.activity import AdminActivityItem, AdminOverviewResponse


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
