from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Tuple
from enum import Enum
from uuid import UUID, uuid4
import time
import random
from app.models.player import Player

class GameState(str, Enum):
    """
    Enum representing the various states of a game
    """
    WAITING = "waiting"           # Waiting for players to join
    STARTING = "starting"         # Game about to start
    IN_PROGRESS = "in_progress"   # Game in progress
    ROUND_END = "round_end"       # Current round ended
    COMPLETED = "completed"       # Game completed
    CANCELLED = "cancelled"       # Game cancelled

class RoundState(str, Enum):
    """
    Enum representing the state of a game round
    """
    READY = "ready"               # Round is ready to start
    WAITING = "waiting"           # Waiting for player choices
    COMPLETED = "completed"       # Round completed

class CryptoPair(BaseModel):
    """
    Model representing a pair of cryptocurrencies for comparison
    """
    base_symbol: str
    quote_symbol: str
    base_price: Optional[float] = None
    quote_price: Optional[float] = None
    
    @property
    def is_base_higher(self) -> bool:
        """Check if base cryptocurrency price is higher than quote"""
        if self.base_price is None or self.quote_price is None:
            raise ValueError("Prices not yet fetched")
        return self.base_price > self.quote_price

class PlayerChoice(BaseModel):
    """
    Model representing a player's choice in a round
    """
    player_id: UUID
    choice: str  # "higher" or "lower"
    timestamp: float = Field(default_factory=time.time)
    is_correct: Optional[bool] = None
    
    @property
    def response_time(self) -> float:
        """Return the response time from round start"""
        return self.timestamp - self.round_start_time
    
    round_start_time: float = 0

class Round(BaseModel):
    """
    Model representing a single round in the game
    """
    id: int
    crypto_pair: CryptoPair
    state: RoundState = RoundState.READY
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    player_choices: Dict[UUID, PlayerChoice] = {}
    round_timeout: int = 30  # seconds
    
    @property
    def time_remaining(self) -> float:
        """Calculate remaining time in the round"""
        if self.start_time is None or self.state != RoundState.WAITING:
            return 0
        elapsed = time.time() - self.start_time
        return max(0, self.round_timeout - elapsed)
    
    @property
    def is_timed_out(self) -> bool:
        """Check if the round has timed out"""
        return self.time_remaining <= 0 and self.state == RoundState.WAITING

