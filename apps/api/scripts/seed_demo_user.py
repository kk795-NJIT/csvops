#!/usr/bin/env python3
"""
Seed script to create a demo user and set plan.
Run: python scripts/seed_demo_user.py
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal, engine, Base
from app.models import User, PlanType

def seed_demo_user():
    """Create demo users with different plans"""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create Free demo user
        free_user = db.query(User).filter(User.email == "demo@example.com").first()
        if not free_user:
            free_user = User(
                email="demo@example.com",
                name="Demo User (Free)",
                plan=PlanType.FREE.value,
            )
            db.add(free_user)
            print(f"✓ Created Free user: demo@example.com (ID will be assigned)")
        else:
            print(f"✓ Free user exists: demo@example.com (ID: {free_user.id})")
        
        # Create Pro demo user
        pro_user = db.query(User).filter(User.email == "pro@example.com").first()
        if not pro_user:
            pro_user = User(
                email="pro@example.com",
                name="Demo User (Pro)",
                plan=PlanType.PRO.value,
            )
            db.add(pro_user)
            print(f"✓ Created Pro user: pro@example.com (ID will be assigned)")
        else:
            print(f"✓ Pro user exists: pro@example.com (ID: {pro_user.id})")
        
        db.commit()
        
        # Refresh to get IDs
        db.refresh(free_user)
        db.refresh(pro_user)
        
        print("\n" + "=" * 50)
        print("Demo Users Created:")
        print("=" * 50)
        print(f"  Free User: ID={free_user.id}, email={free_user.email}, plan={free_user.plan}")
        print(f"  Pro User:  ID={pro_user.id}, email={pro_user.email}, plan={pro_user.plan}")
        print("\nTo use in frontend, add X-User-Id header:")
        print(f"  Free: X-User-Id: {free_user.id}")
        print(f"  Pro:  X-User-Id: {pro_user.id}")
        print("\nTo toggle plan via API:")
        print(f"  curl -X PATCH 'http://localhost:8000/users/{free_user.id}/plan?plan=pro'")
        print("=" * 50)
        
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_user()
