from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, require_matching_wallet, require_wallet_identity
from backend.app.db.models import InteractionType
from backend.app.db.session import get_database_session
from backend.app.integrations.checkin import StellarCheckinService, get_stellar_checkin_service
from backend.app.schemas.activity import (
    ActivityAcceptedResponse,
    CheckinFundRequest,
    CheckinFundResponse,
    CheckinPrepareRequest,
    CheckinPrepareResponse,
    CheckinReceiptResponse,
    CheckinSubmitRequest,
    WalletConnectionRequest,
)
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


@router.post("/check-ins/prepare", response_model=CheckinPrepareResponse, summary="Prepare a wallet-signed on-chain check-in")
async def prepare_checkin(
    request: CheckinPrepareRequest,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    service: StellarCheckinService = Depends(get_stellar_checkin_service),
) -> CheckinPrepareResponse:
    require_matching_wallet(identity, request.wallet_address)
    return await service.prepare(request)


@router.post("/check-ins/submit", response_model=CheckinReceiptResponse, summary="Submit and record an on-chain check-in")
async def submit_checkin(
    request: CheckinSubmitRequest,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
    service: StellarCheckinService = Depends(get_stellar_checkin_service),
) -> CheckinReceiptResponse:
    require_matching_wallet(identity, request.wallet_address)
    receipt = await service.submit(request)
    await record_wallet_interaction(
        session,
        receipt.wallet_address,
        InteractionType.ONCHAIN_CHECKIN,
        receipt.network,
        receipt.transaction_hash,
        receipt.ledger_sequence,
        interaction_data={"role": receipt.role, "intent": receipt.intent},
    )
    return receipt


@router.post("/check-ins/fund", response_model=CheckinFundResponse, summary="Fund an unfunded Stellar testnet wallet")
async def fund_checkin_wallet(
    request: CheckinFundRequest,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    service: StellarCheckinService = Depends(get_stellar_checkin_service),
) -> CheckinFundResponse:
    require_matching_wallet(identity, request.wallet_address)
    return await service.fund(request.wallet_address)
