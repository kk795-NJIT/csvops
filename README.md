# Ops CSV Cleaner

The CSV cleaner for Ops, RevOps & Agency teams. Pre-built templates for HubSpot, Salesforce, Shopify & Mailchimp. Privacy-first: all processing happens in your browser.

## Features

- 🔒 **Privacy-First**: Your CSV data never leaves your browser
- 📋 **CRM Templates**: Pre-built schemas for HubSpot, Salesforce, Shopify, Mailchimp
- 🎯 **Smart Mapping**: Fuzzy column matching with auto-suggestions
- ✅ **Validation**: Catch bad emails, dates, and required fields
- 💾 **Save & Reuse**: Save templates for recurring imports (Pro)
- 📥 **Clean Exports**: Download validated CSV ready for CRM import

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with features, pricing, and CTAs |
| `/tool` | Free tool mode - clean any CSV, no login required |
| `/templates` | Browse pre-built CRM templates |
| `/templates/:slug` | Template detail with schema, sample download |
| `/app/import` | Full app with template save/load (requires login for Pro) |

## Try Free Tool Mode

No signup required! Visit `/tool` to:
1. Upload any CSV file
2. Define or use a template schema
3. Map columns with smart suggestions
4. Validate all rows
5. Export clean CSV or error report

All processing happens 100% in your browser.

## Project Structure

```
ops-csv-cleaner/
├── apps/
│   ├── web/          # React + Vite + TypeScript + Tailwind
│   └── api/          # FastAPI + Uvicorn
├── packages/
│   └── shared/       # Shared types & schemas
├── docker-compose.yml
└── package.json
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+ (for API)
- Docker & Docker Compose (optional)

### Local Development

```bash
# Install dependencies
npm install

# Install API dependencies (optional, for full app)
cd apps/api && pip install -r requirements.txt && cd ../..

# Run all services
npm run dev
```

Or run individually:

```bash
# Web only - Free Tool works without API
npm run dev:web
# Visit http://localhost:5173/tool

# API (for Pro features)
npm run dev:api
```

### Docker Compose

```bash
# Start all services
docker-compose up --build

# Stop services
docker-compose down
```

## Available Templates

| Template | Platform | Fields |
|----------|----------|--------|
| HubSpot Contacts | HubSpot | email, firstname, lastname, company, phone, jobtitle, lifecyclestage |
| Salesforce Leads | Salesforce | Email, FirstName, LastName, Company, Title, Phone, LeadSource, Status |
| Shopify Products | Shopify | Handle, Title, Body, Vendor, Type, SKU, Price, Inventory |
| Mailchimp Subscribers | Mailchimp | Email Address, First Name, Last Name, Tags, MEMBER_RATING |
| Generic Contacts | Universal | email, first_name, last_name, company, phone, title |

Sample CSV files available at `/samples/<template-id>.csv`

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Web | http://localhost:5173 | React frontend |
| Free Tool | http://localhost:5173/tool | No-login CSV cleaner |
| Templates | http://localhost:5173/templates | Template library |
| API | http://localhost:8000 | FastAPI backend |
| API Docs | http://localhost:8000/docs | Swagger UI |

## Tech Stack

- **Frontend**: React, React Router, Vite, TypeScript, Tailwind CSS, PapaParse, Fuse.js, Zod
- **Backend**: FastAPI, Uvicorn, SQLAlchemy, Pydantic
- **Shared**: TypeScript types, Pydantic schemas
- **DevOps**: Docker, Docker Compose

## Future Roadmap

- [ ] Database integration (PostgreSQL)
- [ ] User authentication
- [ ] Stripe integration (Sprint 3)

## License

MIT
