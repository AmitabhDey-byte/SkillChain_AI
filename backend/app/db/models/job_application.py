from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import Enum as SqlEnum, Index, JSON, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.base import Base
from backend.app.db.models.mixins import TimestampMixin


class ApplicationStatus(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    SHORTLISTED = "shortlisted"
    DECLINED = "declined"


class JobApplication(TimestampMixin, Base):
    __tablename__ = "job_applications"
    __table_args__ = (
        UniqueConstraint("job_id", "applicant_wallet", name="uq_job_applications_job_wallet"),
        Index("ix_job_applications_company_status", "company_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    job_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    company_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(160), nullable=False)
    job_title: Mapped[str] = mapped_column(String(180), nullable=False)
    applicant_wallet: Mapped[str] = mapped_column(String(56), nullable=False, index=True)
    applicant_name: Mapped[str] = mapped_column(String(120), nullable=False)
    applicant_headline: Mapped[str] = mapped_column(String(220), nullable=False)
    applicant_role: Mapped[str] = mapped_column(String(32), nullable=False)
    skills: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list, server_default="[]")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        SqlEnum(
            ApplicationStatus,
            name="application_status",
            native_enum=False,
            values_callable=lambda enum_type: [item.value for item in enum_type],
        ),
        nullable=False,
        default=ApplicationStatus.PENDING,
        server_default=ApplicationStatus.PENDING.value,
    )
