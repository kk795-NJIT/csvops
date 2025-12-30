"""Runs router for run summaries"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Run, Template, Preset, User
from app.schemas import RunCreate, RunResponse
from app.services.usage import check_run_limit
from app.auth import get_current_user, require_auth

router = APIRouter()


@router.get("", response_model=List[RunResponse])
async def list_runs(
    skip: int = 0,
    limit: int = 100,
    template_id: Optional[int] = Query(default=None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List runs for the current user, optionally filtered by template"""
    query = db.query(Run)
    
    if template_id is not None:
        query = query.filter(Run.template_id == template_id)
    
    # Only show user's own runs if authenticated
    if current_user:
        query = query.filter(Run.user_id == current_user.id)
    else:
        # Anonymous users see no runs
        return []
    
    runs = query.order_by(Run.started_at.desc()).offset(skip).limit(limit).all()
    return runs


@router.get("/{run_id}", response_model=RunResponse)
async def get_run(
    run_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a run by ID"""
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run with id {run_id} not found",
        )
    
    # Check ownership
    if run.user_id and current_user and run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this run",
        )
    
    return run


@router.post("", response_model=RunResponse, status_code=status.HTTP_201_CREATED)
async def create_run(
    run: RunCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new run summary (optionally authenticated)"""
    user_id = current_user.id if current_user else None
    
    # Check run limit for authenticated user
    if user_id:
        allowed, message = check_run_limit(db, user_id)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=message,
            )

    # Validate template_id if provided
    if run.template_id is not None:
        template = db.query(Template).filter(Template.id == run.template_id).first()
        if not template:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template with id {run.template_id} not found",
            )
    
    # Validate preset_id if provided
    if run.preset_id is not None:
        preset = db.query(Preset).filter(Preset.id == run.preset_id).first()
        if not preset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Preset with id {run.preset_id} not found",
            )

    db_run = Run(
        user_id=user_id,
        template_id=run.template_id,
        preset_id=run.preset_id,
        file_name=run.file_name,
        total_rows=run.total_rows,
        valid_rows=run.valid_rows,
        invalid_rows=run.invalid_rows,
        error_count=run.error_count,
        duplicates_count=run.duplicates_count or 0,
        error_summary=run.error_summary,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        duration_ms=run.duration_ms,
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run


@router.delete("/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_run(
    run_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Delete a run (must be owner)"""
    db_run = db.query(Run).filter(Run.id == run_id).first()
    if not db_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run with id {run_id} not found",
        )
    
    # Check ownership
    if db_run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this run",
        )

    db.delete(db_run)
    db.commit()
    return None
