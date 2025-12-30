/**
 * CSV Import Copilot - Shared Types
 * 
 * These types are used by both the frontend (TypeScript) and 
 * should mirror the Pydantic schemas in the backend.
 */

// =============================================================================
// CSV Types
// =============================================================================

export interface CSVColumn {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
    nullable: boolean;
    sampleValues: string[];
}

export interface CSVValidationError {
    row: number;
    column: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface CSVParseResult {
    headers: string[];
    rows: string[][];
    rowCount: number;
    columnCount: number;
    columns: CSVColumn[];
    errors: CSVValidationError[];
    parseTimeMs: number;
}

// =============================================================================
// Import Types
// =============================================================================

export interface CSVImportRequest {
    fileName: string;
    rowCount: number;
    columnCount: number;
    headers: string[];
}

export interface CSVImportResponse {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message: string;
    createdAt: string;
}

export interface Import {
    id: string;
    fileName: string;
    rowCount: number;
    columnCount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// API Types
// =============================================================================

export interface APIError {
    detail: string;
    status: number;
}

export interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
}

// =============================================================================
// Billing Types (Sprint 3)
// =============================================================================

export interface StripeCheckoutRequest {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
}

export interface StripeCheckoutResponse {
    checkoutUrl: string;
    sessionId: string;
}

export type BillingPlan = 'free' | 'pro' | 'enterprise';

export interface Subscription {
    id: string;
    plan: BillingPlan;
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: string;
}

// =============================================================================
// User Types (Future)
// =============================================================================

export interface User {
    id: string;
    email: string;
    name?: string;
    plan: BillingPlan;
    createdAt: string;
}
