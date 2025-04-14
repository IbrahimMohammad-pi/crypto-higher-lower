from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from typing import Dict, Any, Optional
from uuid import UUID
import json
from pydantic import BaseModel, validator

from app.services.game_service import GameService
from app.services.websocket_manager import connection_manager
from app.api.games import game_service

router = APIRouter()

class GameMessage(BaseModel):
    """
    Model representing a message from a client
    """
    type: str
    game_id: Optional[str] = None
    data: Dict[str, Any] = {}
    
    @validator('type')
    def validate_message_type(cls, v):
        allowed_types = ['join_game', 'leave_game', 'start_game', 'make_choice', 'start_round']
        if v not in allowed_types:
            raise ValueError(f"Message type must be one of: {', '.join(allowed_types)}")
        return v

@router.websocket("/ws/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    """
    WebSocket endpoint for game communication
    """
    try:
        # Validate player ID
        player_uuid = UUID(player_id)
        
        # Check if player exists
        player = game_service.get_player(player_uuid)
        if not player:
            await websocket.close(code=1008, reason="Player not found")
            return
        
        # Accept connection
        await connection_manager.connect(websocket, player_uuid)
        
        # Check if player is in a game and register to it
        if player.current_game_id:
            connection_manager.register_to_game(player.current_game_id, player_uuid)
            
            # Send current game state
            game = game_service.get_game(player.current_game_id)
            if game:
                await connection_manager.send_personal_message(
                    player_uuid,
                    {
                        "type": "game_state",
                        "game_id": str(game.id),
                        "state": game.state.value,
                        "current_round": game.current_round,
                        "max_rounds": game.max_rounds,
                        "players": [
                            {
                                "id": str(p_id),
                                "username": p.username,
                                "score": p.score
                            }
                            for p_id, p in game.players.items()
                        ]
                    }
                )
        
        try:
            # Process messages
            while True:
                # Receive JSON message
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Validate message
                try:
                    message = GameMessage(**message_data)
                except Exception as e:
                    await connection_manager.send_personal_message(
                        player_uuid,
                        {"type": "error", "message": f"Invalid message format: {str(e)}"}
                    )
                    continue
                
                # Process message based on type
                await process_message(player_uuid, message)
                
        except WebSocketDisconnect:
            # Handle disconnection
            connection_manager.disconnect(player_uuid)
            
            # Update player status
            player = game_service.get_player(player_uuid)
            if player:
                player.connected = False
                
                # Notify game participants if player was in a game
                if player.current_game_id:
                    game = game_service.get_game(player.current_game_id)
                    if game:
                        await connection_manager.broadcast_to_game(
                            game.id,
                            {
                                "type": "player_disconnected",
                                "player_id": str(player_uuid)
                            }
                        )
    
    except ValueError:
        # Invalid UUID
        await websocket.close(code=1008, reason="Invalid player ID")
    except Exception as e:
        # Unexpected error
        print(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=1011, reason="Server error")
        except:
            pass

async def process_message(player_id: UUID, message: GameMessage):
    """
    Process a message from a client
    """
    message_type = message.type
    
    # Convert game_id to UUID if provided
    game_id = UUID(message.game_id) if message.game_id else None
    
    if message_type == "join_game":
        # Join a game
        try:
            # Get existing game or create a new one through matchmaking
            if game_id:
                game = game_service.join_game(player_id, game_id)
            else:
                game = game_service.join_game(player_id)
            
            # Register to WebSocket updates
            connection_manager.register_to_game(game.id, player_id)
            
            # Notify other players in the game
            await connection_manager.broadcast_to_game(
                game.id,
                {
                    "type": "player_joined",
                    "game_id": str(game.id),
                    "player": {
                        "id": str(player_id),
                        "username": game.players[player_id].username
                    }
                }
            )
            
            # Send game state to the player
            await connection_manager.send_personal_message(
                player_id,
                {
                    "type": "game_joined",
                    "game_id": str(game.id),
                    "state": game.state.value,
                    "players": [
                        {
                            "id": str(p_id),
                            "username": p.username,
                            "score": p.score
                        }
                        for p_id, p in game.players.items()
                    ]
                }
            )
        except ValueError as e:
            await connection_manager.send_personal_message(
                player_id,
                {"type": "error", "message": str(e)}
            )
    
    elif message_type == "leave_game":
        # Leave a game
        try:
            player = game_service.get_player(player_id)
            if player and player.current_game_id:
                game_id = player.current_game_id
                
                # Leave the game
                game_service.leave_game(player_id)
                
                # Unregister from WebSocket updates
                connection_manager.unregister_from_game(game_id, player_id)
                
                # Notify other players
                await connection_manager.broadcast_to_game(
                    game_id,
                    {
                        "type": "player_left",
                        "game_id": str(game_id),
                        "player_id": str(player_id)
                    }
                )
                
                # Confirm to the player
                await connection_manager.send_personal_message(
                    player_id,
                    {"type": "game_left", "game_id": str(game_id)}
                )
        except Exception as e:
            await connection_manager.send_personal_message(
                player_id,
                {"type": "error", "message": str(e)}
            )
    
    elif message_type == "start_game":
        # Start a game
        try:
            if not game_id:
                raise ValueError("Game ID is required")
            
            # Start the game
            game = game_service.start_game(game_id)
            
            # Notify all players
            await connection_manager.broadcast_to_game(
                game.id,
                {
                    "type": "game_started",
                    "game_id": str(game.id),
                    "rounds": game.max_rounds
                }
            )
        except ValueError as e:
            await connection_manager.send_personal_message(
                player_id,
                {"type": "error", "message": str(e)}
            )
    
    elif message_type == "start_round":
        # Start a round
        try:
            if not game_id:
                raise ValueError("Game ID is required")
            
            # Start the round
            game = game_service.start_round(game_id)
            current_round = game.rounds[game.current_round]
            
            # Notify all players
            await connection_manager.broadcast_to_game(
                game.id,
                {
                    "type": "round_started",
                    "game_id": str(game.id),
                    "round_number": game.current_round + 1,
                    "crypto_pair": {
                        "base_symbol": current_round.crypto_pair.base_symbol,
                        "quote_symbol": current_round.crypto_pair.quote_symbol
                    },
                    "timeout": current_round.round_timeout
                }
            )
        except ValueError as e:
            await connection_manager.send_personal_message(
                player_id,
                {"type": "error", "message": str(e)}
            )
    
    elif message_type == "make_choice":
        # Make a choice in the current round
        try:
            if not game_id:
                raise ValueError("Game ID is required")
            
            # Get choice from message data
            choice = message.data.get("choice")
            if choice not in ["higher", "lower"]:
                raise ValueError("Choice must be 'higher' or 'lower'")
            
            # Submit the choice
            game = game_service.submit_player_choice(player_id, choice)
            
            # Confirm to the player
            await connection_manager.send_personal_message(
                player_id,
                {
                    "type": "choice_received",
                    "game_id": str(game.id),
                    "round_number": game.current_round,
                    "choice": choice
                }
            )
            
            # If the round is completed, notify all players
            current_round = game.current_round - 1  # because it's already incremented
            if current_round < len(game.rounds) and game.rounds[current_round].state.value == "completed":
                round_obj = game.rounds[current_round]
                
                # Prepare player choices
                player_choices = {
                    str(p_id): {
                        "choice": choice.choice,
                        "is_correct": choice.is_correct
                    }
                    for p_id, choice in round_obj.player_choices.items()
                }
                
                await connection_manager.broadcast_to_game(
                    game.id,
                    {
                        "type": "round_completed",
                        "game_id": str(game.id),
                        "round_number": current_round + 1,
                        "crypto_pair": {
                            "base_symbol": round_obj.crypto_pair.base_symbol,
                            "quote_symbol": round_obj.crypto_pair.quote_symbol,
                            "base_price": round_obj.crypto_pair.base_price,
                            "quote_price": round_obj.crypto_pair.quote_price
                        },
                        "player_choices": player_choices,
                        "scores": {
                            str(p_id): p.score
                            for p_id, p in game.players.items()
                        }
                    }
                )
                
                # If the game is completed, notify all players
                if game.state.value == "completed":
                    await connection_manager.broadcast_to_game(
                        game.id,
                        {
                            "type": "game_completed",
                            "game_id": str(game.id),
                            "winner_id": str(game.winner_id) if game.winner_id else None,
                            "scores": {
                                str(p_id): p.score
                                for p_id, p in game.players.items()
                            }
                        }
                    )
        except ValueError as e:
            await connection_manager.send_personal_message(
                player_id,
                {"type": "error", "message": str(e)}
            ) 