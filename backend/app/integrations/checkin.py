from datetime import UTC, datetime, timedelta
import hashlib
import secrets

from fastapi import Depends
import httpx
from stellar_sdk import Account, Keypair, Network, TransactionBuilder, TransactionEnvelope
from stellar_sdk.exceptions import BadSignatureError
from stellar_sdk.memo import TextMemo
from stellar_sdk.operation import ManageData

from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.schemas.activity import (
    CheckinFundResponse,
    CheckinPrepareRequest,
    CheckinPrepareResponse,
    CheckinReceiptResponse,
    CheckinSubmitRequest,
)


DATA_KEY = "skillchain_checkin"
ROLE_CODES = {
    "developer": "dev",
    "freelancer": "free",
    "student": "student",
    "recruiter": "recruiter",
}
CODE_ROLES = {code: role for role, code in ROLE_CODES.items()}


class StellarCheckinService:
    def __init__(self, horizon_url: str, friendbot_url: str, network: str, timeout_seconds: int) -> None:
        self.horizon_url = horizon_url.rstrip("/")
        self.friendbot_url = friendbot_url.rstrip("/")
        self.network = network
        self.timeout_seconds = timeout_seconds
        self.network_passphrase = (
            Network.TESTNET_NETWORK_PASSPHRASE
            if network == "testnet"
            else Network.PUBLIC_NETWORK_PASSPHRASE
        )

    @staticmethod
    def normalize_intent(intent: str) -> str:
        return " ".join(intent.strip().split())

    @classmethod
    def intent_digest(cls, intent: str) -> str:
        return hashlib.sha256(cls.normalize_intent(intent).encode()).hexdigest()[:12]

    @classmethod
    def build_marker(cls, role: str, intent: str, timestamp: int, nonce: str) -> str:
        return f"sc1|{ROLE_CODES[role]}|{timestamp}|{nonce}|{cls.intent_digest(intent)}"

    async def prepare(self, request: CheckinPrepareRequest) -> CheckinPrepareResponse:
        wallet_address = request.wallet_address.upper()
        intent = self.normalize_intent(request.intent)
        account_data = await self._load_account(wallet_address)
        timestamp = int(datetime.now(UTC).timestamp())
        marker = self.build_marker(request.role, intent, timestamp, secrets.token_hex(4))
        account = Account(wallet_address, int(account_data["sequence"]))
        transaction = (
            TransactionBuilder(account, self.network_passphrase, base_fee=100)
            .append_manage_data_op(DATA_KEY, marker.encode())
            .add_text_memo("SkillChain check-in")
            .set_timeout(180)
            .build()
        )
        expires_at = datetime.now(UTC) + timedelta(seconds=180)
        return CheckinPrepareResponse(
            transaction_xdr=transaction.to_xdr(),
            wallet_address=wallet_address,
            network=self.network,
            role=request.role,
            intent=intent,
            data_key=DATA_KEY,
            data_value=marker,
            estimated_fee_xlm="0.0000100",
            expires_at=expires_at,
        )

    async def submit(self, request: CheckinSubmitRequest) -> CheckinReceiptResponse:
        wallet_address = request.wallet_address.upper()
        intent = self.normalize_intent(request.intent)
        envelope, checked_in_at = self.validate_signed_transaction(
            request.signed_transaction_xdr,
            wallet_address,
            request.role,
            intent,
        )
        payload = await self._submit_transaction(request.signed_transaction_xdr)
        transaction_hash = str(payload.get("hash") or envelope.hash().hex())
        ledger_sequence = payload.get("ledger")
        if not isinstance(ledger_sequence, int):
            raise AppError("Stellar confirmed the check-in without a ledger reference.", "stellar_checkin_incomplete", 502)
        return CheckinReceiptResponse(
            wallet_address=wallet_address,
            role=request.role,
            intent=intent,
            network=self.network,
            transaction_hash=transaction_hash,
            ledger_sequence=ledger_sequence,
            checked_in_at=checked_in_at,
            explorer_url=f"https://stellar.expert/explorer/{self.network}/tx/{transaction_hash}",
        )

    async def fund(self, wallet_address: str) -> CheckinFundResponse:
        if self.network != "testnet":
            raise AppError("Automatic wallet funding is only available on Stellar testnet.", "friendbot_unavailable", 422)
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(self.friendbot_url, params={"addr": wallet_address.upper()})
        except httpx.RequestError as error:
            raise AppError("Stellar Friendbot is temporarily unavailable.", "friendbot_unavailable", 503) from error
        if response.status_code >= 400:
            if await self._account_exists(wallet_address.upper()):
                return CheckinFundResponse(
                    wallet_address=wallet_address.upper(),
                    network="testnet",
                    funded=True,
                    transaction_hash=None,
                )
            raise AppError("Friendbot could not fund this testnet wallet.", "friendbot_funding_failed", 502)
        payload = response.json()
        return CheckinFundResponse(
            wallet_address=wallet_address.upper(),
            network="testnet",
            funded=True,
            transaction_hash=payload.get("hash"),
        )

    def validate_signed_transaction(
        self,
        signed_xdr: str,
        wallet_address: str,
        role: str,
        intent: str,
    ) -> tuple[TransactionEnvelope, datetime]:
        try:
            envelope = TransactionEnvelope.from_xdr(signed_xdr, self.network_passphrase)
        except Exception as error:
            raise AppError("The signed Stellar transaction is invalid.", "stellar_checkin_invalid", 422) from error
        transaction = envelope.transaction
        if transaction.source.account_id.upper() != wallet_address.upper():
            raise AppError("The check-in transaction belongs to another wallet.", "stellar_checkin_wallet_mismatch", 403)
        time_bounds = transaction.preconditions.time_bounds
        if (
            transaction.fee != 100
            or not isinstance(transaction.memo, TextMemo)
            or transaction.memo.memo_text != b"SkillChain check-in"
            or time_bounds is None
        ):
            raise AppError("The check-in transaction settings were altered.", "stellar_checkin_blueprint_invalid", 422)
        if len(transaction.operations) != 1 or not isinstance(transaction.operations[0], ManageData):
            raise AppError("The check-in transaction contains an unsupported operation.", "stellar_checkin_operation_invalid", 422)
        operation = transaction.operations[0]
        if operation.source is not None or operation.data_name != DATA_KEY or operation.data_value is None:
            raise AppError("The check-in marker was altered.", "stellar_checkin_marker_invalid", 422)
        try:
            marker = operation.data_value.decode()
            version, role_code, raw_timestamp, nonce, intent_digest = marker.split("|")
            timestamp = int(raw_timestamp)
        except (UnicodeDecodeError, ValueError) as error:
            raise AppError("The check-in marker is malformed.", "stellar_checkin_marker_invalid", 422) from error
        if (
            version != "sc1"
            or CODE_ROLES.get(role_code) != role
            or len(nonce) != 8
            or self.intent_digest(intent) != intent_digest
        ):
            raise AppError("The check-in details do not match the signed transaction.", "stellar_checkin_details_mismatch", 422)
        now = int(datetime.now(UTC).timestamp())
        if timestamp > now + 60 or timestamp < now - 600:
            raise AppError("The check-in transaction has expired. Create a new one.", "stellar_checkin_expired", 422)
        if time_bounds.min_time != 0 or time_bounds.max_time < timestamp or time_bounds.max_time > timestamp + 300:
            raise AppError("The check-in transaction expiry was altered.", "stellar_checkin_blueprint_invalid", 422)
        if len(envelope.signatures) != 1:
            raise AppError("The check-in requires one wallet signature.", "stellar_checkin_signature_invalid", 422)
        try:
            Keypair.from_public_key(wallet_address).verify(envelope.hash(), envelope.signatures[0].signature)
        except (ValueError, BadSignatureError) as error:
            raise AppError("The wallet signature is invalid.", "stellar_checkin_signature_invalid", 401) from error
        return envelope, datetime.fromtimestamp(timestamp, UTC)

    async def _load_account(self, wallet_address: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(f"{self.horizon_url}/accounts/{wallet_address}")
        except httpx.RequestError as error:
            raise AppError("Stellar Horizon is temporarily unavailable.", "stellar_horizon_unavailable", 503) from error
        if response.status_code == 404:
            raise AppError(
                "This testnet wallet is not funded yet. Fund it once, then create your check-in.",
                "stellar_account_unfunded",
                422,
                {"friendbot_supported": self.network == "testnet"},
            )
        if response.status_code >= 400:
            raise AppError("Stellar could not load this wallet.", "stellar_account_unavailable", 502)
        return response.json()

    async def _account_exists(self, wallet_address: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(f"{self.horizon_url}/accounts/{wallet_address}")
        except httpx.RequestError:
            return False
        return response.status_code == 200

    async def _submit_transaction(self, signed_xdr: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(f"{self.horizon_url}/transactions", data={"tx": signed_xdr})
        except httpx.RequestError as error:
            raise AppError("Stellar Horizon could not submit the check-in.", "stellar_horizon_unavailable", 503) from error
        if response.status_code >= 400:
            payload = response.json()
            result_codes = payload.get("extras", {}).get("result_codes", {})
            raise AppError(
                "Stellar rejected the check-in transaction. Refresh it and sign again.",
                "stellar_checkin_rejected",
                422,
                {"result_codes": result_codes},
            )
        return response.json()


def get_stellar_checkin_service(settings: Settings = Depends(get_settings)) -> StellarCheckinService:
    return StellarCheckinService(
        horizon_url=settings.resolved_stellar_horizon_url,
        friendbot_url=settings.stellar_friendbot_url,
        network=settings.stellar_network,
        timeout_seconds=settings.stellar_transaction_timeout_seconds,
    )
