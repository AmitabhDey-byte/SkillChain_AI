from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base
from backend.app.db.models.mixins import TimestampMixin


class GithubProfile(TimestampMixin, Base):
    __tablename__ = "github_profiles"
    __table_args__ = (Index("ix_github_profiles_username_synced", "username", "synced_at"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    github_user_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)
    username: Mapped[str] = mapped_column(String(39), nullable=False, unique=True, index=True)
    profile_url: Mapped[str] = mapped_column(String(300), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    access_token_encrypted: Mapped[str | None] = mapped_column(String(1000))
    public_repositories: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    followers: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    profile_data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict, server_default="{}")
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="github_profile")

