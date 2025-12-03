# NextBite - Food Ordering Application

NextBite is a modern, full-stack food ordering application built with FastAPI (Backend) and React (Frontend). It features role-based access control, real-time cart management, Stripe payment integration, and a responsive UI.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.8+**
- **Node.js 16+** & **npm**
- **PostgreSQL** (Running locally or accessible remotely)

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. Backend Setup

The backend is built with FastAPI and handles authentication, database interactions, and payments.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    *   **Windows (PowerShell):**
        ```powershell
        python -m venv venv
        .\venv\Scripts\Activate
        ```
    *   **macOS/Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Open `.env` and update the following:
        *   `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgresql://user:password@localhost/nextbite`).
        *   `JWT_SECRET_KEY`: Generate a secure random string.
        *   `STRIPE_SECRET_KEY` & `STRIPE_PUBLISHABLE_KEY`: Your Stripe test keys (optional for basic browsing, required for checkout).

5.  **Initialize the Database:**
    This script creates tables and seeds sample data (users, restaurants, menu items).
    ```bash
    python scripts/init_db.py
    ```

6.  **Run the Backend Server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend will be available at `http://localhost:8000`.
    *   **API Docs:** `http://localhost:8000/docs`

---

### 2. Frontend Setup

The frontend is a React application built with Vite and Tailwind CSS.

1.  **Open a new terminal and navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`.

---

## 🔑 Default Test Accounts

The database initialization script creates the following accounts for testing:

| # | Email | Password | Role | Country | Permissions |
|---|-------|----------|------|---------|-------------|
| 1 | `nick.fury@nextbite.com` | `Fury@123` | **Admin** | USA | Full access - Manage users, payments, restaurants, orders |
| 2 | `captain.marvel@nextbite.com` | `Marvel@123` | **Manager** | India | Checkout orders, Cancel orders, View all carts |
| 3 | `captain.america@nextbite.com` | `America@123` | **Manager** | USA | Checkout orders, Cancel orders, View all carts |
| 4 | `thanos@nextbite.com` | `Thanos@123` | **Team Member** | India | Browse restaurants, Create orders, Checkout own orders |
| 5 | `thor@nextbite.com` | `Thor@123` | **Team Member** | India | Browse restaurants, Create orders, Checkout own orders |
| 6 | `travis@nextbite.com` | `Travis@123` | **Team Member** | USA | Browse restaurants, Create orders, Checkout own orders |

---

## 🛠️ Troubleshooting

*   **Database Connection Error:** Ensure PostgreSQL is running and the `DATABASE_URL` in `backend/.env` is correct.
*   **Frontend API Errors:** Ensure the backend is running on port `8000`. The frontend is configured to proxy requests or point to this port.
*   **Stripe Errors:** If checkout fails, ensure valid Stripe Test keys are in `backend/.env`.

## 📚 Tech Stack

*   **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Pydantic, Stripe API
*   **Frontend:** React, Vite, Tailwind CSS, TanStack Query, Lucide React
