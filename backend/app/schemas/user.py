from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    country: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.TEAM_MEMBER


class UserCreateByAdmin(UserBase):
    """Schema for admin creating users at any role."""
    password: str
    role: UserRole  # Required for admin creation


class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    country: Optional[str] = None
    is_active: Optional[bool] = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserResponse(UserBase):
    id: int
    user_uid: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
