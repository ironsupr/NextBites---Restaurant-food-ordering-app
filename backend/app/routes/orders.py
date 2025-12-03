from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.menu_item import MenuItem
from app.models.restaurant import Restaurant
from app.schemas.order import OrderCreate, OrderResponse, OrderItemCreate, OrderItemResponse, OrderCheckout
from app.middleware.auth import get_current_active_user
from app.core.rbac import Permission, has_permission
import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/orders", tags=["Orders"])


def check_permission(user: User, permission: Permission):
    """Check if user has required permission."""
    if not has_permission(user.role, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your role ({user.role.value}) does not have permission for this action"
        )


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new order (cart) - all roles can create."""
    check_permission(current_user, Permission.CREATE_ORDER)
    
    # Verify restaurant exists
    restaurant = db.query(Restaurant).filter(Restaurant.id == order_data.restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    # Check if user already has a cart
    existing_cart = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.status == OrderStatus.CART
    ).first()
    
    if existing_cart:
        # If cart is for the same restaurant, return it
        if existing_cart.restaurant_id == order_data.restaurant_id:
            return OrderResponse.model_validate(existing_cart)
        
        # If cart is for a different restaurant, delete the old cart and its items
        db.query(OrderItem).filter(OrderItem.order_id == existing_cart.id).delete()
        db.delete(existing_cart)
        db.commit()
    
    # Create new order in CART status
    new_order = Order(
        user_id=current_user.id,
        restaurant_id=order_data.restaurant_id,
        status=OrderStatus.CART
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    return OrderResponse.model_validate(new_order)


@router.get("/", response_model=List[OrderResponse])
async def get_user_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's orders."""
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    
    # Convert to responses with order items
    order_responses = []
    for order in orders:
        order_items = []
        for item in order.order_items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            order_item_response = OrderItemResponse(
                id=item.id,
                menu_item_id=item.menu_item_id,
                quantity=item.quantity,
                price_at_time=item.price_at_time,
                menu_item_name=menu_item.name if menu_item else None
            )
            order_items.append(order_item_response)
        
        order_response = OrderResponse(
            id=order.id,
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            status=order.status,
            total_amount=order.total_amount,
            created_at=order.created_at,
            updated_at=order.updated_at,
            order_items=order_items
        )
        order_responses.append(order_response)
    
    return order_responses


@router.get("/all-carts", response_model=List[OrderResponse])
async def get_all_carts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all users' carts - ADMIN and MANAGER only."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can view all carts"
        )
    
    # Get all cart orders
    orders = db.query(Order).filter(Order.status == OrderStatus.CART).all()
    
    # Convert to responses with order items
    order_responses = []
    for order in orders:
        order_items = []
        for item in order.order_items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            order_item_response = OrderItemResponse(
                id=item.id,
                menu_item_id=item.menu_item_id,
                quantity=item.quantity,
                price_at_time=item.price_at_time,
                menu_item_name=menu_item.name if menu_item else None
            )
            order_items.append(order_item_response)
        
        order_response = OrderResponse(
            id=order.id,
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            status=order.status,
            total_amount=order.total_amount,
            created_at=order.created_at,
            updated_at=order.updated_at,
            order_items=order_items
        )
        order_responses.append(order_response)
    
    return order_responses


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get order details - user can only see their own orders."""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Users can only see their own orders
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own orders"
        )
    
    # Build response with order items
    order_items = []
    for item in order.order_items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
        order_item_response = OrderItemResponse(
            id=item.id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity,
            price_at_time=item.price_at_time,
            menu_item_name=menu_item.name if menu_item else None
        )
        order_items.append(order_item_response)
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        restaurant_id=order.restaurant_id,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        updated_at=order.updated_at,
        order_items=order_items
    )


@router.post("/{order_id}/items", response_model=OrderItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_order(
    order_id: int,
    item_data: OrderItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add item to cart - all roles can add items."""
    check_permission(current_user, Permission.CREATE_ORDER)
    
    # Get order
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify ownership
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own orders"
        )
    
    # Can only add items to cart
    if order.status != OrderStatus.CART:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only add items to orders in CART status"
        )
    
    # Get menu item
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_data.menu_item_id).first()
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    # Verify menu item belongs to the same restaurant
    if menu_item.restaurant_id != order.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu item does not belong to this restaurant"
        )
    
    # Check if item already exists in order
    existing_item = db.query(OrderItem).filter(
        OrderItem.order_id == order_id,
        OrderItem.menu_item_id == item_data.menu_item_id
    ).first()
    
    if existing_item:
        # Update quantity
        existing_item.quantity += item_data.quantity
        db.commit()
        db.refresh(existing_item)
        order_item = existing_item
    else:
        # Add new item
        order_item = OrderItem(
            order_id=order_id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity,
            price_at_time=menu_item.price
        )
        db.add(order_item)
        db.commit()
        db.refresh(order_item)
    
    # Update order total
    order.calculate_total()
    db.commit()
    
    return OrderItemResponse(
        id=order_item.id,
        menu_item_id=order_item.menu_item_id,
        quantity=order_item.quantity,
        price_at_time=order_item.price_at_time,
        menu_item_name=menu_item.name
    )


