# Higher or Lower Crypto Challenge - SNAK Integration Service

This service wraps the SNAK functionality for token transfers and price fetching, providing a simple REST API for the Crypto Higher or Lower game.

## Features

- REST API for SNAK operations
- Crypto price fetching endpoint
- Token transfer functionality
- Health check endpoint

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3001
SNAK_PATH=../snak
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Start the service:
```bash
npm start
```

For development with automatic reloading:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Price Fetching
```
GET /price/:symbol
```
Parameters:
- `symbol`: Cryptocurrency symbol (e.g., BTC, ETH, SOL)

### Token Transfer
```
POST /transfer
```
Body (JSON):
```json
{
  "fromAddress": "0x123...",
  "toAddress": "0x456...",
  "amount": "0.1",
  "tokenAddress": "0x789..." // Optional, defaults to ETH
}
```

## Project Structure

- `src/` - Source code directory
  - `server.ts` - Express server setup and route definitions
  - `services/` - Business logic and SNAK integration 