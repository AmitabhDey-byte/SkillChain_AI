from fastapi import APIRouter, Depends

from backend.app.integrations.gemini import GeminiAssessmentService, get_gemini_assessment_service
from backend.app.schemas.assessment import AssessmentPreviewRequest, AssessmentPreviewResponse


router = APIRouter()


@router.post("/preview", response_model=AssessmentPreviewResponse, summary="Generate an AI portfolio assessment")
async def preview_assessment(
    request: AssessmentPreviewRequest,
    service: GeminiAssessmentService = Depends(get_gemini_assessment_service),
) -> AssessmentPreviewResponse:
    return await service.assess(request)