class Game(BaseModel):
    """
    Model representing a game session
    """
    id: UUID = Field(default_factory=uuid4)
    players: Dict[UUID, Player] = {}
    state: GameState = GameState.WAITING
    rounds: List[Round] = []
    current_round: int = 0
    max_rounds: int = 5
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    winner_id: Optional[UUID] = None
    crypto_symbols: List[str] = [
        "BTC", "ETH", "SOL", "AVAX", "USDT", 
        "BNB", "XRP", "ADA", "DOGE", "MATIC",
        "DOT", "UNI", "LINK", "ATOM", "LTC"
    ]
    stake_amount: Optional[str] = None
    
    def add_player(self, player: Player) -> None:
        """Add a player to the game"""
        if len(self.players) >= 2:
            raise ValueError("Game already has maximum number of players")
        
        self.players[player.id] = player
        player.current_game_id = self.id
        player.score = 0
        self.updated_at = time.time()
    
    def remove_player(self, player_id: UUID) -> None:
        """Remove a player from the game"""
        if player_id in self.players:
            player = self.players[player_id]
            player.current_game_id = None
            del self.players[player_id]
            
            # Cancel game if it was in progress
            if self.state in [GameState.STARTING, GameState.IN_PROGRESS, GameState.ROUND_END]:
                self.state = GameState.CANCELLED
                
            self.updated_at = time.time()
    
    def start_game(self) -> None:
        """Start the game if requirements are met"""
        if len(self.players) != 2:
            raise ValueError("Game requires exactly 2 players to start")
        
        if self.state != GameState.WAITING:
            raise ValueError(f"Cannot start game in {self.state} state")
        
        # Generate rounds with random crypto pairs
        self.generate_rounds()
        
        self.state = GameState.STARTING
        self.updated_at = time.time()
    
    def generate_rounds(self) -> None:
        """Generate random cryptocurrency pairs for all rounds"""
        self.rounds = []
        
        # Make sure we have enough symbols for all rounds
        if len(self.crypto_symbols) < 2 * self.max_rounds:
            raise ValueError(f"Not enough crypto symbols for {self.max_rounds} rounds")
        
        # Create a copy of symbols to avoid modifying the original list
        available_symbols = self.crypto_symbols.copy()
        
        for i in range(self.max_rounds):
            # Select two random symbols for this round
            base_symbol = random.choice(available_symbols)
            available_symbols.remove(base_symbol)
            
            quote_symbol = random.choice(available_symbols)
            available_symbols.remove(quote_symbol)
            
            # Create crypto pair and round
            crypto_pair = CryptoPair(
                base_symbol=base_symbol,
                quote_symbol=quote_symbol
            )
            
            round_obj = Round(
                id=i + 1,
                crypto_pair=crypto_pair
            )
            
            self.rounds.append(round_obj)
    
    def start_round(self) -> Round:
        """Start the current round"""
        if self.state not in [GameState.STARTING, GameState.ROUND_END]:
            raise ValueError(f"Cannot start round in {self.state} state")
        
        if self.current_round >= len(self.rounds):
            raise ValueError("No more rounds to play")
        
        # Get the current round
        round_obj = self.rounds[self.current_round]
        round_obj.state = RoundState.WAITING
        round_obj.start_time = time.time()
        
        # Clear any previous choices
        round_obj.player_choices = {}
        
        # Update game state
        self.state = GameState.IN_PROGRESS
        self.updated_at = time.time()
        
        return round_obj
    
    def submit_choice(self, player_id: UUID, choice: str) -> None:
        """Submit a player's choice for the current round"""
        if self.state != GameState.IN_PROGRESS:
            raise ValueError(f"Cannot submit choice in {self.state} state")
        
        if player_id not in self.players:
            raise ValueError("Player not in this game")
        
        if self.current_round >= len(self.rounds):
            raise ValueError("No active round")
        
        round_obj = self.rounds[self.current_round]
        
        if round_obj.state != RoundState.WAITING:
            raise ValueError(f"Cannot submit choice in round state {round_obj.state}")
        
        if player_id in round_obj.player_choices:
            raise ValueError("Player already submitted a choice for this round")
        
        # Create and store the player's choice
        player_choice = PlayerChoice(
            player_id=player_id,
            choice=choice,
            timestamp=time.time(),
            round_start_time=round_obj.start_time or time.time()
        )
        
        round_obj.player_choices[player_id] = player_choice
        self.updated_at = time.time()
        
        # Check if all players have made a choice
        if len(round_obj.player_choices) == len(self.players):
            self.end_round()
    
    def end_round(self) -> None:
        """End the current round and evaluate results"""
        if self.state != GameState.IN_PROGRESS:
            raise ValueError(f"Cannot end round in {self.state} state")
        
        if self.current_round >= len(self.rounds):
            raise ValueError("No active round")
        
        round_obj = self.rounds[self.current_round]
        round_obj.state = RoundState.COMPLETED
        round_obj.end_time = time.time()
        
        # Evaluate choices and update scores if prices are available
        crypto_pair = round_obj.crypto_pair
        if crypto_pair.base_price is not None and crypto_pair.quote_price is not None:
            base_higher = crypto_pair.is_base_higher
            
            for player_id, choice in round_obj.player_choices.items():
                # Determine if the choice was correct
                is_correct = (
                    (choice.choice == "higher" and base_higher) or
                    (choice.choice == "lower" and not base_higher)
                )
                
                choice.is_correct = is_correct
                
                # Award points if correct
                if is_correct:
                    self.players[player_id].score += 1
        
        # Move to next round or end game
        self.current_round += 1
        
        if self.current_round >= self.max_rounds:
            self.end_game()
        else:
            self.state = GameState.ROUND_END
            
        self.updated_at = time.time()
    
    def end_game(self) -> None:
        """End the game and determine the winner"""
        self.state = GameState.COMPLETED
        
        # Find the player with the highest score
        max_score = -1
        winner_id = None
        
        for player_id, player in self.players.items():
            if player.score > max_score:
                max_score = player.score
                winner_id = player_id
        
        self.winner_id = winner_id
        self.updated_at = time.time()
    
    def is_inactive(self, timeout_seconds: int = 300) -> bool:
        """Check if the game is inactive based on last update time"""
        return time.time() - self.updated_at > timeout_seconds 