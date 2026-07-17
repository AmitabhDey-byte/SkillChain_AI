from typing import Annotated

from pydantic import BaseModel, Field, model_validator

from backend.app.schemas.assessment import SkillAssessment


WALLET_PATTERN = r"^G[A-Z2-7]{55}$"
HASH_PATTERN = r"^[a-f0-9]{64}$"
RepositoryId = Annotated[int, Field(gt=0)]


class CredentialIssueRequest(BaseModel):
    wallet_address: str = Field(pattern=WALLET_PATTERN)
    model: str = Field(min_length=1, max_length=100)
    rubric_version: str = Field(min_length=1, max_length=100)
    repository_ids: list[RepositoryId] = Field(min_length=1, max_length=5)
    assessment: SkillAssessment
    attestation: str = Field(pattern=HASH_PATTERN)

    @model_validator(mode="after")
    def validate_unique_repositories(self) -> "CredentialIssueRequest":
        if len(self.repository_ids) != len(set(self.repository_ids)):
            raise ValueError("Repository IDs must be unique.")
        return self


class CredentialIssueResponse(BaseModel):
    credential_id: str = Field(pattern=HASH_PATTERN)
    report_hash: str = Field(pattern=HASH_PATTERN)
    owner: str = Field(pattern=WALLET_PATTERN)
    score: int = Field(ge=0, le=100)
    level: str
    transaction_hash: str
    ledger_sequence: int | None = None
    contract_id: str
    network: str


class CredentialVerificationResponse(BaseModel):
    credential_id: str = Field(pattern=HASH_PATTERN)
    owner: str = Field(pattern=WALLET_PATTERN)
    active: bool
    contract_id: str
    network: str
