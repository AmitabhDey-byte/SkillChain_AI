from datetime import datetime
from enum import Enum
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field


class UserRoleValue(str, Enum):
    TALENT = "talent"
    FREELANCER = "freelancer"
    RECRUITER = "recruiter"


SkillName = Annotated[str, Field(min_length=1, max_length=64)]


class UserProfileUpsert(BaseModel):
    role: UserRoleValue
    display_name: str = Field(min_length=2, max_length=120)
    headline: str = Field(min_length=3, max_length=220)
    location: str | None = Field(default=None, max_length=160)
    organization: str | None = Field(default=None, max_length=160)
    bio: str | None = Field(default=None, max_length=1200)
    avatar_url: str | None = Field(
        default=None,
        max_length=500,
        pattern=r"^https://(?:github\.com/[A-Za-z0-9-]+\.png|avatars\.githubusercontent\.com/u/[0-9]+)(?:\?.*)?$",
    )
    github_username: str | None = Field(
        default=None,
        min_length=1,
        max_length=39,
        pattern=r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$",
    )
    skills: list[SkillName] = Field(default_factory=list, max_length=20)


class UserProfileResponse(BaseModel):
    id: UUID
    wallet_address: str
    role: UserRoleValue
    display_name: str
    headline: str
    location: str | None
    organization: str | None
    bio: str | None
    avatar_url: str | None
    github_username: str | None
    skills: list[str]
    onboarding_complete: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
