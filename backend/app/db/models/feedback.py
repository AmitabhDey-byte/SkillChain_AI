from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base
from backend.app.db.models.mixins import TimestampMixin


class Feedback(TimestampMixin, Base):
    __tablename__ = "feedback"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="rating_range"),
        Index("ix_feedback_rating_created", "rating", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    wallet_address: Mapped[str | None] = mapped_column(String(56), index=True)
    rating: Mapped[int] = mapped_column(nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False, default="general", server_default="general")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    page: Mapped[str | None] = mapped_column(String(200))

    user: Mapped[User | None] = relationship(back_populates="feedback_entries")

