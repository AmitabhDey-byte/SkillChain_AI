from fastapi import APIRouter, Depends

from backend.app.core.auth import WalletIdentity, require_wallet_identity
from backend.app.integrations.albedo import AlbedoService, get_albedo_service
from backend.app.schemas.assistant import AssistantChatRequest, AssistantChatResponse, InterviewKitRequest, InterviewKitResponse


router = APIRouter()


@router.post("/chat", response_model=AssistantChatResponse, summary="Chat with the Albedo blockchain assistant")
async def chat_with_albedo(
    request: AssistantChatRequest,
    _: WalletIdentity | None = Depends(require_wallet_identity),
    service: AlbedoService = Depends(get_albedo_service),
) -> AssistantChatResponse:
    return await service.chat(request)


@router.post("/interview-kit", response_model=InterviewKitResponse, summary="Generate an evidence-based interview kit")
async def generate_interview_kit(
    request: InterviewKitRequest,
    _: WalletIdentity | None = Depends(require_wallet_identity),
    service: AlbedoService = Depends(get_albedo_service),
) -> InterviewKitResponse:
    return await service.generate_interview_kit(request)
