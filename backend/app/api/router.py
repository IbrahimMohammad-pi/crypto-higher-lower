from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.api import games, crypto, ws

# Create main API router
router = APIRouter()

# Include game management routes
router.include_router(games.router, prefix="/games", tags=["games"])

# Include crypto/SNAK integration routes
router.include_router(crypto.router, prefix="/crypto", tags=["crypto"])

# Include WebSocket routes
router.include_router(ws.router, tags=["websocket"])

# Health check endpoint
@router.get("/health", tags=["healthcheck"])
async def health(request: Request):
    """
    Health check endpoint to verify API status
    """
    return JSONResponse({"status": "healthy", "service": "Crypto Higher-Lower Game API"}) 