import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connect as getStarknetConnect, disconnect as disconnectWallet } from 'get-starknet';
import { AccountInterface, ProviderInterface } from 'starknet';

interface StarknetWindowObject {
  id: string;
  name: string;
  version: string;
  icon: string;
  isConnected: boolean;
  account?: AccountInterface;
  provider?: ProviderInterface;
  selectedAddress?: string;
  isPreauthorized: () => Promise<boolean>;
  request: (params: any) => Promise<any>;
  enable: (options?: any) => Promise<any>;
  on: (event: string, handler: any) => void;
  off: (event: string, handler: any) => void;
}

interface ConnectOptions {
  modalMode?: 'neverAsk' | 'alwaysAsk';
  modalTheme?: 'light' | 'dark' | 'system';
  modalOptions?: {
    theme?: string;
  };
}

interface WalletContextType {
  account: AccountInterface | null;
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: Error | null;
}

const defaultContext: WalletContextType = {
  account: null,
  address: null,
  isConnecting: false,
  isConnected: false,
  connect: async () => {},
  disconnect: async () => {},
  error: null,
};

const WalletContext = createContext<WalletContextType>(defaultContext);

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const starknet = await getStarknetConnect({ 
          modalMode: 'neverAsk'
        }) as StarknetWindowObject | null;
        
        if (starknet && starknet.isConnected && starknet.account) {
          setAccount(starknet.account);
          setAddress(starknet.selectedAddress || null);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };
    
    checkConnection();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const starknet = await getStarknetConnect({
        modalMode: 'alwaysAsk'
      }) as StarknetWindowObject | null;
      
      if (starknet && starknet.isConnected && starknet.account) {
        setAccount(starknet.account);
        setAddress(starknet.selectedAddress || null);
        setIsConnected(true);
        
        // Add event listener for account changes
        starknet.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          } else {
            setAccount(null);
            setAddress(null);
            setIsConnected(false);
          }
        });
      } else {
        throw new Error('Failed to connect wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await disconnectWallet({ clearLastWallet: true });
      setAccount(null);
      setAddress(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        address,
        isConnecting,
        isConnected,
        connect,
        disconnect,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext; 