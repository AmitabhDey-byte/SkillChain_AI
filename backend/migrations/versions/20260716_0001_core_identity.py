from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260716_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("wallet_address", sa.String(length=56), nullable=False),
        sa.Column("role", sa.Enum("talent", "freelancer", "recruiter", name="user_role", native_enum=False), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("headline", sa.String(length=220), nullable=False),
        sa.Column("location", sa.String(length=160), nullable=True),
        sa.Column("status", sa.Enum("active", "suspended", "deleted", name="user_status", native_enum=False), server_default="active", nullable=False),
        sa.Column("onboarding_complete", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("wallet_address", name=op.f("uq_users_wallet_address")),
    )
    op.create_index(op.f("ix_users_wallet_address"), "users", ["wallet_address"], unique=True)
    op.create_index("ix_users_wallet_status", "users", ["wallet_address", "status"], unique=False)

    op.create_table(
        "github_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("github_user_id", sa.BigInteger(), nullable=True),
        sa.Column("username", sa.String(length=39), nullable=False),
        sa.Column("profile_url", sa.String(length=300), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("access_token_encrypted", sa.String(length=1000), nullable=True),
        sa.Column("public_repositories", sa.Integer(), server_default="0", nullable=False),
        sa.Column("followers", sa.Integer(), server_default="0", nullable=False),
        sa.Column("profile_data", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_github_profiles_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_github_profiles")),
        sa.UniqueConstraint("github_user_id", name=op.f("uq_github_profiles_github_user_id")),
        sa.UniqueConstraint("user_id", name=op.f("uq_github_profiles_user_id")),
        sa.UniqueConstraint("username", name=op.f("uq_github_profiles_username")),
    )
    op.create_index(op.f("ix_github_profiles_user_id"), "github_profiles", ["user_id"], unique=True)
    op.create_index(op.f("ix_github_profiles_username"), "github_profiles", ["username"], unique=True)
    op.create_index("ix_github_profiles_username_synced", "github_profiles", ["username", "synced_at"], unique=False)

    op.create_table(
        "wallet_interactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("wallet_address", sa.String(length=56), nullable=False),
        sa.Column("interaction_type", sa.Enum("wallet_connected", "message_signed", "credential_issued", "credential_verified", "payment_funded", "payment_released", name="interaction_type", native_enum=False), nullable=False),
        sa.Column("network", sa.String(length=32), server_default="testnet", nullable=False),
        sa.Column("transaction_hash", sa.String(length=64), nullable=True),
        sa.Column("ledger_sequence", sa.BigInteger(), nullable=True),
        sa.Column("success", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("interaction_data", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_wallet_interactions_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_wallet_interactions")),
        sa.UniqueConstraint("transaction_hash", name=op.f("uq_wallet_interactions_transaction_hash")),
    )
    op.create_index(op.f("ix_wallet_interactions_user_id"), "wallet_interactions", ["user_id"], unique=False)
    op.create_index(op.f("ix_wallet_interactions_wallet_address"), "wallet_interactions", ["wallet_address"], unique=False)
    op.create_index("ix_wallet_interactions_wallet_created", "wallet_interactions", ["wallet_address", "created_at"], unique=False)
    op.create_index("ix_wallet_interactions_type_success", "wallet_interactions", ["interaction_type", "success"], unique=False)

    op.create_table(
        "feedback",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("wallet_address", sa.String(length=56), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=40), server_default="general", nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("page", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name=op.f("ck_feedback_rating_range")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_feedback_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_feedback")),
    )
    op.create_index(op.f("ix_feedback_user_id"), "feedback", ["user_id"], unique=False)
    op.create_index(op.f("ix_feedback_wallet_address"), "feedback", ["wallet_address"], unique=False)
    op.create_index("ix_feedback_rating_created", "feedback", ["rating", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_table("feedback")
    op.drop_table("wallet_interactions")
    op.drop_table("github_profiles")
    op.drop_table("users")
