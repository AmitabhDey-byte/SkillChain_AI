import asyncio

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.models import InteractionType
from backend.app.db.session import get_database_session
from backend.app.integrations.stellar import StellarCredentialService, get_stellar_credential_service
from backend.app.schemas.credential import (
    HASH_PATTERN,
    WALLET_PATTERN,
    CredentialIssueRequest,
    CredentialIssueResponse,
    CredentialVerificationResponse,
)
from backend.app.services.activity import record_wallet_interaction


router = APIRouter()


@router.post("", response_model=CredentialIssueResponse, summary="Issue a verified skill credential on Stellar")
async def issue_credential(
    request: CredentialIssueRequest,
    service: StellarCredentialService = Depends(get_stellar_credential_service),
    session: AsyncSession = Depends(get_database_session),
) -> CredentialIssueResponse:
    credential = await asyncio.to_thread(service.issue, request)
    await record_wallet_interaction(
        session,
        credential.owner,
        InteractionType.CREDENTIAL_ISSUED,
        credential.network,
        credential.transaction_hash,
        credential.ledger_sequence,
        interaction_data={
            "credential_id": credential.credential_id,
            "level": credential.level,
            "score": credential.score,
        },
    )
    return credential


@router.get("/{credential_id}/verify", response_model=CredentialVerificationResponse, summary="Verify a Stellar skill credential")
async def verify_credential(
    credential_id: str = Path(pattern=HASH_PATTERN),
    owner: str = Query(pattern=WALLET_PATTERN),
    service: StellarCredentialService = Depends(get_stellar_credential_service),
    session: AsyncSession = Depends(get_database_session),
) -> CredentialVerificationResponse:
    verification = await asyncio.to_thread(service.verify, credential_id, owner)
    await record_wallet_interaction(
        session,
        verification.owner,
        InteractionType.CREDENTIAL_VERIFIED,
        verification.network,
        success=verification.active,
        interaction_data={"credential_id": verification.credential_id},
    )
    return verification
