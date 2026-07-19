from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260719_0002"
down_revision: str | None = "20260716_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "job_applications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("job_id", sa.String(length=64), nullable=False),
        sa.Column("company_id", sa.String(length=64), nullable=False),
        sa.Column("company_name", sa.String(length=160), nullable=False),
        sa.Column("job_title", sa.String(length=180), nullable=False),
        sa.Column("applicant_wallet", sa.String(length=56), nullable=False),
        sa.Column("applicant_name", sa.String(length=120), nullable=False),
        sa.Column("applicant_headline", sa.String(length=220), nullable=False),
        sa.Column("applicant_role", sa.String(length=32), nullable=False),
        sa.Column("skills", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.Enum("pending", "reviewing", "shortlisted", "declined", name="application_status", native_enum=False), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_job_applications")),
        sa.UniqueConstraint("job_id", "applicant_wallet", name="uq_job_applications_job_wallet"),
    )
    op.create_index(op.f("ix_job_applications_job_id"), "job_applications", ["job_id"], unique=False)
    op.create_index(op.f("ix_job_applications_company_id"), "job_applications", ["company_id"], unique=False)
    op.create_index(op.f("ix_job_applications_applicant_wallet"), "job_applications", ["applicant_wallet"], unique=False)
    op.create_index("ix_job_applications_company_status", "job_applications", ["company_id", "status"], unique=False)


def downgrade() -> None:
    op.drop_table("job_applications")
