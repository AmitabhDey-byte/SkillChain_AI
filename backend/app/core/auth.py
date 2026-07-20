import base64
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import json
from typing import Annotated, Any

from fastapi import Depends, Header
from pydantic import BaseModel, ValidationError
from stellar_sdk import Keypair
from stellar_sdk.exceptions import BadSignatureError

from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError


SIGNED_MESSAGE_PREFIX = "Stellar Signed Message:\n"


class SessionClaims(BaseModel):
    sub: str
    network: str
    wallet_type: str
    iss: str
    aud: str
    iat: int
    exp: int
    jti: str


@dataclass(frozen=True)
class WalletIdentity:
    wallet_address: str
    network: str
    wallet_type: str
    expires_at: datetime


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _base64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_session_token(
    wallet_address: str,
    network: str,
    wallet_type: str,
    settings: Settings,
    token_id: str,
) -> tuple[str, datetime]:
    issued_at = datetime.now(UTC)
    expires_at = issued_at + timedelta(minutes=settings.auth_token_minutes)
    header = {"alg": "HS256", "typ": "JWT"}
    claims = {
        "sub": wallet_address,
        "network": network,
        "wallet_type": wallet_type,
        "iss": "skillchain-ai",
        "aud": "skillchain-web",
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": token_id,
    }
    encoded_header = _base64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode())
    encoded_claims = _base64url_encode(json.dumps(claims, separators=(",", ":"), sort_keys=True).encode())
    signing_input = f"{encoded_header}.{encoded_claims}".encode()
    signature = hmac.new(settings.auth_session_secret.get_secret_value().encode(), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_claims}.{_base64url_encode(signature)}", expires_at


def decode_session_token(token: str, settings: Settings) -> WalletIdentity:
    try:
        encoded_header, encoded_claims, encoded_signature = token.split(".")
        header = json.loads(_base64url_decode(encoded_header))
        if header != {"alg": "HS256", "typ": "JWT"}:
            raise ValueError
        signing_input = f"{encoded_header}.{encoded_claims}".encode()
        expected = hmac.new(settings.auth_session_secret.get_secret_value().encode(), signing_input, hashlib.sha256).digest()
        supplied = _base64url_decode(encoded_signature)
        if not hmac.compare_digest(expected, supplied):
            raise ValueError
        claims = SessionClaims.model_validate_json(_base64url_decode(encoded_claims))
    except (ValueError, TypeError, json.JSONDecodeError, ValidationError) as error:
        raise AppError("The wallet session is invalid.", "auth_invalid", 401) from error

    now = int(datetime.now(UTC).timestamp())
    if claims.iss != "skillchain-ai" or claims.aud != "skillchain-web" or claims.exp <= now:
        raise AppError("The wallet session has expired.", "auth_expired", 401)
    return WalletIdentity(
        wallet_address=claims.sub,
        network=claims.network,
        wallet_type=claims.wallet_type,
        expires_at=datetime.fromtimestamp(claims.exp, UTC),
    )


def decode_wallet_signature(signature: str) -> bytes:
    normalized = signature.strip()
    try:
        decoded = base64.b64decode(normalized, validate=True)
        if len(decoded) == 64:
            return decoded
    except ValueError:
        pass
    try:
        decoded = bytes.fromhex(normalized)
        if len(decoded) == 64:
            return decoded
    except ValueError:
        pass
    raise AppError("The wallet signature is invalid.", "auth_signature_invalid", 401)


def verify_wallet_signature(wallet_address: str, message: str, signature: str) -> bool:
    try:
        keypair = Keypair.from_public_key(wallet_address)
    except ValueError:
        return False
    decoded_signature = decode_wallet_signature(signature)
    candidates = (
        hashlib.sha256(f"{SIGNED_MESSAGE_PREFIX}{message}".encode()).digest(),
        hashlib.sha256(f"{wallet_address}:{message}".encode()).digest(),
        message.encode(),
        hashlib.sha256(message.encode()).digest(),
    )
    for payload in candidates:
        try:
            keypair.verify(payload, decoded_signature)
            return True
        except BadSignatureError:
            continue
    return False


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, separator, token = authorization.partition(" ")
    if separator and scheme.lower() == "bearer" and token.strip():
        return token.strip()
    return None


def get_optional_identity(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    settings: Settings = Depends(get_settings),
) -> WalletIdentity | None:
    token = _extract_bearer(authorization)
    return decode_session_token(token, settings) if token else None


def require_wallet_identity(
    identity: WalletIdentity | None = Depends(get_optional_identity),
    settings: Settings = Depends(get_settings),
) -> WalletIdentity | None:
    if identity is None and settings.security_enforced:
        raise AppError("Connect and sign with your Stellar wallet to continue.", "auth_required", 401)
    return identity


def require_matching_wallet(identity: WalletIdentity | None, wallet_address: str) -> None:
    if identity and not hmac.compare_digest(identity.wallet_address.upper(), wallet_address.upper()):
        raise AppError("The wallet session does not own this request.", "auth_wallet_mismatch", 403)
