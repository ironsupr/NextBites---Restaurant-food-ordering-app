# NextBite Backend Setup Guide

## ✅ What's Been Implemented

The complete FastAPI backend is ready with:

### Core Features
- ✅ **JWT Authentication** - Login, logout, register with token management
- ✅ **Role-Based Access Control (RBAC)** - 3 roles with permission matrix
- ✅ **Email Notifications** - Sends credentials when admin creates users
- ✅ **Stripe Payments** - Test mode integration for checkout
- ✅ **Database Models** - All 6 models with relationships

### API Endpoints
- ✅ **Auth Routes** - Register, login, logout, current user
- ✅ **User Management** - Admin can create/update users and roles
- ✅ **Restaurants** - Browse restaurants and menus (all roles)
- ✅ **Orders** - Create cart, add items (all), checkout/cancel (admin/manager only)
- ✅ **Payments** - Manage payment methods (admin only)

## 🚀 Next Steps to Run Backend

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up PostgreSQL Database
```bash
# Create database (you may need to install PostgreSQL first)
createdb nextbite

# Or use existing PostgreSQL instance and update DATABASE_URL in .env
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

**Important settings to configure:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET_KEY` - A random secret key
- `STRIPE_SECRET_KEY` & `STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard (test mode)
- `SMTP_*` settings - For email notifications (optional for testing)

### 4. Initialize Database
```bash
# This creates tables and seeds sample data
python scripts/init_db.py
```

This will create:
- Root admin account: `admin@nextbite.com` / `Admin@123`
- Sample users (Nick Fury, etc.)
- Sample restaurants and menu items

### 5. Run Development Server
```bash
uvicorn app.main:app --reload
```

Backend will be at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

## 🔑 Default Accounts

| Role | Email | Password | Country |
|------|-------|----------|---------|
| Admin | admin@nextbite.com | Admin@123 | USA |
| Admin | nick.fury@nextbite.com | Fury@123 | USA |
| Manager | captain.marvel@nextbite.com | Marvel@123 | India |
| Manager | captain.america@nextbite.com | America@123 | USA |
| Team Member | thanos@nextbite.com | Thanos@123 | India |
| Team Member | thor@nextbite.com | Thor@123 | India |
| Team Member | travis@nextbite.com | Travis@123 | USA |

## 📋 RBAC Permission Matrix

| Functionality | Admin | Manager | Team Member |
|--------------|-------|---------|-------------|
| View Menu | ✅ | ✅ | ✅ |
| Add Items (Create Order) | ✅ | ✅ | ✅ |
| Checkout & Pay | ✅ | ✅ | ❌ |
| Cancel Order | ✅ | ✅ | ❌ |
| Update Payment Method | ✅ | ❌ | ❌ |
| Manage Users (create/update roles) | ✅ | ❌ | ❌ |

## 🎯 Testing RBAC

1. **As Team Member** (`thanos@nextbite.com`):
   - ✅ Can view restaurants and menus
   - ✅ Can create orders and add items to cart
   - ❌ Cannot checkout (403 Forbidden)
   - ❌ Cannot cancel orders

2. **As Manager** (`captain.marvel@nextbite.com`):
   - ✅ Can do everything Team Member can
   - ✅ Can checkout orders
   - ✅ Can cancel orders
   - ❌ Cannot manage payment methods
   - ❌ Cannot manage users

3. **As Admin** (`admin@nextbite.com`):
   - ✅ Full access to all features
   - ✅ Can manage payment methods
   - ✅ Can create users and assign roles
   - ✅ Can upgrade/downgrade user roles

## 📧 Email Feature

When admin creates a new user via `POST /users`:
- User receives email with login credentials
- Email contains: email, password, and role
- Configure SMTP settings in `.env` to enable

**For Gmail:**
1. Enable 2FA on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password in `SMTP_PASSWORD`

## 💳 Stripe Setup

1. Create account at https://stripe.com
2. Get test API keys from Dashboard
3. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Use test credit cards from: https://stripe.com/docs/testing

## 🐛 Troubleshooting

**Can't connect to database:**
- Make sure PostgreSQL is running
- Check DATABASE_URL is correct
- Database `nextbite` must exist

**Import errors:**
- Run `pip install -r requirements.txt`
- Make sure you're in the backend directory

**Email not sending:**
- Email errors won't block user creation
- Check SMTP settings in `.env`
- Check terminal for email error logs

## 📦 Project Structure

```
backend/
├── app/
│   ├── core/           # Config, security, RBAC
│   ├── db/             # Database connection
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth middleware
│   ├── services/       # Email service
│   └── main.py         # FastAPI app
├── scripts/
│   └── init_db.py      # Database initialization
├── requirements.txt
├── .env.example
└── README.md
```

## ✨ What's Next?

The backend is complete! You can:
1. Test all endpoints using Swagger UI at `/docs`
2. Move on to frontend implementation
3. Add location-based segregation (Phase 2) later
