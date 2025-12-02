from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base


class OrderStatus(str, enum.Enum):
    """Order status enumeration."""
    CART = "cart"  # User is still building the order
    PENDING = "pending"  # Order placed, payment processing
    COMPLETED = "completed"  # Order completed and paid
    CANCELLED = "cancelled"  # Order cancelled


class Order(Base):
    """Order model."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.CART, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    stripe_payment_intent_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def calculate_total(self):
        """Calculate total amount from order items."""
        self.total_amount = sum(item.price_at_time * item.quantity for item in self.order_items)
        return self.total_amount

    def __repr__(self):
        return f"<Order #{self.id} - {self.status.value} - ${self.total_amount}>"
