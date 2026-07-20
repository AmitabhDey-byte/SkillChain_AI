from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, require_matching_wallet, require_wallet_identity
from backend.app.db.models import InteractionType
from backend.app.db.session import get_database_session
from backend.app.schemas.activity import ActivityAcceptedResponse, WalletConnectionRequest
from backend.app.services.activity import record_wallet_interaction


router = APIRouter()


@router.post("/wallet-connections", response_model=ActivityAcceptedResponse, summary="Record a wallet connection")
async def record_wallet_connection(
    request: WalletConnectionRequest,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
) -> ActivityAcceptedResponse:
    require_matching_wallet(identity, request.wallet_address)
    accepted = await record_wallet_interaction(
        session,
        request.wallet_address,
        InteractionType.WALLET_CONNECTED,
        request.network,
    )
    return ActivityAcceptedResponse(accepted=accepted)
