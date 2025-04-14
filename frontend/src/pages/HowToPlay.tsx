import { Link } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';

const HowToPlay = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">How To Play</h1>
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

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Game Overview</h2>
          <p className="mb-4">
            Crypto Higher-Lower is a multiplayer game where you predict whether one cryptocurrency's 
            price is higher or lower than another. Earn points for correct predictions and win by 
            having the highest score at the end of 5 rounds.
          </p>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Requirements:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>A Starknet wallet (like Argent X or Braavos)</li>
              <li>A small amount of ETH on Starknet for gas fees</li>
              <li>Crypto knowledge is helpful but not required!</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">How to Start Playing</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <span className="font-bold">Connect your wallet</span> - Click the "Connect Wallet" button 
              in the top right corner to connect your Starknet wallet.
            </li>
            <li>
              <span className="font-bold">Join or create a game</span> - From the lobby, you can either 
              create a new game or join an existing one using a game ID.
            </li>
            <li>
              <span className="font-bold">Play rounds</span> - Each game consists of 5 rounds where you'll 
              compare two cryptocurrencies and predict which has the higher price.
            </li>
            <li>
              <span className="font-bold">Earn points</span> - Each correct prediction earns you 10 points.
              The player with the most points after 5 rounds wins!
            </li>
          </ol>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Gameplay Rules</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>Each round lasts 10 seconds - decide quickly!</li>
            <li>You can only make one choice per round.</li>
            <li>If you don't make a choice before the timer runs out, you'll receive 0 points for that round.</li>
            <li>The correct answer is determined by the real-time price of each cryptocurrency.</li>
            <li>Prices are fetched from reliable cryptocurrency price APIs.</li>
            <li>In case of a tie (extremely rare), both players receive 5 points.</li>
          </ul>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Tips & Strategies</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>Stay informed about current market trends and cryptocurrency news.</li>
            <li>Remember that higher market cap coins (like BTC and ETH) typically have higher prices than newer altcoins.</li>
            <li>Some coins have very similar prices - these comparisons can be challenging!</li>
            <li>Don't overthink it - sometimes a quick gut decision works best when the timer is running down.</li>
            <li>Have fun! This game is designed to be entertaining while also teaching you about crypto market prices.</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/lobby" 
            className="py-3 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-bold transition-all duration-300 inline-block"
          >
            Go to Lobby
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay; 