from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set, Any, Optional
from uuid import UUID
import json
import asyncio

class ConnectionManager:
    """
    WebSocket connection manager for game sessions
    """
    def __init__(self):
        # Mapping of player_id to websocket
        self.active_connections: Dict[UUID, WebSocket] = {}
        
        # Mapping of game_id to set of player_ids
        self.game_connections: Dict[UUID, Set[UUID]] = {}
        
        # For tracking game updates that need to be sent
        self.message_queue: asyncio.Queue = asyncio.Queue()
    
    async def connect(self, websocket: WebSocket, player_id: UUID):
        """
        Connect a player's websocket
        """
        await websocket.accept()
        self.active_connections[player_id] = websocket
        
        await self.send_personal_message(
            player_id=player_id,
            message={
                "type": "connection_established",
                "player_id": str(player_id)
            }
        )
    
    def disconnect(self, player_id: UUID):
        """
        Disconnect a player's websocket
        """
        if player_id in self.active_connections:
            del self.active_connections[player_id]
            
            # Remove player from game connections
            for game_id, players in self.game_connections.items():
                if player_id in players:
                    players.remove(player_id)
    
    async def send_personal_message(self, player_id: UUID, message: Dict[str, Any]):
        """
        Send a message to a specific player
        """
        if player_id in self.active_connections:
            try:
                await self.active_connections[player_id].send_json(message)
            except Exception:
                # Handle connection errors
                self.disconnect(player_id)
    
    async def broadcast_to_game(self, game_id: UUID, message: Dict[str, Any], exclude: Optional[UUID] = None):
        """
        Broadcast a message to all players in a game
        """
        if game_id in self.game_connections:
            for player_id in self.game_connections[game_id]:
                if exclude and player_id == exclude:
                    continue
                
                await self.send_personal_message(player_id, message)
    
    def register_to_game(self, game_id: UUID, player_id: UUID):
        """
        Register a player as connected to a game
        """
        if game_id not in self.game_connections:
            self.game_connections[game_id] = set()
        
        self.game_connections[game_id].add(player_id)
    
    def unregister_from_game(self, game_id: UUID, player_id: UUID):
        """
        Unregister a player from a game
        """
        if game_id in self.game_connections:
            if player_id in self.game_connections[game_id]:
                self.game_connections[game_id].remove(player_id)
            
            # Remove game if no players left
            if not self.game_connections[game_id]:
                del self.game_connections[game_id]
    
    async def queue_game_event(self, game_id: UUID, event_type: str, data: Dict[str, Any]):
        """
        Queue a game event to be sent to all players in the game
        """
        message = {
            "type": event_type,
            "game_id": str(game_id),
            "data": data
        }
        
        await self.message_queue.put((game_id, message))
    
    async def message_processor(self):
        """
        Background task to process the message queue
        """
        while True:
            try:
                game_id, message = await self.message_queue.get()
                await self.broadcast_to_game(game_id, message)
                self.message_queue.task_done()
            except Exception as e:
                print(f"Error processing WebSocket message: {str(e)}")
                # Continue processing next message
                continue

# Create a singleton instance
connection_manager = ConnectionManager() 