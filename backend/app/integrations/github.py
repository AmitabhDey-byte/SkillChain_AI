from collections.abc import AsyncIterator
from datetime import datetime
from typing import Any

import httpx
from fastapi import Depends

from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.schemas.github import GithubProfileResponse, GithubRepositoryResponse, RepositoryListResponse, RepositoryPageMeta


class GithubService:
    def __init__(self, client: httpx.AsyncClient, api_version: str, token: str | None = None) -> None:
        self.client = client
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": api_version,
            "User-Agent": "SkillChain-AI",
        }
        if token:
            self.headers["Authorization"] = f"Bearer {token}"

    async def get_profile(self, username: str) -> GithubProfileResponse:
        response = await self._request(f"/users/{username}")
        data = response.json()
        return GithubProfileResponse(
            github_user_id=data["id"],
            username=data["login"],
            name=data.get("name"),
            bio=data.get("bio"),
            avatar_url=data["avatar_url"],
            profile_url=data["html_url"],
            company=data.get("company"),
            location=data.get("location"),
            blog=data.get("blog") or None,
            followers=data.get("followers", 0),
            following=data.get("following", 0),
            public_repositories=data.get("public_repos", 0),
            created_at=self._parse_datetime(data.get("created_at")),
            updated_at=self._parse_datetime(data.get("updated_at")),
        )

    async def list_repositories(self, username: str, page: int, per_page: int) -> RepositoryListResponse:
        response = await self._request(
            f"/users/{username}/repos",
            params={"type": "owner", "sort": "updated", "direction": "desc", "page": page, "per_page": per_page},
        )
        repositories = [self._repository(item) for item in response.json()]
        return RepositoryListResponse(
            repositories=repositories,
            meta=RepositoryPageMeta(
                page=page,
                per_page=per_page,
                returned=len(repositories),
                has_next='rel="next"' in response.headers.get("link", ""),
                rate_limit_remaining=self._header_int(response, "x-ratelimit-remaining"),
                rate_limit_reset=self._header_int(response, "x-ratelimit-reset"),
            ),
        )

    async def _request(self, path: str, params: dict[str, Any] | None = None) -> httpx.Response:
        try:
            response = await self.client.get(path, params=params, headers=self.headers)
        except httpx.TimeoutException as error:
            raise AppError("GitHub did not respond in time.", "github_timeout", 504) from error
        except httpx.RequestError as error:
            raise AppError("GitHub is currently unreachable.", "github_unavailable", 502) from error

        if response.status_code == 404:
            raise AppError("The requested GitHub user was not found.", "github_user_not_found", 404)
        if response.status_code in {403, 429} and response.headers.get("x-ratelimit-remaining") == "0":
            raise AppError(
                "The GitHub API rate limit has been reached. Try again after the reset time.",
                "github_rate_limited",
                429,
                {"reset_at": self._header_int(response, "x-ratelimit-reset")},
            )
        if response.status_code >= 400:
            raise AppError("GitHub rejected the upstream request.", "github_upstream_error", 502, {"status": response.status_code})
        return response

    def _repository(self, data: dict[str, Any]) -> GithubRepositoryResponse:
        license_data = data.get("license") or {}
        return GithubRepositoryResponse(
            github_repository_id=data["id"],
            name=data["name"],
            full_name=data["full_name"],
            description=data.get("description"),
            repository_url=data["html_url"],
            homepage=data.get("homepage") or None,
            language=data.get("language"),
            topics=data.get("topics") or [],
            stars=data.get("stargazers_count", 0),
            forks=data.get("forks_count", 0),
            open_issues=data.get("open_issues_count", 0),
            size_kb=data.get("size", 0),
            default_branch=data.get("default_branch", "main"),
            is_fork=data.get("fork", False),
            is_archived=data.get("archived", False),
            visibility=data.get("visibility", "public"),
            license=license_data.get("spdx_id"),
            updated_at=self._parse_datetime(data.get("updated_at")),
            pushed_at=self._parse_datetime(data.get("pushed_at")),
        )

    @staticmethod
    def _parse_datetime(value: str | None) -> datetime | None:
        return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None

    @staticmethod
    def _header_int(response: httpx.Response, name: str) -> int | None:
        value = response.headers.get(name)
        return int(value) if value and value.isdigit() else None


async def get_github_service(settings: Settings = Depends(get_settings)) -> AsyncIterator[GithubService]:
    token = settings.github_token.get_secret_value() if settings.github_token else None
    timeout = httpx.Timeout(12, connect=5)
    limits = httpx.Limits(max_connections=50, max_keepalive_connections=20)
    async with httpx.AsyncClient(base_url="https://api.github.com", timeout=timeout, limits=limits) as client:
        yield GithubService(client, settings.github_api_version, token)

