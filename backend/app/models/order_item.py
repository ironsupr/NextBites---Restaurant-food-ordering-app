from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class OrderItem(Base):
    """Order item model for cart items."""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    price_at_time = Column(Float, nullable=False)  # Store price at time of order

    # Relationships
    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")

    def __repr__(self):
        return f"<OrderItem {self.menu_item_id} x{self.quantity}>"
