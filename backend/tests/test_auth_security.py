import base64
from hashlib import sha256
import unittest

from pydantic import SecretStr, ValidationError
from stellar_sdk import Keypair

from backend.app.core.auth import (
    SIGNED_MESSAGE_PREFIX,
    create_session_token,
    decode_session_token,
    verify_wallet_signature,
)
from backend.app.core.config import Settings
from backend.app.core.errors import AppError
from backend.app.core.middleware import RateLimitMiddleware


class WalletSignatureTests(unittest.TestCase):
    def setUp(self) -> None:
        self.keypair = Keypair.random()
        self.message = "SkillChain AI Authentication\nNonce: secure-test"

    def test_freighter_signature_is_verified(self) -> None:
        payload = sha256(f"{SIGNED_MESSAGE_PREFIX}{self.message}".encode()).digest()
        signature = base64.b64encode(self.keypair.sign(payload)).decode()

        self.assertTrue(verify_wallet_signature(self.keypair.public_key, self.message, signature))

    def test_albedo_signature_is_verified(self) -> None:
        payload = sha256(f"{self.keypair.public_key}:{self.message}".encode()).digest()
        signature = self.keypair.sign(payload).hex()

        self.assertTrue(verify_wallet_signature(self.keypair.public_key, self.message, signature))

    def test_signature_cannot_be_replayed_for_another_message(self) -> None:
        payload = sha256(f"{SIGNED_MESSAGE_PREFIX}{self.message}".encode()).digest()
        signature = base64.b64encode(self.keypair.sign(payload)).decode()

        self.assertFalse(verify_wallet_signature(self.keypair.public_key, f"{self.message}-changed", signature))


class SessionTokenTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            environment="test",
            auth_session_secret=SecretStr("a-production-length-auth-secret-value"),
        )
        self.wallet = Keypair.random().public_key

    def test_session_token_round_trip(self) -> None:
        token, _ = create_session_token(self.wallet, "testnet", "albedo", self.settings, "challenge-id")
        identity = decode_session_token(token, self.settings)

        self.assertEqual(identity.wallet_address, self.wallet)
        self.assertEqual(identity.network, "testnet")
        self.assertEqual(identity.wallet_type, "albedo")

    def test_tampered_session_is_rejected(self) -> None:
        token, _ = create_session_token(self.wallet, "testnet", "freighter", self.settings, "challenge-id")
        header, claims, signature = token.split(".")
        tampered = f"{header}.{claims[:-1]}A.{signature}"

        with self.assertRaises(AppError):
            decode_session_token(tampered, self.settings)


class ProductionConfigurationTests(unittest.TestCase):
    def test_production_requires_strong_session_secret(self) -> None:
        with self.assertRaises(ValidationError):
            Settings(environment="production", allowed_hosts=["skillchain.example"])

    def test_production_rejects_wildcard_hosts(self) -> None:
        with self.assertRaises(ValidationError):
            Settings(
                environment="production",
                auth_session_secret=SecretStr("a-production-length-auth-secret-value"),
                allowed_hosts=["*"],
            )

    def test_vercel_domains_are_added_to_trusted_hosts(self) -> None:
        settings = Settings(
            environment="production",
            auth_session_secret=SecretStr("a-production-length-auth-secret-value"),
            allowed_hosts=["skillchain.example"],
            vercel_url="skillchain-preview.vercel.app",
            vercel_project_production_url="skillchain.example",
        )

        self.assertEqual(
            settings.allowed_hosts,
            ["skillchain.example", "skillchain-preview.vercel.app"],
        )

    def test_dynamic_paths_share_rate_limit_bucket(self) -> None:
        self.assertEqual(
            RateLimitMiddleware.bucket_for("/api/v1/github/users/alice"),
            RateLimitMiddleware.bucket_for("/api/v1/github/users/bob"),
        )


if __name__ == "__main__":
    unittest.main()
