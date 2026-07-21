import unittest
from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from backend.app.core.config import Settings
from backend.app.db.models import JobApplication, Notification, NotificationType, User, UserRole
from backend.app.db.session import get_database_session
from backend.app.main import create_app


OWNER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"


def application_payload() -> dict:
    return {
        "job_id": "demo-job-01",
        "company_id": "company-01",
        "company_name": "NovaLedger Labs",
        "job_title": "Frontend Engineer",
        "applicant_wallet": OWNER,
        "applicant_name": "Aisha Kapoor",
        "applicant_headline": "Stellar product developer",
        "applicant_role": "talent",
        "skills": ["React", "TypeScript", "Stellar"],
        "message": "I have relevant Stellar product experience and would like to discuss this role.",
    }


class FakeScalarCollection:
    def __init__(self, items: list) -> None:
        self.items = items

    def all(self) -> list:
        return self.items


class FakeMarketplaceSession:
    def __init__(self) -> None:
        self.items: list = []

    def add(self, item) -> None:
        self.items.append(item)

    async def commit(self) -> None:
        now = datetime.now(UTC)
        for item in self.items:
            if item.id is None:
                item.id = uuid4()
            if item.created_at is None:
                item.created_at = now
            item.updated_at = now

    async def rollback(self) -> None:
        return None

    async def refresh(self, item) -> None:
        now = datetime.now(UTC)
        if item.id is None:
            item.id = uuid4()
        if item.created_at is None:
            item.created_at = now
        item.updated_at = now

    async def scalars(self, statement) -> FakeScalarCollection:
        entity = statement.column_descriptions[0].get("entity")
        return FakeScalarCollection([item for item in self.items if entity is None or isinstance(item, entity)])

    async def get(self, model, item_id):
        return next((item for item in self.items if isinstance(item, model) and item.id == item_id), None)


class MarketplaceApplicationRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.session = FakeMarketplaceSession()

        async def override_session():
            yield self.session

        application = create_app(Settings(environment="test"))
        application.dependency_overrides[get_database_session] = override_session
        self.client = TestClient(application)

    def test_application_reaches_recruiter_inbox(self) -> None:
        created = self.client.post("/api/v1/marketplace/applications", json=application_payload())
        inbox = self.client.get("/api/v1/marketplace/applications")

        self.assertEqual(created.status_code, 201)
        self.assertEqual(inbox.status_code, 200)
        self.assertEqual(inbox.json()["total"], 1)
        self.assertEqual(inbox.json()["applications"][0]["applicant_wallet"], OWNER)

    def test_recruiter_can_shortlist_application(self) -> None:
        created = self.client.post("/api/v1/marketplace/applications", json=application_payload()).json()
        response = self.client.patch(
            f"/api/v1/marketplace/applications/{created['id']}",
            json={"status": "shortlisted"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "shortlisted")
        notifications = [item for item in self.session.items if isinstance(item, Notification)]
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0].notification_type, NotificationType.APPLICATION_SHORTLISTED)
        self.assertEqual(notifications[0].recipient_wallet, OWNER)

    def test_candidate_can_read_recruiter_decision_notification(self) -> None:
        created = self.client.post("/api/v1/marketplace/applications", json=application_payload()).json()
        self.client.patch(
            f"/api/v1/marketplace/applications/{created['id']}",
            json={"status": "reviewing"},
        )

        inbox = self.client.get(f"/api/v1/notifications?wallet={OWNER}")
        notification = inbox.json()["notifications"][0]
        marked = self.client.patch(f"/api/v1/notifications/{notification['id']}/read?wallet={OWNER}")

        self.assertEqual(inbox.status_code, 200)
        self.assertEqual(inbox.json()["unread_count"], 1)
        self.assertEqual(notification["notification_type"], "application_reviewing")
        self.assertEqual(marked.status_code, 200)
        self.assertIsNotNone(marked.json()["read_at"])

    def test_repeating_same_status_does_not_duplicate_notification(self) -> None:
        created = self.client.post("/api/v1/marketplace/applications", json=application_payload()).json()
        endpoint = f"/api/v1/marketplace/applications/{created['id']}"
        self.client.patch(endpoint, json={"status": "shortlisted"})
        self.client.patch(endpoint, json={"status": "shortlisted"})

        notifications = [item for item in self.session.items if isinstance(item, Notification)]
        applications = [item for item in self.session.items if isinstance(item, JobApplication)]
        self.assertEqual(len(notifications), 1)
        self.assertEqual(len(applications), 1)

    def test_registered_developer_appears_in_talent_directory(self) -> None:
        now = datetime.now(UTC)
        self.session.items.append(
            User(
                id=uuid4(),
                wallet_address=OWNER,
                role=UserRole.TALENT,
                display_name="Live Builder",
                headline="Stellar protocol developer",
                location="Remote",
                skills=["Soroban", "Rust"],
                onboarding_complete=True,
                created_at=now,
                updated_at=now,
            )
        )

        response = self.client.get("/api/v1/marketplace/talent")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
        self.assertEqual(response.json()["profiles"][0]["display_name"], "Live Builder")


if __name__ == "__main__":
    unittest.main()
