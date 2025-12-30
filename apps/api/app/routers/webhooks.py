"""Webhook configuration and sending router"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WebhookConfig, Template, User, PlanType
from app.schemas import (
    WebhookConfigCreate,
    WebhookConfigUpdate,
    WebhookConfigResponse,
    WebhookSendRequest,
    WebhookSendResponse,
)
from app.auth import require_auth
from app.services.usage import check_webhook_access
from app.services.webhook import send_webhook
from app.services.audit import log_action, AuditActions

router = APIRouter()


def webhook_to_response(webhook: WebhookConfig) -> dict:
    """Convert webhook model to response dict"""
    return {
        "id": webhook.id,
        "user_id": webhook.user_id,
        "organization_id": webhook.organization_id,
        "template_id": webhook.template_id,
        "name": webhook.name,
        "url": webhook.url,
        "has_signing_secret": bool(webhook.signing_secret),
        "custom_headers": webhook.custom_headers,
        "is_active": webhook.is_active,
        "created_at": webhook.created_at,
        "updated_at": webhook.updated_at,
    }


@router.get("", response_model=List[WebhookConfigResponse])
async def list_webhooks(
    template_id: Optional[int] = None,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """List webhook configurations for current user"""
    # Check webhook access
    allowed, message = check_webhook_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    query = db.query(WebhookConfig).filter(WebhookConfig.user_id == current_user.id)
    
    if template_id is not None:
        query = query.filter(WebhookConfig.template_id == template_id)
    
    webhooks = query.order_by(WebhookConfig.created_at.desc()).all()
    return [webhook_to_response(w) for w in webhooks]


@router.get("/{webhook_id}", response_model=WebhookConfigResponse)
async def get_webhook(
    webhook_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Get a webhook configuration by ID"""
    allowed, message = check_webhook_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    webhook = db.query(WebhookConfig).filter(WebhookConfig.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
    
    if webhook.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    return webhook_to_response(webhook)


@router.post("", response_model=WebhookConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    config: WebhookConfigCreate,
    request: Request,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Create a new webhook configuration (Pro/Team only)"""
    allowed, message = check_webhook_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    # Validate template if provided
    if config.template_id:
        template = db.query(Template).filter(Template.id == config.template_id).first()
        if not template:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Template not found")
    
    webhook = WebhookConfig(
        user_id=current_user.id,
        template_id=config.template_id,
        name=config.name,
        url=config.url,
        signing_secret=config.signing_secret,
        custom_headers=config.custom_headers or {},
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    
    # Audit log for team users
    if current_user.plan == PlanType.TEAM.value:
        log_action(
            db,
            action=AuditActions.WEBHOOK_CREATED,
            user_id=current_user.id,
            resource_type="webhook",
            resource_id=webhook.id,
            details={"name": webhook.name, "template_id": config.template_id},
            ip_address=request.client.host if request.client else None,
        )
    
    return webhook_to_response(webhook)


@router.put("/{webhook_id}", response_model=WebhookConfigResponse)
async def update_webhook(
    webhook_id: int,
    config: WebhookConfigUpdate,
    request: Request,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Update a webhook configuration"""
    allowed, message = check_webhook_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    webhook = db.query(WebhookConfig).filter(WebhookConfig.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
    
    if webhook.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Update fields
    if config.name is not None:
        webhook.name = config.name
    if config.url is not None:
        webhook.url = config.url
    if config.signing_secret is not None:
        webhook.signing_secret = config.signing_secret
    if config.custom_headers is not None:
        webhook.custom_headers = config.custom_headers
    if config.is_active is not None:
        webhook.is_active = config.is_active
    
    db.commit()
    db.refresh(webhook)
    
    # Audit log for team users
    if current_user.plan == PlanType.TEAM.value:
        log_action(
            db,
            action=AuditActions.WEBHOOK_UPDATED,
            user_id=current_user.id,
            resource_type="webhook",
            resource_id=webhook.id,
            details={"name": webhook.name},
            ip_address=request.client.host if request.client else None,
        )
    
    return webhook_to_response(webhook)


@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: int,
    request: Request,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Delete a webhook configuration"""
    allowed, message = check_webhook_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    webhook = db.query(WebhookConfig).filter(WebhookConfig.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
    
    if webhook.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    webhook_name = webhook.name
    db.delete(webhook)
    db.commit()
    
    # Audit log for team users
    if current_user.plan == PlanType.TEAM.value:
        log_action(
            db,
            action=AuditActions.WEBHOOK_DELETED,
            user_id=current_user.id,
            resource_type="webhook",
            resource_id=webhook_id,
            details={"name": webhook_name},
            ip_address=request.client.host if request.client else None,
        )


@router.post("/send", response_model=WebhookSendResponse)
async def send_to_webhook(
    payload: WebhookSendRequest,
    request: Request,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Send data to a webhook endpoint.
    
    Can use either:
    - webhook_id: Use a saved webhook configuration
    - url: Send to a custom URL (Pro only, no signing)
    
    The data is NOT stored - it's sent directly to the webhook.
    """
    allowed, message = check_webhook_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    if not payload.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data to send")
    
    # Get webhook config or use provided URL
    signing_secret = None
    custom_headers = None
    
    if payload.webhook_id:
        webhook = db.query(WebhookConfig).filter(WebhookConfig.id == payload.webhook_id).first()
        if not webhook:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
        if webhook.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        if not webhook.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook is disabled")
        
        url = webhook.url
        signing_secret = webhook.signing_secret
        custom_headers = webhook.custom_headers
    elif payload.url:
        url = payload.url
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either webhook_id or url is required")
    
    # Send the webhook
    result = await send_webhook(
        url=url,
        data=payload.data,
        user_id=current_user.id,
        signing_secret=signing_secret,
        custom_headers=custom_headers,
        include_metadata=payload.include_metadata,
        file_name=payload.file_name,
    )
    
    # Audit log for team users
    if current_user.plan == PlanType.TEAM.value:
        action = AuditActions.WEBHOOK_SENT if result["success"] else AuditActions.WEBHOOK_FAILED
        log_action(
            db,
            action=action,
            user_id=current_user.id,
            resource_type="webhook",
            resource_id=payload.webhook_id,
            details={
                "row_count": len(payload.data),
                "success": result["success"],
                "status_code": result.get("status_code"),
            },
            ip_address=request.client.host if request.client else None,
        )
    
    return result
