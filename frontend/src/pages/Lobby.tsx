import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';
import { useWallet } from '../contexts/WalletContext';

const Lobby = () => {
  const [gameId, setGameId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleJoinGame = () => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    if (gameId.trim() === '') {
      setErrorMessage('Please enter a valid game ID');
      return;
    }

    // Here you would validate if the game exists
    // For now, just navigate to the game page
    navigate(`/game/${gameId}`);
  };

  const handleCreateGame = () => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    // Generate a random game ID (in a real app, this would come from the backend)
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/game/${newGameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Game Lobby</h1>
          <div className="flex items-center space-x-4">
            <WalletConnect />
            <Link 
              to="/" 
              className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-300"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Join a Game</h2>
            <p className="mb-4">Enter a game ID to join an existing game.</p>
            <div className="mb-4">
              <input
                type="text"
                value={gameId}
                onChange={(e) => {
                  setGameId(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter Game ID"
                className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleJoinGame}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-bold transition-all duration-300"
            >
              Join Game
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Create a Game</h2>
            <p className="mb-4">Start a new game and invite friends to join.</p>
            <div className="mb-4">
              <p className="text-gray-300">
                Creating a new game will generate a unique Game ID that you can share with your friends.
              </p>
            </div>
            <button
              onClick={handleCreateGame}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 rounded-lg font-bold transition-all duration-300"
            >
              Create New Game
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Recent Games</h2>
          <div className="text-gray-400 italic">
            You haven't played any games recently.
          </div>
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/how-to-play" 
            className="text-blue-400 hover:text-blue-300 underline transition-colors duration-300"
          >
            Need help? Check out the How to Play guide
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Lobby; 