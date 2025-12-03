from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, users, restaurants, orders, payment_methods
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend for NextBite Food Ordering Platform",
    version="1.0.0",
    redirect_slashes=False  # Prevent redirects that lose auth headers
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(restaurants.router)
app.include_router(orders.router)
app.include_router(payment_methods.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to NextBite API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