@router.delete("/{order_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_order(
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove item from cart."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own orders"
        )
    
    if order.status != OrderStatus.CART:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only remove items from orders in CART status"
        )
    
    order_item = db.query(OrderItem).filter(
        OrderItem.id == item_id,
        OrderItem.order_id == order_id
    ).first()
    
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found"
        )
    
    db.delete(order_item)
    db.commit()
    
    # Update order total
    order.calculate_total()
    db.commit()
    
    return None


@router.post("/{order_id}/checkout", response_model=OrderResponse)
async def checkout_order(
    order_id: int,
    checkout_data: OrderCheckout,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Checkout and pay for order - ADMIN and MANAGER only."""
    check_permission(current_user, Permission.CHECKOUT)
    
    # Get order
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Admin and Manager can checkout any order, others only their own
    if order.user_id != current_user.id:
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only checkout your own orders"
            )
    
    if order.status != OrderStatus.CART:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in CART status"
        )
    
    if not order.order_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot checkout empty cart"
        )
    
    # Get payment method - admin/manager can use any user's payment method for their order
    from app.models.payment_method import PaymentMethod
    payment_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == checkout_data.payment_method_id,
        PaymentMethod.user_id == order.user_id  # Use order owner's payment method
    ).first()
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found for order owner"
        )
    
    # Calculate total
    order.calculate_total()
    
    # Handle Cash payments
    if payment_method.brand == "Cash":
        order.status = OrderStatus.COMPLETED
        db.commit()
        db.refresh(order)
    else:
        try:
            # Create Stripe payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=int(order.total_amount * 100),  # Amount in cents
                currency="usd",
                payment_method=payment_method.stripe_payment_method_id,
                confirm=True,
                automatic_payment_methods={
                    "enabled": True,
                    "allow_redirects": "never"
                }
            )
            
            order.stripe_payment_intent_id = payment_intent.id
            order.status = OrderStatus.COMPLETED
            db.commit()
            db.refresh(order)
            
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment failed: {str(e)}"
            )
    
    # Build response
    order_items = []
    for item in order.order_items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
        order_items.append(OrderItemResponse(
            id=item.id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity,
            price_at_time=item.price_at_time,
            menu_item_name=menu_item.name if menu_item else None
        ))
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        restaurant_id=order.restaurant_id,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        updated_at=order.updated_at,
        order_items=order_items
    )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel order - ADMIN and MANAGER only."""
    check_permission(current_user, Permission.CANCEL_ORDER)
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own orders"
        )
    
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled"
        )
    
    if order.status == OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed orders"
        )
    
    order.status = OrderStatus.CANCELLED
    db.commit()
    
    return None
