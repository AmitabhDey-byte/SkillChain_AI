from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from backend.app.schemas.credential import WALLET_PATTERN


class WalletConnectionRequest(BaseModel):
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    network: str = Field(min_length=1, max_length=32)


class ActivityAcceptedResponse(BaseModel):
    accepted: bool


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
