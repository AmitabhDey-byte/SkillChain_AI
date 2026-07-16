import asyncio
import base64
from collections.abc import AsyncIterator
from datetime import datetime
from typing import Any

import httpx
from fastapi import Depends

from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.schemas.assessment import CommitEvidence, RepositoryEvidence
from backend.app.schemas.github import (
    EvidenceBatchItem,
    EvidenceBatchResponse,
    GithubProfileResponse,
    GithubRepositoryResponse,
    RepositoryEvidenceBundle,
    RepositoryListResponse,
    RepositoryPageMeta,
    RepositoryReference,
)


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

    async def collect_evidence(self, owner: str, repository: str) -> RepositoryEvidenceBundle:
        repository_response = await self._request(
            f"/repos/{owner}/{repository}",
            not_found_code="github_repository_not_found",
            not_found_message="The requested GitHub repository was not found.",
        )
        repository_data = repository_response.json()
        default_branch = repository_data.get("default_branch", "main")
        source_requests = {
            "languages": self._optional_request(f"/repos/{owner}/{repository}/languages"),
            "readme": self._optional_request(f"/repos/{owner}/{repository}/readme"),
            "commits": self._optional_request(f"/repos/{owner}/{repository}/commits", {"per_page": 20}),
            "contributors": self._optional_request(f"/repos/{owner}/{repository}/contributors", {"per_page": 100, "anon": "true"}),
            "tree": self._optional_request(f"/repos/{owner}/{repository}/git/trees/{default_branch}", {"recursive": "1"}),
        }
        source_results = await asyncio.gather(*source_requests.values(), return_exceptions=True)
        sources: dict[str, httpx.Response | None] = {}
        unavailable_sources: list[str] = []
        for name, result in zip(source_requests, source_results, strict=True):
            if isinstance(result, Exception) or result is None:
                sources[name] = None
                unavailable_sources.append(name)
            else:
                sources[name] = result

        languages = self._language_percentages(sources["languages"])
        readme = self._readme_excerpt(sources["readme"])
        commits = self._commit_evidence(sources["commits"])
        contributors = len(sources["contributors"].json()) if sources["contributors"] else 0
        paths = self._tree_paths(sources["tree"])
        evidence = RepositoryEvidence(
            github_repository_id=repository_data["id"],
            name=repository_data["name"],
            full_name=repository_data["full_name"],
            description=repository_data.get("description"),
            repository_url=repository_data["html_url"],
            language=repository_data.get("language"),
            languages=languages,
            topics=repository_data.get("topics") or [],
            stars=repository_data.get("stargazers_count", 0),
            forks=repository_data.get("forks_count", 0),
            open_issues=repository_data.get("open_issues_count", 0),
            contributors=contributors,
            size_kb=repository_data.get("size", 0),
            default_branch=default_branch,
            license=(repository_data.get("license") or {}).get("spdx_id"),
            readme_excerpt=readme,
            recent_commits=commits,
            has_tests=self._has_tests(paths),
            has_documentation=bool(readme) or self._has_documentation(paths),
            is_fork=repository_data.get("fork", False),
            is_archived=repository_data.get("archived", False),
            pushed_at=self._parse_datetime(repository_data.get("pushed_at")),
        )
        return RepositoryEvidenceBundle(evidence=evidence, unavailable_sources=unavailable_sources)

    async def collect_evidence_batch(self, references: list[RepositoryReference]) -> EvidenceBatchResponse:
        semaphore = asyncio.Semaphore(2)

        async def collect(reference: RepositoryReference) -> EvidenceBatchItem:
            async with semaphore:
                try:
                    bundle = await self.collect_evidence(reference.owner, reference.repository)
                    return EvidenceBatchItem(
                        owner=reference.owner,
                        repository=reference.repository,
                        status="success",
                        evidence=bundle.evidence,
                        unavailable_sources=bundle.unavailable_sources,
                    )
                except AppError as error:
                    return EvidenceBatchItem(
                        owner=reference.owner,
                        repository=reference.repository,
                        status="failed",
                        error=error.code,
                    )

        items = await asyncio.gather(*(collect(reference) for reference in references))
        successful = sum(item.status == "success" for item in items)
        return EvidenceBatchResponse(items=items, successful=successful, failed=len(items) - successful)

    async def _request(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        not_found_code: str = "github_user_not_found",
        not_found_message: str = "The requested GitHub user was not found.",
    ) -> httpx.Response:
        try:
            response = await self.client.get(path, params=params, headers=self.headers)
        except httpx.TimeoutException as error:
            raise AppError("GitHub did not respond in time.", "github_timeout", 504) from error
        except httpx.RequestError as error:
            raise AppError("GitHub is currently unreachable.", "github_unavailable", 502) from error

        if response.status_code == 404:
            raise AppError(not_found_message, not_found_code, 404)
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

    async def _optional_request(self, path: str, params: dict[str, Any] | None = None) -> httpx.Response | None:
        try:
            return await self._request(path, params, "github_evidence_not_found", "Repository evidence was not found.")
        except AppError as error:
            if error.status_code in {404, 409, 422}:
                return None
            raise

    @staticmethod
    def _language_percentages(response: httpx.Response | None) -> dict[str, float]:
        if not response:
            return {}
        language_bytes = response.json()
        total = sum(language_bytes.values())
        if total <= 0:
            return {}
        percentages = {language: round(value / total * 100, 2) for language, value in language_bytes.items()}
        difference = round(100 - sum(percentages.values()), 2)
        if percentages and difference:
            largest = max(percentages, key=percentages.get)
            percentages[largest] = round(percentages[largest] + difference, 2)
        return percentages

    @staticmethod
    def _readme_excerpt(response: httpx.Response | None) -> str | None:
        if not response:
            return None
        data = response.json()
        if data.get("encoding") != "base64" or not data.get("content"):
            return None
        decoded = base64.b64decode(data["content"], validate=False).decode("utf-8", errors="replace")
        return decoded.replace("\x00", "").strip()[:8000] or None

    def _commit_evidence(self, response: httpx.Response | None) -> list[CommitEvidence]:
        if not response:
            return []
        commits: list[CommitEvidence] = []
        for item in response.json()[:20]:
            commit = item.get("commit") or {}
            author = commit.get("author") or {}
            commits.append(
                CommitEvidence(
                    sha=item["sha"],
                    message=(commit.get("message") or "Untitled commit")[:500],
                    authored_at=self._parse_datetime(author.get("date")),
                )
            )
        return commits

    @staticmethod
    def _tree_paths(response: httpx.Response | None) -> list[str]:
        if not response:
            return []
        return [item.get("path", "").lower() for item in response.json().get("tree", []) if item.get("type") == "blob"]

    @staticmethod
    def _has_tests(paths: list[str]) -> bool:
        signals = ("test/", "tests/", "__tests__/", ".test.", ".spec.", "_test.")
        return any(path.startswith(signals) or any(f"/{signal}" in path for signal in signals) for path in paths)

    @staticmethod
    def _has_documentation(paths: list[str]) -> bool:
        return any(path.startswith(("docs/", "documentation/")) or "/docs/" in path for path in paths)

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
