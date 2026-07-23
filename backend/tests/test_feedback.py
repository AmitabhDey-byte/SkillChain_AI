import unittest
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient
from pydantic import SecretStr

from backend.app.core.auth import create_session_token
from backend.app.core.config import Settings
from backend.app.db.session import get_database_session
from backend.app.main import create_app


WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"


class FakeFeedbackSession:
    def __init__(self) -> None:
        self.entry = None

    async def scalar(self, statement):
        return None

    def add(self, entry) -> None:
        self.entry = entry

    async def commit(self) -> None:
        return None

    async def refresh(self, entry) -> None:
        entry.id = uuid4()
        entry.created_at = datetime.now(UTC)

    async def rollback(self) -> None:
        return None


async def fake_feedback_session():
    yield FakeFeedbackSession()


class FeedbackRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            environment="production",
            allowed_hosts=["testserver"],
            auth_session_secret=SecretStr("feedback-production-auth-secret-0123456789"),
        )
        application = create_app(self.settings)
        application.dependency_overrides[get_database_session] = fake_feedback_session
        self.client = TestClient(application)
        self.token, _ = create_session_token(WALLET, "testnet", "freighter", self.settings, "feedback-test")

    def test_feedback_requires_wallet_session(self) -> None:
        response = self.client.post("/api/v1/feedback", json={"rating": 5, "message": "Clear and useful onboarding."})

        self.assertEqual(response.status_code, 401)

    def test_feedback_records_signed_wallet_context(self) -> None:
        response = self.client.post(
            "/api/v1/feedback",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"rating": 5, "category": "onboarding", "message": "Clear and useful onboarding.", "page": "/dashboard"},
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["rating"], 5)
        self.assertEqual(response.json()["category"], "onboarding")
        self.assertEqual(response.json()["page"], "/dashboard")
