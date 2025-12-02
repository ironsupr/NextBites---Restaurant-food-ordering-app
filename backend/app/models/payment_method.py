from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class PaymentMethod(Base):
    """Payment method model for Stripe payment methods."""
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stripe_payment_method_id = Column(String, nullable=False, unique=True)
    last4 = Column(String, nullable=False)  # Last 4 digits of card
    brand = Column(String, nullable=False)  # e.g., visa, mastercard
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="payment_methods")

    def __repr__(self):
        return f"<PaymentMethod {self.brand} ****{self.last4}>"
