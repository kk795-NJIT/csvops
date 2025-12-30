"""Organization management router for Team tier"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Organization, OrgMembership, User, OrgRole, PlanType
from app.schemas import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrgMemberResponse,
    OrgInviteRequest,
)
from app.auth import require_auth
from app.services.usage import check_team_access
from app.services.audit import log_action, AuditActions

router = APIRouter()


def get_org_members(db: Session, org_id: int) -> List[dict]:
    """Get all members of an organization"""
    memberships = (
        db.query(OrgMembership, User)
        .join(User, OrgMembership.user_id == User.id)
        .filter(OrgMembership.organization_id == org_id)
        .all()
    )
    
    return [
        {
            "id": m.OrgMembership.id,
            "user_id": m.User.id,
            "email": m.User.email,
            "name": m.User.name,
            "role": m.OrgMembership.role,
            "created_at": m.OrgMembership.created_at,
        }
        for m in memberships
    ]


def check_org_membership(db: Session, user_id: int, org_id: int) -> Optional[OrgMembership]:
    """Check if user is a member of the organization"""
    return (
        db.query(OrgMembership)
        .filter(OrgMembership.user_id == user_id, OrgMembership.organization_id == org_id)
        .first()
    )


def check_org_owner(db: Session, user_id: int, org_id: int) -> bool:
    """Check if user is an owner of the organization"""
    membership = check_org_membership(db, user_id, org_id)
    return membership and membership.role == OrgRole.OWNER.value


@router.get("", response_model=List[OrganizationResponse])
async def list_organizations(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """List organizations the current user belongs to"""
    allowed, message = check_team_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    memberships = (
        db.query(OrgMembership)
        .filter(OrgMembership.user_id == current_user.id)
        .all()
    )
    
    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    
    result = []
    for org in orgs:
        result.append({
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "members": get_org_members(db, org.id),
            "created_at": org.created_at,
            "updated_at": org.updated_at,
        })
    
    return result


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Get an organization by ID"""
    allowed, message = check_team_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    # Check membership
    membership = check_org_membership(db, current_user.id, org_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "members": get_org_members(db, org.id),
        "created_at": org.created_at,
        "updated_at": org.updated_at,
    }


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    request: Request,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Create a new organization (Team tier only)"""
    allowed, message = check_team_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    # Check slug uniqueness
    existing = db.query(Organization).filter(Organization.slug == org_data.slug).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization slug already exists")
    
    # Create organization
    org = Organization(
        name=org_data.name,
        slug=org_data.slug,
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Add creator as owner
    membership = OrgMembership(
        user_id=current_user.id,
        organization_id=org.id,
        role=OrgRole.OWNER.value,
    )
    db.add(membership)
    db.commit()
    
    # Audit log
    log_action(
        db,
        action=AuditActions.ORG_CREATED,
        user_id=current_user.id,
        organization_id=org.id,
        resource_type="organization",
        resource_id=org.id,
        details={"name": org.name, "slug": org.slug},
        ip_address=request.client.host if request.client else None,
    )
    
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "members": get_org_members(db, org.id),
        "created_at": org.created_at,
        "updated_at": org.updated_at,
    }


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    org_data: OrganizationUpdate,
    request: Request,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Update an organization (owners only)"""
    allowed, message = check_team_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    if not check_org_owner(db, current_user.id, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can update the organization")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    
    if org_data.name is not None:
        org.name = org_data.name
    
    db.commit()
    db.refresh(org)
    
    # Audit log
    log_action(
        db,
        action=AuditActions.ORG_UPDATED,
        user_id=current_user.id,
        organization_id=org.id,
        resource_type="organization",
        resource_id=org.id,
        details={"name": org.name},
        ip_address=request.client.host if request.client else None,
    )
    
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "members": get_org_members(db, org.id),
        "created_at": org.created_at,
        "updated_at": org.updated_at,
    }


@router.post("/{org_id}/invite", response_model=OrgMemberResponse)
async def invite_member(
    org_id: int,
    invite: OrgInviteRequest,
    request: Request,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Invite a user to the organization (owners only)"""
    allowed, message = check_team_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    if not check_org_owner(db, current_user.id, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can invite members")
    
    # Find user by email
    user = db.query(User).filter(User.email == invite.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found. They must register first.")
    
    # Check if already a member
    existing = check_org_membership(db, user.id, org_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member")
    
    # Add membership
    membership = OrgMembership(
        user_id=user.id,
        organization_id=org_id,
        role=invite.role,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    
    # Audit log
    log_action(
        db,
        action=AuditActions.ORG_MEMBER_ADDED,
        user_id=current_user.id,
        organization_id=org_id,
        resource_type="org_membership",
        resource_id=membership.id,
        details={"invited_email": invite.email, "role": invite.role},
        ip_address=request.client.host if request.client else None,
    )
    
    return {
        "id": membership.id,
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": membership.role,
        "created_at": membership.created_at,
    }


@router.delete("/{org_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    org_id: int,
    user_id: int,
    request: Request,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Remove a member from the organization (owners only, cannot remove self if only owner)"""
    allowed, message = check_team_access(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
    
    if not check_org_owner(db, current_user.id, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can remove members")
    
    membership = check_org_membership(db, user_id, org_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    # Check if trying to remove the only owner
    if membership.role == OrgRole.OWNER.value:
        owner_count = (
            db.query(OrgMembership)
            .filter(OrgMembership.organization_id == org_id, OrgMembership.role == OrgRole.OWNER.value)
            .count()
        )
        if owner_count <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the only owner")
    
    # Get user email for audit
    user = db.query(User).filter(User.id == user_id).first()
    user_email = user.email if user else "unknown"
    
    db.delete(membership)
    db.commit()
    
    # Audit log
    log_action(
        db,
        action=AuditActions.ORG_MEMBER_REMOVED,
        user_id=current_user.id,
        organization_id=org_id,
        resource_type="org_membership",
        details={"removed_user_id": user_id, "removed_email": user_email},
        ip_address=request.client.host if request.client else None,
    )
