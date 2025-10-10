/**
 * WebSocket service for real-time messaging functionality
 * Connects to dedicated WebSocket server (separate from REST API)
 */

import { io } from 'socket.io-client';

// Helper function to only log in development environment
const debugLog = (...args) => {
    if (import.meta.env.MODE === 'development') {
        console.log(...args);
    }
};

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.isManuallyDisconnected = false;
        this.lastEmittedEvents = new Map(); // Add throttling cache
        this._throttleCleanupInterval = null; // Add cleanup interval tracker
        
        // Start periodic cleanup for throttling cache
        this._startThrottleCleanup();
    }

    /**
     * Start periodic cleanup for throttling cache to prevent memory leaks
     */
    _startThrottleCleanup() {
        // Clear any existing interval
        if (this._throttleCleanupInterval) {
            clearInterval(this._throttleCleanupInterval);
        }
        
        this._throttleCleanupInterval = setInterval(() => {
            const now = Date.now();
            // Remove entries older than 5 minutes (300000 ms)
            for (const [key, timestamp] of this.lastEmittedEvents.entries()) {
                if (now - timestamp > 300000) {
                    this.lastEmittedEvents.delete(key);
                }
            }
            
            if (import.meta.env.DEV && this.lastEmittedEvents.size > 0) {
                debugLog(`[SOCKET] 🧹 Throttle cache cleanup: ${this.lastEmittedEvents.size} entries remaining`);
            }
        }, 60000); // Run cleanup every 60 seconds
    }

    /**
     * Connect to the WebSocket server
     */
    connect() {
        if (this.socket && this.isConnected) {
            debugLog('[SOCKET] Already connected');
            return Promise.resolve();
        }

        // Reset manual disconnect flag
        this.isManuallyDisconnected = false;

        // Get WebSocket URL from environment variable (DIFFERENT from REST API)
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';

        debugLog('[SOCKET] Connecting to WebSocket server:', socketUrl);

        return new Promise((resolve, reject) => {
            this.socket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                // Optimize ping/pong to reduce message handler calls
                pingTimeout: 60000,
                pingInterval: 30000
            });

            this.socket.on('connect', () => {
                debugLog('[SOCKET] ✅ Connected to WebSocket server:', this.socket.id);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connection_status_changed', { connected: true });
                resolve();
            });

            this.socket.on('disconnect', (reason) => {
                debugLog('[SOCKET] ❌ Disconnected from server. Reason:', reason);
                this.isConnected = false;
                this.emit('connection_status_changed', { connected: false });
                
                if (this.isManuallyDisconnected) {
                    debugLog('[SOCKET] Manual disconnect - stopping reconnection attempts');
                    return;
                }
                
                if (reason === 'io server disconnect') {
                    debugLog('[SOCKET] Server initiated disconnect - stopping reconnection');
                    this.socket.disconnect();
                }
            });

            this.socket.on('connect_error', (error) => {
                console.error('[SOCKET] ❌ Connection error:', error);
                this.isConnected = false;
                this.reconnectAttempts++;
                this.emit('connection_status_changed', { connected: false, error });
                
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.warn('[SOCKET] ⚠️ Max reconnection attempts reached.');
                    this.forceDisconnect();
                    reject(error);
                }
            });

            this.socket.on('reconnect_attempt', (attemptNumber) => {
                debugLog(`[SOCKET] 🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
            });

            this.socket.on('reconnect_failed', () => {
                console.error('[SOCKET] ❌ All reconnection attempts failed');
                this.forceDisconnect();
                reject(new Error('Reconnection failed'));
            });

            this.socket.on('connected', (data) => {
                debugLog('[SOCKET] ✅ Server confirmation:', data);
            });

            // Listen for real-time events
            this.socket.on('message_received', (data) => {
                if (import.meta.env.DEV) {
                    debugLog('[SOCKET] 📨 New message received:', data);
                    debugLog('[SOCKET] 📨 Event listeners count:', this.listeners.get('message_received')?.length || 0);
                }
                this.emit('message_received', data);
            });

            // Listen for GLOBAL message events (for Navbar unread count updates)
            this.socket.on('global_message_received', (data) => {
                if (import.meta.env.DEV) {
                    debugLog('[SOCKET] 🌐📨 Global message received:', data);
                }
                this.emit('global_message_received', data); // Use different event name to avoid duplication
            });

            this.socket.on('messages_marked_read', (data) => {
                debugLog('[SOCKET] 👀 Messages marked as read:', data);
                this.emit('messages_marked_read', data);
            });

            // Listen for GLOBAL messages read events (for Navbar unread count updates)
            this.socket.on('global_messages_read', (data) => {
                debugLog('[SOCKET] 🌐👀 Global messages marked as read:', data);
                this.emit('global_messages_read', data); // Use different event name to avoid duplication
            });

            this.socket.on('chat_was_deleted', (data) => {
                debugLog('[SOCKET] 🗑️ Chat was deleted:', data);
                this.emit('chat_was_deleted', data);
            });

            // Listen for GLOBAL chat deleted events (for Navbar unread count updates)
            this.socket.on('global_chat_deleted', (data) => {
                debugLog('[SOCKET] 🌐🗑️ Global chat was deleted:', data);
                this.emit('global_chat_deleted', data); // Use different event name to avoid duplication
            });

            this.socket.on('joined_chat', (data) => {
                debugLog('[SOCKET] ✅ Joined chat room:', data);
            });

            this.socket.on('left_chat', (data) => {
                debugLog('[SOCKET] ⬅️ Left chat room:', data);
            });
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        debugLog('[SOCKET] 🔌 Disconnecting...');
        this.isManuallyDisconnected = true;
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.emit('connection_status_changed', { connected: false });
        // Don't remove listeners on manual disconnect - components may still need them
        debugLog('[SOCKET] ✅ Disconnected and cleaned up');
    }

    /**
     * Force disconnect and stop all reconnection attempts
     */
    forceDisconnect() {
        debugLog('[SOCKET] 🛑 Force disconnecting...');
        this.isManuallyDisconnected = true;
        
        if (this.socket) {
            this.socket.off();
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.reconnectAttempts = this.maxReconnectAttempts;
        this.emit('connection_status_changed', { connected: false });

        // Don't remove listeners on force disconnect - components may still need them
        // this.removeAllListeners();
        
        debugLog('[SOCKET] ✅ Force disconnected');
    }

    /**
     * Remove all event listeners
     */
    removeAllListeners() {
        this.listeners.clear();
    }

    /**
     * Destroy the socket service completely (removes all listeners and disconnects)
     * Only use this when the service is no longer needed (e.g., app shutdown)
     */
    destroy() {
        debugLog('[SOCKET] 🔥 Destroying socket service...');
        
        // Clean up throttle cleanup interval
        if (this._throttleCleanupInterval) {
            clearInterval(this._throttleCleanupInterval);
            this._throttleCleanupInterval = null;
        }
        
        // Clear throttling cache
        this.lastEmittedEvents.clear();
        
        this.disconnect();
        this.removeAllListeners();
        debugLog('[SOCKET] ✅ Socket service destroyed');
    }

    /**
     * Join a specific chat room
     * @param {number} chatId - The chat ID to join
     * @param {number} userId - The current user ID
     */
    joinChat(chatId, userId) {
        if (!this.socket || !this.isConnected) {
            console.warn('[SOCKET] ⚠️ Cannot join chat - not connected');
            return;
        }

        debugLog('[SOCKET] 🚪 Joining chat:', chatId, 'for user:', userId);
        this.socket.emit('join_chat', {
            chat_id: chatId,
            user_id: userId
        });
    }

    /**
     * Leave a specific chat room
     * @param {number} chatId - The chat ID to leave
     * @param {number} userId - The current user ID
     */
    leaveChat(chatId, userId) {
        if (!this.socket || !this.isConnected) {
            console.warn('[SOCKET] ⚠️ Cannot leave chat - not connected');
            return;
        }

        debugLog('[SOCKET] 🚪 Leaving chat:', chatId, 'for user:', userId);
        this.socket.emit('leave_chat', {
            chat_id: chatId,
            user_id: userId
        });
    }

    /**
     * Emit a new message event (this will be handled by backend API + WebSocket)
     * @param {number} chatId - The chat ID
     * @param {object} messageData - The message data
     */
    emitNewMessage(chatId, messageData) {
        if (!this.socket || !this.isConnected) {
            console.warn('[SOCKET] Cannot emit message - not connected');
            return;
        }

        debugLog('[SOCKET] Emitting new message for chat:', chatId);
        this.socket.emit('new_message', {
            chat_id: chatId,
            message: messageData
        });
    }

    /**
     * Emit messages read event
     * @param {number} chatId - The chat ID
     * @param {number} userId - The user who read the messages
     */
    emitMessagesRead(chatId, userId) {
        if (!this.socket || !this.isConnected) {
            console.warn('[SOCKET] Cannot emit messages read - not connected');
            return;
        }

        debugLog('[SOCKET] Emitting messages read for chat:', chatId);
        this.socket.emit('messages_read', {
            chat_id: chatId,
            user_id: userId
        });
    }

    /**
     * Emit chat deleted event
     * @param {number} chatId - The chat ID that was deleted
     * @param {number} deletedBy - The user who deleted the chat
     */
    emitChatDeleted(chatId, deletedBy) {
        if (!this.socket || !this.isConnected) {
            console.warn('[SOCKET] Cannot emit chat deleted - not connected');
            return;
        }

        debugLog('[SOCKET] Emitting chat deleted:', chatId);
        this.socket.emit('chat_deleted', {
            chat_id: chatId,
            deleted_by: deletedBy
        });
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {function} callback - Callback function to remove
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to all listeners with basic deduplication
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;

        // Basic throttling for message events to prevent rapid duplicates
        if (event.includes('message') && data?.message?.message_id) {
            const messageKey = `${event}_${data.message.message_id}_${data.chat_id}`;
            const now = Date.now();
            const lastEmitted = this.lastEmittedEvents.get(messageKey);
            
            if (lastEmitted && (now - lastEmitted) < 50) { // 50ms throttle
                debugLog('[SOCKET] ⚡ Throttling rapid duplicate event:', event, messageKey);
                return;
            }
            
            this.lastEmittedEvents.set(messageKey, now);
        }

        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('[SOCKET] Error in event listener:', error);
            }
        });
    }

    /**
     * Get connection status
     * @returns {boolean} - True if connected
     */
    getConnectionStatus() {
        return this.isConnected;
    }
}

// Create a singleton instance
const socketService = new SocketService();




// Add global access for debugging purposes (only in development)

// Adding debugging functions to the global window object in production code creates global pollution and potential naming conflicts.
// Consider wrapping these in a development-only condition or moving to a separate debug utility.

if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
// if (import.meta.env.DEV) {
    window.socketService = socketService;
    window.stopSocket = () => {
        debugLog('🛑 Manually stopping socket service...');
        socketService.forceDisconnect();
        debugLog('✅ Socket service stopped');
    };
    window.destroySocket = () => {
        debugLog('🔥 Manually destroying socket service...');
        socketService.destroy();
        debugLog('✅ Socket service destroyed');
    };
    window.testSocketEvent = () => {
        debugLog('🧪 Testing socket event reception...');
        debugLog('Connected:', socketService.getConnectionStatus());
        debugLog('Listeners:', socketService.listeners);
        debugLog('Current message_received listeners:', socketService.listeners.get('message_received')?.length || 0);
        debugLog('Current global_message_received listeners:', socketService.listeners.get('global_message_received')?.length || 0);
    };
    
    window.clearAllTestListeners = () => {
        debugLog('🧹 Clearing all test listeners...');
        debugLog('Before clearing - message_received listeners:', socketService.listeners.get('message_received')?.length || 0);
        debugLog('Before clearing - global_message_received listeners:', socketService.listeners.get('global_message_received')?.length || 0);
        
        // Clear specific event types that might have test listeners
        if (socketService.listeners.has('message_received')) {
            const listeners = socketService.listeners.get('message_received');
            listeners.forEach((listener, index) => {
                debugLog(`Removing message_received listener ${index}:`, listener.toString().slice(0, 100) + '...');
            });
        }
        
        socketService.removeAllListeners();
        debugLog('After clearing - all listeners removed');
    };
    
    window.listAllSocketListeners = () => {
        debugLog('📋 Current socket listeners:');
        debugLog('message_received:', socketService.listeners.get('message_received')?.length || 0);
        debugLog('global_message_received:', socketService.listeners.get('global_message_received')?.length || 0);
        debugLog('messages_marked_read:', socketService.listeners.get('messages_marked_read')?.length || 0);
        debugLog('global_messages_read:', socketService.listeners.get('global_messages_read')?.length || 0);
        debugLog('chat_was_deleted:', socketService.listeners.get('chat_was_deleted')?.length || 0);
        debugLog('global_chat_deleted:', socketService.listeners.get('global_chat_deleted')?.length || 0);
        debugLog('All listeners map:', socketService.listeners);
    };
}

export default socketService;