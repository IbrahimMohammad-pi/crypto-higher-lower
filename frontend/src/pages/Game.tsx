import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';
import { useWallet } from '../contexts/WalletContext';
import { getPrice } from '../services/api';
import '../styles/Game.css';

interface CryptoCurrency {
  symbol: string;
  price: number | null;
}

const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'BNB', 'ADA', 'DOT', 'LINK', 'XRP', 'DOGE'];

const Game: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [maxRounds] = useState<number>(5);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [currentSymbol, setCurrentSymbol] = useState<string>('');
  const [nextSymbol, setNextSymbol] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [userGuess, setUserGuess] = useState<'higher' | 'lower' | null>(null);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | null>(null);
  const [revealNext, setRevealNext] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [nextPrice, setNextPrice] = useState<number | null>(null);

  // Reset game on wallet disconnect
  useEffect(() => {
    if (!isConnected && gameStarted) {
      navigate('/');
    }
  }, [isConnected, gameStarted, navigate]);

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameEnded(false);
    setPlayerScore(0);
    setOpponentScore(0);
    setCurrentRound(1);
    startRound();
  };

  // Start a new round
  const startRound = async () => {
    setIsLoading(true);
    setError(null);
    setUserGuess(null);
    setRoundResult(null);
    setRevealNext(false);
    setCurrentPrice(null);
    setNextPrice(null);

    try {
      // Select random symbols for the round
      const availableSymbols = [...SUPPORTED_SYMBOLS];
      const randomIndex = Math.floor(Math.random() * availableSymbols.length);
      const symbol = availableSymbols[randomIndex];
      availableSymbols.splice(randomIndex, 1);
      
      const nextRandomIndex = Math.floor(Math.random() * availableSymbols.length);
      const nextSymbol = availableSymbols[nextRandomIndex];
      
      setCurrentSymbol(symbol);
      setNextSymbol(nextSymbol);
      
      // Fetch price for current symbol
      const priceData = await getPrice(symbol);
      setCurrentPrice(priceData.price);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price data');
      setIsLoading(false);
    }
  };

  // Handle user's guess
  const makeGuess = (guess: 'higher' | 'lower') => {
    setUserGuess(guess);
    setIsLoading(true);
    
    // Simulate opponent making a choice (50/50 chance)
    setTimeout(() => {
      endRound(guess);
    }, 1000);
  };

  // End the current round and determine the winner
  const endRound = async (guess: 'higher' | 'lower') => {
    try {
      // Fetch next symbol's price
      const priceData = await getPrice(nextSymbol);
      setNextPrice(priceData.price);
      
      // Determine if user won the round
      const isHigher = priceData.price > (currentPrice || 0);
      const userWon = (guess === 'higher' && isHigher) || (guess === 'lower' && !isHigher);
      
      setRoundResult(userWon ? 'win' : 'lose');
      
      // Update scores
      if (userWon) {
        setPlayerScore(prevScore => prevScore + 1);
      } else {
        setOpponentScore(prevScore => prevScore + 1);
      }
      
      setRevealNext(true);
      setIsLoading(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch next price');
      setIsLoading(false);
    }
  };

  // Continue to next round or end game
  const continueGame = () => {
    if (currentRound < maxRounds) {
      setCurrentRound(prevRound => prevRound + 1);
      startRound();
    } else {
      setGameEnded(true);
    }
  };

  // Return to lobby
  const returnToLobby = () => {
    navigate('/lobby');
  };

  // Format price for display
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="game-container">
      <h1>Crypto Higher-Lower</h1>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={startRound}>Try Again</button>
        </div>
      )}
      
      {!gameStarted && !gameEnded && (
        <div className="start-screen">
          <h2>Ready to Play?</h2>
          <p>Guess whether the next cryptocurrency is higher or lower in price.</p>
          <button onClick={startGame}>Start Game</button>
        </div>
      )}
      
      {gameStarted && !gameEnded && (
        <div className="game-screen">
          <div className="game-header">
            <div className="round-info">Round {currentRound} of {maxRounds}</div>
            <div className="score-display">
              <span>You: {playerScore}</span>
              <span>Opponent: {opponentScore}</span>
            </div>
          </div>
          
          <div className="crypto-cards">
            <div className="crypto-card current">
              <h3>{currentSymbol}</h3>
              {isLoading && !currentPrice ? (
                <div className="loading">Loading price...</div>
              ) : (
                <div className="price">{formatPrice(currentPrice)}</div>
              )}
            </div>
            
            <div className="crypto-card next">
              <h3>{nextSymbol}</h3>
              {revealNext ? (
                <div className="price">{formatPrice(nextPrice)}</div>
              ) : (
                <div className="price unknown">?</div>
              )}
            </div>
          </div>
          
          {!userGuess && !isLoading && currentPrice && (
            <div className="guess-buttons">
              <button 
                onClick={() => makeGuess('higher')} 
                className="higher-button"
              >
                Higher
              </button>
              <button 
                onClick={() => makeGuess('lower')} 
                className="lower-button"
              >
                Lower
              </button>
            </div>
          )}
          
          {isLoading && userGuess && (
            <div className="loading-message">
              Checking prices...
            </div>
          )}
          
          {roundResult && (
            <div className={`round-result ${roundResult}`}>
              <h3>{roundResult === 'win' ? 'You won this round!' : 'You lost this round!'}</h3>
              <button onClick={continueGame}>
                {currentRound < maxRounds ? 'Next Round' : 'See Results'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {gameEnded && (
        <div className="end-screen">
          <h2>Game Over</h2>
          <div className="final-score">
            <p>Your Score: {playerScore}</p>
            <p>Opponent Score: {opponentScore}</p>
            <h3>
              {playerScore > opponentScore
                ? 'You Won!'
                : playerScore < opponentScore
                ? 'You Lost!'
                : 'It\'s a Tie!'}
            </h3>
          </div>
          <div className="end-buttons">
            <button onClick={startGame}>Play Again</button>
            <button onClick={returnToLobby}>Return to Lobby</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game; 