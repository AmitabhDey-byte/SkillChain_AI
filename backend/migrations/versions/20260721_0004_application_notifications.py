from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260721_0004"
down_revision: str | None = "20260720_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("recipient_wallet", sa.String(length=56), nullable=False),
        sa.Column(
            "notification_type",
            sa.Enum(
                "application_reviewing",
                "application_shortlisted",
                "application_declined",
                name="notification_type",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
    )
    op.create_index(op.f("ix_notifications_recipient_wallet"), "notifications", ["recipient_wallet"], unique=False)
    op.create_index(op.f("ix_notifications_application_id"), "notifications", ["application_id"], unique=False)
    op.create_index("ix_notifications_recipient_read", "notifications", ["recipient_wallet", "read_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_notifications_recipient_read", table_name="notifications")
    op.drop_index(op.f("ix_notifications_application_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_recipient_wallet"), table_name="notifications")
    op.drop_table("notifications")
