import json
import unittest

import httpx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from backend.app.core.config import Settings
from backend.app.core.errors import AppError
from backend.app.integrations.albedo import AlbedoService, get_albedo_service, normalize_gemini_api_key
from backend.app.main import create_app
from backend.app.schemas.assistant import AssistantChatRequest, AssistantChatResponse, InterviewKitRequest, InterviewKitResponse


class AlbedoServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_chat_uses_guardrails_and_returns_text(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.url.path, "/v1/models/gemini-2.5-flash:generateContent")
            payload = json.loads(request.content)
            prompt = payload["contents"][0]["parts"][0]["text"]
            self.assertEqual(set(payload), {"contents"})
            self.assertIn("seed phrases", prompt)
            self.assertIn("User: What is Stellar?", prompt)
            self.assertIn("Albedo: Stellar is a payments network.", prompt)
            self.assertIn("Current user type: freelancer", prompt)
            return httpx.Response(
                200,
                json={
                    "candidates": [
                        {
                            "finishReason": "STOP",
                            "content": {"parts": [{"text": "Soroban is Stellar's smart contract platform."}]},
                        }
                    ]
                },
            )

        async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", transport=httpx.MockTransport(handler)) as client:
            result = await AlbedoService(client, "test-key", "gemini-2.5-flash").chat(
                AssistantChatRequest(
                    message="What is Soroban?",
                    role="freelancer",
                    history=[
                        {"role": "assistant", "content": "Welcome to SkillChain."},
                        {"role": "user", "content": "What is Stellar?"},
                        {"role": "assistant", "content": "Stellar is a payments network."},
                    ],
                )
            )

        self.assertEqual(result.reply, "Soroban is Stellar's smart contract platform.")

    async def test_invalid_api_key_response_is_actionable(self) -> None:
        def handler(_: httpx.Request) -> httpx.Response:
            return httpx.Response(
                400,
                json={
                    "error": {
                        "code": 400,
                        "message": "API key not valid. Please pass a valid API key.",
                        "status": "INVALID_ARGUMENT",
                        "details": [{"reason": "API_KEY_INVALID"}],
                    }
                },
            )

        async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", transport=httpx.MockTransport(handler)) as client:
            with self.assertRaises(AppError) as context:
                await AlbedoService(client, "invalid-key", "gemini-2.5-flash", retry_delays=()).chat(
                    AssistantChatRequest(message="What is Stellar?", role="talent")
                )

        self.assertEqual(context.exception.code, "albedo_unauthorized")
        self.assertEqual(context.exception.status_code, 503)

    def test_normalizes_pasted_vercel_secret(self) -> None:
        self.assertEqual(normalize_gemini_api_key(' GEMINI_API_KEY="AIza-test" '), "AIza-test")

    async def test_interview_kit_is_validated_and_returns_model(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            payload = json.loads(request.content)
            prompt = payload["contents"][0]["parts"][0]["text"]
            self.assertIn("evidence-based technical interview architect", prompt)
            self.assertIn("Senior protocol engineer", prompt)
            return httpx.Response(
                200,
                json={
                    "candidates": [{
                        "finishReason": "STOP",
                        "content": {"parts": [{"text": json.dumps(interview_kit_payload())}]},
                    }]
                },
            )

        async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", transport=httpx.MockTransport(handler)) as client:
            result = await AlbedoService(client, "test-key", "gemini-2.5-flash").generate_interview_kit(
                InterviewKitRequest(
                    role="Senior protocol engineer",
                    seniority="senior",
                    job_description="Own Stellar protocol integrations.",
                    skills=["Rust", "Soroban", "Security"],
                )
            )

        self.assertEqual(result.model, "gemini-2.5-flash")
        self.assertEqual(len(result.questions), 5)


def interview_kit_payload() -> dict:
    return {
        "title": "Senior Protocol Engineer Evidence Interview",
        "overview": "A structured discussion focused on demonstrated protocol engineering decisions and outcomes.",
        "questions": [
            {"question": f"Explain a production decision involving evidence area {index} and the trade-offs you considered.", "look_for": "Specific artifacts, constraints, alternatives, and measurable outcomes.", "skill": skill}
            for index, skill in enumerate(["Rust", "Soroban", "Security", "Architecture", "Ownership"], start=1)
        ],
        "scorecard": [
            {"criterion": criterion, "guidance": "Score the specificity, relevance, judgment, and evidence behind the answer."}
            for criterion in ["Evidence", "Judgment", "Ownership", "Communication"]
        ],
        "duration_minutes": 50,
    }


class FakeAlbedoService:
    async def chat(self, request: AssistantChatRequest) -> AssistantChatResponse:
        return AssistantChatResponse(reply=f"Albedo received: {request.message}", model="gemini-test")

    async def generate_interview_kit(self, _: InterviewKitRequest) -> InterviewKitResponse:
        return InterviewKitResponse(**interview_kit_payload(), model="gemini-test")


class AlbedoRouteTests(unittest.TestCase):
    def test_chat_route(self) -> None:
        application = create_app(Settings(environment="test", gemini_api_key=SecretStr("test-key")))
        application.dependency_overrides[get_albedo_service] = FakeAlbedoService
        response = TestClient(application).post(
            "/api/v1/assistant/chat",
            json={"message": "Explain Stellar fees", "role": "talent", "history": []},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["model"], "gemini-test")

    def test_missing_key_is_reported(self) -> None:
        application = create_app(Settings(environment="test", gemini_api_key=None))
        response = TestClient(application).post(
            "/api/v1/assistant/chat",
            json={"message": "Explain Stellar fees", "role": "talent", "history": []},
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"]["code"], "albedo_not_configured")

    def test_interview_kit_route(self) -> None:
        application = create_app(Settings(environment="test", gemini_api_key=SecretStr("test-key")))
        application.dependency_overrides[get_albedo_service] = FakeAlbedoService
        response = TestClient(application).post(
            "/api/v1/assistant/interview-kit",
            json={
                "role": "Senior protocol engineer",
                "seniority": "senior",
                "job_description": "Own Stellar protocol integrations.",
                "skills": ["Rust", "Soroban", "Security"],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["model"], "gemini-test")


if __name__ == "__main__":
    unittest.main()
