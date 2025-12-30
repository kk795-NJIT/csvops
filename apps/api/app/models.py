"""SQLAlchemy models"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PlanType(str, enum.Enum):
    """User plan types"""
    FREE = "free"
    PRO = "pro"
    TEAM = "team"


class OrgRole(str, enum.Enum):
    """Organization membership roles"""
    OWNER = "owner"
    MEMBER = "member"


class Organization(Base):
    """Organization for team features"""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members = relationship("OrgMembership", back_populates="organization", cascade="all, delete-orphan")
    shared_templates = relationship("Template", back_populates="organization")
    shared_presets = relationship("Preset", back_populates="organization")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")
    webhook_configs = relationship("WebhookConfig", back_populates="organization", cascade="all, delete-orphan")


class OrgMembership(Base):
    """User membership in an organization"""
    __tablename__ = "org_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role = Column(String(20), default=OrgRole.MEMBER.value, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="org_memberships")
    organization = relationship("Organization", back_populates="members")


class User(Base):
    """User with plan and usage tracking"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    
    # Password hash for simple auth (nullable for legacy users)
    password_hash = Column(String(255), nullable=True)
    
    # Plan (free, pro, or team)
    plan = Column(String(20), default=PlanType.FREE.value, nullable=False)
    
    # Usage limits for Free plan
    # Free: 10 files per month, 2 templates, 2 presets
    # Pro: unlimited + webhook
    # Team: Pro + shared templates/presets + audit log
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")
    presets = relationship("Preset", back_populates="user", cascade="all, delete-orphan")
    runs = relationship("Run", back_populates="user", cascade="all, delete-orphan")
    org_memberships = relationship("OrgMembership", back_populates="user", cascade="all, delete-orphan")
    webhook_configs = relationship("WebhookConfig", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class WebhookConfig(Base):
    """Webhook configuration for Pro/Team users"""
    __tablename__ = "webhook_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    
    name = Column(String(255), nullable=False)
    url = Column(String(2048), nullable=False)
    signing_secret = Column(String(255), nullable=True)  # HMAC secret for signature
    
    # Headers to include (JSON object)
    custom_headers = Column(JSON, nullable=True, default=dict)
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="webhook_configs")
    organization = relationship("Organization", back_populates="webhook_configs")
    template = relationship("Template", back_populates="webhook_configs")


class AuditLog(Base):
    """Audit log for Team tier - stores action metadata only"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    action = Column(String(100), nullable=False, index=True)  # e.g., "template.created", "preset.updated"
    resource_type = Column(String(50), nullable=True)  # e.g., "template", "preset", "webhook"
    resource_id = Column(Integer, nullable=True)
    
    # Details about the action (no raw data) - named 'details' to avoid SQLAlchemy reserved 'metadata'
    details = Column(JSON, nullable=True, default=dict)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    organization = relationship("Organization", back_populates="audit_logs")


class Template(Base):
    """Template for CSV import schema and mapping"""
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)  # For team sharing
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=True, unique=True, index=True)
    description = Column(String(1000), nullable=True)
    
    # Schema definition: list of {name, type, required}
    schema_json = Column(JSON, nullable=False, default=list)
    
    # Validation rules: custom rules beyond type validation
    rules_json = Column(JSON, nullable=True, default=dict)
    
    # Transform rules: {field: transform_type}
    transforms_json = Column(JSON, nullable=True, default=dict)
    
    # Legacy field (kept for compatibility)
    schema_fields = Column(JSON, nullable=True, default=list)
    mapping_presets = Column(JSON, nullable=True, default=dict)
    validation_rules = Column(JSON, nullable=True, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="templates")
    organization = relationship("Organization", back_populates="shared_templates")
    presets = relationship("Preset", back_populates="template", cascade="all, delete-orphan")
    runs = relationship("Run", back_populates="template", cascade="all, delete-orphan")
    webhook_configs = relationship("WebhookConfig", back_populates="template", cascade="all, delete-orphan")


class Preset(Base):
    """Reusable column mapping preset for a template"""
    __tablename__ = "presets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)  # For team sharing
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    name = Column(String(255), nullable=False, index=True)
    
    # Mapping: {source_column: target_field}
    mapping_json = Column(JSON, nullable=False, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="presets")
    organization = relationship("Organization", back_populates="shared_presets")
    template = relationship("Template", back_populates="presets")


class Run(Base):
    """Summary of a CSV import run (NO raw data stored)"""
    __tablename__ = "runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    preset_id = Column(Integer, ForeignKey("presets.id"), nullable=True)
    
    # File metadata (not the actual file)
    file_name = Column(String(255), nullable=False)
    
    # Run statistics
    total_rows = Column(Integer, nullable=False)
    valid_rows = Column(Integer, nullable=False)
    invalid_rows = Column(Integer, nullable=False)
    error_count = Column(Integer, nullable=False)
    duplicates_count = Column(Integer, nullable=True, default=0)
    
    # Summary of error types (e.g., {"email": 5, "required": 3})
    error_summary = Column(JSON, nullable=True, default=dict)
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="runs")
    template = relationship("Template", back_populates="runs")


# Plan limits - Sprint 3
PLAN_LIMITS = {
    PlanType.FREE.value: {
        "max_runs_per_month": 10,
        "max_templates": 2,
        "max_presets": 2,
        "webhook_enabled": False,
        "team_features": False,
    },
    PlanType.PRO.value: {
        "max_runs_per_month": float("inf"),
        "max_templates": float("inf"),
        "max_presets": float("inf"),
        "webhook_enabled": True,
        "team_features": False,
    },
    PlanType.TEAM.value: {
        "max_runs_per_month": float("inf"),
        "max_templates": float("inf"),
        "max_presets": float("inf"),
        "webhook_enabled": True,
        "team_features": True,
    },
}
