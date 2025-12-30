"""Add users table and user_id to templates and runs

Revision ID: 002_add_users
Revises: 001_initial
Create Date: 2024-12-30

Uses batch mode for SQLite FK support.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002_add_users"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("plan", sa.String(length=20), nullable=False, server_default="free"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # Add user_id to templates using batch mode (SQLite FK support)
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_templates_user_id", "users", ["user_id"], ["id"])

    # Add user_id to runs using batch mode
    with op.batch_alter_table("runs", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_runs_user_id", "users", ["user_id"], ["id"])


def downgrade() -> None:
    # Remove foreign keys using batch mode
    with op.batch_alter_table("runs", schema=None) as batch_op:
        batch_op.drop_constraint("fk_runs_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")
    
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.drop_constraint("fk_templates_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")

    # Drop users table
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
