from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRole(str, enum.Enum):
    """User role enumeration."""
    ADMIN = "admin"
    MANAGER = "manager"
    TEAM_MEMBER = "team_member"


class User(Base):
    """User model with role-based access control."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.TEAM_MEMBER, nullable=False)
    country = Column(String, nullable=True)  # For location-based segregation (Phase 2)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    payment_methods = relationship("PaymentMethod", back_populates="user", cascade="all, delete-orphan")

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        """Verify a password against the hash."""
        return pwd_context.verify(password, self.password_hash)

    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"
