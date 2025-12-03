from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentMethodCreate(BaseModel):
    stripe_payment_method_id: str
    last4: str
    brand: str
    is_default: bool = False
    user_id: Optional[int] = None  # Admin can specify user_id


class PaymentMethodResponse(BaseModel):
    id: int
    user_id: int
    stripe_payment_method_id: str
    last4: str
    brand: str
    is_default: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
