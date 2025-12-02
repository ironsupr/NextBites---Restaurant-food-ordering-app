from enum import Enum
from typing import List
from app.models.user import UserRole


class Permission(str, Enum):
    """Permission types."""
    VIEW_MENU = "view_menu"
    CREATE_ORDER = "create_order"
    CHECKOUT = "checkout"
    CANCEL_ORDER = "cancel_order"
    UPDATE_PAYMENT = "update_payment"
    MANAGE_USERS = "manage_users"


# RBAC Permission Matrix
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        Permission.VIEW_MENU,
        Permission.CREATE_ORDER,
        Permission.CHECKOUT,
        Permission.CANCEL_ORDER,
        Permission.UPDATE_PAYMENT,
        Permission.MANAGE_USERS,
    ],
    UserRole.MANAGER: [
        Permission.VIEW_MENU,
        Permission.CREATE_ORDER,
        Permission.CHECKOUT,
        Permission.CANCEL_ORDER,
    ],
    UserRole.TEAM_MEMBER: [
        Permission.VIEW_MENU,
        Permission.CREATE_ORDER,
    ],
}


def has_permission(user_role: UserRole, permission: Permission) -> bool:
    """Check if a role has a specific permission."""
    return permission in ROLE_PERMISSIONS.get(user_role, [])


def require_permission(permission: Permission):
    """Decorator to require a specific permission."""
    def decorator(func):
        func.required_permission = permission
        return func
    return decorator


def require_role(*roles: UserRole):
    """Decorator to require specific roles."""
    def decorator(func):
        func.required_roles = roles
        return func
    return decorator
