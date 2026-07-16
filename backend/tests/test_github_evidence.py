import base64
import unittest

import httpx
from fastapi.testclient import TestClient

from backend.app.core.config import Settings
from backend.app.integrations.github import GithubService, get_github_service
from backend.app.main import create_app
from backend.app.schemas.github import EvidenceBatchRequest, EvidenceBatchResponse, RepositoryReference


def repository_data(name: str = "stellar-payments") -> dict:
    return {
        "id": 501,
        "name": name,
        "full_name": f"aisha-builds/{name}",
        "description": "Milestone payments on Stellar",
        "html_url": f"https://github.com/aisha-builds/{name}",
        "language": "TypeScript",
        "topics": ["stellar", "soroban"],
        "stargazers_count": 24,
        "forks_count": 6,
        "open_issues_count": 2,
        "size": 2048,
        "default_branch": "main",
        "license": {"spdx_id": "MIT"},
        "fork": False,
        "archived": False,
        "pushed_at": "2026-07-09T09:00:00Z",
    }


def evidence_handler(readme_available: bool = True):
    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path == "/repos/aisha-builds/stellar-payments":
            return httpx.Response(200, json=repository_data())
        if path.endswith("/languages"):
            return httpx.Response(200, json={"TypeScript": 3000, "Rust": 1000})
        if path.endswith("/readme"):
            if not readme_available:
                return httpx.Response(404, json={"message": "Not Found"})
            content = base64.b64encode(b"# Stellar Payments\nDocumented Soroban milestone release workflow.").decode()
            return httpx.Response(200, json={"encoding": "base64", "content": content})
        if path.endswith("/commits"):
            return httpx.Response(
                200,
                json=[
                    {
                        "sha": "abcdef1234567890",
                        "commit": {
                            "message": "Add milestone release validation",
                            "author": {"date": "2026-07-09T09:00:00Z"},
                        },
                    }
                ],
            )
        if path.endswith("/contributors"):
            return httpx.Response(200, json=[{"login": "aisha-builds"}, {"login": "reviewer"}])
        if "/git/trees/" in path:
            return httpx.Response(
                200,
                json={
                    "tree": [
                        {"path": "src/App.tsx", "type": "blob"},
                        {"path": "tests/contract.spec.ts", "type": "blob"},
                        {"path": "docs/architecture.md", "type": "blob"},
                    ],
                    "truncated": False,
                },
            )
        return httpx.Response(404, json={"message": "Not Found"})

    return handler


class GithubEvidenceServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_collects_normalized_repository_evidence(self) -> None:
        async with httpx.AsyncClient(base_url="https://api.github.com", transport=httpx.MockTransport(evidence_handler())) as client:
            bundle = await GithubService(client, "2026-03-10").collect_evidence("aisha-builds", "stellar-payments")

        self.assertEqual(bundle.unavailable_sources, [])
        self.assertEqual(bundle.evidence.languages, {"TypeScript": 75.0, "Rust": 25.0})
        self.assertEqual(bundle.evidence.contributors, 2)
        self.assertTrue(bundle.evidence.has_tests)
        self.assertTrue(bundle.evidence.has_documentation)
        self.assertIn("Soroban milestone", bundle.evidence.readme_excerpt)
        self.assertEqual(bundle.evidence.recent_commits[0].sha, "abcdef1234567890")

    async def test_missing_optional_source_is_reported(self) -> None:
        async with httpx.AsyncClient(base_url="https://api.github.com", transport=httpx.MockTransport(evidence_handler(False))) as client:
            bundle = await GithubService(client, "2026-03-10").collect_evidence("aisha-builds", "stellar-payments")

        self.assertIn("readme", bundle.unavailable_sources)
        self.assertIsNone(bundle.evidence.readme_excerpt)
        self.assertTrue(bundle.evidence.has_documentation)

    async def test_batch_preserves_successful_repositories(self) -> None:
        base_handler = evidence_handler()

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/repos/aisha-builds/missing-repo":
                return httpx.Response(404, json={"message": "Not Found"})
            return base_handler(request)

        references = [
            RepositoryReference(owner="aisha-builds", repository="stellar-payments"),
            RepositoryReference(owner="aisha-builds", repository="missing-repo"),
        ]
        async with httpx.AsyncClient(base_url="https://api.github.com", transport=httpx.MockTransport(handler)) as client:
            result = await GithubService(client, "2026-03-10").collect_evidence_batch(references)

        self.assertEqual(result.successful, 1)
        self.assertEqual(result.failed, 1)
        self.assertEqual(result.items[1].error, "github_repository_not_found")


class FakeEvidenceService:
    async def collect_evidence_batch(self, references: list[RepositoryReference]) -> EvidenceBatchResponse:
        return EvidenceBatchResponse(
            items=[
                {
                    "owner": reference.owner,
                    "repository": reference.repository,
                    "status": "failed",
                    "error": "test_only",
                }
                for reference in references
            ],
            successful=0,
            failed=len(references),
        )


class GithubEvidenceRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        application = create_app(Settings(environment="test"))
        application.dependency_overrides[get_github_service] = FakeEvidenceService
        cls.client = TestClient(application)

    def test_batch_route(self) -> None:
        response = self.client.post(
            "/api/v1/github/evidence",
            json={"repositories": [{"owner": "aisha-builds", "repository": "stellar-payments"}]},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["failed"], 1)

    def test_batch_limit_is_validated(self) -> None:
        reference = {"owner": "aisha-builds", "repository": "stellar-payments"}
        response = self.client.post("/api/v1/github/evidence", json={"repositories": [reference] * 6})
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"]["code"], "validation_error")


if __name__ == "__main__":
    unittest.main()
