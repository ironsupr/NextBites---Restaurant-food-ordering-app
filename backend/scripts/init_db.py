"""
Database initialization and seeding script.
Creates tables and seeds initial data including:
- Root admin account
- Sample users (Nick Fury, Captain Marvel, etc.)
- Sample restaurants and menu items
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine, SessionLocal
from app.models import Base, User, Restaurant, MenuItem
from app.models.user import UserRole
from sqlalchemy.orm import Session


def init_db():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")


def seed_data():
    """Seed initial data."""
    db = SessionLocal()
    
    try:
        print("\nSeeding initial data...")
        
        # Create root admin account
        print("\n1. Creating root admin account...")
        admin = db.query(User).filter(User.email == "admin@nextbite.com").first()
        if not admin:
            admin = User(
                email="admin@nextbite.com",
                password_hash=User.hash_password("Admin@123"),
                role=UserRole.ADMIN,
                country="USA"
            )
            db.add(admin)
            print("   ✓ Admin account created:")
            print("     Email: admin@nextbite.com")
            print("     Password: Admin@123")
        else:
            print("   - Admin account already exists")
        
        # Create sample users from the assignment
        print("\n2. Creating sample users...")
        users_data = [
            {"email": "nick.fury@nextbite.com", "password": "Fury@123", "role": UserRole.ADMIN, "country": "USA"},
            {"email": "captain.marvel@nextbite.com", "password": "Marvel@123", "role": UserRole.MANAGER, "country": "India"},
            {"email": "captain.america@nextbite.com", "password": "America@123", "role": UserRole.MANAGER, "country": "USA"},
            {"email": "thanos@nextbite.com", "password": "Thanos@123", "role": UserRole.TEAM_MEMBER, "country": "India"},
            {"email": "thor@nextbite.com", "password": "Thor@123", "role": UserRole.TEAM_MEMBER, "country": "India"},
            {"email": "travis@nextbite.com", "password": "Travis@123", "role": UserRole.TEAM_MEMBER, "country": "USA"},
        ]
        
        for user_data in users_data:
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing:
                user = User(
                    email=user_data["email"],
                    password_hash=User.hash_password(user_data["password"]),
                    role=user_data["role"],
                    country=user_data["country"]
                )
                db.add(user)
                print(f"   ✓ Created {user_data['role'].value}: {user_data['email']}")
            else:
                print(f"   - {user_data['email']} already exists")
        
        db.commit()
        
        # Create sample restaurants
        print("\n3. Creating sample restaurants...")
        restaurants_data = [
            {
                "name": "Spice Garden",
                "description": "Authentic Indian cuisine with a modern twist",
                "country": "India",
                "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800"
            },
            {
                "name": "Curry House",
                "description": "Traditional Indian dishes and tandoori specialties",
                "country": "India",
                "image_url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800"
            },
            {
                "name": "American Diner",
                "description": "Classic American comfort food",
                "country": "USA",
                "image_url": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800"
            },
            {
                "name": "Burger Haven",
                "description": "Gourmet burgers and craft beer",
                "country": "USA",
                "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800"
            },
        ]
        
        created_restaurants = []
        for restaurant_data in restaurants_data:
            existing = db.query(Restaurant).filter(Restaurant.name == restaurant_data["name"]).first()
            if not existing:
                restaurant = Restaurant(**restaurant_data)
                db.add(restaurant)
                db.flush()
                created_restaurants.append((restaurant.id, restaurant.name, restaurant.country))
                print(f"   ✓ Created restaurant: {restaurant_data['name']} ({restaurant_data['country']})")
            else:
                created_restaurants.append((existing.id, existing.name, existing.country))
                print(f"   - {restaurant_data['name']} already exists")
        
        db.commit()
        
        # Create sample menu items
        print("\n4. Creating sample menu items...")
        
        # Menu items for each restaurant
        menu_items_data = {
            "Spice Garden": [
                {"name": "Butter Chicken", "description": "Creamy tomato-based curry with tender chicken", "price": 14.99},
                {"name": "Paneer Tikka Masala", "description": "Grilled cottage cheese in rich gravy", "price": 12.99},
                {"name": "Biryani", "description": "Fragrant rice with spices and meat", "price": 15.99},
                {"name": "Naan Bread", "description": "Traditional Indian flatbread", "price": 3.99},
            ],
            "Curry House": [
                {"name": "Tandoori Chicken", "description": "Charcoal-grilled marinated chicken", "price": 13.99},
                {"name": "Dal Makhani", "description": "Creamy black lentils", "price": 10.99},
                {"name": "Samosas", "description": "Crispy pastries filled with spiced potatoes", "price": 5.99},
                {"name": "Mango Lassi", "description": "Refreshing yogurt drink", "price": 4.99},
            ],
            "American Diner": [
                {"name": "Classic Cheeseburger", "description": "Juicy beef patty with cheese and fixings", "price": 11.99},
                {"name": "BBQ Ribs", "description": "Slow-cooked tender ribs with BBQ sauce", "price": 18.99},
                {"name": "Mac & Cheese", "description": "Creamy macaroni and cheese", "price": 8.99},
                {"name": "Milkshake", "description": "Thick and creamy milkshake", "price": 5.99},
            ],
            "Burger Haven": [
                {"name": "Bacon Burger", "description": "Double patty with crispy bacon", "price": 13.99},
                {"name": "Veggie Burger", "description": "House-made veggie patty", "price": 10.99},
                {"name": "Sweet Potato Fries", "description": "Crispy sweet potato fries", "price": 6.99},
                {"name": "Craft Beer", "description": "Local craft beer on tap", "price": 7.99},
            ],
        }
        
        for restaurant_id, restaurant_name, country in created_restaurants:
            if restaurant_name in menu_items_data:
                for item_data in menu_items_data[restaurant_name]:
                    existing_item = db.query(MenuItem).filter(
                        MenuItem.restaurant_id == restaurant_id,
                        MenuItem.name == item_data["name"]
                    ).first()
                    
                    if not existing_item:
                        menu_item = MenuItem(
                            restaurant_id=restaurant_id,
                            **item_data
                        )
                        db.add(menu_item)
                        print(f"   ✓ Created menu item: {item_data['name']} at {restaurant_name}")
                    else:
                        print(f"   - {item_data['name']} already exists at {restaurant_name}")
        
        db.commit()
        
        print("\n✅ Database initialization complete!")
        print("\n" + "="*50)
        print("SAMPLE LOGIN CREDENTIALS:")
        print("="*50)
        print("\nRoot Admin:")
        print("  Email: admin@nextbite.com")
        print("  Password: Admin@123")
        print("\nSample Users:")
        for user_data in users_data:
            print(f"\n  {user_data['role'].value.upper()} - {user_data['country']}:")
            print(f"    Email: {user_data['email']}")
            print(f"    Password: {user_data['password']}")
        print("\n" + "="*50)
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("="*50)
    print("NextBite Database Initialization")
    print("="*50)
    
    init_db()
    seed_data()
