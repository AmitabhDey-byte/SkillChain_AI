import asyncio

from fastapi import APIRouter, Depends, Path, Query

from backend.app.integrations.stellar import StellarCredentialService, get_stellar_credential_service
from backend.app.schemas.credential import (
    HASH_PATTERN,
    WALLET_PATTERN,
    CredentialIssueRequest,
    CredentialIssueResponse,
    CredentialVerificationResponse,
)


router = APIRouter()


@router.post("", response_model=CredentialIssueResponse, summary="Issue a verified skill credential on Stellar")
async def issue_credential(
    request: CredentialIssueRequest,
    service: StellarCredentialService = Depends(get_stellar_credential_service),
) -> CredentialIssueResponse:
    return await asyncio.to_thread(service.issue, request)


@router.get("/{credential_id}/verify", response_model=CredentialVerificationResponse, summary="Verify a Stellar skill credential")
async def verify_credential(
    credential_id: str = Path(pattern=HASH_PATTERN),
    owner: str = Query(pattern=WALLET_PATTERN),
    service: StellarCredentialService = Depends(get_stellar_credential_service),
) -> CredentialVerificationResponse:
    return await asyncio.to_thread(service.verify, credential_id, owner)
