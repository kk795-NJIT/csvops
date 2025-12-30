"""Audit logging service for Team tier"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models import AuditLog, User


def log_action(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    organization_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    Log an action to the audit log.
    
    Args:
        db: Database session
        action: Action type (e.g., "template.created", "webhook.configured")
        user_id: User who performed the action
        organization_id: Organization context (for team features)
        resource_type: Type of resource affected (e.g., "template", "preset")
        resource_id: ID of resource affected
        details: Additional details about the action (no raw data!)
        ip_address: Client IP address
        user_agent: Client user agent
    
    Returns:
        Created AuditLog entry
    """
    audit_log = AuditLog(
        user_id=user_id,
        organization_id=organization_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_audit_logs(
    db: Session,
    organization_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[AuditLog], int]:
    """
    Get paginated audit logs with optional filters.
    
    Returns:
        Tuple of (logs, total_count)
    """
    query = db.query(AuditLog)
    
    if organization_id:
        query = query.filter(AuditLog.organization_id == organization_id)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action.like(f"{action}%"))
    
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    
    # Get total count
    total = query.count()
    
    # Paginate
    logs = (
        query
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    
    return logs, total


# Common action types for consistency
class AuditActions:
    """Standard audit action types"""
    # Templates
    TEMPLATE_CREATED = "template.created"
    TEMPLATE_UPDATED = "template.updated"
    TEMPLATE_DELETED = "template.deleted"
    TEMPLATE_SHARED = "template.shared"
    
    # Presets
    PRESET_CREATED = "preset.created"
    PRESET_UPDATED = "preset.updated"
    PRESET_DELETED = "preset.deleted"
    PRESET_SHARED = "preset.shared"
    
    # Webhooks
    WEBHOOK_CREATED = "webhook.created"
    WEBHOOK_UPDATED = "webhook.updated"
    WEBHOOK_DELETED = "webhook.deleted"
    WEBHOOK_SENT = "webhook.sent"
    WEBHOOK_FAILED = "webhook.failed"
    
    # Organizations
    ORG_CREATED = "org.created"
    ORG_UPDATED = "org.updated"
    ORG_MEMBER_ADDED = "org.member_added"
    ORG_MEMBER_REMOVED = "org.member_removed"
    ORG_MEMBER_ROLE_CHANGED = "org.member_role_changed"
    
    # Runs
    RUN_CREATED = "run.created"
    
    # Auth
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    USER_REGISTERED = "user.registered"
