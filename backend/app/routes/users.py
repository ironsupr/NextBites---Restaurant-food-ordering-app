from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
import string
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserCreateByAdmin, UserRoleUpdate
from app.middleware.auth import get_current_active_user
from app.services.email import send_new_user_credentials_email

router = APIRouter(prefix="/users", tags=["User Management"])


def require_admin(current_user: User = Depends(get_current_active_user)):
    """Dependency to ensure user is admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this action"
        )
    return current_user


def generate_random_password(length: int = 12) -> str:
    """Generate a random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


@router.get("/", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all users (Admin only)."""
    users = db.query(User).all()
    return [UserResponse.model_validate(user) for user in users]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateByAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user at any role (Admin only). Sends email with credentials."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate random password if not provided
    password = user_data.password
    
    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=User.hash_password(password),
        role=user_data.role,
        country=user_data.country
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send email with credentials (async, non-blocking)
    try:
        await send_new_user_credentials_email(
            email=new_user.email,
            password=password,
            role=new_user.role.value
        )
    except Exception as e:
        # Log error but don't fail user creation
        print(f"Failed to send email: {str(e)}")
    
    return UserResponse.model_validate(new_user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get user details (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.model_validate(user)


@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user role - escalate or degrade (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from demoting themselves
    if user.id == current_user.id and role_update.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote your own admin account"
        )
    
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)
