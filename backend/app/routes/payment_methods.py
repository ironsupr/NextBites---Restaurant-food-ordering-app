from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.payment_method import PaymentMethod
from app.schemas.payment import PaymentMethodCreate, PaymentMethodResponse
from app.middleware.auth import get_current_active_user
from app.core.rbac import Permission, has_permission

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])


def require_admin(current_user: User = Depends(get_current_active_user)):
    """Dependency to ensure user is admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can manage payment methods"
        )
    return current_user


@router.get("/", response_model=List[PaymentMethodResponse])
async def list_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List current user's payment methods (all roles can view their own)."""
    payment_methods = db.query(PaymentMethod).filter(
        PaymentMethod.user_id == current_user.id
    ).all()
    
    return [PaymentMethodResponse.model_validate(pm) for pm in payment_methods]


@router.post("/", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    payment_data: PaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new payment method - ADMIN only."""
    # If this is set as default, unset other defaults
    if payment_data.is_default:
        db.query(PaymentMethod).filter(
            PaymentMethod.user_id == current_user.id,
            PaymentMethod.is_default == True
        ).update({"is_default": False})
    
    new_payment_method = PaymentMethod(
        user_id=current_user.id,
        stripe_payment_method_id=payment_data.stripe_payment_method_id,
        last4=payment_data.last4,
        brand=payment_data.brand,
        is_default=payment_data.is_default
    )
    
    db.add(new_payment_method)
    db.commit()
    db.refresh(new_payment_method)
    
    return PaymentMethodResponse.model_validate(new_payment_method)


@router.put("/{payment_method_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    payment_method_id: int,
    payment_data: PaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update payment method - ADMIN only."""
    payment_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == payment_method_id,
        PaymentMethod.user_id == current_user.id
    ).first()
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    # If setting as default, unset other defaults
    if payment_data.is_default and not payment_method.is_default:
        db.query(PaymentMethod).filter(
            PaymentMethod.user_id == current_user.id,
            PaymentMethod.is_default == True
        ).update({"is_default": False})
    
    payment_method.stripe_payment_method_id = payment_data.stripe_payment_method_id
    payment_method.last4 = payment_data.last4
    payment_method.brand = payment_data.brand
    payment_method.is_default = payment_data.is_default
    
    db.commit()
    db.refresh(payment_method)
    
    return PaymentMethodResponse.model_validate(payment_method)


@router.delete("/{payment_method_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_method(
    payment_method_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete payment method - ADMIN only."""
    payment_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == payment_method_id,
        PaymentMethod.user_id == current_user.id
    ).first()
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    db.delete(payment_method)
    db.commit()
    
    return None
