/**
 * API Client for Ops CSV Cleaner Backend
 * With JWT auth and user tracking
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// JWT Token storage
const TOKEN_KEY = 'ops_csv_cleaner_token'

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
}

// Legacy user ID support (for migration)
const USER_ID_KEY = 'csv_copilot_user_id'

export function getUserId(): number | null {
    const stored = localStorage.getItem(USER_ID_KEY)
    return stored ? parseInt(stored, 10) : null
}

export function setUserId(id: number): void {
    localStorage.setItem(USER_ID_KEY, id.toString())
}

export function clearUserId(): void {
    localStorage.removeItem(USER_ID_KEY)
}

interface ApiError {
    detail: string
}

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }
        const token = getToken()
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        return headers
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        })

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                detail: `HTTP ${response.status}: ${response.statusText}`,
            }))
            throw new Error(error.detail)
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return null as T
        }

        return response.json()
    }

    // Health check
    async health(): Promise<{ status: string; version: string; database: string }> {
        return this.request('/health')
    }

    // Auth
    async login(email: string, password: string): Promise<TokenResponse> {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        })
    }

    async register(email: string, password: string, name?: string): Promise<TokenResponse> {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        })
    }

    async devLogin(): Promise<TokenResponse> {
        return this.request('/auth/dev-login', {
            method: 'POST',
        })
    }

    async getMe(): Promise<UserResponse> {
        return this.request('/auth/me')
    }

    // Users
    async getMyUsage(): Promise<UsageResponse> {
        return this.request('/users/me/usage')
    }

    async createUser(email: string, name?: string): Promise<UserResponse> {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify({ email, name, plan: 'free' }),
        })
    }

    async upgradeUser(userId: number): Promise<UserResponse> {
        return this.request(`/users/${userId}/plan?plan=pro`, {
            method: 'PATCH',
        })
    }

    // Templates
    async listTemplates(): Promise<Template[]> {
        return this.request('/templates')
    }

    async getTemplate(id: number): Promise<Template> {
        return this.request(`/templates/${id}`)
    }

    async createTemplate(template: CreateTemplateRequest): Promise<Template> {
        return this.request('/templates', {
            method: 'POST',
            body: JSON.stringify(template),
        })
    }

    async updateTemplate(id: number, template: Partial<CreateTemplateRequest>): Promise<Template> {
        return this.request(`/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(template),
        })
    }

    async deleteTemplate(id: number): Promise<void> {
        return this.request(`/templates/${id}`, {
            method: 'DELETE',
        })
    }

    // Presets
    async listPresets(templateId?: number): Promise<Preset[]> {
        const query = templateId ? `?template_id=${templateId}` : ''
        return this.request(`/presets${query}`)
    }

    async getPreset(id: number): Promise<Preset> {
        return this.request(`/presets/${id}`)
    }

    async createPreset(preset: CreatePresetRequest): Promise<Preset> {
        return this.request('/presets', {
            method: 'POST',
            body: JSON.stringify(preset),
        })
    }

    async updatePreset(id: number, preset: Partial<CreatePresetRequest>): Promise<Preset> {
        return this.request(`/presets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(preset),
        })
    }

    async deletePreset(id: number): Promise<void> {
        return this.request(`/presets/${id}`, {
            method: 'DELETE',
        })
    }

    // Runs
    async listRuns(templateId?: number): Promise<RunSummary[]> {
        const query = templateId ? `?template_id=${templateId}` : ''
        return this.request(`/runs${query}`)
    }

    async createRun(run: CreateRunRequest): Promise<RunSummary> {
        return this.request('/runs', {
            method: 'POST',
            body: JSON.stringify(run),
        })
    }

    // Webhooks (Pro/Team only)
    async listWebhooks(templateId?: number): Promise<WebhookConfig[]> {
        const query = templateId ? `?template_id=${templateId}` : ''
        return this.request(`/webhooks${query}`)
    }

    async getWebhook(id: number): Promise<WebhookConfig> {
        return this.request(`/webhooks/${id}`)
    }

    async createWebhook(webhook: CreateWebhookRequest): Promise<WebhookConfig> {
        return this.request('/webhooks', {
            method: 'POST',
            body: JSON.stringify(webhook),
        })
    }

    async updateWebhook(id: number, webhook: Partial<CreateWebhookRequest>): Promise<WebhookConfig> {
        return this.request(`/webhooks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(webhook),
        })
    }

    async deleteWebhook(id: number): Promise<void> {
        return this.request(`/webhooks/${id}`, {
            method: 'DELETE',
        })
    }

    async sendToWebhook(payload: WebhookSendRequest): Promise<WebhookSendResponse> {
        return this.request('/webhooks/send', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    }

    // Organizations (Team only)
    async listOrganizations(): Promise<Organization[]> {
        return this.request('/orgs')
    }

    async getOrganization(id: number): Promise<Organization> {
        return this.request(`/orgs/${id}`)
    }

    async createOrganization(org: CreateOrgRequest): Promise<Organization> {
        return this.request('/orgs', {
            method: 'POST',
            body: JSON.stringify(org),
        })
    }

    async inviteMember(orgId: number, email: string, role: 'owner' | 'member' = 'member'): Promise<OrgMember> {
        return this.request(`/orgs/${orgId}/invite`, {
            method: 'POST',
            body: JSON.stringify({ email, role }),
        })
    }

    async removeMember(orgId: number, userId: number): Promise<void> {
        return this.request(`/orgs/${orgId}/members/${userId}`, {
            method: 'DELETE',
        })
    }

    // Audit logs (Team only)
    async listAuditLogs(params?: AuditLogParams): Promise<AuditLogListResponse> {
        const query = new URLSearchParams()
        if (params?.organizationId) query.append('organization_id', params.organizationId.toString())
        if (params?.action) query.append('action', params.action)
        if (params?.resourceType) query.append('resource_type', params.resourceType)
        if (params?.page) query.append('page', params.page.toString())
        if (params?.perPage) query.append('per_page', params.perPage.toString())
        
        const queryStr = query.toString()
        return this.request(`/audit${queryStr ? '?' + queryStr : ''}`)
    }
}

// Types
export interface SchemaField {
    name: string
    type: 'string' | 'email' | 'number' | 'date' | 'phone'
    required: boolean
}

export interface Template {
    id: number
    user_id: number | null
    name: string
    slug: string | null
    description: string | null
    schema_json: SchemaField[]
    rules_json: Record<string, unknown>
    transforms_json: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface CreateTemplateRequest {
    name: string
    slug?: string
    description?: string
    schema_json: SchemaField[]
    rules_json?: Record<string, unknown>
    transforms_json?: Record<string, unknown>
}

export interface Preset {
    id: number
    user_id: number | null
    template_id: number | null
    name: string
    mapping_json: Record<string, string>
    created_at: string
    updated_at: string
}

export interface CreatePresetRequest {
    name: string
    template_id?: number
    mapping_json: Record<string, string>
}

export interface RunSummary {
    id: number
    user_id: number | null
    template_id: number | null
    preset_id: number | null
    file_name: string
    total_rows: number
    valid_rows: number
    invalid_rows: number
    error_count: number
    duplicates_count: number
    error_summary: Record<string, number>
    started_at: string
    completed_at: string | null
    duration_ms: number | null
}

export interface CreateRunRequest {
    template_id?: number
    preset_id?: number
    file_name: string
    total_rows: number
    valid_rows: number
    invalid_rows: number
    error_count: number
    duplicates_count?: number
    error_summary?: Record<string, number>
    duration_ms?: number
}

export interface TokenResponse {
    access_token: string
    token_type: string
    user: UserResponse
}

export interface UserResponse {
    id: number
    email: string
    name: string | null
    plan: 'free' | 'pro' | 'team'
    created_at: string
    updated_at: string
}

export interface UsageStats {
    runs_this_month: number
    max_runs_per_month: number  // -1 means unlimited
    templates: number
    max_templates: number  // -1 means unlimited
    presets: number
    max_presets: number  // -1 means unlimited
}

export interface UsageLimits {
    can_create_run: boolean
    can_create_template: boolean
    can_create_preset: boolean
    can_use_webhook: boolean
    can_use_team_features: boolean
}

export interface UsageResponse {
    user_id: number
    email: string
    plan: 'free' | 'pro' | 'team'
    usage: UsageStats
    limits: UsageLimits
}

// Webhook types
export interface WebhookConfig {
    id: number
    user_id: number
    organization_id: number | null
    template_id: number | null
    name: string
    url: string
    has_signing_secret: boolean
    custom_headers: Record<string, string> | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CreateWebhookRequest {
    name: string
    url: string
    template_id?: number
    signing_secret?: string
    custom_headers?: Record<string, string>
}

export interface WebhookSendRequest {
    webhook_id?: number
    url?: string
    data: Record<string, unknown>[]
    include_metadata?: boolean
    file_name?: string
}

export interface WebhookSendResponse {
    success: boolean
    message: string
    status_code?: number
}

// Organization types
export interface OrgMember {
    id: number
    user_id: number
    email: string
    name: string | null
    role: 'owner' | 'member'
    created_at: string
}

export interface Organization {
    id: number
    name: string
    slug: string
    members: OrgMember[]
    created_at: string
    updated_at: string
}

export interface CreateOrgRequest {
    name: string
    slug: string
}

// Audit log types
export interface AuditLogEntry {
    id: number
    user_id: number | null
    user_email: string | null
    organization_id: number | null
    action: string
    resource_type: string | null
    resource_id: number | null
    details: Record<string, unknown> | null
    ip_address: string | null
    created_at: string
}

export interface AuditLogListResponse {
    items: AuditLogEntry[]
    total: number
    page: number
    per_page: number
}

export interface AuditLogParams {
    organizationId?: number
    action?: string
    resourceType?: string
    page?: number
    perPage?: number
}

// Export singleton instance
export const api = new ApiClient()

export default api
