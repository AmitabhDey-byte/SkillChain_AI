import json
import unittest

import httpx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from backend.app.core.config import Settings
from backend.app.core.errors import AppError
from backend.app.integrations.gemini import GeminiAssessmentService, get_gemini_assessment_service
from backend.app.main import create_app
from backend.app.schemas.assessment import AssessmentPreviewRequest, AssessmentPreviewResponse


def evidence_request() -> dict:
    return {
        "github_username": "aisha-builds",
        "repositories": [
            {
                "github_repository_id": 501,
                "name": "stellar-payments",
                "full_name": "aisha-builds/stellar-payments",
                "description": "Milestone payments on Stellar",
                "repository_url": "https://github.com/aisha-builds/stellar-payments",
                "language": "TypeScript",
                "languages": {"TypeScript": 82.5, "Rust": 17.5},
                "topics": ["stellar", "soroban", "payments"],
                "stars": 24,
                "forks": 6,
                "open_issues": 2,
                "contributors": 3,
                "size_kb": 2048,
                "default_branch": "main",
                "license": "MIT",
                "readme_excerpt": "A documented milestone payment application using Soroban contracts and a React client.",
                "recent_commits": [
                    {
                        "sha": "abcdef1234567890",
                        "message": "Add milestone release validation",
                        "authored_at": "2026-07-09T09:00:00Z",
                        "additions": 120,
                        "deletions": 18,
                        "files_changed": 7,
                    }
                ],
                "has_tests": True,
                "has_documentation": True,
                "is_fork": False,
                "is_archived": False,
                "pushed_at": "2026-07-09T09:00:00Z",
            }
        ],
    }


def assessment_payload() -> dict:
    dimension_scores = {
        "code_quality": 80,
        "architecture": 70,
        "documentation": 60,
        "consistency": 90,
        "complexity": 75,
        "impact": 50,
    }
    dimensions = {
        name: {
            "score": score,
            "rationale": f"The supplied repository evidence supports the {name.replace('_', ' ')} score with concrete signals.",
            "evidence": ["stellar-payments includes relevant documented implementation evidence"],
        }
        for name, score in dimension_scores.items()
    }
    return {
        "overall_score": 99,
        "confidence": 0.84,
        "level": "advanced",
        "summary": "The portfolio demonstrates advanced full-stack development with credible Stellar and Soroban implementation evidence across code, documentation, and recent commits.",
        "dimensions": dimensions,
        "skills": [
            {
                "name": "TypeScript",
                "category": "Frontend engineering",
                "level": "advanced",
                "confidence": 0.9,
                "evidence": ["TypeScript represents 82.5 percent of stellar-payments"],
            },
            {
                "name": "Soroban",
                "category": "Blockchain engineering",
                "level": "intermediate",
                "confidence": 0.76,
                "evidence": ["Repository topics and README identify Soroban contract work"],
            },
        ],
        "repository_findings": [
            {
                "repository": "aisha-builds/stellar-payments",
                "complexity_score": 76,
                "technologies": ["TypeScript", "Rust", "Soroban", "React"],
                "strengths": ["Combines frontend and smart contract implementation"],
                "improvements": ["Publish deeper architecture documentation"],
            }
        ],
        "portfolio_strengths": ["Recent implementation activity", "Cross-stack project evidence"],
        "risk_flags": ["Assessment covers one repository"],
        "next_steps": ["Add contract-level integration tests", "Document security assumptions"],
        "methodology": "Scores use the SkillChain weighted rubric and only the repository evidence supplied in this request.",
    }


def gemini_response(assessment: dict | None = None) -> dict:
    return {
        "candidates": [
            {
                "finishReason": "STOP",
                "content": {"parts": [{"text": json.dumps(assessment or assessment_payload())}]},
            }
        ],
        "usageMetadata": {"promptTokenCount": 920, "candidatesTokenCount": 640, "totalTokenCount": 1560},
    }


class GeminiAssessmentServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_structured_request_and_weighted_score(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.headers["X-Goog-Api-Key"], "test-key")
            payload = json.loads(request.content)
            self.assertEqual(payload["generationConfig"]["responseMimeType"], "application/json")
            self.assertIn("properties", payload["generationConfig"]["responseJsonSchema"])
            compact_schema = json.dumps(payload["generationConfig"]["responseJsonSchema"])
            for removed_constraint in ("minLength", "maxItems", "minimum", "maximum", "format", "title"):
                self.assertNotIn(removed_constraint, compact_schema)
            self.assertIn("untrusted data", payload["systemInstruction"]["parts"][0]["text"])
            self.assertIn("integer from 0 to 100", payload["contents"][0]["parts"][0]["text"])
            return httpx.Response(200, json=gemini_response())

        async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", transport=httpx.MockTransport(handler)) as client:
            result = await GeminiAssessmentService(client, "test-key", "gemini-2.5-flash", "attestation-key").assess(
                AssessmentPreviewRequest.model_validate(evidence_request())
            )

        self.assertEqual(result.assessment.overall_score, 73)
        self.assertEqual(result.rubric_version, "skillchain-v1")
        self.assertEqual(result.usage.total_tokens, 1560)
        self.assertEqual(len(result.attestation), 64)

    async def test_retryable_response_is_retried(self) -> None:
        attempts = 0

        def handler(_: httpx.Request) -> httpx.Response:
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                return httpx.Response(429, json={"error": {"message": "Busy"}})
            return httpx.Response(200, json=gemini_response())

        async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", transport=httpx.MockTransport(handler)) as client:
            await GeminiAssessmentService(
                client,
                "test-key",
                "gemini-2.5-flash",
                "attestation-key",
                retry_delays=(0,),
            ).assess(
                AssessmentPreviewRequest.model_validate(evidence_request())
            )
        self.assertEqual(attempts, 2)

    async def test_invalid_json_becomes_safe_error(self) -> None:
        response = {"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": "not-json"}]}}]}
        transport = httpx.MockTransport(lambda _: httpx.Response(200, json=response))
        async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", transport=transport) as client:
            with self.assertRaises(AppError) as context:
                await GeminiAssessmentService(client, "test-key", "gemini-2.5-flash", "attestation-key").assess(
                    AssessmentPreviewRequest.model_validate(evidence_request())
                )
        self.assertEqual(context.exception.code, "gemini_invalid_response")

    async def test_invalid_structure_is_repaired_once(self) -> None:
        attempts = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                invalid = assessment_payload()
                invalid["skills"] = []
                return httpx.Response(200, json=gemini_response(invalid))
            repair_payload = json.loads(request.content)
            self.assertEqual(repair_payload["generationConfig"]["temperature"], 0.05)
            self.assertIn("validation_errors", repair_payload["contents"][-1]["parts"][0]["text"])
            return httpx.Response(200, json=gemini_response())

        async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", transport=httpx.MockTransport(handler)) as client:
            result = await GeminiAssessmentService(
                client,
                "test-key",
                "gemini-2.5-flash",
                "attestation-key",
                retry_delays=(),
            ).assess(AssessmentPreviewRequest.model_validate(evidence_request()))

        self.assertEqual(attempts, 2)
        self.assertEqual(result.assessment.overall_score, 73)

    async def test_safety_block_becomes_domain_error(self) -> None:
        transport = httpx.MockTransport(lambda _: httpx.Response(200, json={"promptFeedback": {"blockReason": "SAFETY"}}))
        async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", transport=transport) as client:
            with self.assertRaises(AppError) as context:
                await GeminiAssessmentService(client, "test-key", "gemini-2.5-flash", "attestation-key").assess(
                    AssessmentPreviewRequest.model_validate(evidence_request())
                )
        self.assertEqual(context.exception.status_code, 422)


class FakeAssessmentService:
    async def assess(self, request: AssessmentPreviewRequest) -> AssessmentPreviewResponse:
        return AssessmentPreviewResponse(
            model="gemini-2.5-flash",
            rubric_version="skillchain-v1",
            assessment=assessment_payload(),
            usage={"prompt_tokens": 100, "output_tokens": 100, "total_tokens": 200},
            attestation="a" * 64,
        )


class GeminiAssessmentRouteTests(unittest.TestCase):
    def test_preview_route(self) -> None:
        application = create_app(Settings(environment="test", gemini_api_key=SecretStr("test-key")))
        application.dependency_overrides[get_gemini_assessment_service] = FakeAssessmentService
        response = TestClient(application).post("/api/v1/assessments/preview", json=evidence_request())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["assessment"]["level"], "advanced")

    def test_missing_key_is_reported_safely(self) -> None:
        application = create_app(Settings(environment="test", gemini_api_key=None))
        response = TestClient(application).post("/api/v1/assessments/preview", json=evidence_request())
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"]["code"], "gemini_not_configured")

    def test_repository_limit_is_validated(self) -> None:
        application = create_app(Settings(environment="test", gemini_api_key=SecretStr("test-key")))
        application.dependency_overrides[get_gemini_assessment_service] = FakeAssessmentService
        request = evidence_request()
        request["repositories"] = request["repositories"] * 6
        response = TestClient(application).post("/api/v1/assessments/preview", json=request)
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"]["code"], "validation_error")


if __name__ == "__main__":
    unittest.main()
