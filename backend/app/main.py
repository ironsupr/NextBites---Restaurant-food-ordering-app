from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import auth, users, restaurants, orders, payment_methods

# Create FastAPI app
app = FastAPI(
    title="NextBite API",
    description="Food ordering platform with Role-Based Access Control",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
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
