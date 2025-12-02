from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None


class MenuItemCreate(MenuItemBase):
    restaurant_id: int


class MenuItemResponse(MenuItemBase):
    id: int
    restaurant_id: int
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class RestaurantBase(BaseModel):
    name: str
    description: Optional[str] = None
    country: Optional[str] = None
    image_url: Optional[str] = None


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantResponse(RestaurantBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class RestaurantWithMenu(RestaurantResponse):
    menu_items: List[MenuItemResponse] = []
    
    class Config:
        from_attributes = True
