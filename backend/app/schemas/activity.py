from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from backend.app.schemas.credential import WALLET_PATTERN


class WalletConnectionRequest(BaseModel):
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    network: str = Field(min_length=1, max_length=32)


class ActivityAcceptedResponse(BaseModel):
    accepted: bool


CheckinRole = Literal["developer", "freelancer", "student", "recruiter"]


class CheckinPrepareRequest(BaseModel):
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    role: CheckinRole
    intent: str = Field(min_length=3, max_length=40)


class CheckinPrepareResponse(BaseModel):
    transaction_xdr: str
    wallet_address: str
    network: str
    role: CheckinRole
    intent: str
    data_key: str
    data_value: str
    estimated_fee_xlm: str
    expires_at: datetime


class CheckinSubmitRequest(BaseModel):
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    role: CheckinRole
    intent: str = Field(min_length=3, max_length=40)
    signed_transaction_xdr: str = Field(min_length=40, max_length=20_000)


class CheckinReceiptResponse(BaseModel):
    wallet_address: str
    role: CheckinRole
    intent: str
    network: str
    transaction_hash: str
    ledger_sequence: int
    checked_in_at: datetime
    explorer_url: str


class CheckinFundRequest(BaseModel):
    wallet_address: str = Field(pattern=WALLET_PATTERN)


class CheckinFundResponse(BaseModel):
    wallet_address: str
    network: Literal["testnet"]
    funded: bool
    transaction_hash: str | None


class AdminActivityItem(BaseModel):
    id: str
    wallet_address: str
    interaction_type: str
    network: str
    transaction_hash: str | None
    ledger_sequence: int | None
    success: bool
    interaction_data: dict[str, Any]
    created_at: datetime


class AdminOverviewResponse(BaseModel):
    unique_wallets: int
    wallet_connections: int
    credentials_issued: int
    credentials_verified: int
    recent_activity: list[AdminActivityItem]
    recent_transactions: list[AdminActivityItem]


class AdminUserItem(BaseModel):
    id: str
    wallet_address: str
    role: str
    display_name: str
    headline: str
    location: str | None
    organization: str | None
    avatar_url: str | None
    github_username: str | None
    skills: list[str]
    onboarding_complete: bool
    created_at: datetime


class AdminUserDirectoryResponse(BaseModel):
    total: int
    users: list[AdminUserItem]
