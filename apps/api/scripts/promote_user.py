#!/usr/bin/env python3
"""
Admin script to promote a user to Pro or Team plan.

Usage:
    python promote_user.py <email> <plan>
    
Examples:
    python promote_user.py user@example.com pro
    python promote_user.py user@example.com team
    python promote_user.py user@example.com free  # Downgrade
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, PlanType


def promote_user(email: str, plan: str) -> bool:
    """Promote a user to a new plan."""
    # Validate plan
    valid_plans = [p.value for p in PlanType]
    if plan not in valid_plans:
        print(f"❌ Invalid plan: {plan}")
        print(f"   Valid plans: {', '.join(valid_plans)}")
        return False
    
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User not found: {email}")
            return False
        
        old_plan = user.plan
        user.plan = plan
        db.commit()
        
        print(f"✅ User {email} updated:")
        print(f"   Plan: {old_plan} → {plan}")
        
        # Show plan features
        if plan == PlanType.FREE.value:
            print("   Features: 10 runs/month, 2 templates, 2 presets")
        elif plan == PlanType.PRO.value:
            print("   Features: Unlimited runs/templates/presets, webhook export")
        elif plan == PlanType.TEAM.value:
            print("   Features: Pro + shared templates/presets, audit log, team management")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def list_users():
    """List all users with their plans."""
    db: Session = SessionLocal()
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        
        if not users:
            print("No users found.")
            return
        
        print(f"\n{'Email':<40} {'Plan':<10} {'Created'}")
        print("-" * 70)
        
        for user in users:
            created = user.created_at.strftime("%Y-%m-%d") if user.created_at else "N/A"
            print(f"{user.email:<40} {user.plan:<10} {created}")
        
        print(f"\nTotal: {len(users)} users")
        
    finally:
        db.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nCommands:")
        print("  python promote_user.py <email> <plan>  - Promote user to plan")
        print("  python promote_user.py list            - List all users")
        sys.exit(1)
    
    if sys.argv[1] == "list":
        list_users()
    elif len(sys.argv) >= 3:
        email = sys.argv[1]
        plan = sys.argv[2].lower()
        success = promote_user(email, plan)
        sys.exit(0 if success else 1)
    else:
        print("❌ Missing arguments.")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
