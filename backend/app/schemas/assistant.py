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


class InterviewKitRequest(BaseModel):
    role: str = Field(min_length=2, max_length=180)
    seniority: Literal["junior", "mid", "senior", "staff"] = "senior"
    job_description: str = Field(default="", max_length=4000)
    skills: list[str] = Field(min_length=1, max_length=6)


class InterviewQuestion(BaseModel):
    question: str = Field(min_length=10, max_length=500)
    look_for: str = Field(min_length=10, max_length=500)
    skill: str = Field(min_length=1, max_length=100)


class InterviewScorecardCriterion(BaseModel):
    criterion: str = Field(min_length=2, max_length=100)
    guidance: str = Field(min_length=10, max_length=320)


class InterviewKitContent(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    overview: str = Field(min_length=10, max_length=600)
    questions: list[InterviewQuestion] = Field(min_length=4, max_length=8)
    scorecard: list[InterviewScorecardCriterion] = Field(min_length=3, max_length=6)
    duration_minutes: int = Field(ge=20, le=120)


class InterviewKitResponse(InterviewKitContent):
    model: str
