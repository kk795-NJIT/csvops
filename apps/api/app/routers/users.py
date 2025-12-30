"""Users router with usage tracking"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, UsageResponse
from app.services.usage import get_user_usage

router = APIRouter()


def get_current_user_id(x_user_id: Optional[str] = Header(default=None)) -> Optional[int]:
    """Extract user_id from X-User-Id header. Returns None if not provided."""
    if x_user_id:
        try:
            return int(x_user_id)
        except ValueError:
            return None
    return None


@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/me/usage", response_model=UsageResponse)
async def get_my_usage(
    user_id: Optional[int] = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get current user's usage stats"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header required",
        )
    
    usage = get_user_usage(db, user_id)
    if not usage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return usage


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Get a user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    """Create a new user"""
    # Check if email already exists
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    db_user = User(
        email=user.email,
        name=user.name,
        plan=user.plan,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.patch("/{user_id}/plan", response_model=UserResponse)
async def update_user_plan(
    user_id: int,
    plan: str = Query(pattern="^(free|pro)$"),
    db: Session = Depends(get_db),
):
    """Update a user's plan (for admin toggle)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )

    user.plan = plan
    db.commit()
    db.refresh(user)
    return user
