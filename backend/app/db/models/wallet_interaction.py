from __future__ import annotations

from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, Boolean, Enum as SqlEnum, ForeignKey, Index, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base
from backend.app.db.models.mixins import TimestampMixin


class InteractionType(str, Enum):
    WALLET_CONNECTED = "wallet_connected"
    MESSAGE_SIGNED = "message_signed"
    CREDENTIAL_ISSUED = "credential_issued"
    CREDENTIAL_VERIFIED = "credential_verified"
    PAYMENT_FUNDED = "payment_funded"
    PAYMENT_RELEASED = "payment_released"


class WalletInteraction(TimestampMixin, Base):
    __tablename__ = "wallet_interactions"
    __table_args__ = (
        Index("ix_wallet_interactions_wallet_created", "wallet_address", "created_at"),
        Index("ix_wallet_interactions_type_success", "interaction_type", "success"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    wallet_address: Mapped[str] = mapped_column(String(56), nullable=False, index=True)
    interaction_type: Mapped[InteractionType] = mapped_column(
        SqlEnum(InteractionType, name="interaction_type", native_enum=False, values_callable=lambda enum_type: [item.value for item in enum_type]),
        nullable=False,
    )
    network: Mapped[str] = mapped_column(String(32), nullable=False, default="testnet", server_default="testnet")
    transaction_hash: Mapped[str | None] = mapped_column(String(64), unique=True)
    ledger_sequence: Mapped[int | None] = mapped_column(BigInteger)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    interaction_data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict, server_default="{}")

    user: Mapped[User | None] = relationship(back_populates="wallet_interactions")
