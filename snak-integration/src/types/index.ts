/**
 * Price response from the SNAK service
 */
export interface PriceResponse {
  symbol: string;
  price: number;
  timestamp: string;
}

/**
 * Transfer response from the SNAK service
 */
export interface TransferResponse {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenAddress?: string;
  timestamp: string;
}

/**
 * Address validation response
 */
export interface AddressValidationResponse {
  address: string;
  isValid: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

/**
 * Error response from the API
 */
export interface ErrorResponse {
  status: 'error';
  message: string;
} 