"""Pydantic schemas for API request/response"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ============ Schema Field ============

class SchemaField(BaseModel):
    """A field in a template schema"""
    name: str
    type: str = Field(pattern="^(string|email|number|date|phone)$")
    required: bool = False


# ============ Template Schemas ============

class TemplateBase(BaseModel):
    """Base template schema"""
    name: str = Field(min_length=1, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    schema_fields: list[SchemaField] = Field(default=[], alias="schema_json")
    rules_json: Optional[dict] = {}
    transforms_json: Optional[dict] = {}
    organization_id: Optional[int] = None  # For team sharing

    model_config = {"populate_by_name": True}


class TemplateCreate(TemplateBase):
    """Schema for creating a template"""
    pass


class TemplateUpdate(BaseModel):
    """Schema for updating a template (all fields optional)"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    schema_fields: Optional[list[SchemaField]] = Field(default=None, alias="schema_json")
    rules_json: Optional[dict] = None
    transforms_json: Optional[dict] = None
    organization_id: Optional[int] = None

    model_config = {"populate_by_name": True}


class TemplateResponse(TemplateBase):
    """Schema for template response"""
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Preset Schemas ============

class PresetBase(BaseModel):
    """Base preset schema"""
    name: str = Field(min_length=1, max_length=255)
    template_id: Optional[int] = None
    mapping_json: dict[str, str] = {}
    organization_id: Optional[int] = None  # For team sharing


class PresetCreate(PresetBase):
    """Schema for creating a preset"""
    pass


class PresetUpdate(BaseModel):
    """Schema for updating a preset (all fields optional)"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    template_id: Optional[int] = None
    mapping_json: Optional[dict[str, str]] = None
    organization_id: Optional[int] = None


class PresetResponse(PresetBase):
    """Schema for preset response"""
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Run Schemas ============

class RunCreate(BaseModel):
    """Schema for creating a run summary"""
    template_id: Optional[int] = None
    preset_id: Optional[int] = None
    file_name: str = Field(min_length=1, max_length=255)
    total_rows: int = Field(ge=0)
    valid_rows: int = Field(ge=0)
    invalid_rows: int = Field(ge=0)
    error_count: int = Field(ge=0)
    duplicates_count: Optional[int] = Field(default=0, ge=0)
    error_summary: Optional[dict[str, int]] = {}
    duration_ms: Optional[int] = Field(default=None, ge=0)


class RunResponse(BaseModel):
    """Schema for run response"""
    id: int
    user_id: Optional[int] = None
    template_id: Optional[int]
    preset_id: Optional[int] = None
    file_name: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    error_count: int
    duplicates_count: Optional[int] = 0
    error_summary: Optional[dict[str, int]]
    started_at: datetime
    completed_at: Optional[datetime]
    duration_ms: Optional[int]

    class Config:
        from_attributes = True


# ============ Health Schemas ============

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "ok"
    version: str = "0.1.0"
    database: str = "connected"


# ============ User Schemas ============

class UserCreate(BaseModel):
    """Schema for creating a user"""
    email: str = Field(min_length=3, max_length=255)
    password: Optional[str] = Field(default=None, min_length=6, max_length=255)
    name: Optional[str] = Field(default=None, max_length=255)
    plan: str = Field(default="free", pattern="^(free|pro|team)$")


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    name: Optional[str]
    plan: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Auth Schemas ============

class LoginRequest(BaseModel):
    """Schema for login request"""
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class RegisterRequest(BaseModel):
    """Schema for registration"""
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=255)
    name: Optional[str] = Field(default=None, max_length=255)


class TokenResponse(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UsageLimits(BaseModel):
    """Usage limit flags"""
    can_create_run: bool
    can_create_template: bool
    can_create_preset: bool
    can_use_webhook: bool
    can_use_team_features: bool


class UsageStats(BaseModel):
    """Current usage statistics"""
    runs_this_month: int
    max_runs_per_month: int  # -1 means unlimited
    templates: int
    max_templates: int  # -1 means unlimited
    presets: int
    max_presets: int  # -1 means unlimited


class UsageResponse(BaseModel):
    """Full usage response"""
    user_id: int
    email: str
    plan: str
    usage: UsageStats
    limits: UsageLimits


# ============ Organization Schemas ============

class OrganizationCreate(BaseModel):
    """Schema for creating an organization"""
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255, pattern="^[a-z0-9-]+$")


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)


class OrgMemberResponse(BaseModel):
    """Schema for org member response"""
    id: int
    user_id: int
    email: str
    name: Optional[str]
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationResponse(BaseModel):
    """Schema for organization response"""
    id: int
    name: str
    slug: str
    members: List[OrgMemberResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrgInviteRequest(BaseModel):
    """Schema for inviting a user to an organization"""
    email: str = Field(min_length=3, max_length=255)
    role: str = Field(default="member", pattern="^(owner|member)$")


# ============ Webhook Schemas ============

class WebhookConfigCreate(BaseModel):
    """Schema for creating a webhook config"""
    name: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=1, max_length=2048)
    template_id: Optional[int] = None
    signing_secret: Optional[str] = Field(default=None, max_length=255)
    custom_headers: Optional[dict] = {}


class WebhookConfigUpdate(BaseModel):
    """Schema for updating a webhook config"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    url: Optional[str] = Field(default=None, min_length=1, max_length=2048)
    signing_secret: Optional[str] = Field(default=None, max_length=255)
    custom_headers: Optional[dict] = None
    is_active: Optional[bool] = None


class WebhookConfigResponse(BaseModel):
    """Schema for webhook config response"""
    id: int
    user_id: int
    organization_id: Optional[int]
    template_id: Optional[int]
    name: str
    url: str
    has_signing_secret: bool  # Don't expose actual secret
    custom_headers: Optional[dict]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebhookSendRequest(BaseModel):
    """Schema for sending data to a webhook"""
    webhook_id: Optional[int] = None  # Use saved webhook config
    url: Optional[str] = None  # Or provide URL directly (Pro only)
    data: List[dict]  # The rows to send (already transformed)
    include_metadata: bool = True
    file_name: Optional[str] = None


class WebhookSendResponse(BaseModel):
    """Schema for webhook send response"""
    success: bool
    message: str
    status_code: Optional[int] = None


# ============ Audit Log Schemas ============

class AuditLogResponse(BaseModel):
    """Schema for audit log entry response"""
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    organization_id: Optional[int]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[int]
    details: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit log list"""
    items: List[AuditLogResponse]
    total: int
    page: int
    per_page: int

