from datetime import UTC, datetime, timedelta
import secrets
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, create_session_token, require_wallet_identity, verify_wallet_signature
from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.db.models import AuthChallenge, InteractionType
from backend.app.db.session import get_database_session
from backend.app.schemas.auth import (
    AuthChallengeRequest,
    AuthChallengeResponse,
    AuthIdentityResponse,
    AuthSessionResponse,
    AuthVerifyRequest,
)
from backend.app.services.activity import record_wallet_interaction


router = APIRouter()


def challenge_message(
    wallet_address: str,
    network: str,
    nonce: str,
    issued_at: datetime,
    expires_at: datetime,
) -> str:
    return "\n".join(
        (
            "SkillChain AI Authentication",
            f"Wallet: {wallet_address}",
            f"Network: {network}",
            f"Nonce: {nonce}",
            f"Issued At: {issued_at.isoformat()}",
            f"Expires At: {expires_at.isoformat()}",
            "Statement: Sign in to SkillChain AI. This request cannot move funds.",
        )
    )


@router.post("/challenge", response_model=AuthChallengeResponse, summary="Create a wallet authentication challenge")
async def create_challenge(
    request: AuthChallengeRequest,
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_database_session),
) -> AuthChallengeResponse:
    issued_at = datetime.now(UTC)
    await session.execute(
        delete(AuthChallenge).where(AuthChallenge.expires_at < issued_at - timedelta(days=1))
    )
    expires_at = issued_at + timedelta(minutes=settings.auth_challenge_minutes)
    message = challenge_message(
        request.wallet_address,
        request.network,
        secrets.token_urlsafe(32),
        issued_at,
        expires_at,
    )
    challenge = AuthChallenge(
        wallet_address=request.wallet_address,
        network=request.network,
        wallet_type=request.wallet_type,
        message=message,
        expires_at=expires_at,
    )
    session.add(challenge)
    await session.commit()
    await session.refresh(challenge)
    return AuthChallengeResponse(challenge_id=challenge.id, message=message, expires_at=expires_at)


@router.post("/verify", response_model=AuthSessionResponse, summary="Verify a wallet signature and create a session")
async def verify_challenge(
    request: AuthVerifyRequest,
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_database_session),
) -> AuthSessionResponse:
    result = await session.execute(
        select(AuthChallenge).where(AuthChallenge.id == request.challenge_id).with_for_update()
    )
    challenge = result.scalar_one_or_none()
    now = datetime.now(UTC)
    if (
        challenge is None
        or challenge.consumed_at is not None
        or challenge.expires_at <= now
        or challenge.wallet_address.upper() != request.wallet_address.upper()
    ):
        raise AppError("The wallet challenge is invalid or expired.", "auth_challenge_invalid", 401)
    if not verify_wallet_signature(request.wallet_address, challenge.message, request.signature):
        raise AppError("The wallet signature could not be verified.", "auth_signature_invalid", 401)

    challenge.consumed_at = now
    await session.commit()
    token, expires_at = create_session_token(
        challenge.wallet_address,
        challenge.network,
        challenge.wallet_type,
        settings,
        str(challenge.id),
    )
    await record_wallet_interaction(
        session,
        challenge.wallet_address,
        InteractionType.MESSAGE_SIGNED,
        challenge.network,
        interaction_data={"wallet_type": challenge.wallet_type},
    )
    return AuthSessionResponse(
        access_token=token,
        expires_at=expires_at,
        wallet_address=challenge.wallet_address,
        network=challenge.network,
        wallet_type=challenge.wallet_type,
    )


@router.get("/me", response_model=AuthIdentityResponse, summary="Read the active wallet session")
async def read_identity(
    identity: WalletIdentity | None = Depends(require_wallet_identity),
) -> AuthIdentityResponse:
    if identity is None:
        raise AppError("Connect and sign with your Stellar wallet to continue.", "auth_required", 401)
    return AuthIdentityResponse(
        wallet_address=identity.wallet_address,
        network=identity.network,
        wallet_type=identity.wallet_type,
        expires_at=identity.expires_at,
    )
