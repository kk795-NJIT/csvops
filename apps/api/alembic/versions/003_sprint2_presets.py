"""Add presets table and update templates/runs for Sprint 2

Revision ID: 003_sprint2_presets
Revises: 002_add_users
Create Date: 2024-12-30

Adds:
- presets table for reusable column mappings
- password_hash to users for auth
- slug, schema_json, rules_json, transforms_json to templates
- preset_id and duplicates_count to runs
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003_sprint2_presets"
down_revision: Union[str, None] = "002_add_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add password_hash to users
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("password_hash", sa.String(length=255), nullable=True))

    # Add new columns to templates
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.add_column(sa.Column("slug", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("schema_json", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("rules_json", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("transforms_json", sa.JSON(), nullable=True))
        batch_op.create_index("ix_templates_slug", ["slug"], unique=True)

    # Create presets table
    op.create_table(
        "presets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("template_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("mapping_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["template_id"], ["templates.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_presets_id"), "presets", ["id"], unique=False)
    op.create_index(op.f("ix_presets_name"), "presets", ["name"], unique=False)

    # Add preset_id and duplicates_count to runs
    with op.batch_alter_table("runs", schema=None) as batch_op:
        batch_op.add_column(sa.Column("preset_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("duplicates_count", sa.Integer(), nullable=True, server_default="0"))
        batch_op.create_foreign_key("fk_runs_preset_id", "presets", ["preset_id"], ["id"])


def downgrade() -> None:
    # Remove preset_id and duplicates_count from runs
    with op.batch_alter_table("runs", schema=None) as batch_op:
        batch_op.drop_constraint("fk_runs_preset_id", type_="foreignkey")
        batch_op.drop_column("duplicates_count")
        batch_op.drop_column("preset_id")

    # Drop presets table
    op.drop_index(op.f("ix_presets_name"), table_name="presets")
    op.drop_index(op.f("ix_presets_id"), table_name="presets")
    op.drop_table("presets")

    # Remove new columns from templates
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.drop_index("ix_templates_slug")
        batch_op.drop_column("transforms_json")
        batch_op.drop_column("rules_json")
        batch_op.drop_column("schema_json")
        batch_op.drop_column("slug")

    # Remove password_hash from users
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("password_hash")
