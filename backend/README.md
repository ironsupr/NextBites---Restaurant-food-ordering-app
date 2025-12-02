# NextBite Backend

FastAPI backend for NextBite food ordering platform with Role-Based Access Control.

## Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL database

### Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
- Database URL
- JWT secret key
- Stripe API keys (test mode)
- SMTP settings for email

3. **Create PostgreSQL database:**
```bash
createdb nextbite
```

4. **Initialize database and seed data:**
```bash
python scripts/init_db.py
```

This will create tables and seed:
- Root admin account
- Sample users (Nick Fury, Captain Marvel, etc.)
- Sample restaurants and menu items

5. **Run the development server:**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## Default Accounts

**Root Admin:**
- Email: `admin@nextbite.com`
- Password: `Admin@123`

**Sample Users:**
- Nick Fury (Admin, USA): `nick.fury@nextbite.com` / `Fury@123`
- Captain Marvel (Manager, India): `captain.marvel@nextbite.com` / `Marvel@123`
- Captain America (Manager, USA): `captain.america@nextbite.com` / `America@123`
- Thanos (Team Member, India): `thanos@nextbite.com` / `Thanos@123`
- Thor (Team Member, India): `thor@nextbite.com` / `Thor@123`
- Travis (Team Member, USA): `travis@nextbite.com` / `Travis@123`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user (default: team_member)
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### User Management (Admin Only)
- `GET /users` - List all users
- `POST /users` - Create user at any role (sends email)
- `GET /users/{id}` - Get user details
- `PATCH /users/{id}/role` - Update user role

### Restaurants (All Roles)
- `GET /restaurants` - List restaurants
- `GET /restaurants/{id}` - Get restaurant details
- `GET /restaurants/{id}/menu` - Get menu items

### Orders
- `POST /orders` - Create order (all roles)
- `GET /orders` - Get user's orders
- `GET /orders/{id}` - Get order details
- `POST /orders/{id}/items` - Add item to cart (all roles)
- `DELETE /orders/{id}/items/{item_id}` - Remove item
- `POST /orders/{id}/checkout` - Checkout (Admin/Manager only)
- `DELETE /orders/{id}` - Cancel order (Admin/Manager only)

### Payment Methods
- `GET /payment-methods` - List payment methods (all roles)
- `POST /payment-methods` - Add payment method (Admin only)
- `PUT /payment-methods/{id}` - Update payment method (Admin only)
- `DELETE /payment-methods/{id}` - Delete payment method (Admin only)

## RBAC Permission Matrix

| Action | Admin | Manager | Team Member |
|--------|-------|---------|-------------|
| View Menu | ✅ | ✅ | ✅ |
| Add to Cart | ✅ | ✅ | ✅ |
| Checkout | ✅ | ✅ | ❌ |
| Cancel Order | ✅ | ✅ | ❌ |
| Manage Payments | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |

## Email Configuration

The application sends email when admin creates new users. Configure SMTP settings in `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@nextbite.com
```

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).

## Stripe Integration

Set up Stripe for payment processing:

1. Create a Stripe account
2. Get test API keys from Stripe Dashboard
3. Add keys to `.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Technology Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Authentication:** JWT tokens
- **Payments:** Stripe
- **Email:** aiosmtplib with Jinja2 templates
