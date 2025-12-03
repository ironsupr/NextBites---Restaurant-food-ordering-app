from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import stripe
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.payment_method import PaymentMethod
from app.schemas.payment import PaymentMethodCreate, PaymentMethodResponse, SetupIntentResponse
from app.middleware.auth import get_current_active_user
from app.core.rbac import Permission, has_permission
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])


def require_admin(current_user: User = Depends(get_current_active_user)):
    """Dependency to ensure user is admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can manage payment methods"
        )
    return current_user


@router.get("/config")
async def get_stripe_config():
    """Get Stripe publishable key."""
    if not settings.STRIPE_PUBLISHABLE_KEY or "your_stripe_publishable_key" in settings.STRIPE_PUBLISHABLE_KEY:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe Publishable Key is not configured."
        )
    return {"publishableKey": settings.STRIPE_PUBLISHABLE_KEY}


@router.post("/setup-intent", response_model=SetupIntentResponse)
async def create_setup_intent(
    current_user: User = Depends(get_current_active_user)
):
    """Create a Stripe SetupIntent to collect payment method details."""
    if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY.startswith("sk_test_placeholder"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe API key is not properly configured. Please check your .env file."
        )
        
    try:
        # Create a SetupIntent
        intent = stripe.SetupIntent.create(
            automatic_payment_methods={"enabled": True},
        )
        return {"client_secret": intent.client_secret}
    except stripe.error.AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid Stripe API key. Please check your server configuration."
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )


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
    current_user: User = Depends(get_current_active_user)
):
    """Create a new payment method."""
    from app.models.user import User as UserModel
    
    # Admin logic for creating for other users
    if current_user.role == UserRole.ADMIN and payment_data.user_id:
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
        
        # Single user (Admin creating for someone else)
        target_user_id = payment_data.user_id
    else:
        # Regular user creating for themselves
        target_user_id = current_user.id
    
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
    current_user: User = Depends(get_current_active_user)
):
    """Update payment method."""
    payment_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == payment_method_id
    ).first()
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
        
    # Check permissions
    if payment_method.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this payment method"
        )
    
    # If setting as default, unset other defaults
    if payment_data.is_default and not payment_method.is_default:
        db.query(PaymentMethod).filter(
            PaymentMethod.user_id == payment_method.user_id,
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
    current_user: User = Depends(get_current_active_user)
):
    """Delete payment method."""
    payment_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == payment_method_id
    ).first()
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
        
    # Check permissions
    if payment_method.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this payment method"
        )
    
    db.delete(payment_method)
    db.commit()
    
    return None
