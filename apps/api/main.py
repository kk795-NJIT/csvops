"""
CSV Import Copilot - Backend API
Template storage and run summary backend
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import templates, runs, health, users, auth, presets, webhooks, orgs, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup"""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Ops CSV Cleaner API",
    description="Template storage, presets, and run summary backend with team features",
    version="0.3.0",
    lifespan=lifespan,
)

# CORS for frontend - include production URL from env
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# Add production frontend URL if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)
    # Also add without trailing slash and with trailing slash
    allowed_origins.append(frontend_url.rstrip("/"))
    if not frontend_url.endswith("/"):
        allowed_origins.append(frontend_url + "/")

# In production, also allow all vercel preview URLs
if os.getenv("ENVIRONMENT") == "production" or frontend_url:
    allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now to debug
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(templates.router, prefix="/templates", tags=["templates"])
app.include_router(presets.router, prefix="/presets", tags=["presets"])
app.include_router(runs.router, prefix="/runs", tags=["runs"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(orgs.router, prefix="/orgs", tags=["organizations"])
app.include_router(audit.router, prefix="/audit", tags=["audit"])


@app.get("/")
async def root():
    return {"message": "Ops CSV Cleaner API", "docs": "/docs"}
