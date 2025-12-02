from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1


class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    price_at_time: float
    menu_item_name: Optional[str] = None  # Added for convenience
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    restaurant_id: int


class OrderCheckout(BaseModel):
    payment_method_id: int


class OrderResponse(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    status: OrderStatus
    total_amount: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    order_items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True
