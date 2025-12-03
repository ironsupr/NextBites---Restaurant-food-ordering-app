from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.restaurant import Restaurant
from app.models.menu_item import MenuItem
from app.schemas.restaurant import RestaurantResponse, RestaurantWithMenu, MenuItemResponse
from app.middleware.auth import get_current_active_user

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/countries", response_model=List[str])
async def list_countries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all available countries with restaurants. Only admins can see all countries."""
    # Only admins can see all countries (for the location selector)
    if current_user.role != UserRole.ADMIN:
        # Non-admins only see their own country
        return [current_user.country] if current_user.country else []
    
    countries = db.query(Restaurant.country).filter(
        Restaurant.is_active == True,
        Restaurant.country.isnot(None)
    ).distinct().all()
    return sorted([c[0] for c in countries if c[0]])


@router.get("/", response_model=List[RestaurantResponse])
async def list_restaurants(
    country: Optional[str] = Query(None, description="Filter by country (admin only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List restaurants based on user's location.
    - Admin: Can see all restaurants or filter by any country
    - Manager/Team Member: Only see restaurants in their assigned country
    """
    query = db.query(Restaurant).filter(Restaurant.is_active == True)
    
    if current_user.role == UserRole.ADMIN:
        # Admin can filter by any country or see all
        if country:
            query = query.filter(Restaurant.country == country)
    else:
        # Non-admins only see restaurants in their own country
        if current_user.country:
            query = query.filter(Restaurant.country == current_user.country)
        else:
            # If user has no country set, show nothing (or you could show all)
            return []
    
    restaurants = query.all()
    return [RestaurantResponse.model_validate(r) for r in restaurants]


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get restaurant details. Non-admins can only access restaurants in their country."""
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    # Non-admins can only access restaurants in their country
    if current_user.role != UserRole.ADMIN:
        if restaurant.country != current_user.country:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access restaurants in your assigned location"
            )
    
    return RestaurantResponse.model_validate(restaurant)


@router.get("/{restaurant_id}/menu", response_model=List[MenuItemResponse])
async def get_restaurant_menu(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get menu items for a restaurant. Non-admins can only access their country's restaurants."""
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    # Non-admins can only access restaurants in their country
    if current_user.role != UserRole.ADMIN:
        if restaurant.country != current_user.country:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access restaurants in your assigned location"
            )
    
    menu_items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_available == True
    ).all()
    
    return [MenuItemResponse.model_validate(item) for item in menu_items]
