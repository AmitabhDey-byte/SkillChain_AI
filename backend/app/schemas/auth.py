from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from backend.app.schemas.credential import WALLET_PATTERN


WalletType = Literal["freighter", "albedo"]


class AuthChallengeRequest(BaseModel):
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    network: Literal["testnet", "mainnet"] = "testnet"
    wallet_type: WalletType


class AuthChallengeResponse(BaseModel):
    challenge_id: UUID
    message: str
    expires_at: datetime


class AuthVerifyRequest(BaseModel):
    challenge_id: UUID
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    signature: str = Field(min_length=32, max_length=512)


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_at: datetime
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    network: str
    wallet_type: WalletType


class AuthIdentityResponse(BaseModel):
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    network: str
    wallet_type: WalletType
    expires_at: datetime
