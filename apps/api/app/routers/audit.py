"""Audit log router for Team tier"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AuditLog, OrgMembership
from app.schemas import AuditLogResponse, AuditLogListResponse
from app.auth import require_auth
from app.services.usage import check_team_access
from app.services.audit import get_audit_logs

router = APIRouter()


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    organization_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    List audit logs for an organization (Team tier only).
    
    Query params:
    - organization_id: Filter by organization (required for non-personal logs)
    - action: Filter by action prefix (e.g., "template" for all template actions)
    - resource_type: Filter by resource type
    - page: Page number (1-indexed)
    - per_page: Items per page (max 100)
    """
    allowed, message = check_team_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    # Limit per_page
    per_page = min(per_page, 100)
    
    # If organization_id provided, check membership
    if organization_id:
        membership = (
            db.query(OrgMembership)
            .filter(
                OrgMembership.user_id == current_user.id,
                OrgMembership.organization_id == organization_id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this organization",
            )
    
    # Get logs
    logs, total = get_audit_logs(
        db,
        organization_id=organization_id,
        user_id=current_user.id if not organization_id else None,
        action=action,
        resource_type=resource_type,
        page=page,
        per_page=per_page,
    )
    
    # Build response with user emails
    items = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        items.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_email": user.email if user else None,
            "organization_id": log.organization_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{log_id}", response_model=AuditLogResponse)
async def get_audit_log(
    log_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Get a single audit log entry"""
    allowed, message = check_team_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log not found")
    
    # Check access: user owns the log or is member of the org
    if log.organization_id:
        membership = (
            db.query(OrgMembership)
            .filter(
                OrgMembership.user_id == current_user.id,
                OrgMembership.organization_id == log.organization_id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    elif log.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
    
    return {
        "id": log.id,
        "user_id": log.user_id,
        "user_email": user.email if user else None,
        "organization_id": log.organization_id,
        "action": log.action,
        "resource_type": log.resource_type,
        "resource_id": log.resource_id,
        "details": log.details,
        "ip_address": log.ip_address,
        "created_at": log.created_at,
    }
