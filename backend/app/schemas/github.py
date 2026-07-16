from datetime import datetime

from pydantic import BaseModel, Field

from backend.app.schemas.assessment import RepositoryEvidence


class GithubProfileResponse(BaseModel):
    github_user_id: int
    username: str
    name: str | None
    bio: str | None
    avatar_url: str
    profile_url: str
    company: str | None
    location: str | None
    blog: str | None
    followers: int = Field(ge=0)
    following: int = Field(ge=0)
    public_repositories: int = Field(ge=0)
    created_at: datetime | None
    updated_at: datetime | None


class GithubRepositoryResponse(BaseModel):
    github_repository_id: int
    name: str
    full_name: str
    description: str | None
    repository_url: str
    homepage: str | None
    language: str | None
    topics: list[str]
    stars: int = Field(ge=0)
    forks: int = Field(ge=0)
    open_issues: int = Field(ge=0)
    size_kb: int = Field(ge=0)
    default_branch: str
    is_fork: bool
    is_archived: bool
    visibility: str
    license: str | None
    updated_at: datetime | None
    pushed_at: datetime | None


class RepositoryPageMeta(BaseModel):
    page: int = Field(ge=1)
    per_page: int = Field(ge=1, le=100)
    returned: int = Field(ge=0)
    has_next: bool
    rate_limit_remaining: int | None
    rate_limit_reset: int | None


class RepositoryListResponse(BaseModel):
    repositories: list[GithubRepositoryResponse]
    meta: RepositoryPageMeta


class RepositoryReference(BaseModel):
    owner: str = Field(min_length=1, max_length=39, pattern=r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$")
    repository: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9._-]+$")


class EvidenceBatchRequest(BaseModel):
    repositories: list[RepositoryReference] = Field(min_length=1, max_length=5)


class RepositoryEvidenceBundle(BaseModel):
    evidence: RepositoryEvidence
    unavailable_sources: list[str]


class EvidenceBatchItem(BaseModel):
    owner: str
    repository: str
    status: str
    evidence: RepositoryEvidence | None = None
    unavailable_sources: list[str] = Field(default_factory=list)
    error: str | None = None


class EvidenceBatchResponse(BaseModel):
    items: list[EvidenceBatchItem]
    successful: int = Field(ge=0)
    failed: int = Field(ge=0)
