"""
CSV Import Copilot - Shared Pydantic Schemas

These schemas mirror the TypeScript types in types.ts
and are used for API validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


# =============================================================================
# CSV Schemas
# =============================================================================

class ColumnType(str, Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    UNKNOWN = "unknown"


class CSVColumn(BaseModel):
    name: str
    type: ColumnType
    nullable: bool
    sample_values: list[str] = Field(alias="sampleValues")

    class Config:
        populate_by_name = True


class ValidationSeverity(str, Enum):
    ERROR = "error"
    WARNING = "warning"


class CSVValidationError(BaseModel):
    row: int
    column: str
    message: str
    severity: ValidationSeverity


class CSVParseResult(BaseModel):
    headers: list[str]
    rows: list[list[str]]
    row_count: int = Field(alias="rowCount")
    column_count: int = Field(alias="columnCount")
    columns: list[CSVColumn]
    errors: list[CSVValidationError]
    parse_time_ms: float = Field(alias="parseTimeMs")

    class Config:
        populate_by_name = True


# =============================================================================
# Import Schemas
# =============================================================================

class ImportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CSVImportRequest(BaseModel):
    file_name: str = Field(alias="fileName")
    row_count: int = Field(alias="rowCount")
    column_count: int = Field(alias="columnCount")
    headers: list[str]

    class Config:
        populate_by_name = True


class CSVImportResponse(BaseModel):
    id: str
    status: ImportStatus
    message: str
    created_at: str = Field(alias="createdAt")

    class Config:
        populate_by_name = True


class Import(BaseModel):
    id: str
    file_name: str = Field(alias="fileName")
    row_count: int = Field(alias="rowCount")
    column_count: int = Field(alias="columnCount")
    status: ImportStatus
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

    class Config:
        populate_by_name = True


# =============================================================================
# Billing Schemas (Sprint 3)
# =============================================================================

class BillingPlan(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"


class StripeCheckoutRequest(BaseModel):
    price_id: str = Field(alias="priceId")
    success_url: str = Field(alias="successUrl")
    cancel_url: str = Field(alias="cancelUrl")

    class Config:
        populate_by_name = True


class StripeCheckoutResponse(BaseModel):
    checkout_url: str = Field(alias="checkoutUrl")
    session_id: str = Field(alias="sessionId")

    class Config:
        populate_by_name = True


class Subscription(BaseModel):
    id: str
    plan: BillingPlan
    status: SubscriptionStatus
    current_period_end: str = Field(alias="currentPeriodEnd")

    class Config:
        populate_by_name = True


# =============================================================================
# User Schemas (Future)
# =============================================================================

class User(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    plan: BillingPlan
    created_at: str = Field(alias="createdAt")

    class Config:
        populate_by_name = True
