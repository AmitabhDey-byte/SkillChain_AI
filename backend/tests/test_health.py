import unittest
from uuid import UUID

from fastapi.testclient import TestClient
from pydantic import SecretStr

from backend.app.core.config import Settings
from backend.app.main import create_app


class HealthEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        settings = Settings(
            environment="test",
            database_url=SecretStr("postgresql+asyncpg://test:test@localhost/skillchain_test"),
            gemini_api_key=None,
            stellar_rpc_url="https://soroban-testnet.stellar.org",
            stellar_contract_id="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
            stellar_issuer_secret=SecretStr("SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
            credential_attestation_secret=SecretStr("a" * 32),
        )
        cls.client = TestClient(create_app(settings))

    def test_liveness_response(self) -> None:
        response = self.client.get("/api/v1/health/live")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["service"], "SkillChain AI API")
        self.assertIn("timestamp", payload)

    def test_readiness_reports_optional_gemini_key(self) -> None:
        response = self.client.get("/api/v1/health/ready")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ready")
        self.assertEqual(payload["dependencies"]["database"], "configured")
        self.assertEqual(payload["dependencies"]["gemini"], "pending")
        self.assertEqual(payload["dependencies"]["stellar"], "configured")

    def test_request_context_headers(self) -> None:
        response = self.client.get("/api/v1/health/live")
        UUID(response.headers["X-Request-ID"])
        self.assertGreaterEqual(float(response.headers["X-Process-Time"]), 0)

    def test_supplied_request_id_is_preserved(self) -> None:
        response = self.client.get("/api/v1/health/live", headers={"X-Request-ID": "test-request-123"})
        self.assertEqual(response.headers["X-Request-ID"], "test-request-123")


if __name__ == "__main__":
    unittest.main()
