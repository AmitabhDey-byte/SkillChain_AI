import unittest

import httpx
from fastapi.testclient import TestClient

from backend.app.core.config import Settings
from backend.app.core.errors import AppError
from backend.app.integrations.github import GithubService, get_github_service
from backend.app.main import create_app
from backend.app.schemas.github import GithubProfileResponse, GithubRepositoryResponse, RepositoryListResponse, RepositoryPageMeta


def profile_payload() -> dict:
    return {
        "id": 101,
        "login": "aisha-builds",
        "name": "Aisha Kapoor",
        "bio": "Building on Stellar",
        "avatar_url": "https://avatars.example/aisha",
        "html_url": "https://github.com/aisha-builds",
        "company": "Open Source",
        "location": "Bengaluru",
        "blog": "https://aisha.dev",
        "followers": 42,
        "following": 18,
        "public_repos": 12,
        "created_at": "2022-01-02T03:04:05Z",
        "updated_at": "2026-07-01T10:20:30Z",
    }


def repository_payload() -> dict:
    return {
        "id": 501,
        "name": "stellar-payments",
        "full_name": "aisha-builds/stellar-payments",
        "description": "Milestone payments on Stellar",
        "html_url": "https://github.com/aisha-builds/stellar-payments",
        "homepage": "https://stellar-payments.example",
        "language": "TypeScript",
        "topics": ["stellar", "soroban"],
        "stargazers_count": 24,
        "forks_count": 6,
        "open_issues_count": 2,
        "size": 2048,
        "default_branch": "main",
        "fork": False,
        "archived": False,
        "visibility": "public",
        "license": {"spdx_id": "MIT"},
        "updated_at": "2026-07-10T10:00:00Z",
        "pushed_at": "2026-07-09T09:00:00Z",
    }


class GithubServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_profile_is_normalized_and_versioned(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.headers["X-GitHub-Api-Version"], "2026-03-10")
            self.assertEqual(request.headers["Accept"], "application/vnd.github+json")
            return httpx.Response(200, json=profile_payload())

        async with httpx.AsyncClient(base_url="https://api.github.com", transport=httpx.MockTransport(handler)) as client:
            profile = await GithubService(client, "2026-03-10").get_profile("aisha-builds")

        self.assertEqual(profile.username, "aisha-builds")
        self.assertEqual(profile.public_repositories, 12)
        self.assertEqual(profile.created_at.year, 2022)

    async def test_repository_page_includes_rate_limit_metadata(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.url.params["sort"], "updated")
            self.assertEqual(request.url.params["per_page"], "20")
            return httpx.Response(
                200,
                json=[repository_payload()],
                headers={
                    "Link": '<https://api.github.com/users/aisha-builds/repos?page=2>; rel="next"',
                    "X-RateLimit-Remaining": "58",
                    "X-RateLimit-Reset": "1784190000",
                },
            )

        async with httpx.AsyncClient(base_url="https://api.github.com", transport=httpx.MockTransport(handler)) as client:
            result = await GithubService(client, "2026-03-10").list_repositories("aisha-builds", 1, 20)

        self.assertEqual(result.repositories[0].language, "TypeScript")
        self.assertEqual(result.repositories[0].license, "MIT")
        self.assertTrue(result.meta.has_next)
        self.assertEqual(result.meta.rate_limit_remaining, 58)

    async def test_missing_profile_becomes_domain_error(self) -> None:
        transport = httpx.MockTransport(lambda _: httpx.Response(404, json={"message": "Not Found"}))
        async with httpx.AsyncClient(base_url="https://api.github.com", transport=transport) as client:
            with self.assertRaises(AppError) as context:
                await GithubService(client, "2026-03-10").get_profile("missing-user")
        self.assertEqual(context.exception.code, "github_user_not_found")
        self.assertEqual(context.exception.status_code, 404)

    async def test_rate_limit_exposes_reset_time(self) -> None:
        transport = httpx.MockTransport(
            lambda _: httpx.Response(403, headers={"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1784190000"})
        )
        async with httpx.AsyncClient(base_url="https://api.github.com", transport=transport) as client:
            with self.assertRaises(AppError) as context:
                await GithubService(client, "2026-03-10").get_profile("aisha-builds")
        self.assertEqual(context.exception.code, "github_rate_limited")
        self.assertEqual(context.exception.details["reset_at"], 1784190000)


class FakeGithubService:
    async def get_profile(self, username: str) -> GithubProfileResponse:
        data = profile_payload()
        return GithubProfileResponse(
            github_user_id=data["id"],
            username=username,
            name=data["name"],
            bio=data["bio"],
            avatar_url=data["avatar_url"],
            profile_url=data["html_url"],
            company=data["company"],
            location=data["location"],
            blog=data["blog"],
            followers=data["followers"],
            following=data["following"],
            public_repositories=data["public_repos"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        )

    async def list_repositories(self, username: str, page: int, per_page: int) -> RepositoryListResponse:
        data = repository_payload()
        repository = GithubRepositoryResponse(
            github_repository_id=data["id"],
            name=data["name"],
            full_name=f"{username}/{data['name']}",
            description=data["description"],
            repository_url=data["html_url"],
            homepage=data["homepage"],
            language=data["language"],
            topics=data["topics"],
            stars=data["stargazers_count"],
            forks=data["forks_count"],
            open_issues=data["open_issues_count"],
            size_kb=data["size"],
            default_branch=data["default_branch"],
            is_fork=data["fork"],
            is_archived=data["archived"],
            visibility=data["visibility"],
            license=data["license"]["spdx_id"],
            updated_at=data["updated_at"],
            pushed_at=data["pushed_at"],
        )
        return RepositoryListResponse(
            repositories=[repository],
            meta=RepositoryPageMeta(page=page, per_page=per_page, returned=1, has_next=False, rate_limit_remaining=59, rate_limit_reset=None),
        )


class GithubRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        application = create_app(Settings(environment="test"))
        application.dependency_overrides[get_github_service] = FakeGithubService
        cls.client = TestClient(application)

    def test_profile_route(self) -> None:
        response = self.client.get("/api/v1/github/users/aisha-builds")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "aisha-builds")

    def test_repository_route_validates_pagination(self) -> None:
        response = self.client.get("/api/v1/github/users/aisha-builds/repositories?per_page=101")
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"]["code"], "validation_error")


if __name__ == "__main__":
    unittest.main()
