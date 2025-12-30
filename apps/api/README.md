# CSV Import Copilot API

Thin backend for template storage and run summaries.

## Stack
- FastAPI + Uvicorn
- SQLAlchemy + Alembic
- SQLite
- Pydantic

## Data Policy
**NO raw CSV data is stored.** Only:
- Templates: schema definitions, mapping presets, validation rules
- Run summaries: row counts, error counts, timestamps

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/templates` | List all templates |
| GET | `/templates/{id}` | Get template by ID |
| POST | `/templates` | Create template |
| PUT | `/templates/{id}` | Update template |
| DELETE | `/templates/{id}` | Delete template |
| GET | `/runs` | List run summaries |
| GET | `/runs/{id}` | Get run by ID |
| POST | `/runs` | Create run summary |
| DELETE | `/runs/{id}` | Delete run |

## How to Run Locally

```bash
cd apps/api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

## Run with Docker Compose

```bash
# From root directory
docker-compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Example API Calls

### Create Template
```bash
curl -X POST http://localhost:8000/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Import",
    "description": "Standard customer data import",
    "schema_fields": [
      {"name": "email", "type": "email", "required": true},
      {"name": "first_name", "type": "string", "required": true},
      {"name": "company", "type": "string", "required": false}
    ],
    "mapping_presets": {
      "email": "Email Address",
      "first_name": "First Name"
    }
  }'
```

### Create Run Summary
```bash
curl -X POST http://localhost:8000/runs \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": 1,
    "file_name": "customers.csv",
    "total_rows": 1000,
    "valid_rows": 950,
    "invalid_rows": 50,
    "error_count": 75,
    "error_summary": {"email": 40, "required": 35},
    "duration_ms": 1234
  }'
```

### List Templates
```bash
curl http://localhost:8000/templates
```

### List Runs
```bash
curl http://localhost:8000/runs
curl http://localhost:8000/runs?template_id=1
```
