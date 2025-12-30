/**
 * Template Registry for Ops CSV Cleaner
 * Focused on CRM/Marketing/E-commerce imports for SMB Ops teams
 */

export interface TemplateField {
    name: string
    type: 'string' | 'email' | 'number' | 'date'
    required: boolean
    description?: string
}

export interface RecommendedTransform {
    field: string
    transform: string
    description: string
}

export interface ImportTemplate {
    id: string
    slug: string
    name: string
    description: string
    icon: string
    platform: string
    sampleFile: string
    schema: TemplateField[]
    recommendedTransforms: RecommendedTransform[]
    tags: string[]
}

export const TEMPLATES: ImportTemplate[] = [
    {
        id: 'hubspot-contacts',
        slug: 'hubspot-contacts',
        name: 'HubSpot Contacts',
        description: 'Import contacts into HubSpot CRM. Maps to HubSpot\'s standard contact properties.',
        icon: '🟠',
        platform: 'HubSpot',
        sampleFile: '/samples/hubspot-contacts.csv',
        tags: ['hubspot', 'crm', 'contacts', 'sales'],
        schema: [
            { name: 'email', type: 'email', required: true, description: 'Contact email (required by HubSpot)' },
            { name: 'firstname', type: 'string', required: false, description: 'First name' },
            { name: 'lastname', type: 'string', required: false, description: 'Last name' },
            { name: 'company', type: 'string', required: false, description: 'Company name' },
            { name: 'phone', type: 'string', required: false, description: 'Phone number' },
            { name: 'jobtitle', type: 'string', required: false, description: 'Job title' },
            { name: 'lifecyclestage', type: 'string', required: false, description: 'lead, subscriber, opportunity, customer' },
        ],
        recommendedTransforms: [
            { field: 'email', transform: 'lowercase', description: 'Normalize email to lowercase' },
            { field: 'phone', transform: 'phone_format', description: 'Format phone to E.164' },
        ],
    },
    {
        id: 'salesforce-leads',
        slug: 'salesforce-leads',
        name: 'Salesforce Leads',
        description: 'Import leads into Salesforce. Matches Salesforce Lead object fields.',
        icon: '☁️',
        platform: 'Salesforce',
        sampleFile: '/samples/salesforce-leads.csv',
        tags: ['salesforce', 'crm', 'leads', 'sales'],
        schema: [
            { name: 'Email', type: 'email', required: true, description: 'Lead email address' },
            { name: 'FirstName', type: 'string', required: false, description: 'First name' },
            { name: 'LastName', type: 'string', required: true, description: 'Last name (required)' },
            { name: 'Company', type: 'string', required: true, description: 'Company name (required)' },
            { name: 'Title', type: 'string', required: false, description: 'Job title' },
            { name: 'Phone', type: 'string', required: false, description: 'Phone number' },
            { name: 'LeadSource', type: 'string', required: false, description: 'Web, Referral, Partner, etc.' },
            { name: 'Status', type: 'string', required: false, description: 'Open, Contacted, Qualified' },
        ],
        recommendedTransforms: [
            { field: 'Email', transform: 'lowercase', description: 'Normalize email' },
            { field: 'Status', transform: 'capitalize', description: 'Capitalize status' },
        ],
    },
    {
        id: 'shopify-products',
        slug: 'shopify-products',
        name: 'Shopify Products',
        description: 'Import products into Shopify. Follows Shopify\'s CSV import format.',
        icon: '🛍️',
        platform: 'Shopify',
        sampleFile: '/samples/shopify-products.csv',
        tags: ['shopify', 'ecommerce', 'products', 'inventory'],
        schema: [
            { name: 'Handle', type: 'string', required: true, description: 'URL handle (lowercase, hyphens)' },
            { name: 'Title', type: 'string', required: true, description: 'Product title' },
            { name: 'Body (HTML)', type: 'string', required: false, description: 'Product description' },
            { name: 'Vendor', type: 'string', required: false, description: 'Product vendor' },
            { name: 'Type', type: 'string', required: false, description: 'Product type/category' },
            { name: 'Variant SKU', type: 'string', required: false, description: 'SKU code' },
            { name: 'Variant Price', type: 'number', required: true, description: 'Price' },
            { name: 'Variant Inventory Qty', type: 'number', required: false, description: 'Stock quantity' },
        ],
        recommendedTransforms: [
            { field: 'Handle', transform: 'slugify', description: 'Convert to URL-safe slug' },
            { field: 'Variant Price', transform: 'number', description: 'Ensure numeric format' },
        ],
    },
    {
        id: 'mailchimp-subscribers',
        slug: 'mailchimp-subscribers',
        name: 'Mailchimp Subscribers',
        description: 'Import subscribers into Mailchimp audiences. Ready for direct upload.',
        icon: '🐵',
        platform: 'Mailchimp',
        sampleFile: '/samples/mailchimp-subscribers.csv',
        tags: ['mailchimp', 'email', 'marketing', 'subscribers'],
        schema: [
            { name: 'Email Address', type: 'email', required: true, description: 'Subscriber email' },
            { name: 'First Name', type: 'string', required: false, description: 'First name' },
            { name: 'Last Name', type: 'string', required: false, description: 'Last name' },
            { name: 'Tags', type: 'string', required: false, description: 'Comma-separated tags' },
            { name: 'MEMBER_RATING', type: 'number', required: false, description: 'Engagement rating 1-5' },
        ],
        recommendedTransforms: [
            { field: 'Email Address', transform: 'lowercase', description: 'Normalize email' },
            { field: 'Tags', transform: 'trim', description: 'Clean up tag whitespace' },
        ],
    },
    {
        id: 'generic-contacts',
        slug: 'generic-contacts',
        name: 'Generic Contacts',
        description: 'Universal contact format. Works with most CRMs and email tools.',
        icon: '📇',
        platform: 'Universal',
        sampleFile: '/samples/generic-contacts.csv',
        tags: ['contacts', 'universal', 'crm', 'general'],
        schema: [
            { name: 'email', type: 'email', required: true, description: 'Email address' },
            { name: 'first_name', type: 'string', required: true, description: 'First name' },
            { name: 'last_name', type: 'string', required: false, description: 'Last name' },
            { name: 'company', type: 'string', required: false, description: 'Company' },
            { name: 'phone', type: 'string', required: false, description: 'Phone' },
            { name: 'title', type: 'string', required: false, description: 'Job title' },
        ],
        recommendedTransforms: [
            { field: 'email', transform: 'lowercase', description: 'Normalize email' },
        ],
    },
]

export function getTemplateBySlug(slug: string): ImportTemplate | undefined {
    return TEMPLATES.find(t => t.slug === slug)
}

export function getTemplateById(id: string): ImportTemplate | undefined {
    return TEMPLATES.find(t => t.id === id)
}
