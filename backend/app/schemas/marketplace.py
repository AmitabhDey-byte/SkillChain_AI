from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field

from backend.app.schemas.credential import WALLET_PATTERN
from backend.app.schemas.user import UserProfileResponse


class ApplicationStatusValue(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    SHORTLISTED = "shortlisted"
    DECLINED = "declined"


class JobApplicationCreate(BaseModel):
    job_id: str = Field(min_length=1, max_length=64)
    company_id: str = Field(min_length=1, max_length=64)
    company_name: str = Field(min_length=1, max_length=160)
    job_title: str = Field(min_length=1, max_length=180)
    applicant_wallet: str = Field(pattern=WALLET_PATTERN)
    applicant_name: str = Field(min_length=1, max_length=120)
    applicant_headline: str = Field(min_length=1, max_length=220)
    applicant_role: str = Field(min_length=1, max_length=32)
    skills: list[str] = Field(default_factory=list, max_length=15)
    message: str = Field(min_length=20, max_length=1200)


class JobApplicationStatusUpdate(BaseModel):
    status: ApplicationStatusValue


class JobApplicationResponse(BaseModel):
    id: UUID
    job_id: str
    company_id: str
    company_name: str
    job_title: str
    applicant_wallet: str
    applicant_name: str
    applicant_headline: str
    applicant_role: str
    skills: list[str]
    message: str
    status: ApplicationStatusValue
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobApplicationListResponse(BaseModel):
    applications: list[JobApplicationResponse]
    total: int


class TalentDirectoryResponse(BaseModel):
    profiles: list[UserProfileResponse]
    total: int
