import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const WalletConnect: React.FC = () => {
  const { address, isConnected, isConnecting, connect, disconnect, error } = useWallet();

  // Helper function to format address
  const formatAddress = (address: string | null): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="relative">
      {isConnected && address ? (
        <div className="flex items-center">
          <span className="bg-green-500 rounded-full w-2 h-2 mr-2"></span>
          <div className="flex flex-col mr-2">
            <span className="text-sm text-gray-300">Connected</span>
            <span className="text-sm font-medium">{formatAddress(address)}</span>
          </div>
          <button
            onClick={() => disconnect()}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-all duration-300"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => connect()}
          disabled={isConnecting}
          className={`py-2 px-6 ${
            isConnecting
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 text-black'
          } rounded-lg font-bold transition-all duration-300`}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error.message}
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 