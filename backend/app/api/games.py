from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, List, Optional
from uuid import UUID

from app.services.game_service import GameService
from app.models.player import Player
from app.models.game import Game, GameState

# Create a global instance of the GameService
game_service = GameService()

router = APIRouter()

class PlayerCreate(BaseModel):
    wallet_address: str
    username: Optional[str] = None

class PlayerResponse(BaseModel):
    id: UUID
    wallet_address: str
    username: Optional[str]

class GameResponse(BaseModel):
    id: UUID
    state: str
    player_count: int
    current_round: int
    max_rounds: int

@router.post("/players", response_model=PlayerResponse)
async def create_player(player_data: PlayerCreate):
    """
    Create a new player
    """
    # Check if player with this wallet already exists
    existing_player = game_service.get_player_by_wallet(player_data.wallet_address)
    if existing_player:
        return PlayerResponse(
            id=existing_player.id,
            wallet_address=existing_player.wallet_address,
            username=existing_player.username
        )
    
    # Create new player
    player = game_service.create_player(
        wallet_address=player_data.wallet_address,
        username=player_data.username
    )
    
    return PlayerResponse(
        id=player.id,
        wallet_address=player.wallet_address,
        username=player.username
    )

@router.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: UUID):
    """
    Get player by ID
    """
    player = game_service.get_player(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return PlayerResponse(
        id=player.id,
        wallet_address=player.wallet_address,
        username=player.username
    )

@router.post("/games", response_model=GameResponse)
async def create_game():
    """
    Create a new game
    """
    game = game_service.create_game()
    
    return GameResponse(
        id=game.id,
        state=game.state.value,
        player_count=len(game.players),
        current_round=game.current_round,
        max_rounds=game.max_rounds
    )

@router.post("/games/join/{game_id}", response_model=GameResponse)
async def join_game(game_id: UUID, player_id: UUID):
    """
    Join a specific game
    """
    try:
        game = game_service.join_game(player_id, game_id)
        
        return GameResponse(
            id=game.id,
            state=game.state.value,
            player_count=len(game.players),
            current_round=game.current_round,
            max_rounds=game.max_rounds
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/matchmaking", response_model=GameResponse)
async def find_game(player_id: UUID):
    """
    Join matchmaking to find a game
    """
    try:
        game = game_service.join_game(player_id)
        
        return GameResponse(
            id=game.id,
            state=game.state.value,
            player_count=len(game.players),
            current_round=game.current_round,
            max_rounds=game.max_rounds
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/games", response_model=List[GameResponse])
async def list_active_games():
    """
    List all active games
    """
    games = game_service.get_active_games()
    
    return [
        GameResponse(
            id=game.id,
            state=game.state.value,
            player_count=len(game.players),
            current_round=game.current_round,
            max_rounds=game.max_rounds
        )
        for game in games
    ]

@router.get("/games/{game_id}", response_model=GameResponse)
async def get_game(game_id: UUID):
    """
    Get game by ID
    """
    game = game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return GameResponse(
        id=game.id,
        state=game.state.value,
        player_count=len(game.players),
        current_round=game.current_round,
        max_rounds=game.max_rounds
    )

@router.post("/games/{game_id}/start", response_model=GameResponse)
async def start_game(game_id: UUID):
    """
    Start a game
    """
    try:
        game = game_service.start_game(game_id)
        
        return GameResponse(
            id=game.id,
            state=game.state.value,
            player_count=len(game.players),
            current_round=game.current_round,
            max_rounds=game.max_rounds
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) 