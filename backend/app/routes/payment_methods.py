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
    user_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List payment methods. Admins/Managers can view any user's payment methods."""
    target_user_id = current_user.id
    
    # Admin/Manager can view any user's payment methods
    if user_id and user_id != current_user.id:
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins and managers can view other users' payment methods"
            )
        target_user_id = user_id
    
    payment_methods = db.query(PaymentMethod).filter(
        PaymentMethod.user_id == target_user_id
    ).all()
    
    return [PaymentMethodResponse.model_validate(pm) for pm in payment_methods]


@router.post("/", response_model=List[PaymentMethodResponse], status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    payment_data: PaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new payment method - ADMIN only. Admin can create for any user or all users."""
    from app.models.user import User as UserModel
    
    created_methods = []
    
    # If user_id is -1, create for all users
    if payment_data.user_id == -1:
        all_users = db.query(UserModel).filter(UserModel.is_active == True).all()
        for target_user in all_users:
            # If this is set as default, unset other defaults for target user
            if payment_data.is_default:
                db.query(PaymentMethod).filter(
                    PaymentMethod.user_id == target_user.id,
                    PaymentMethod.is_default == True
                ).update({"is_default": False})
            
            new_payment_method = PaymentMethod(
                user_id=target_user.id,
                stripe_payment_method_id=f"{payment_data.stripe_payment_method_id}_{target_user.id}",
                last4=payment_data.last4,
                brand=payment_data.brand,
                is_default=payment_data.is_default
            )
            db.add(new_payment_method)
            created_methods.append(new_payment_method)
        
        db.commit()
        for pm in created_methods:
            db.refresh(pm)
        
        return [PaymentMethodResponse.model_validate(pm) for pm in created_methods]
    
    # Single user
    target_user_id = payment_data.user_id if payment_data.user_id else current_user.id
    
    # Verify target user exists
    target_user = db.query(UserModel).filter(UserModel.id == target_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # If this is set as default, unset other defaults for target user
    if payment_data.is_default:
        db.query(PaymentMethod).filter(
            PaymentMethod.user_id == target_user_id,
            PaymentMethod.is_default == True
        ).update({"is_default": False})
    
    new_payment_method = PaymentMethod(
        user_id=target_user_id,
        stripe_payment_method_id=payment_data.stripe_payment_method_id,
        last4=payment_data.last4,
        brand=payment_data.brand,
        is_default=payment_data.is_default
    )
    
    db.add(new_payment_method)
    db.commit()
    db.refresh(new_payment_method)
    
    return [PaymentMethodResponse.model_validate(new_payment_method)]


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
