from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID, uuid4

class Player(BaseModel):
    """
    Player model representing a participant in a game
    """
    id: UUID = Field(default_factory=uuid4)
    wallet_address: str
    username: Optional[str] = None
    
    # Connection info
    connected: bool = True
    last_active: float = Field(default_factory=lambda: __import__('time').time())
    
    # Game-related data
    current_game_id: Optional[UUID] = None
    score: int = 0
    
    class Config:
        frozen = False 