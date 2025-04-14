import path from 'path';
import dotenv from 'dotenv';
import { TransferResponse } from '../types';
import binanceMcpService from './binanceMcp';

// Load environment variables
dotenv.config();

// Path to SNAK
const SNAK_PATH = process.env.SNAK_PATH || '../snak';

// Supported cryptocurrency symbols from environment variable
const SUPPORTED_SYMBOLS = process.env.SUPPORTED_SYMBOLS 
  ? process.env.SUPPORTED_SYMBOLS.split(',').map(symbol => symbol.trim().toUpperCase())
  : ['BTC', 'ETH', 'SOL', 'AVAX', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC'];

/**
 * Get the list of supported cryptocurrency symbols
 * @returns Array of supported symbols
 */
export function getSupportedSymbols(): string[] {
  return [...SUPPORTED_SYMBOLS];
}

/**
 * Checks if a cryptocurrency symbol is supported
 * @param symbol The cryptocurrency symbol to check
 * @returns True if the symbol is supported, false otherwise
 */
export function isSymbolSupported(symbol: string): boolean {
  return SUPPORTED_SYMBOLS.includes(symbol.toUpperCase());
}

/**
 * Validates an Ethereum address
 * @param address The address to validate
 * @returns True if the address is valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  return binanceMcpService.validateAddress(address);
}

/**
 * Fetches the current price of a cryptocurrency from SNAK
 * @param symbol The cryptocurrency symbol (e.g., BTC, ETH)
 * @returns A promise that resolves to the current price
 */
export async function getPrice(symbol: string): Promise<number> {
  try {
    // Validate the symbol
    const upperSymbol = symbol.toUpperCase();
    if (!isSymbolSupported(upperSymbol)) {
      throw new Error(`Unsupported cryptocurrency symbol: ${symbol}`);
    }

    // Use Binance MCP to get the price
    return await binanceMcpService.getPrice(upperSymbol);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw new Error(`Failed to fetch price for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates transfer parameters
 * @param fromAddress Sender address
 * @param toAddress Recipient address
 * @param amount Amount to transfer
 * @param tokenAddress Optional token address
 * @throws Error if any parameters are invalid
 */
function validateTransferParams(
  fromAddress: string,
  toAddress: string,
  amount: string,
  tokenAddress?: string
): void {
  // Validate addresses
  if (!isValidAddress(fromAddress)) {
    throw new Error(`Invalid sender address: ${fromAddress}`);
  }
  
  if (!isValidAddress(toAddress)) {
    throw new Error(`Invalid recipient address: ${toAddress}`);
  }
  
  // Validate amount format
  const amountNumber = parseFloat(amount);
  if (isNaN(amountNumber) || amountNumber <= 0) {
    throw new Error(`Invalid amount: ${amount}. Amount must be a positive number.`);
  }
  
  // Validate token address if provided
  if (tokenAddress && !isValidAddress(tokenAddress)) {
    throw new Error(`Invalid token address: ${tokenAddress}`);
  }
}

/**
 * Transfers tokens using SNAK
 * @param fromAddress The sender's address
 * @param toAddress The recipient's address
 * @param amount The amount to transfer
 * @param tokenAddress Optional token address (defaults to native token)
 * @returns A promise that resolves to the transaction details
 */
export async function transferTokens(
  fromAddress: string,
  toAddress: string,
  amount: string,
  tokenAddress?: string
): Promise<TransferResponse> {
  try {
    // Validate parameters
    validateTransferParams(fromAddress, toAddress, amount, tokenAddress);
    
    // Use Binance MCP to perform the transfer
    return await binanceMcpService.transferTokens(fromAddress, toAddress, amount, tokenAddress);
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw new Error(`Failed to transfer tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 