import { Link } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col p-4">
      <div className="flex justify-end p-4">
        <WalletConnect />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Crypto Higher-Lower
        </h1>
        <p className="text-xl mb-8 max-w-2xl text-center text-gray-300">
          Test your crypto knowledge! Predict whether the price of one cryptocurrency 
          is higher or lower than another and win rewards.
        </p>
        <div className="space-y-4 w-full max-w-md">
          <Link 
            to="/lobby" 
            className="w-full block py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-center font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Play Now
          </Link>
          <Link 
            to="/how-to-play" 
            className="w-full block py-3 px-6 bg-gray-800 hover:bg-gray-700 rounded-lg text-center font-bold transition-all duration-300"
          >
            How to Play
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home; 