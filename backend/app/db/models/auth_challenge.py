from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.base import Base
from backend.app.db.models.mixins import TimestampMixin


class AuthChallenge(TimestampMixin, Base):
    __tablename__ = "auth_challenges"
    __table_args__ = (
        Index("ix_auth_challenges_wallet_expires", "wallet_address", "expires_at"),
        Index("ix_auth_challenges_consumed_expires", "consumed_at", "expires_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    wallet_address: Mapped[str] = mapped_column(String(56), nullable=False, index=True)
    network: Mapped[str] = mapped_column(String(32), nullable=False)
    wallet_type: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
