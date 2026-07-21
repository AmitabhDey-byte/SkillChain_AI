from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum as SqlEnum, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.base import Base
from backend.app.db.models.mixins import TimestampMixin


class NotificationType(str, Enum):
    APPLICATION_REVIEWING = "application_reviewing"
    APPLICATION_SHORTLISTED = "application_shortlisted"
    APPLICATION_DECLINED = "application_declined"


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_recipient_read", "recipient_wallet", "read_at"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    recipient_wallet: Mapped[str] = mapped_column(String(56), nullable=False, index=True)
    notification_type: Mapped[NotificationType] = mapped_column(
        SqlEnum(
            NotificationType,
            name="notification_type",
            native_enum=False,
            values_callable=lambda enum_type: [item.value for item in enum_type],
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    application_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True, index=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
