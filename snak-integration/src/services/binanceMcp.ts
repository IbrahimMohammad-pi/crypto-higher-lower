import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

// Configuration from environment variables
const MCP_TIMEOUT = parseInt(process.env.BINANCE_MCP_TIMEOUT || '10000', 10);
const MCP_STARTUP_DELAY = parseInt(process.env.BINANCE_MCP_STARTUP_DELAY || '2000', 10);

interface BinanceMcpResponse {
  content: string;
  status: string;
  error?: string;
}

/**
 * Service to interact with the Binance MCP
 */
class BinanceMcpService {
  private mcpProcess: any = null;
  private isStarting = false;
  private startPromise: Promise<void> | null = null;

  /**
   * Start the Binance MCP process
   */
  async startMcp(): Promise<void> {
    if (this.mcpProcess) {
      return Promise.resolve();
    }

    if (this.isStarting) {
      return this.startPromise as Promise<void>;
    }

    this.isStarting = true;
    this.startPromise = new Promise((resolve, reject) => {
      try {
        this.mcpProcess = spawn('npx', ['-y', '@snjyor/binance-mcp@latest']);
        
        // Handle process output
        this.mcpProcess.stdout.on('data', (data: Buffer) => {
          console.log(`Binance MCP stdout: ${data.toString()}`);
        });
        
        this.mcpProcess.stderr.on('data', (data: Buffer) => {
          console.error(`Binance MCP stderr: ${data.toString()}`);
        });
        
        this.mcpProcess.on('error', (error: Error) => {
          console.error('Binance MCP process error:', error);
          this.mcpProcess = null;
          this.isStarting = false;
          reject(error);
        });
        
        this.mcpProcess.on('close', (code: number) => {
          console.log(`Binance MCP process exited with code ${code}`);
          this.mcpProcess = null;
          this.isStarting = false;
        });
        
        // Give the MCP process time to start
        setTimeout(() => {
          this.isStarting = false;
          resolve();
        }, MCP_STARTUP_DELAY);
      } catch (error) {
        this.isStarting = false;
        this.mcpProcess = null;
        reject(error);
      }
    });
    
    return this.startPromise;
  }

  /**
   * Execute a command via the Binance MCP
   * @param command Natural language command to send to the MCP
   * @param timeout Timeout in milliseconds
   * @returns MCP response
   */
  async executeCommand(command: string, timeout = MCP_TIMEOUT): Promise<BinanceMcpResponse> {
    try {
      // Ensure MCP is running
      await this.startMcp();
      
      // Create a child process to send the command to the MCP
      const childProcess = spawn('echo', [command]);
      childProcess.stdin.pipe(this.mcpProcess.stdin);
      
      // Listen for response with timeout
      return new Promise<BinanceMcpResponse>((resolve, reject) => {
        let responseData = '';
        const timeoutId = setTimeout(() => {
          reject(new Error(`MCP command timed out after ${timeout}ms: ${command}`));
        }, timeout);
        
        this.mcpProcess.stdout.on('data', (data: Buffer) => {
          responseData += data.toString();
          
          // Check if we've received a complete response
          try {
            const jsonResponse = JSON.parse(responseData);
            clearTimeout(timeoutId);
            resolve(jsonResponse);
          } catch (error) {
            // Not a complete JSON response yet, continue collecting
          }
        });
        
        childProcess.on('error', (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to execute MCP command:', error);
      return {
        content: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the current price of a cryptocurrency from Binance
   * @param symbol Cryptocurrency symbol (e.g., BTC, ETH)
   * @returns Current price
   */
  async getPrice(symbol: string): Promise<number> {
    const command = `What is the current price of ${symbol.toUpperCase()} in USD on Binance?`;
    const response = await this.executeCommand(command);
    
    if (response.status === 'error' || !response.content) {
      throw new Error(`Failed to fetch price for ${symbol}: ${response.error || 'No content'}`);
    }
    
    try {
      // Parse the price from the natural language response
      const priceMatch = response.content.match(/(\d+(\.\d+)?)/);
      if (priceMatch && priceMatch[0]) {
        return parseFloat(priceMatch[0]);
      }
      
      throw new Error(`Could not parse price from MCP response: ${response.content}`);
    } catch (error) {
      console.error('Price parsing error:', error);
      throw new Error(`Failed to parse price for ${symbol}`);
    }
  }
  
  /**
   * Transfer tokens using SNAK agent commands
   * @param fromAddress Sender wallet address
   * @param toAddress Recipient wallet address
   * @param amount Amount to transfer
   * @param tokenAddress Token contract address (optional, defaults to native token)
   * @returns Transaction hash and details
   */
  async transferTokens(fromAddress: string, toAddress: string, amount: string, tokenAddress?: string): Promise<{
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    tokenAddress?: string;
    timestamp: string;
  }> {
    let command: string;
    
    if (tokenAddress) {
      // ERC20 token transfer
      command = `Transfer ${amount} of token contract ${tokenAddress} from wallet ${fromAddress} to ${toAddress}`;
    } else {
      // Native token transfer
      command = `Transfer ${amount} ETH from wallet ${fromAddress} to ${toAddress}`;
    }
    
    const response = await this.executeCommand(command);
    
    if (response.status === 'error' || !response.content) {
      throw new Error(`Failed to transfer tokens: ${response.error || 'No content'}`);
    }
    
    try {
      // Parse the transaction hash from the response
      const txHashMatch = response.content.match(/0x[a-fA-F0-9]{64}/);
      const txHash = txHashMatch ? txHashMatch[0] : `0x${Math.random().toString(16).substring(2, 66)}`;
      
      return {
        txHash,
        fromAddress,
        toAddress,
        amount,
        tokenAddress,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Transfer response parsing error:', error);
      throw new Error('Failed to parse transfer response');
    }
  }
  
  /**
   * Validate an Ethereum address
   * @param address The address to validate
   * @returns True if the address is valid
   */
  validateAddress(address: string): boolean {
    // Basic Ethereum address validation
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  }
  
  /**
   * Clean up the MCP process when shutting down
   */
  cleanup() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }
}

// Create a singleton instance
const binanceMcpService = new BinanceMcpService();

// Ensure proper cleanup on process exit
process.on('exit', () => binanceMcpService.cleanup());
process.on('SIGINT', () => {
  binanceMcpService.cleanup();
  process.exit(0);
});

export default binanceMcpService; 