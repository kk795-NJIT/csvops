"""Usage tracking service"""
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models import User, Template, Preset, Run, PLAN_LIMITS, PlanType


def get_user_usage(db: Session, user_id: int) -> dict:
    """Get current usage stats for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    # Get current month
    now = datetime.utcnow()
    
    # Count runs this month
    runs_this_month = (
        db.query(func.count(Run.id))
        .filter(
            Run.user_id == user_id,
            extract("year", Run.started_at) == now.year,
            extract("month", Run.started_at) == now.month,
        )
        .scalar()
    )

    # Count templates
    template_count = (
        db.query(func.count(Template.id))
        .filter(Template.user_id == user_id)
        .scalar()
    )
    
    # Count presets
    preset_count = (
        db.query(func.count(Preset.id))
        .filter(Preset.user_id == user_id)
        .scalar()
    )

    # Get limits for user's plan
    limits = PLAN_LIMITS.get(user.plan, PLAN_LIMITS[PlanType.FREE.value])
    
    def format_limit(val):
        """Convert inf to -1 for JSON serialization"""
        return -1 if val == float("inf") else val

    return {
        "user_id": user_id,
        "email": user.email,
        "plan": user.plan,
        "usage": {
            "runs_this_month": runs_this_month,
            "max_runs_per_month": format_limit(limits["max_runs_per_month"]),
            "templates": template_count,
            "max_templates": format_limit(limits["max_templates"]),
            "presets": preset_count,
            "max_presets": format_limit(limits["max_presets"]),
        },
        "limits": {
            "can_create_run": user.plan in (PlanType.PRO.value, PlanType.TEAM.value) or runs_this_month < limits["max_runs_per_month"],
            "can_create_template": user.plan in (PlanType.PRO.value, PlanType.TEAM.value) or template_count < limits["max_templates"],
            "can_create_preset": user.plan in (PlanType.PRO.value, PlanType.TEAM.value) or preset_count < limits["max_presets"],
            "can_use_webhook": limits.get("webhook_enabled", False),
            "can_use_team_features": limits.get("team_features", False),
        },
    }


def check_run_limit(db: Session, user_id: int) -> tuple[bool, str]:
    """Check if user can create a run. Returns (allowed, message)"""
    usage = get_user_usage(db, user_id)
    if not usage:
        return True, ""  # No user = no limits (anonymous)
    
    if not usage["limits"]["can_create_run"]:
        return False, f"Monthly run limit reached ({usage['usage']['max_runs_per_month']} runs). Upgrade to Pro for unlimited runs."
    
    return True, ""


def check_template_limit(db: Session, user_id: int) -> tuple[bool, str]:
    """Check if user can create a template. Returns (allowed, message)"""
    usage = get_user_usage(db, user_id)
    if not usage:
        return True, ""  # No user = no limits (anonymous)
    
    if not usage["limits"]["can_create_template"]:
        return False, f"Template limit reached ({usage['usage']['max_templates']} templates). Upgrade to Pro for unlimited templates."
    
    return True, ""


def check_preset_limit(db: Session, user_id: int) -> tuple[bool, str]:
    """Check if user can create a preset. Returns (allowed, message)"""
    usage = get_user_usage(db, user_id)
    if not usage:
        return True, ""  # No user = no limits (anonymous)
    
    if not usage["limits"]["can_create_preset"]:
        return False, f"Preset limit reached ({usage['usage']['max_presets']} presets). Upgrade to Pro for unlimited presets."
    
    return True, ""


def check_webhook_access(db: Session, user_id: int) -> tuple[bool, str]:
    """Check if user can use webhooks. Returns (allowed, message)"""
    usage = get_user_usage(db, user_id)
    if not usage:
        return False, "Authentication required for webhook access."
    
    if not usage["limits"]["can_use_webhook"]:
        return False, "Webhook export is a Pro feature. Upgrade to Pro to use webhooks."
    
    return True, ""


def check_team_access(db: Session, user_id: int) -> tuple[bool, str]:
    """Check if user has team features. Returns (allowed, message)"""
    usage = get_user_usage(db, user_id)
    if not usage:
        return False, "Authentication required for team features."
    
    if not usage["limits"]["can_use_team_features"]:
        return False, "Team features require a Team plan. Upgrade to Team for shared templates and audit logs."
    
    return True, ""
