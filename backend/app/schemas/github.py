from datetime import datetime

from pydantic import BaseModel, Field


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

