from pydantic import BaseModel
from datetime import datetime


class PaymentMethodCreate(BaseModel):
    stripe_payment_method_id: str
    last4: str
    brand: str
    is_default: bool = False


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
