import json
import unittest

import httpx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from backend.app.core.config import Settings
from backend.app.core.errors import AppError
from backend.app.integrations.albedo import AlbedoService, get_albedo_service, normalize_gemini_api_key
from backend.app.main import create_app
from backend.app.schemas.assistant import AssistantChatRequest, AssistantChatResponse


class AlbedoServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_chat_uses_guardrails_and_returns_text(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            payload = json.loads(request.content)
            instruction = payload["systemInstruction"]["parts"][0]["text"]
            self.assertIn("seed phrases", instruction)
            self.assertEqual([item["role"] for item in payload["contents"]], ["user", "model", "user"])
            self.assertIn("Current user type: freelancer", payload["contents"][-1]["parts"][0]["text"])
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


class FakeAlbedoService:
    async def chat(self, request: AssistantChatRequest) -> AssistantChatResponse:
        return AssistantChatResponse(reply=f"Albedo received: {request.message}", model="gemini-test")


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


if __name__ == "__main__":
    unittest.main()
