import unittest
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient
from pydantic import SecretStr

from backend.app.core.config import Settings
from backend.app.core.auth import create_session_token
from backend.app.db.models import InteractionType, UserRole
from backend.app.db.session import get_database_session
from backend.app.main import create_app


OWNER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
ADMIN_KEY = "test-admin-key"


class FakeScalarCollection:
    def __init__(self, items: list) -> None:
        self.items = items

    def all(self) -> list:
        return self.items


class FakeAdminSession:
    def __init__(self) -> None:
        self.counts = iter([2, 3, 1, 4])
        self.activity = SimpleNamespace(
            id=uuid4(),
            wallet_address=OWNER,
            interaction_type=InteractionType.CREDENTIAL_ISSUED,
            network="testnet",
            transaction_hash="b" * 64,
            ledger_sequence=987654,
            success=True,
            interaction_data={"credential_id": "a" * 64},
            created_at=datetime.now(UTC),
        )

    async def scalar(self, statement) -> int:
        return next(self.counts)

    async def scalars(self, statement) -> FakeScalarCollection:
        return FakeScalarCollection([self.activity])

    async def rollback(self) -> None:
        return None


class FakeUserSession:
    def __init__(self) -> None:
        self.user = SimpleNamespace(
            id=uuid4(),
            wallet_address=OWNER,
            role=UserRole.TALENT,
            display_name="Ada Lovelace",
            headline="Proof-first protocol engineer",
            location="London",
            organization="Analytical Society",
            avatar_url=None,
            github_username="ada-lovelace",
            skills=["Rust", "Stellar"],
            onboarding_complete=True,
            created_at=datetime.now(UTC),
        )

    async def scalar(self, statement) -> int:
        return 1

    async def scalars(self, statement) -> FakeScalarCollection:
        return FakeScalarCollection([self.user])

    async def rollback(self) -> None:
        return None


class FakeFeedbackSession:
    def __init__(self) -> None:
        self.entry = SimpleNamespace(
            id=uuid4(),
            wallet_address=OWNER,
            rating=5,
            category="onboarding",
            message="The onboarding flow was clear.",
            page="/dashboard",
            created_at=datetime.now(UTC),
        )

    async def scalar(self, statement) -> int:
        return 1

    async def scalars(self, statement) -> FakeScalarCollection:
        return FakeScalarCollection([self.entry])

    async def rollback(self) -> None:
        return None


async def fake_admin_session():
    yield FakeAdminSession()


async def fake_user_session():
    yield FakeUserSession()


async def fake_feedback_session():
    yield FakeFeedbackSession()


class AdminActivityRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        application = create_app(Settings(environment="test", admin_api_key=SecretStr(ADMIN_KEY)))
        application.dependency_overrides[get_database_session] = fake_admin_session
        self.client = TestClient(application)

    def test_admin_overview_requires_key(self) -> None:
        response = self.client.get("/api/v1/admin/overview")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "admin_unauthorized")

    def test_admin_overview_rejects_wrong_key(self) -> None:
        response = self.client.get("/api/v1/admin/overview", headers={"X-Admin-Key": "wrong"})

        self.assertEqual(response.status_code, 401)

    def test_admin_overview_returns_private_metrics(self) -> None:
        response = self.client.get("/api/v1/admin/overview", headers={"X-Admin-Key": ADMIN_KEY})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["unique_wallets"], 2)
        self.assertEqual(response.json()["wallet_connections"], 3)
        self.assertEqual(response.json()["credentials_issued"], 1)
        self.assertEqual(response.json()["credentials_verified"], 4)
        self.assertEqual(response.json()["recent_transactions"][0]["transaction_hash"], "b" * 64)

    def test_admin_users_lists_completed_profiles(self) -> None:
        self.client.app.dependency_overrides[get_database_session] = fake_user_session

        response = self.client.get("/api/v1/admin/users", headers={"X-Admin-Key": ADMIN_KEY})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
        self.assertEqual(response.json()["users"][0]["display_name"], "Ada Lovelace")
        self.assertEqual(response.json()["users"][0]["role"], "talent")

    def test_admin_feedback_lists_member_feedback(self) -> None:
        self.client.app.dependency_overrides[get_database_session] = fake_feedback_session

        response = self.client.get("/api/v1/admin/feedback", headers={"X-Admin-Key": ADMIN_KEY})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
        self.assertEqual(response.json()["feedback"][0]["message"], "The onboarding flow was clear.")


class AdminConfigurationTests(unittest.TestCase):
    def test_missing_admin_key_is_reported(self) -> None:
        application = create_app(Settings(environment="test", admin_api_key=None))
        response = TestClient(application).get("/api/v1/admin/overview")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"]["code"], "admin_not_configured")

    def test_production_admin_uses_allowlisted_wallet_session(self) -> None:
        settings = Settings(
            environment="production",
            allowed_hosts=["testserver"],
            auth_session_secret=SecretStr("a-production-length-auth-secret-value"),
            admin_wallets=[OWNER],
        )
        application = create_app(settings)
        application.dependency_overrides[get_database_session] = fake_admin_session
        token, _ = create_session_token(OWNER, "testnet", "freighter", settings, "admin-test")

        response = TestClient(application).get(
            "/api/v1/admin/overview",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["unique_wallets"], 2)


if __name__ == "__main__":
    unittest.main()
