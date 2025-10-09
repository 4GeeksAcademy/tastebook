/**
 * WebSocket service for real-time messaging functionality
 * Connects to dedicated WebSocket server (separate from REST API)
 */

import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.isManuallyDisconnected = false;
    }

    /**
     * Connect to the WebSocket server
     */
    connect() {
        if (this.socket && this.isConnected) {
            console.log('[SOCKET] Already connected');
            return Promise.resolve();
        }

        // Reset manual disconnect flag
        this.isManuallyDisconnected = false;

        // Get WebSocket URL from environment variable (DIFFERENT from REST API)
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';

        console.log('[SOCKET] Connecting to WebSocket server:', socketUrl);

        return new Promise((resolve, reject) => {
            this.socket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000
            });

            this.socket.on('connect', () => {
                console.log('[SOCKET] ✅ Connected to WebSocket server:', this.socket.id);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connection_status_changed', { connected: true });
                resolve();
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[SOCKET] ❌ Disconnected from server. Reason:', reason);
                this.isConnected = false;
                this.emit('connection_status_changed', { connected: false });
                
                if (this.isManuallyDisconnected) {
                    console.log('[SOCKET] Manual disconnect - stopping reconnection attempts');
                    return;
                }
                
                if (reason === 'io server disconnect') {
                    console.log('[SOCKET] Server initiated disconnect - stopping reconnection');
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
                console.log(`[SOCKET] 🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
            });

            this.socket.on('reconnect_failed', () => {
                console.error('[SOCKET] ❌ All reconnection attempts failed');
                this.forceDisconnect();
                reject(new Error('Reconnection failed'));
            });

            this.socket.on('connected', (data) => {
                console.log('[SOCKET] ✅ Server confirmation:', data);
            });

            // Listen for real-time events
            this.socket.on('message_received', (data) => {
                console.log('[SOCKET] 📨 New message received:', data);
                this.emit('message_received', data);
            });

            this.socket.on('messages_marked_read', (data) => {
                console.log('[SOCKET] 👀 Messages marked as read:', data);
                this.emit('messages_marked_read', data);
            });

            this.socket.on('chat_was_deleted', (data) => {
                console.log('[SOCKET] 🗑️ Chat was deleted:', data);
                this.emit('chat_was_deleted', data);
            });

            this.socket.on('joined_chat', (data) => {
                console.log('[SOCKET] ✅ Joined chat room:', data);
            });

            this.socket.on('left_chat', (data) => {
                console.log('[SOCKET] ⬅️ Left chat room:', data);
            });
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        console.log('[SOCKET] 🔌 Disconnecting...');
        this.isManuallyDisconnected = true;
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.emit('connection_status_changed', { connected: false });
        // Don't remove listeners on manual disconnect - components may still need them
        console.log('[SOCKET] ✅ Disconnected and cleaned up');
    }

    /**
     * Force disconnect and stop all reconnection attempts
     */
    forceDisconnect() {
        console.log('[SOCKET] 🛑 Force disconnecting...');
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
        
        console.log('[SOCKET] ✅ Force disconnected');
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
        console.log('[SOCKET] 🔥 Destroying socket service...');
        this.disconnect();
        this.removeAllListeners();
        console.log('[SOCKET] ✅ Socket service destroyed');
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

        console.log('[SOCKET] 🚪 Joining chat:', chatId, 'for user:', userId);
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

        console.log('[SOCKET] 🚪 Leaving chat:', chatId, 'for user:', userId);
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

        console.log('[SOCKET] Emitting new message for chat:', chatId);
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

        console.log('[SOCKET] Emitting messages read for chat:', chatId);
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

        console.log('[SOCKET] Emitting chat deleted:', chatId);
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
     * Emit event to all listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[SOCKET] Error in event listener:', error);
                }
            });
        }
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
if (import.meta.env.DEV) {
    window.socketService = socketService;
    window.stopSocket = () => {
        console.log('🛑 Manually stopping socket service...');
        socketService.forceDisconnect();
        console.log('✅ Socket service stopped');
    };
    window.destroySocket = () => {
        console.log('🔥 Manually destroying socket service...');
        socketService.destroy();
        console.log('✅ Socket service destroyed');
    };
}

export default socketService;