from fastapi import APIRouter, Depends

from backend.app.core.auth import WalletIdentity, require_wallet_identity
from backend.app.integrations.gemini import GeminiAssessmentService, get_gemini_assessment_service
from backend.app.schemas.assessment import AssessmentPreviewRequest, AssessmentPreviewResponse


router = APIRouter()


@router.post("/preview", response_model=AssessmentPreviewResponse, summary="Generate an AI portfolio assessment")
async def preview_assessment(
    request: AssessmentPreviewRequest,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    service: GeminiAssessmentService = Depends(get_gemini_assessment_service),
) -> AssessmentPreviewResponse:
    if identity:
        return await service.assess(request, identity.wallet_address)
    return await service.assess(request)
