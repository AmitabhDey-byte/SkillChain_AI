from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query

from backend.app.core.auth import WalletIdentity, require_wallet_identity
from backend.app.integrations.github import GithubService, get_github_service
from backend.app.schemas.github import EvidenceBatchRequest, EvidenceBatchResponse, GithubProfileResponse, RepositoryEvidenceBundle, RepositoryListResponse


router = APIRouter()
GithubUsername = Annotated[
    str,
    Path(min_length=1, max_length=39, pattern=r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$"),
]
RepositoryName = Annotated[str, Path(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9._-]+$")]


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


@router.get("/repos/{owner}/{repository}/evidence", response_model=RepositoryEvidenceBundle, summary="Collect repository assessment evidence")
async def collect_repository_evidence(
    owner: GithubUsername,
    repository: RepositoryName,
    _: WalletIdentity | None = Depends(require_wallet_identity),
    service: GithubService = Depends(get_github_service),
) -> RepositoryEvidenceBundle:
    return await service.collect_evidence(owner, repository)


@router.post("/evidence", response_model=EvidenceBatchResponse, summary="Collect evidence for selected repositories")
async def collect_evidence_batch(
    request: EvidenceBatchRequest,
    _: WalletIdentity | None = Depends(require_wallet_identity),
    service: GithubService = Depends(get_github_service),
) -> EvidenceBatchResponse:
    return await service.collect_evidence_batch(request.repositories)
