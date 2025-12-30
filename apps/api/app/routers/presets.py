"""Presets CRUD router for mapping presets"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Preset, Template, User, OrgMembership
from app.schemas import PresetCreate, PresetUpdate, PresetResponse
from app.auth import get_current_user, require_auth
from app.services.usage import check_preset_limit

router = APIRouter()


def get_user_org_ids(db: Session, user_id: int) -> List[int]:
    """Get organization IDs the user belongs to"""
    memberships = db.query(OrgMembership).filter(OrgMembership.user_id == user_id).all()
    return [m.organization_id for m in memberships]


@router.get("", response_model=List[PresetResponse])
async def list_presets(
    skip: int = 0,
    limit: int = 100,
    template_id: Optional[int] = None,
    include_shared: bool = False,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List presets (filtered by current user if authenticated, or public only)"""
    query = db.query(Preset)
    
    # Filter by template if specified
    if template_id is not None:
        query = query.filter(Preset.template_id == template_id)
    
    # If authenticated, show user's presets (and org presets if include_shared)
    if current_user:
        if include_shared:
            org_ids = get_user_org_ids(db, current_user.id)
            query = query.filter(
                (Preset.user_id == current_user.id) |
                (Preset.organization_id.in_(org_ids) if org_ids else False)
            )
        else:
            query = query.filter(Preset.user_id == current_user.id)
    else:
        # Anonymous users see no presets (presets are private)
        return []
    
    presets = query.offset(skip).limit(limit).all()
    return presets


@router.get("/{preset_id}", response_model=PresetResponse)
async def get_preset(
    preset_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a preset by ID"""
    preset = db.query(Preset).filter(Preset.id == preset_id).first()
    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preset with id {preset_id} not found",
        )
    
    # Check ownership or org membership
    if current_user:
        if preset.user_id == current_user.id:
            return preset
        if preset.organization_id:
            org_ids = get_user_org_ids(db, current_user.id)
            if preset.organization_id in org_ids:
                return preset
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to view this preset",
    )


@router.post("", response_model=PresetResponse, status_code=status.HTTP_201_CREATED)
async def create_preset(
    preset: PresetCreate,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Create a new preset (requires authentication, enforces limit for Free plan)"""
    # Check preset limit for user
    allowed, message = check_preset_limit(db, current_user.id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message,
        )
    
    # Validate template_id if provided
    if preset.template_id is not None:
        template = db.query(Template).filter(Template.id == preset.template_id).first()
        if not template:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template with id {preset.template_id} not found",
            )
    
    # Validate organization_id if provided
    if preset.organization_id is not None:
        org_ids = get_user_org_ids(db, current_user.id)
        if preset.organization_id not in org_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of the specified organization",
            )

    db_preset = Preset(
        user_id=current_user.id,
        organization_id=preset.organization_id,
        template_id=preset.template_id,
        name=preset.name,
        mapping_json=preset.mapping_json,
    )
    db.add(db_preset)
    db.commit()
    db.refresh(db_preset)
    return db_preset


@router.put("/{preset_id}", response_model=PresetResponse)
async def update_preset(
    preset_id: int,
    preset_update: PresetUpdate,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Update a preset"""
    db_preset = db.query(Preset).filter(Preset.id == preset_id).first()
    if not db_preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preset with id {preset_id} not found",
        )
    
    # Check ownership
    if db_preset.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this preset",
        )
    
    # Update fields if provided
    update_data = preset_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(db_preset, field, value)
    
    db.commit()
    db.refresh(db_preset)
    return db_preset


@router.delete("/{preset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_preset(
    preset_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Delete a preset"""
    db_preset = db.query(Preset).filter(Preset.id == preset_id).first()
    if not db_preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preset with id {preset_id} not found",
        )
    
    # Check ownership
    if db_preset.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this preset",
        )
    
    db.delete(db_preset)
    db.commit()
    return None
