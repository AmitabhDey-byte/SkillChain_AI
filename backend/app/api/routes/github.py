from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query

from backend.app.integrations.github import GithubService, get_github_service
from backend.app.schemas.github import GithubProfileResponse, RepositoryListResponse


router = APIRouter()
GithubUsername = Annotated[
    str,
    Path(min_length=1, max_length=39, pattern=r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$"),
]


@router.get("/users/{username}", response_model=GithubProfileResponse, summary="Get a public GitHub profile")
async def get_profile(username: GithubUsername, service: GithubService = Depends(get_github_service)) -> GithubProfileResponse:
    return await service.get_profile(username)


@router.get("/users/{username}/repositories", response_model=RepositoryListResponse, summary="List public GitHub repositories")
async def list_repositories(
    username: GithubUsername,
    page: Annotated[int, Query(ge=1, le=1000)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 30,
    service: GithubService = Depends(get_github_service),
) -> RepositoryListResponse:
    return await service.list_repositories(username, page, per_page)

