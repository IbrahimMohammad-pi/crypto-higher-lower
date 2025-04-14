/**
 * API utilities for communication with the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get cryptocurrency price
 * @param symbol Cryptocurrency symbol
 * @returns Promise with price data
 */
export const getCryptoPrice = async (symbol: string): Promise<{ symbol: string; price: number }> => {
  try {
    const response = await fetch(`${API_URL}/crypto/price/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Validate wallet address
 * @param address Wallet address to validate
 * @returns Promise with validation result
 */
export const validateAddress = async (address: string): Promise<{ address: string; is_valid: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/crypto/validate-address/${address}`);
    if (!response.ok) {
      throw new Error(`Failed to validate address: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error validating address ${address}:`, error);
    throw error;
  }
};

/**
 * Get list of supported cryptocurrency symbols
 * @returns Promise with list of supported symbols
 */
export const getSupportedSymbols = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URL}/crypto/supported-symbols`);
    if (!response.ok) {
      throw new Error(`Failed to fetch supported symbols: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching supported symbols:', error);
    throw error;
  }
};

/**
 * Create a new player
 * @param username Player username
 * @param walletAddress Player's wallet address
 * @returns Promise with player data including ID
 */
export const createPlayer = async (username: string, walletAddress: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/games/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, wallet_address: walletAddress }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create player: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
};

/**
 * Transfer tokens (stake)
 * @param fromAddress Sender wallet address
 * @param toAddress Recipient wallet address
 * @param amount Amount to transfer
 * @param tokenAddress Optional token address
 * @returns Promise with transaction details
 */
export const transferTokens = async (
  fromAddress: string, 
  toAddress: string, 
  amount: string,
  tokenAddress?: string
): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/crypto/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_address: fromAddress,
        to_address: toAddress,
        amount,
        token_address: tokenAddress,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Transfer failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw error;
  }
};

/**
 * Create a new game
 * @param playerId Player ID creating the game
 * @param stakeAmount Amount staked for the game
 * @returns Promise with game data including ID
 */
export const createGame = async (playerId: string, stakeAmount: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player_id: playerId, stake_amount: stakeAmount }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create game: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

/**
 * Join an existing game
 * @param playerId Player ID joining the game
 * @param gameId Game ID to join
 * @returns Promise with game data
 */
export const joinGame = async (playerId: string, gameId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/games/${gameId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player_id: playerId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to join game: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
}; 