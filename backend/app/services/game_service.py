from typing import Dict, List, Optional, Union
from uuid import UUID
import time
import asyncio
from datetime import datetime

from app.models.player import Player
from app.models.game import Game, GameState, RoundState, CryptoPair

class GameService:
    """
    Service for managing game sessions and matchmaking
    """
    def __init__(self):
        self.games: Dict[UUID, Game] = {}
        self.players: Dict[UUID, Player] = {}
        self.waiting_game: Optional[UUID] = None
        self.inactive_timeout = 300  # seconds (5 minutes)
    
    def create_player(self, wallet_address: str, username: Optional[str] = None) -> Player:
        """
        Create a new player with the given wallet address
        """
        player = Player(wallet_address=wallet_address, username=username)
        self.players[player.id] = player
        return player
    
    def get_player(self, player_id: UUID) -> Optional[Player]:
        """
        Get a player by ID
        """
        return self.players.get(player_id)
    
    def get_player_by_wallet(self, wallet_address: str) -> Optional[Player]:
        """
        Get a player by wallet address
        """
        for player in self.players.values():
            if player.wallet_address.lower() == wallet_address.lower():
                return player
        return None
    
    def create_game(self, stake_amount: Optional[str] = None) -> Game:
        """
        Create a new game
        """
        game = Game(stake_amount=stake_amount)
        self.games[game.id] = game
        return game
    
    def get_game(self, game_id: UUID) -> Optional[Game]:
        """
        Get a game by ID
        """
        return self.games.get(game_id)
    
    def join_game(self, player_id: UUID, game_id: Optional[UUID] = None) -> Game:
        """
        Join a player to a game or find a game to join
        """
        player = self.get_player(player_id)
        if not player:
            raise ValueError("Player not found")
        
        # If player is already in a game, remove them from it
        if player.current_game_id:
            self.leave_game(player_id)
        
        # If game_id is provided, join that specific game
        if game_id:
            game = self.get_game(game_id)
            if not game:
                raise ValueError("Game not found")
            
            game.add_player(player)
            return game
        
        # Otherwise, look for a waiting game or create a new one
        if self.waiting_game:
            game = self.get_game(self.waiting_game)
            if game and game.state == GameState.WAITING and len(game.players) < 2:
                game.add_player(player)
                
                # If game is now full, clear waiting game
                if len(game.players) == 2:
                    self.waiting_game = None
                
                return game
            else:
                # Invalid waiting game, clear it
                self.waiting_game = None
        
        # Create a new game
        game = self.create_game()
        game.add_player(player)
        self.waiting_game = game.id
        
        return game
    
    def leave_game(self, player_id: UUID) -> None:
        """
        Remove a player from their current game
        """
        player = self.get_player(player_id)
        if not player or not player.current_game_id:
            return
        
        game = self.get_game(player.current_game_id)
        if game:
            game.remove_player(player_id)
            
            # If this was the waiting game and it's now empty, clear it
            if self.waiting_game == game.id and len(game.players) == 0:
                self.waiting_game = None
    
    def start_game(self, game_id: UUID) -> Game:
        """
        Start a game if it's ready
        """
        game = self.get_game(game_id)
        if not game:
            raise ValueError("Game not found")
        
        game.start_game()
        return game
    
    def get_active_games(self) -> List[Game]:
        """
        Get all games that are currently active
        """
        return [
            game for game in self.games.values() 
            if game.state in [GameState.WAITING, GameState.STARTING, GameState.IN_PROGRESS, GameState.ROUND_END]
        ]
    
    def get_player_game(self, player_id: UUID) -> Optional[Game]:
        """
        Get the game a player is currently in
        """
        player = self.get_player(player_id)
        if not player or not player.current_game_id:
            return None
        
        return self.get_game(player.current_game_id)
    
    def submit_player_choice(self, player_id: UUID, choice: str) -> Game:
        """
        Submit a player's choice for the current round
        """
        game = self.get_player_game(player_id)
        if not game:
            raise ValueError("Player not in a game")
        
        # Update player's last active time
        player = self.get_player(player_id)
        if player:
            player.last_active = time.time()
        
        game.submit_choice(player_id, choice)
        return game
    
    def start_round(self, game_id: UUID) -> Game:
        """
        Start the next round in a game
        """
        game = self.get_game(game_id)
        if not game:
            raise ValueError("Game not found")
        
        game.start_round()
        return game
    
    def update_round_prices(self, game_id: UUID, base_price: float, quote_price: float) -> Game:
        """
        Update the prices for the current round's crypto pair
        """
        game = self.get_game(game_id)
        if not game:
            raise ValueError("Game not found")
        
        if game.current_round >= len(game.rounds):
            raise ValueError("No active round")
        
        round_obj = game.rounds[game.current_round]
        round_obj.crypto_pair.base_price = base_price
        round_obj.crypto_pair.quote_price = quote_price
        
        return game
    
    def check_timeouts(self) -> List[Game]:
        """
        Check for timed out rounds and inactive games
        """
        now = time.time()
        updated_games = []
        
        for game in self.games.values():
            # Skip completed or cancelled games
            if game.state in [GameState.COMPLETED, GameState.CANCELLED]:
                continue
            
            # Check for inactive games
            if game.is_inactive(self.inactive_timeout):
                game.state = GameState.CANCELLED
                updated_games.append(game)
                continue
            
            # Check for timed out rounds
            if game.state == GameState.IN_PROGRESS and game.current_round < len(game.rounds):
                round_obj = game.rounds[game.current_round]
                if round_obj.is_timed_out:
                    game.end_round()
                    updated_games.append(game)
        
        return updated_games
    
    async def timeout_monitor(self, check_interval: int = 5):
        """
        Background task to monitor timeouts
        """
        while True:
            self.check_timeouts()
            await asyncio.sleep(check_interval)
    
    def cleanup_old_games(self, max_age: int = 86400) -> int:
        """
        Remove completed and cancelled games older than max_age seconds (default: 24 hours)
        """
        now = time.time()
        count = 0
        
        game_ids = list(self.games.keys())
        for game_id in game_ids:
            game = self.games[game_id]
            
            if (game.state in [GameState.COMPLETED, GameState.CANCELLED] and
                now - game.updated_at > max_age):
                # Remove references to this game from players
                for player_id in game.players:
                    player = self.get_player(player_id)
                    if player and player.current_game_id == game_id:
                        player.current_game_id = None
                
                # Remove the game
                del self.games[game_id]
                count += 1
        
        return count 