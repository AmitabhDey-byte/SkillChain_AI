import unittest
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from pydantic import SecretStr
from stellar_sdk import Account, Keypair, Network, TransactionBuilder

from backend.app.core.auth import create_session_token
from backend.app.core.config import Settings
from backend.app.core.errors import AppError
from backend.app.db.models import InteractionType
from backend.app.db.session import get_database_session
from backend.app.integrations.checkin import DATA_KEY, StellarCheckinService, get_stellar_checkin_service
from backend.app.main import create_app
from backend.app.schemas.activity import CheckinFundResponse, CheckinPrepareResponse, CheckinReceiptResponse


class FakeCheckinSession:
    def __init__(self) -> None:
        self.entry = None

    def add(self, entry) -> None:
        self.entry = entry

    async def commit(self) -> None:
        return None

    async def rollback(self) -> None:
        return None


class FakeCheckinService:
    async def prepare(self, request) -> CheckinPrepareResponse:
        return CheckinPrepareResponse(
            transaction_xdr="A" * 80,
            wallet_address=request.wallet_address,
            network="testnet",
            role=request.role,
            intent=request.intent,
            data_key=DATA_KEY,
            data_value="sc1|dev|1720000000|12345678|abcdef123456",
            estimated_fee_xlm="0.0000100",
            expires_at=datetime.now(UTC) + timedelta(minutes=3),
        )

    async def submit(self, request) -> CheckinReceiptResponse:
        return CheckinReceiptResponse(
            wallet_address=request.wallet_address,
            role=request.role,
            intent=request.intent,
            network="testnet",
            transaction_hash="b" * 64,
            ledger_sequence=123456,
            checked_in_at=datetime.now(UTC),
            explorer_url=f"https://stellar.expert/explorer/testnet/tx/{'b' * 64}",
        )

    async def fund(self, wallet_address: str) -> CheckinFundResponse:
        return CheckinFundResponse(
            wallet_address=wallet_address,
            network="testnet",
            funded=True,
            transaction_hash="c" * 64,
        )


class CheckinRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.keypair = Keypair.random()
        self.settings = Settings(
            environment="production",
            allowed_hosts=["testserver"],
            auth_session_secret=SecretStr("checkin-production-auth-secret-0123456789"),
        )
        self.session = FakeCheckinSession()
        application = create_app(self.settings)

        async def fake_session():
            yield self.session

        application.dependency_overrides[get_database_session] = fake_session
        application.dependency_overrides[get_stellar_checkin_service] = lambda: FakeCheckinService()
        self.client = TestClient(application)
        token, _ = create_session_token(self.keypair.public_key, "testnet", "freighter", self.settings, "checkin-test")
        self.headers = {"Authorization": f"Bearer {token}"}

    def test_prepare_requires_signed_wallet_session(self) -> None:
        response = self.client.post(
            "/api/v1/activity/check-ins/prepare",
            json={"wallet_address": self.keypair.public_key, "role": "developer", "intent": "Joining the proof network"},
        )

        self.assertEqual(response.status_code, 401)

    def test_prepare_returns_wallet_transaction(self) -> None:
        response = self.client.post(
            "/api/v1/activity/check-ins/prepare",
            headers=self.headers,
            json={"wallet_address": self.keypair.public_key, "role": "developer", "intent": "Joining the proof network"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data_key"], DATA_KEY)
        self.assertEqual(response.json()["network"], "testnet")

    def test_submit_records_real_transaction_activity(self) -> None:
        response = self.client.post(
            "/api/v1/activity/check-ins/submit",
            headers=self.headers,
            json={
                "wallet_address": self.keypair.public_key,
                "role": "freelancer",
                "intent": "Finding trusted client work",
                "signed_transaction_xdr": "A" * 80,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["transaction_hash"], "b" * 64)
        self.assertEqual(self.session.entry.interaction_type, InteractionType.ONCHAIN_CHECKIN)
        self.assertEqual(self.session.entry.interaction_data["role"], "freelancer")

    def test_funding_rejects_another_wallet(self) -> None:
        response = self.client.post(
            "/api/v1/activity/check-ins/fund",
            headers=self.headers,
            json={"wallet_address": Keypair.random().public_key},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"]["code"], "auth_wallet_mismatch")


class CheckinValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.keypair = Keypair.random()
        self.service = StellarCheckinService(
            horizon_url="https://horizon-testnet.stellar.org",
            friendbot_url="https://friendbot.stellar.org",
            network="testnet",
            timeout_seconds=10,
        )

    def build_signed_checkin(self, role: str, intent: str) -> str:
        timestamp = int(datetime.now(UTC).timestamp())
        marker = self.service.build_marker(role, intent, timestamp, "12345678")
        transaction = (
            TransactionBuilder(Account(self.keypair.public_key, 1), Network.TESTNET_NETWORK_PASSPHRASE, 100)
            .append_manage_data_op(DATA_KEY, marker.encode())
            .add_text_memo("SkillChain check-in")
            .set_timeout(180)
            .build()
        )
        transaction.sign(self.keypair)
        return transaction.to_xdr()

    def test_signed_marker_is_verified_without_network_access(self) -> None:
        envelope, checked_in_at = self.service.validate_signed_transaction(
            self.build_signed_checkin("student", "Learning Stellar development"),
            self.keypair.public_key,
            "student",
            "Learning Stellar development",
        )

        self.assertEqual(envelope.transaction.source.account_id, self.keypair.public_key)
        self.assertLess(abs((datetime.now(UTC) - checked_in_at).total_seconds()), 5)

    def test_changed_intent_is_rejected_before_submission(self) -> None:
        with self.assertRaises(AppError) as context:
            self.service.validate_signed_transaction(
                self.build_signed_checkin("developer", "Building public proof"),
                self.keypair.public_key,
                "developer",
                "A changed reason",
            )

        self.assertEqual(context.exception.code, "stellar_checkin_details_mismatch")

    def test_changed_transaction_blueprint_is_rejected(self) -> None:
        timestamp = int(datetime.now(UTC).timestamp())
        marker = self.service.build_marker("developer", "Building public proof", timestamp, "12345678")
        transaction = (
            TransactionBuilder(Account(self.keypair.public_key, 1), Network.TESTNET_NETWORK_PASSPHRASE, 200)
            .append_manage_data_op(DATA_KEY, marker.encode())
            .add_text_memo("Changed memo")
            .set_timeout(180)
            .build()
        )
        transaction.sign(self.keypair)

        with self.assertRaises(AppError) as context:
            self.service.validate_signed_transaction(
                transaction.to_xdr(),
                self.keypair.public_key,
                "developer",
                "Building public proof",
            )

        self.assertEqual(context.exception.code, "stellar_checkin_blueprint_invalid")


if __name__ == "__main__":
    unittest.main()
