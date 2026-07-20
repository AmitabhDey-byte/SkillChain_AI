import unittest
from types import SimpleNamespace

from fastapi.testclient import TestClient
from pydantic import SecretStr
from stellar_sdk import Keypair

from backend.app.core.attestation import sign_assessment
from backend.app.core.config import Settings
from backend.app.db.session import get_database_session
from backend.app.integrations.stellar import StellarCredentialService, get_stellar_credential_service
from backend.app.main import create_app
from backend.app.schemas.credential import CredentialIssueRequest, CredentialIssueResponse, CredentialVerificationResponse
from backend.tests.test_gemini_assessment import assessment_payload


CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"
OWNER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"


def credential_request() -> dict:
    assessment = assessment_payload()
    assessment["overall_score"] = 73
    attestation = sign_assessment(
        "gemini-2.5-flash",
        "skillchain-v1",
        [501],
        assessment,
        "attestation-key",
        OWNER,
        "aisha-builds",
    )
    return {
        "wallet_address": OWNER,
        "subject_wallet": OWNER,
        "github_username": "aisha-builds",
        "model": "gemini-2.5-flash",
        "rubric_version": "skillchain-v1",
        "repository_ids": [501],
        "assessment": assessment,
        "attestation": attestation,
    }


class FakeTransaction:
    def __init__(self, result: bool = True) -> None:
        self.send_transaction_response = SimpleNamespace(hash="b" * 64)
        self.get_transaction_response = SimpleNamespace(ledger=987654)
        self.verification_result = result
        self.submitted = False

    def sign_and_submit(self) -> None:
        self.submitted = True

    def result(self) -> bool:
        return self.verification_result


class FakeContractClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, list, dict]] = []
        self.transaction = FakeTransaction()

    def invoke(self, function_name: str, parameters: list, **options) -> FakeTransaction:
        self.calls.append((function_name, parameters, options))
        return self.transaction


class StellarCredentialServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.issuer = Keypair.random()
        self.service = StellarCredentialService(
            CONTRACT_ID,
            "https://rpc.example",
            "testnet",
            self.issuer,
            30,
            "attestation-key",
        )
        self.client = FakeContractClient()
        self.service.client = self.client
        self.request = CredentialIssueRequest.model_validate(credential_request())

    def test_hashes_are_deterministic_and_repository_order_independent(self) -> None:
        first_hash = self.service.report_hash(self.request)
        reordered = self.request.model_copy(update={"repository_ids": [700, 501]})
        reverse_ordered = self.request.model_copy(update={"repository_ids": [501, 700]})

        self.assertEqual(self.service.report_hash(reordered), self.service.report_hash(reverse_ordered))
        self.assertEqual(first_hash, self.service.report_hash(self.request))
        self.assertEqual(len(self.service.credential_id(OWNER, first_hash)), 64)

    def test_issue_builds_and_submits_contract_invocation(self) -> None:
        result = self.service.issue(self.request)

        self.assertEqual(self.client.calls[0][0], "issue")
        self.assertEqual(len(self.client.calls[0][1]), 5)
        self.assertEqual(self.client.calls[0][2]["source"], self.issuer.public_key)
        self.assertTrue(self.client.transaction.submitted)
        self.assertEqual(result.transaction_hash, "b" * 64)
        self.assertEqual(result.ledger_sequence, 987654)
        self.assertEqual(result.owner, OWNER)
        self.assertEqual(result.score, 73)

    def test_issue_requires_server_issuer(self) -> None:
        service = StellarCredentialService(
            CONTRACT_ID,
            "https://rpc.example",
            "testnet",
            None,
            30,
            "attestation-key",
        )

        with self.assertRaisesRegex(Exception, "not configured"):
            service.issue(self.request)

    def test_verify_uses_read_only_contract_call(self) -> None:
        credential_id = "a" * 64
        result = self.service.verify(credential_id, OWNER)

        self.assertEqual(self.client.calls[0][0], "verify")
        self.assertNotIn("signer", self.client.calls[0][2])
        self.assertTrue(result.active)

    def test_tampered_assessment_is_rejected(self) -> None:
        tampered_assessment = self.request.assessment.model_copy(update={"overall_score": 100})
        tampered_request = self.request.model_copy(update={"assessment": tampered_assessment})

        with self.assertRaisesRegex(Exception, "attestation is invalid"):
            self.service.issue(tampered_request)


class FakeCredentialService:
    def issue(self, request: CredentialIssueRequest) -> CredentialIssueResponse:
        return CredentialIssueResponse(
            credential_id="a" * 64,
            report_hash="c" * 64,
            owner=request.wallet_address,
            score=request.assessment.overall_score,
            level=request.assessment.level.value,
            transaction_hash="b" * 64,
            ledger_sequence=987654,
            contract_id=CONTRACT_ID,
            network="testnet",
        )

    def verify(self, credential_id: str, owner: str) -> CredentialVerificationResponse:
        return CredentialVerificationResponse(
            credential_id=credential_id,
            owner=owner,
            active=True,
            contract_id=CONTRACT_ID,
            network="testnet",
        )


class FakeDatabaseSession:
    def add(self, item) -> None:
        self.item = item

    async def commit(self) -> None:
        return None

    async def rollback(self) -> None:
        return None


async def fake_database_session():
    yield FakeDatabaseSession()


class StellarCredentialRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        application = create_app(
            Settings(
                environment="test",
                stellar_contract_id=CONTRACT_ID,
                stellar_issuer_secret=SecretStr(Keypair.random().secret),
                credential_attestation_secret=SecretStr("attestation-key"),
            )
        )
        application.dependency_overrides[get_stellar_credential_service] = FakeCredentialService
        application.dependency_overrides[get_database_session] = fake_database_session
        self.client = TestClient(application)

    def test_issue_route(self) -> None:
        response = self.client.post("/api/v1/credentials", json=credential_request())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["transaction_hash"], "b" * 64)
        self.assertEqual(response.json()["owner"], OWNER)

    def test_verify_route(self) -> None:
        response = self.client.get(f"/api/v1/credentials/{'a' * 64}/verify", params={"owner": OWNER})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["active"])

    def test_invalid_credential_id_is_rejected(self) -> None:
        response = self.client.get("/api/v1/credentials/not-a-hash/verify", params={"owner": OWNER})

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"]["code"], "validation_error")


class StellarCredentialConfigurationTests(unittest.TestCase):
    def test_missing_contract_is_reported_safely(self) -> None:
        application = create_app(Settings(environment="test", stellar_contract_id=None))
        response = TestClient(application).get(f"/api/v1/credentials/{'a' * 64}/verify", params={"owner": OWNER})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"]["code"], "stellar_contract_not_configured")


if __name__ == "__main__":
    unittest.main()
