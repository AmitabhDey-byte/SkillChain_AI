from __future__ import annotations

from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Enum as SqlEnum, Index, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base
from backend.app.db.models.mixins import TimestampMixin


class UserRole(str, Enum):
    TALENT = "talent"
    FREELANCER = "freelancer"
    RECRUITER = "recruiter"


class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_wallet_status", "wallet_address", "status"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    wallet_address: Mapped[str] = mapped_column(String(56), nullable=False, unique=True, index=True)
    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole, name="user_role", native_enum=False, values_callable=lambda enum_type: [item.value for item in enum_type]),
        nullable=False,
    )
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    headline: Mapped[str] = mapped_column(String(220), nullable=False)
    location: Mapped[str | None] = mapped_column(String(160))
    organization: Mapped[str | None] = mapped_column(String(160))
    bio: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    github_username: Mapped[str | None] = mapped_column(String(39), index=True)
    skills: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list, server_default="[]")
    status: Mapped[UserStatus] = mapped_column(
        SqlEnum(UserStatus, name="user_status", native_enum=False, values_callable=lambda enum_type: [item.value for item in enum_type]),
        nullable=False,
        default=UserStatus.ACTIVE,
        server_default=UserStatus.ACTIVE.value,
    )
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    github_profile: Mapped[GithubProfile | None] = relationship(back_populates="user", cascade="all, delete-orphan", single_parent=True, uselist=False)
    wallet_interactions: Mapped[list[WalletInteraction]] = relationship(back_populates="user")
    feedback_entries: Mapped[list[Feedback]] = relationship(back_populates="user")
