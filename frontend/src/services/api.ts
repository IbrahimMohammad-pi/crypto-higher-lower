// API base URL
const API_BASE_URL = 'http://localhost:3001';

// Timeout for fetch requests (in milliseconds)
const FETCH_TIMEOUT = 5000;

// Type for price response
interface PriceResponse {
  symbol: string;
  price: number;
  timestamp: number;
}

// Type for address validation response
interface AddressValidationResponse {
  address: string;
  isValid: boolean;
}

// Type for token transfer request
interface TransferRequest {
  fromAddress: string;
  toAddress: string;
  amount: string;
}

// Type for token transfer response
interface TransferResponse {
  txHash: string;
  status: string;
}

/**
 * Fetch with timeout
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get cryptocurrency price
 */
export const getPrice = async (symbol: string): Promise<PriceResponse> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/price/${symbol}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Failed to fetch price for ${symbol}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: Could not fetch price for ${symbol}`);
    }
    throw error;
  }
};

/**
 * Validate Starknet address
 */
export const validateAddress = async (address: string): Promise<AddressValidationResponse> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/validate-address/${address}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to validate address');
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Could not validate address');
    }
    throw error;
  }
};

/**
 * Transfer tokens
 */
export const transferTokens = async (transferData: TransferRequest): Promise<TransferResponse> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/transfer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to transfer tokens');
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Could not complete transfer');
    }
    throw error;
  }
};

/**
 * Health check
 */
export const healthCheck = async (): Promise<{ status: string }> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error('API service is not available');
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Health check failed');
    }
    throw error;
  }
}; 