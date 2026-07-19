from typing import Literal

from pydantic import BaseModel, Field


class AssistantMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=1200)
    role: str = Field(default="visitor", max_length=40)
    history: list[AssistantMessage] = Field(default_factory=list, max_length=10)


class AssistantChatResponse(BaseModel):
    reply: str
    model: str
