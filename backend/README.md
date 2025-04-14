# Higher or Lower Crypto Challenge - Backend

This is the backend server for the Higher or Lower Crypto Challenge application, built with FastAPI and Python.

## Features

- RESTful API endpoints for game management
- WebSocket server for real-time game updates
- MongoDB integration for storing game data
- Integration with SNAK service for crypto price data

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with the following variables:
```
SNAK_API_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=crypto_game
```

4. Start the server:
```bash
uvicorn app.main:app --reload
```

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

- `app/` - Main application package
  - `main.py` - FastAPI application and routes
  - `models/` - Data models and schemas
  - `services/` - Business logic and external service integrations
  - `utils/` - Utility functions and helpers 