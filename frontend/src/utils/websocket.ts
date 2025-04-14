/**
 * WebSocket utility for real-time game communication
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// Event types for WebSocket messages
export enum WebSocketEventType {
  JOIN_GAME = 'join_game',
  LEAVE_GAME = 'leave_game',
  START_GAME = 'start_game',
  MAKE_CHOICE = 'make_choice',
  START_ROUND = 'start_round',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  GAME_STARTED = 'game_started',
  ROUND_STARTED = 'round_started',
  CHOICE_RECEIVED = 'choice_received',
  ROUND_COMPLETED = 'round_completed',
  GAME_COMPLETED = 'game_completed',
  GAME_STATE = 'game_state',
  ERROR = 'error',
}

// Message handler type
export type WebSocketMessageHandler = (data: any) => void;

/**
 * WebSocket service for real-time game communication
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private messageHandlers: Map<WebSocketEventType, WebSocketMessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // milliseconds
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private playerId: string | null = null;

  /**
   * Connect to the WebSocket server
   * @param playerId Player ID for connection
   * @returns Promise that resolves when connected
   */
  connect(playerId: string): Promise<void> {
    this.playerId = playerId;
    
    return new Promise((resolve, reject) => {
      try {
        // Close any existing connection
        if (this.socket) {
          this.close();
        }
        
        // Create new WebSocket connection
        this.socket = new WebSocket(`${WS_URL}/${playerId}`);
        
        // Handle connection open
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connected');
          resolve();
        };
        
        // Handle connection error
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!this.isConnected) {
            reject(error);
          }
        };
        
        // Handle connection close
        this.socket.onclose = (event) => {
          this.isConnected = false;
          console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
          
          // Attempt to reconnect
          this.attemptReconnect();
        };
        
        // Handle incoming messages
        this.socket.onmessage = (message) => {
          try {
            const data = JSON.parse(message.data);
            const eventType = data.type as WebSocketEventType;
            
            // Call all registered handlers for this event type
            if (this.messageHandlers.has(eventType)) {
              this.messageHandlers.get(eventType)?.forEach((handler) => {
                handler(data);
              });
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.playerId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect(this.playerId as string).catch(() => {
          // Reconnect attempt failed, another will be scheduled by onclose if needed
        });
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnect attempts reached');
    }
  }
  
  /**
   * Close the WebSocket connection
   */
  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isConnected = false;
  }
  
  /**
   * Check if the WebSocket is connected
   * @returns True if connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Register a handler for a specific event type
   * @param eventType Event type to handle
   * @param handler Handler function
   */
  on(eventType: WebSocketEventType, handler: WebSocketMessageHandler): void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    
    this.messageHandlers.get(eventType)?.push(handler);
  }
  
  /**
   * Remove a handler for a specific event type
   * @param eventType Event type
   * @param handler Handler function to remove
   */
  off(eventType: WebSocketEventType, handler: WebSocketMessageHandler): void {
    if (this.messageHandlers.has(eventType)) {
      const handlers = this.messageHandlers.get(eventType) || [];
      const index = handlers.indexOf(handler);
      
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * Send a message to the WebSocket server
   * @param type Message type
   * @param gameId Game ID (optional)
   * @param data Additional data (optional)
   * @returns True if message was sent
   */
  send(type: WebSocketEventType, gameId?: string, data: Record<string, any> = {}): boolean {
    if (!this.isConnected || !this.socket) {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      const message = {
        type,
        ...(gameId ? { game_id: gameId } : {}),
        data,
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService; 