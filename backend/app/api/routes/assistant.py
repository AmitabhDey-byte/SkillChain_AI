from fastapi import APIRouter, Depends

from backend.app.integrations.albedo import AlbedoService, get_albedo_service
from backend.app.schemas.assistant import AssistantChatRequest, AssistantChatResponse


router = APIRouter()


@router.post("/chat", response_model=AssistantChatResponse, summary="Chat with the Albedo blockchain assistant")
async def chat_with_albedo(
    request: AssistantChatRequest,
    service: AlbedoService = Depends(get_albedo_service),
) -> AssistantChatResponse:
    return await service.chat(request)
