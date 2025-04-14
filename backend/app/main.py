from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.utils.config import settings
from app.api.router import router
from app.api.games import game_service

app = FastAPI(
    title="Crypto Higher or Lower API",
    description="Backend API for the Higher or Lower Crypto Challenge game",
    version="0.1.0"
)

# Configure CORS with settings from config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {"message": "Welcome to the Crypto Higher or Lower API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process the data (to be implemented)
            await websocket.send_json({"message": "Message received", "data": data})
    except WebSocketDisconnect:
        # Handle disconnect (to be implemented)
        pass

# Background tasks
@app.on_event("startup")
async def startup_event():
    """
    Start background tasks when the application starts
    """
    # Start the timeout monitor in the background
    import asyncio
    asyncio.create_task(game_service.timeout_monitor())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 