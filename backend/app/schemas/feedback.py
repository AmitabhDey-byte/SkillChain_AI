from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    category: str = Field(default="general", min_length=2, max_length=40)
    message: str = Field(min_length=4, max_length=2000)
    page: str | None = Field(default=None, max_length=200)


class FeedbackResponse(BaseModel):
    id: UUID
    rating: int
    category: str
    message: str
    page: str | None
    created_at: datetime


class AdminFeedbackItem(FeedbackResponse):
    wallet_address: str | None


class AdminFeedbackResponse(BaseModel):
    total: int
    feedback: list[AdminFeedbackItem]
