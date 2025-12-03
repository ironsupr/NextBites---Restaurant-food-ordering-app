from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.payment_method import PaymentMethod
from app.schemas.user import UserCreate, UserResponse, LoginRequest, TokenResponse
from app.core.security import create_access_token, blacklist_token
from app.middleware.auth import get_current_active_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import random
import string

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


def generate_user_uid(db: Session) -> str:
    """Generate a unique user ID like NB-XXXXXX."""
    chars = string.ascii_uppercase + string.digits
    while True:
        random_part = ''.join(random.choices(chars, k=6))
        uid = f"NB-{random_part}"
        # Check if uid already exists
        existing = db.query(User).filter(User.user_uid == uid).first()
        if not existing:
            return uid


def create_default_payment_method(db: Session, user_id: int):
    """Create default Cash payment method for a user."""
    cash_method = PaymentMethod(
        user_id=user_id,
        stripe_payment_method_id=f"cash_{user_id}",
        last4="CASH",
        brand="Cash",
        is_default=True
    )
    db.add(cash_method)
    db.commit()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (default role: team_member)."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate unique user ID
    user_uid = generate_user_uid(db)
    
    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=User.hash_password(user_data.password),
        role=user_data.role,  # Defaults to TEAM_MEMBER
        country=user_data.country,
        full_name=user_data.full_name,
        user_uid=user_uid
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default Cash payment method for new user
    create_default_payment_method(db, new_user.id)
    
    # Create access token (sub should be string per JWT spec)
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login user and return JWT token."""
    # Find user
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not user.verify_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token (sub should be string per JWT spec)
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_active_user)
):
    """Logout user by blacklisting the token."""
    token = credentials.credentials
    blacklist_token(token)
    return None


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return UserResponse.model_validate(current_user)
