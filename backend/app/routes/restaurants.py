from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.menu_item import MenuItem
from app.schemas.restaurant import RestaurantResponse, RestaurantWithMenu, MenuItemResponse
from app.middleware.auth import get_current_active_user

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/", response_model=List[RestaurantResponse])
async def list_restaurants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all restaurants (accessible to all authenticated users)."""
    restaurants = db.query(Restaurant).filter(Restaurant.is_active == True).all()
    return [RestaurantResponse.model_validate(r) for r in restaurants]


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get restaurant details."""
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    return RestaurantResponse.model_validate(restaurant)


@router.get("/{restaurant_id}/menu", response_model=List[MenuItemResponse])
async def get_restaurant_menu(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get menu items for a restaurant."""
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    menu_items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_available == True
    ).all()
    
    return [MenuItemResponse.model_validate(item) for item in menu_items]
