from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260720_0003"
down_revision: str | None = "20260719_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "auth_challenges",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("wallet_address", sa.String(length=56), nullable=False),
        sa.Column("network", sa.String(length=32), nullable=False),
        sa.Column("wallet_type", sa.String(length=32), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_auth_challenges")),
    )
    op.create_index(op.f("ix_auth_challenges_wallet_address"), "auth_challenges", ["wallet_address"], unique=False)
    op.create_index("ix_auth_challenges_wallet_expires", "auth_challenges", ["wallet_address", "expires_at"], unique=False)
    op.create_index("ix_auth_challenges_consumed_expires", "auth_challenges", ["consumed_at", "expires_at"], unique=False)
    op.add_column("users", sa.Column("organization", sa.String(length=160), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("github_username", sa.String(length=39), nullable=True))
    op.add_column("users", sa.Column("skills", sa.JSON(), server_default="[]", nullable=False))
    op.create_index(op.f("ix_users_github_username"), "users", ["github_username"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_github_username"), table_name="users")
    op.drop_column("users", "skills")
    op.drop_column("users", "github_username")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "bio")
    op.drop_column("users", "organization")
    op.drop_table("auth_challenges")
