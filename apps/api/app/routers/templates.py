"""Templates CRUD router"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Template, User, OrgMembership
from app.schemas import TemplateCreate, TemplateUpdate, TemplateResponse
from app.services.usage import check_template_limit, check_team_access
from app.auth import get_current_user, require_auth

router = APIRouter()


def get_user_org_ids(db: Session, user_id: int) -> List[int]:
    """Get all organization IDs the user belongs to."""
    memberships = db.query(OrgMembership).filter(
        OrgMembership.user_id == user_id
    ).all()
    return [m.organization_id for m in memberships]


@router.get("", response_model=List[TemplateResponse])
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    mine_only: bool = False,
    include_shared: bool = False,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List templates. If mine_only=True and authenticated, show only user's templates.
    If include_shared=True, also include org-shared templates (Team plan).
    """
    query = db.query(Template)
    
    if mine_only and current_user:
        if include_shared:
            # Include user's own and org-shared templates
            org_ids = get_user_org_ids(db, current_user.id)
            query = query.filter(
                or_(
                    Template.user_id == current_user.id,
                    Template.organization_id.in_(org_ids) if org_ids else False
                )
            )
        else:
            query = query.filter(Template.user_id == current_user.id)
    elif not mine_only:
        # Show public templates (user_id is null) or user's own templates
        if current_user:
            conditions = [
                Template.user_id == None,
                Template.user_id == current_user.id,
            ]
            # Include org-shared templates for Team users
            if include_shared:
                org_ids = get_user_org_ids(db, current_user.id)
                if org_ids:
                    conditions.append(Template.organization_id.in_(org_ids))
            query = query.filter(or_(*conditions))
        else:
            query = query.filter(Template.user_id == None)
    
    templates = query.order_by(Template.created_at.desc()).offset(skip).limit(limit).all()
    return templates


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
):
    """Get a template by ID"""
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with id {template_id} not found",
        )
    return template


@router.get("/slug/{slug}", response_model=TemplateResponse)
async def get_template_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    """Get a template by slug"""
    template = db.query(Template).filter(Template.slug == slug).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with slug '{slug}' not found",
        )
    return template


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template: TemplateCreate,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Create a new template (requires authentication, enforces limit for Free plan)"""
    # Check template limit for user
    allowed, message = check_template_limit(db, current_user.id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message,
        )

    # Check organization_id if provided (Team feature)
    organization_id = None
    if hasattr(template, 'organization_id') and template.organization_id:
        # Verify user has team access
        can_use_team, team_msg = check_team_access(db, current_user.id)
        if not can_use_team:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=team_msg,
            )
        # Verify user is member of the org
        org_ids = get_user_org_ids(db, current_user.id)
        if template.organization_id not in org_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization",
            )
        organization_id = template.organization_id

    db_template = Template(
        user_id=current_user.id,
        organization_id=organization_id,
        name=template.name,
        slug=template.slug,
        description=template.description,
        schema_json=[field.model_dump() for field in template.schema_json],
        rules_json=template.rules_json,
        transforms_json=template.transforms_json,
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template: TemplateUpdate,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Update an existing template (must be owner)"""
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with id {template_id} not found",
        )
    
    # Check ownership
    if db_template.user_id and db_template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this template",
        )

    # Update only provided fields
    update_data = template.model_dump(exclude_unset=True)
    
    if "schema_json" in update_data and update_data["schema_json"] is not None:
        update_data["schema_json"] = [
            field.model_dump() if hasattr(field, "model_dump") else field
            for field in update_data["schema_json"]
        ]

    for key, value in update_data.items():
        if value is not None:
            setattr(db_template, key, value)

    db.commit()
    db.refresh(db_template)
    return db_template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Delete a template (must be owner)"""
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with id {template_id} not found",
        )
    
    # Check ownership
    if db_template.user_id and db_template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this template",
        )

    db.delete(db_template)
    db.commit()
    return None
