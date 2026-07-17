import hashlib
import hmac
import json

from fastapi import Depends
from stellar_sdk import Keypair, Network, scval
from stellar_sdk.contract import ContractClient
from stellar_sdk.exceptions import SdkError

from backend.app.core.attestation import sign_assessment
from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.schemas.credential import CredentialIssueRequest, CredentialIssueResponse, CredentialVerificationResponse


LEVEL_VARIANTS = {
    "beginner": "Beginner",
    "intermediate": "Intermediate",
    "advanced": "Advanced",
    "expert": "Expert",
}


class StellarCredentialService:
    def __init__(
        self,
        contract_id: str,
        rpc_url: str,
        network: str,
        issuer: Keypair | None,
        timeout_seconds: int,
        attestation_secret: str | None,
    ) -> None:
        self.contract_id = contract_id
        self.network = network
        self.issuer = issuer
        self.timeout_seconds = timeout_seconds
        self.attestation_secret = attestation_secret
        network_passphrase = Network.TESTNET_NETWORK_PASSPHRASE if network == "testnet" else Network.PUBLIC_NETWORK_PASSPHRASE
        self.client = ContractClient(contract_id, rpc_url, network_passphrase)

    @staticmethod
    def report_hash(request: CredentialIssueRequest) -> str:
        canonical_report = json.dumps(
            {
                "assessment": request.assessment.model_dump(mode="json"),
                "model": request.model,
                "repository_ids": sorted(request.repository_ids),
                "rubric_version": request.rubric_version,
            },
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
        return hashlib.sha256(canonical_report).hexdigest()

    @staticmethod
    def credential_id(wallet_address: str, report_hash: str) -> str:
        identity = b"skillchain-credential-v1\x00" + wallet_address.encode() + bytes.fromhex(report_hash)
        return hashlib.sha256(identity).hexdigest()

    def issue(self, request: CredentialIssueRequest) -> CredentialIssueResponse:
        if self.issuer is None:
            raise AppError("Stellar credential issuance is not configured.", "stellar_issuer_not_configured", 503)
        if self.attestation_secret is None:
            raise AppError("Credential attestations are not configured.", "credential_attestation_not_configured", 503)

        expected_attestation = sign_assessment(
            request.model,
            request.rubric_version,
            request.repository_ids,
            request.assessment.model_dump(mode="json"),
            self.attestation_secret,
        )
        if not hmac.compare_digest(request.attestation, expected_attestation):
            raise AppError("The AI assessment attestation is invalid.", "credential_attestation_invalid", 422)

        report_hash = self.report_hash(request)
        credential_id = self.credential_id(request.wallet_address, report_hash)
        parameters = [
            scval.to_bytes(bytes.fromhex(credential_id)),
            scval.to_address(request.wallet_address),
            scval.to_uint32(request.assessment.overall_score),
            scval.to_enum(LEVEL_VARIANTS[request.assessment.level.value], None),
            scval.to_bytes(bytes.fromhex(report_hash)),
        ]

        try:
            transaction = self.client.invoke(
                "issue",
                parameters,
                source=self.issuer.public_key,
                signer=self.issuer,
                transaction_timeout=self.timeout_seconds,
                submit_timeout=self.timeout_seconds,
            )
            transaction.sign_and_submit()
        except SdkError as error:
            raise AppError("Stellar rejected the credential issuance transaction.", "stellar_issuance_failed", 502) from error

        send_response = transaction.send_transaction_response
        get_response = transaction.get_transaction_response
        if send_response is None:
            raise AppError("Stellar did not return a transaction hash.", "stellar_issuance_incomplete", 502)

        return CredentialIssueResponse(
            credential_id=credential_id,
            report_hash=report_hash,
            owner=request.wallet_address,
            score=request.assessment.overall_score,
            level=request.assessment.level.value,
            transaction_hash=send_response.hash,
            ledger_sequence=get_response.ledger if get_response else None,
            contract_id=self.contract_id,
            network=self.network,
        )

    def verify(self, credential_id: str, owner: str) -> CredentialVerificationResponse:
        parameters = [
            scval.to_bytes(bytes.fromhex(credential_id)),
            scval.to_address(owner),
        ]

        try:
            transaction = self.client.invoke(
                "verify",
                parameters,
                parse_result_xdr_fn=scval.from_bool,
                transaction_timeout=self.timeout_seconds,
                submit_timeout=self.timeout_seconds,
            )
            active = transaction.result()
        except SdkError as error:
            raise AppError("Stellar credential verification is unavailable.", "stellar_verification_failed", 502) from error

        return CredentialVerificationResponse(
            credential_id=credential_id,
            owner=owner,
            active=active,
            contract_id=self.contract_id,
            network=self.network,
        )


def get_stellar_credential_service(settings: Settings = Depends(get_settings)) -> StellarCredentialService:
    if not settings.stellar_contract_id:
        raise AppError("The Stellar credential contract is not configured.", "stellar_contract_not_configured", 503)

    issuer = None
    if settings.stellar_issuer_secret and settings.stellar_issuer_secret.get_secret_value():
        try:
            issuer = Keypair.from_secret(settings.stellar_issuer_secret.get_secret_value())
        except ValueError as error:
            raise AppError("The Stellar issuer credentials are invalid.", "stellar_issuer_invalid", 503) from error

    return StellarCredentialService(
        contract_id=settings.stellar_contract_id,
        rpc_url=settings.stellar_rpc_url,
        network=settings.stellar_network,
        issuer=issuer,
        timeout_seconds=settings.stellar_transaction_timeout_seconds,
        attestation_secret=(
            settings.credential_attestation_secret.get_secret_value()
            if settings.credential_attestation_secret
            and len(settings.credential_attestation_secret.get_secret_value()) >= 32
            else None
        ),
    )
