"""Sprint 3: Plans, Limits, Webhooks, Teams

Revision ID: 004_sprint3_plans
Revises: 003_sprint2_presets
Create Date: 2025-12-30

Adds:
- Organizations table for team features
- OrgMemberships table for team membership
- WebhookConfigs table for webhook configuration
- AuditLogs table for team audit logging
- organization_id to templates and presets for sharing
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '004_sprint3_plans'
down_revision = '003_sprint2_presets'
branch_labels = None
depends_on = None


def upgrade():
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    
    # Create org_memberships table
    op.create_table(
        'org_memberships',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='member'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    
    # Create webhook_configs table
    op.create_table(
        'webhook_configs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=True),
        sa.Column('template_id', sa.Integer(), sa.ForeignKey('templates.id'), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('url', sa.String(2048), nullable=False),
        sa.Column('signing_secret', sa.String(255), nullable=True),
        sa.Column('custom_headers', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=True),
        sa.Column('action', sa.String(100), nullable=False, index=True),
        sa.Column('resource_type', sa.String(50), nullable=True),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, index=True),
    )
    
    # Add organization_id to templates (for shared templates)
    with op.batch_alter_table('templates') as batch_op:
        batch_op.add_column(sa.Column('organization_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_templates_organization_id',
            'organizations',
            ['organization_id'],
            ['id']
        )
    
    # Add organization_id to presets (for shared presets)
    with op.batch_alter_table('presets') as batch_op:
        batch_op.add_column(sa.Column('organization_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_presets_organization_id',
            'organizations',
            ['organization_id'],
            ['id']
        )


def downgrade():
    # Remove organization_id from presets
    with op.batch_alter_table('presets') as batch_op:
        batch_op.drop_constraint('fk_presets_organization_id', type_='foreignkey')
        batch_op.drop_column('organization_id')
    
    # Remove organization_id from templates
    with op.batch_alter_table('templates') as batch_op:
        batch_op.drop_constraint('fk_templates_organization_id', type_='foreignkey')
        batch_op.drop_column('organization_id')
    
    # Drop tables in reverse order
    op.drop_table('audit_logs')
    op.drop_table('webhook_configs')
    op.drop_table('org_memberships')
    op.drop_table('organizations')
