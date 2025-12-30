# CSV Import Copilot - Web App

Self-serve CSV import with validation, mapping, and export.

## Features
- Upload CSV files with auto-delimiter detection
- Define target schema (fields, types, required)
- Auto-suggest column mapping using Fuse.js
- Validate data with Zod (email, number, date, required)
- Export clean data or errors to CSV
- Save/load templates from backend API
- Run summaries tracked in backend

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs at: http://localhost:5173

## With Backend API

```bash
# Terminal 1: Start API
cd ../api
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Start web
npm run dev
```

Or use Docker Compose from root:
```bash
docker-compose up --build
```

## Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:8000
```

## Test

```bash
npm run test:run
npm run test:coverage
```

## Workflow

1. **Upload** - Select CSV file, optionally load a saved template
2. **Schema** - Define target fields (name, type, required)
3. **Mapping** - Map CSV columns to target fields (auto-suggested)
4. **Save Template** - Save schema + mapping for reuse
5. **Validate** - Check all rows against schema
6. **Export** - Download clean data or error report
