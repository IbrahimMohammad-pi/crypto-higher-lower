import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import dotenv from 'dotenv';
import * as snakService from './services/snakService';
import { ApiResponse, PriceResponse, TransferResponse, AddressValidationResponse, ErrorResponse } from './types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Port for the SNAK wrapper service

// --- Apply Timeout Middleware ---
const timeoutMiddleware = (timeout: number): RequestHandler => {
  return (req, res, next) => {
    // Set a timeout for the request
    const timeoutId = setTimeout(() => {
      const errorResponse: ErrorResponse = {
        status: 'error',
        message: 'Request timed out'
      };
      res.status(504).json(errorResponse);
    }, timeout);

    // Clear the timeout when the response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};

// Middlewares
app.use(express.json());
app.use(timeoutMiddleware(30000)); // Apply timeout middleware to all requests (30 seconds)

// --- Health Check --- 
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'SNAK Integration Service is running' });
});

// --- Supported Symbols Endpoint ---
app.get('/symbols', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success', 
    data: snakService.getSupportedSymbols() 
  });
});

// --- Address Validation Endpoint ---
app.get('/validate-address/:address', ((req: Request, res: Response) => {
  const { address } = req.params;
  
  if (!address) {
    return res.status(400).json({
      status: 'error',
      message: 'Address parameter is required'
    } as ErrorResponse);
  }
  
  const isValid = snakService.isValidAddress(address);
  
  const response: ApiResponse<AddressValidationResponse> = {
    status: 'success',
    data: {
      address,
      isValid
    }
  };
  
  res.status(200).json(response);
}) as RequestHandler);

// --- Price Endpoint ---
app.get('/price/:symbol', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol } = req.params;
    
    // Validate symbol
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid symbol. Please provide a valid cryptocurrency symbol.' 
      } as ErrorResponse);
    }
    
    // Check if symbol is supported
    if (!snakService.isSymbolSupported(symbol)) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported cryptocurrency symbol: ${symbol}. Supported symbols: ${snakService.getSupportedSymbols().join(', ')}`
      } as ErrorResponse);
    }
    
    // Call the SNAK service to get the price
    const price = await snakService.getPrice(symbol);
    
    const response: ApiResponse<PriceResponse> = {
      status: 'success',
      data: {
        symbol: symbol.toUpperCase(),
        price,
        timestamp: new Date().toISOString()
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error("Price Fetching Error:", error);
    
    // Provide specific error messages
    if (error instanceof Error && error.message.includes('Unsupported cryptocurrency')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      } as ErrorResponse);
    }
    
    if (error instanceof Error && error.message.includes('timed out')) {
      return res.status(504).json({
        status: 'error',
        message: 'Price fetching timed out. Please try again later.'
      } as ErrorResponse);
    }
    
    next(error);
  }
}) as RequestHandler);

// --- Token Transfer Endpoint ---
app.post('/transfer', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromAddress, toAddress, amount, tokenAddress } = req.body;
    
    // Validate request body
    if (!fromAddress || !toAddress || !amount) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields. Please provide fromAddress, toAddress, and amount.' 
      } as ErrorResponse);
    }
    
    // Validate addresses
    if (!snakService.isValidAddress(fromAddress)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid sender address: ${fromAddress}`
      } as ErrorResponse);
    }
    
    if (!snakService.isValidAddress(toAddress)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid recipient address: ${toAddress}`
      } as ErrorResponse);
    }
    
    // Validate amount
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid amount: ${amount}. Amount must be a positive number.`
      } as ErrorResponse);
    }
    
    // Validate token address if provided
    if (tokenAddress && !snakService.isValidAddress(tokenAddress)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid token address: ${tokenAddress}`
      } as ErrorResponse);
    }
    
    // Call the SNAK service to perform the transfer
    const result = await snakService.transferTokens(fromAddress, toAddress, amount, tokenAddress);
    
    const response: ApiResponse<TransferResponse> = {
      status: 'success', 
      data: result
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error("Transfer Error:", error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      // Extract known error messages
      if (error.message.includes('Invalid sender address')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        } as ErrorResponse);
      }
      
      if (error.message.includes('Invalid recipient address')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        } as ErrorResponse);
      }
      
      if (error.message.includes('Invalid amount')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        } as ErrorResponse);
      }
      
      if (error.message.includes('Invalid token address')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        } as ErrorResponse);
      }
      
      if (error.message.includes('timed out')) {
        return res.status(504).json({
          status: 'error',
          message: 'Token transfer timed out. Please try again later.'
        } as ErrorResponse);
      }
    }
    
    next(error);
  }
}) as RequestHandler);

// --- Error Handling Middleware ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server Error:", err);
  const errorResponse: ErrorResponse = {
    status: 'error',
    message: 'Internal Server Error'
  };
  res.status(500).json(errorResponse);
});

// --- Start Server --- 
app.listen(PORT, () => {
  console.log(`SNAK Integration Service running on port ${PORT}`);
}); 