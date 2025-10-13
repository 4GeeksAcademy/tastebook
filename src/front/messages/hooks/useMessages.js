import { useState, useEffect, useRef, useReducer, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import socketService from "../../shared/utils/socketService";
import { normalizeMessage, normalizeChat } from "../utils/normalize";
import { useMessageReadStatus } from "./useMessageReadStatus";

// Helper function to only log in development environment
const debugLog = (...args) => {
    if (import.meta.env.MODE === 'development') {
        console.log(...args);
    }
};

// Module-level cache for throttling message handling (prevents global/window pollution)
const messageThrottleCache = new Map();

// State management for loading states
const loadingReducer = (state, action) => {
    switch (action.type) {
        case 'SET_MAIN_LOADING':
            return { ...state, main: action.payload };
        case 'SET_CHAT_LOADING':
            return { ...state, chat: action.payload };
        case 'SET_SENDING_MESSAGE':
            return { ...state, sendingMessage: action.payload };
        case 'SET_EDITING_MESSAGE':
            return { ...state, editingMessage: action.payload };
        case 'RESET_ALL':
            return { main: false, chat: false, sendingMessage: false, editingMessage: null };
        default:
            return state;
    }
};

// Initial loading state
const initialLoadingState = {
    main: true,
    chat: false,
    sendingMessage: false,
    editingMessage: null
};

// Confirmation modal state
const confirmationReducer = (state, action) => {
    switch (action.type) {
        case 'SHOW_CONFIRM':
            return { show: true, message: action.message, onConfirm: action.onConfirm, type: action.confirmType || 'default' };
        case 'HIDE_CONFIRM':
            return { show: false, message: '', onConfirm: null, type: 'default' };
        default:
            return state;
    }
};

const initialConfirmState = {
    show: false,
    message: '',
    onConfirm: null,
    type: 'default'
};

/**
 * Custom hook for managing messages, chats, and related state
 * @param {string} chatId - Current chat ID from URL params
 * @returns {Object} State and actions for message management
 */
export const useMessages = (chatId) => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const socketConnectedRef = useRef(false);
    const currentUserRef = useRef(null);
    const currentChatRef = useRef(null);
    const handlersRegisteredRef = useRef(false); // Track if handlers are registered
    

    // Configuration constants (centralized)
    
    // Prefer explicit VITE_SOCKET_URL, fall back to VITE_DEFAULT_SOCKET_URL, then local default
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_DEFAULT_SOCKET_URL ?? 'http://localhost:3002';
    
    // Backend URL for REST API
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';
    

    // State management
    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [connectionError, setConnectionError] = useState(false);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isSocketServerAvailable, setIsSocketServerAvailable] = useState(null); // null = checking, true = available, false = not available
    
    // Loading state management with reducer
    const [loadingState, dispatchLoading] = useReducer(loadingReducer, initialLoadingState);
    
    // Confirmation modal state
    const [confirmState, dispatchConfirm] = useReducer(confirmationReducer, initialConfirmState);


    // Keep currentUser reference up to date
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    // Keep currentChat reference up to date
    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    // Optimize setNewMessage to prevent unnecessary re-renders during typing
    const optimizedSetNewMessage = useCallback((value) => {
        // Only update if value actually changed
        setNewMessage(prev => prev !== value ? value : prev);
    }, []);

    // Utility functions
    const showToast = useCallback((message, duration = 3000) => {
        setToastMessage(message);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), duration);
    }, []);

    const showConfirmation = useCallback((message, onConfirm, type = 'default') => {
        dispatchConfirm({ 
            type: 'SHOW_CONFIRM', 
            message, 
            onConfirm, 
            confirmType: type 
        });
    }, []);

    const hideConfirmation = useCallback(() => {
        dispatchConfirm({ type: 'HIDE_CONFIRM' });
    }, []);

    // Check if WebSocket server is available
    const checkWebSocketServerAvailability = useCallback(async () => {
        const socketUrl = SOCKET_URL;
        
        try {
            // Use the dedicated /health endpoint for availability check
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${socketUrl}/health`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'healthy') {
                    setIsSocketServerAvailable(true);
                    return true;
                }
            }
            
            // If response is not ok or status is not 'healthy', treat as unavailable
            setIsSocketServerAvailable(false);
            return false;
        } catch (error) {
            // If the request fails completely (including timeout), the server is not available
            setIsSocketServerAvailable(false);
            return false;
        }
    }, []);

    // API Functions
    const fetchCurrentUser = useCallback(async () => {
        if (!token || !BACKEND_URL) {
            setCurrentUser(null);
            setConnectionError(true);
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/settings`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.current_user);
                setConnectionError(false);
            } else {
                setCurrentUser(null);
                setConnectionError(true);
            }
        } catch (error) {
            console.error("Failed to fetch current user:", error);
            setCurrentUser(null);
            setConnectionError(true);
        }
    }, [token, BACKEND_URL]);

    const fetchChats = useCallback(async () => {
        if (!token) return;
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/chats`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const normalizedChats = data.chats.map(normalizeChat);
                setChats(normalizedChats);
                setTotalUnreadCount(data.total_unread);
                setConnectionError(false);
            } else {
                const errorData = await response.json();
                console.error("Failed to fetch chats:", errorData);
                setConnectionError(true);
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
            setConnectionError(true);
        }
    }, [token, BACKEND_URL]);

    const fetchChat = useCallback(async (chatIdToFetch) => {
        if (!token || !chatIdToFetch) return;
        
        dispatchLoading({ type: 'SET_CHAT_LOADING', payload: true });
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/${chatIdToFetch}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const normalizedChat = normalizeChat(data.chat);
                const normalizedMessages = (data.chat.messages || []).map(normalizeMessage);
                
                setCurrentChat(normalizedChat);
                setMessages(normalizedMessages);
                
                // Show welcome message for new chats
                if (normalizedMessages.length === 0) {
                    showToast(`Conversation started with ${normalizedChat.participant?.full_name || normalizedChat.participant?.username}! 💬`, 4000);
                }
                
                // Update the chat in the chats list immediately
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat.chat_id === chatIdToFetch 
                            ? { ...chat, ...normalizedChat }
                            : chat
                    )
                );
            } else {
                console.error("Failed to fetch chat:", response.status);
                // If chat doesn't exist, try to create a placeholder
                await handleNewChatFromId(chatIdToFetch);
            }
        } catch (error) {
            console.error("Error fetching chat:", error);
        } finally {
            dispatchLoading({ type: 'SET_CHAT_LOADING', payload: false });
        }
    }, [token, BACKEND_URL, showToast]);

    const handleNewChatFromId = useCallback(async (chatIdToFetch) => {
        try {
            // For new chats that don't exist yet, we need to get the chat info from the backend
            // The backend should have created the chat, so let's try fetching it again with a delay
            setTimeout(async () => {
                const response = await fetch(`${BACKEND_URL}/api/chat/${chatIdToFetch}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const normalizedChat = normalizeChat(data.chat);
                    const normalizedMessages = (data.chat.messages || []).map(normalizeMessage);
                    
                    setCurrentChat(normalizedChat);
                    setMessages(normalizedMessages);
                } else {
                    // If chat still doesn't exist, navigate back to messages
                    navigate("/messages");
                }
                dispatchLoading({ type: 'SET_CHAT_LOADING', payload: false });
            }, 1000);
        } catch (error) {
            console.error("Error handling new chat:", error);
            dispatchLoading({ type: 'SET_CHAT_LOADING', payload: false });
        }
    }, [token, BACKEND_URL, navigate]);

    const markMessagesAsRead = useCallback(async (chatIdToMark, specificMessageIds = null) => {
        if (!token) return;
        
        try {
            const requestBody = specificMessageIds ? { message_ids: specificMessageIds } : {};
            
            const response = await fetch(`${BACKEND_URL}/api/chat/${chatIdToMark}/mark-read`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Update the chats state immediately to reflect read status
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat.chat_id === chatIdToMark 
                            ? { ...chat, unread_count: data.remaining_unread || 0 }
                            : chat
                    )
                );
                
                // Update messages state if we're in the current chat
                if (currentChatRef.current && currentChatRef.current.chat_id === chatIdToMark) {
                    setMessages(prevMessages => 
                        prevMessages.map(msg => {
                            if (!specificMessageIds || specificMessageIds.includes(msg.message_id)) {
                                return { ...msg, is_read: true };
                            }
                            return msg;
                        })
                    );
                }
                
                // Update total unread count
                const previousUnread = data.marked_count || 0;
                setTotalUnreadCount(prev => Math.max(0, prev - previousUnread));
                
                // Emit WebSocket event for real-time updates to other users
                if (isSocketConnected && currentUserRef.current) {
                    socketService.emitMessagesRead(chatIdToMark, currentUserRef.current.user_id);
                }
                
                debugLog('[READ_STATUS] Messages marked as read:', {
                    chatId: chatIdToMark,
                    messageIds: specificMessageIds,
                    markedCount: data.marked_count
                });
            } else {
                console.error("[MARK_READ] Failed to mark messages as read:", response.status);
            }
        } catch (error) {
            console.error("[MARK_READ] Error marking messages as read:", error);
        }
    }, [token, BACKEND_URL, isSocketConnected]);

    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        
        // Get message content from event (if provided by optimized input) or from state
        const messageContent = e.currentInputValue || newMessage.trim();
        
        if (!messageContent || !currentChat || loadingState.sendingMessage) return;

        dispatchLoading({ type: 'SET_SENDING_MESSAGE', payload: true });
        
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const optimisticMessage = normalizeMessage({
            id: tempId,
            message_id: tempId, // Ensure both id and message_id are set
            content: messageContent,
            created_at: new Date().toISOString(),
            sender_id: currentUserRef.current?.user_id,
            sender: {
                user_id: currentUserRef.current?.user_id,
                username: currentUserRef.current?.username,
                full_name: currentUserRef.current?.full_name,
                cloudinary_url: currentUserRef.current?.cloudinary_url
            },
            chat_id: currentChat.chat_id,
            is_read: false,
            is_edited: false,
            is_temp: true,
            _tempId: tempId // Keep track of temp ID for replacement
        });

        setMessages(prev => [...prev, optimisticMessage]);
        
        // Only clear state if we used the state value (not the event value)
        if (!e.currentInputValue) {
            setNewMessage("");
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/${currentChat.chat_id}/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ content: messageContent })
            });

            if (response.ok) {
                const data = await response.json();
                const finalMessage = normalizeMessage(data.message);
                
                // Replace temp message with final message and remove any duplicates
                setMessages(prev => {
                    debugLog('[SEND_MESSAGE] Replacing temp message with final message');
                    
                    // Remove the specific temp message
                    const withoutTemp = prev.filter(m => m._tempId !== tempId && m.id !== tempId);
                    
                    // Check if final message already exists (from WebSocket)
                    const finalExists = withoutTemp.some(msg => 
                        msg.message_id === finalMessage.message_id
                    );
                    
                    if (finalExists) {
                        debugLog('[SEND_MESSAGE] Final message already exists from WebSocket, keeping existing');
                        return withoutTemp;
                    }
                    
                    debugLog('[SEND_MESSAGE] Adding final message from API response');
                    // Mark message as coming from API to help WebSocket deduplication
                    const markedMessage = { ...finalMessage, _fromAPI: true };
                    return [...withoutTemp, markedMessage];
                });
                
                fetchChats();
                window.dispatchEvent(new CustomEvent('messageUpdate'));
            } else {
                const errorData = await response.json();
                console.error("[SEND_MESSAGE] Failed to send message:", errorData);
                showToast(errorData.error || "Failed to send message", 5000);
                setMessages(prev => prev.filter(m => m._tempId !== tempId && m.id !== tempId));
            }
        } catch (error) {
            console.error("[SEND_MESSAGE] Error sending message:", error);
            showToast("An unexpected error occurred while sending the message.", 5000);
            setMessages(prev => prev.filter(m => m._tempId !== tempId && m.id !== tempId));
        } finally {
            dispatchLoading({ type: 'SET_SENDING_MESSAGE', payload: false });
        }
    }, [newMessage, currentChat, token, BACKEND_URL, fetchChats, showToast, loadingState.sendingMessage]);

    const updateMessage = useCallback(async (messageId, newContent) => {
        if (!token || !newContent.trim()) return;
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/message/${messageId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newContent.trim()
                })
            });

            if (response.ok) {
                const data = await response.json();
                const normalizedMessage = normalizeMessage(data.message);
                setMessages(prev => prev.map(msg => 
                    msg.message_id === messageId ? normalizedMessage : msg
                ));
                dispatchLoading({ type: 'SET_EDITING_MESSAGE', payload: null });
                showToast("Message updated successfully!");
            } else {
                console.error("Failed to update message");
                showToast("Failed to update message. Please try again.", 3000);
            }
        } catch (error) {
            console.error("Error updating message:", error);
            showToast("Failed to update message. Please try again.", 3000);
        }
    }, [token, BACKEND_URL, showToast]);

    const deleteMessage = useCallback(async (messageId) => {
        const confirmDelete = () => {
            hideConfirmation();
            
            fetch(`${BACKEND_URL}/api/message/${messageId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    setMessages(prev => prev.filter(msg => msg.message_id !== messageId));
                    fetchChats(); // Refresh chats to update last message
                    showToast("Message deleted successfully!");
                } else {
                    console.error("Failed to delete message");
                    showToast("Failed to delete message. Please try again.", 3000);
                }
            })
            .catch(error => {
                console.error("Error deleting message:", error);
                showToast("Failed to delete message. Please try again.", 3000);
            });
        };
        
        showConfirmation("Are you sure you want to delete this message?", confirmDelete, 'danger');
    }, [token, BACKEND_URL, showConfirmation, hideConfirmation, fetchChats, showToast]);

    const deleteChat = useCallback(async (chatIdToDelete) => {
        const confirmDelete = () => {
            hideConfirmation();
            
            fetch(`${BACKEND_URL}/api/chat/${chatIdToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    // Immediately remove from chats list (React state update)
                    setChats(prev => {
                        const deletedChat = prev.find(chat => chat.chat_id === chatIdToDelete);
                        const unreadToRemove = deletedChat?.unread_count || 0;
                        
                        // Update total unread count
                        setTotalUnreadCount(prevTotal => Math.max(0, prevTotal - unreadToRemove));
                        
                        return prev.filter(chat => chat.chat_id !== chatIdToDelete);
                    });
                    
                    // If we're currently viewing the deleted chat, navigate away
                    if (currentChat && currentChat.chat_id === chatIdToDelete) {
                        setCurrentChat(null);
                        setMessages([]);
                        navigate("/messages");
                    }
                    
                    // Notify navbar to update
                    window.dispatchEvent(new CustomEvent('messageUpdate'));
                    showToast("Conversation deleted successfully!");
                } else {
                    return response.json().then(errorData => {
                        console.error("Failed to delete chat:", response.status, errorData);
                        showToast(`Failed to delete conversation: ${errorData.error || 'Unknown error'}`, 3000);
                    });
                }
            })
            .catch(error => {
                console.error("Error deleting chat:", error);
                showToast("Failed to delete conversation. Please try again.", 3000);
            });
        };
        
        showConfirmation("Are you sure you want to delete this entire conversation?", confirmDelete, 'danger');
    }, [token, BACKEND_URL, currentChat, navigate, showConfirmation, hideConfirmation, showToast]);

    // WebSocket event handlers - Use refs to avoid dependency issues
    const handleNewMessage = useCallback((data) => {
        const handlerCallId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        debugLog('[WEBSOCKET] 📨 RAW MESSAGE RECEIVED:', data, 'Handler Call ID:', handlerCallId);
        
        const { chat_id, message } = data;
        const normalizedMessage = normalizeMessage(message);
        
        // CRITICAL: Early deduplication using message ID and timestamp
        const messageKey = `${normalizedMessage.message_id}_${normalizedMessage.chat_id}`;
        const now = Date.now();
        
        // Use module-level cache to track recent messages
        const lastProcessed = messageThrottleCache.get(messageKey);
        if (lastProcessed && (now - lastProcessed) < 300) { // Reduced to 300ms to balance deduplication and rapid updates
            debugLog('[WEBSOCKET] ⚡ BLOCKING DUPLICATE MESSAGE:', messageKey, 'Handler Call ID:', handlerCallId);
            debugLog('[WEBSOCKET] Last processed:', new Date(lastProcessed), 'Current:', new Date(now));
            return; // Early exit to prevent any processing
        }
        messageThrottleCache.set(messageKey, now);
        
        debugLog('[WEBSOCKET] ✅ PROCESSING NEW MESSAGE:', normalizedMessage, 'Handler Call ID:', handlerCallId);
        debugLog('[WEBSOCKET] Current chat ID:', currentChatRef.current?.chat_id);
        debugLog('[WEBSOCKET] Current user ID:', currentUserRef.current?.user_id);
        
        // Clean up old entries to prevent memory leaks
        if (messageThrottleCache.size > 50) {
            const entries = Array.from(messageThrottleCache.entries());
            entries.slice(0, 25).forEach(([key]) => messageThrottleCache.delete(key));
        }
        
        // Pre-calculate values to avoid repeated calculations
        const isCurrentUserMessage = normalizedMessage.sender_id === currentUserRef.current?.user_id;
        const isCurrentChat = currentChatRef.current && currentChatRef.current.chat_id === chat_id;
        
        // Always add the message to the current chat if we're viewing it,
        // regardless of sender (this ensures real-time updates for all users)
        if (isCurrentChat) {
            debugLog('[WEBSOCKET] ✅ Adding to current chat - chat IDs match');
            
            setMessages(prevMessages => {
                debugLog('[WEBSOCKET] Previous messages count:', prevMessages.length);
                
                // OPTIMIZED: Fast deduplication using direct ID lookup (O(1) instead of O(n))
                if (normalizedMessage.message_id) {
                    // Create a Set of existing message IDs for fast lookup
                    const existingIds = new Set(prevMessages.map(msg => msg.message_id));
                    if (existingIds.has(normalizedMessage.message_id)) {
                        debugLog('[WEBSOCKET] ⚠️ Message exists by ID:', normalizedMessage.message_id);
                        return prevMessages; // Early return - no changes needed
                    }
                }
                
                // OPTIMIZED: Only check API duplicates for own messages with pre-calculated timestamp
                let messageExists = false;
                if (isCurrentUserMessage && normalizedMessage.created_at) {
                    const newMessageTime = new Date(normalizedMessage.created_at).getTime();
                    // Only check last 3 messages for API duplicates (most recent are most likely)
                    const recentMessages = prevMessages.slice(-3);
                    messageExists = recentMessages.some(msg => {
                        if (msg._fromAPI && Math.abs(new Date(msg.created_at).getTime() - newMessageTime) < 2000) {
                            debugLog('[WEBSOCKET] ⚠️ Skipping WebSocket message - already have from API');
                            return true;
                        }
                        return false;
                    });
                }
                
                if (!messageExists) {
                    debugLog('[WEBSOCKET] ✅ Adding NEW message to current chat:', normalizedMessage);
                    
                    // OPTIMIZED: For own messages, find and replace temp messages more efficiently
                    if (isCurrentUserMessage) {
                        // Find temp message index to replace (avoid creating new array if none found)
                        let tempIndex = -1;
                        for (let i = prevMessages.length - 1; i >= Math.max(0, prevMessages.length - 5); i--) {
                            const msg = prevMessages[i];
                            if (msg.is_temp && 
                                msg.content === normalizedMessage.content && 
                                msg.sender_id === normalizedMessage.sender_id) {
                                tempIndex = i;
                                break;
                            }
                        }
                        
                        if (tempIndex !== -1) {
                            // Replace temp message in place
                            const newMessages = [...prevMessages];
                            newMessages[tempIndex] = normalizedMessage;
                            return newMessages;
                        } else {
                            // No temp message found, just append
                            return [...prevMessages, normalizedMessage];
                        }
                    } else {
                        // For others' messages, just add normally
                        return [...prevMessages, normalizedMessage];
                    }
                }
                
                debugLog('[WEBSOCKET] ⚠️ Message already exists, skipping duplicate');
                return prevMessages;
            });
        } else {
            debugLog('[WEBSOCKET] ❌ NOT adding to current chat - chat IDs don\'t match or no current chat');
            debugLog('[WEBSOCKET] Current chat:', currentChatRef.current?.chat_id, 'Message chat:', chat_id);
        }
        
        // OPTIMIZED: Single chat list update with minimal processing
        setChats(prevChats => {
            debugLog('[WEBSOCKET] Updating chats list for message - Handler Call ID:', handlerCallId);
            
            const updatedChats = prevChats.map(chat => {
                if (chat.chat_id === chat_id) {
                    debugLog('[WEBSOCKET] Updating chat in list:', {
                        chat_id,
                        isCurrentUserMessage,
                        isCurrentChat,
                        handlerCallId
                    });
                    
                    return {
                        ...chat,
                        last_message: normalizedMessage.content,
                        last_message_timestamp: normalizedMessage.timestamp || normalizedMessage.created_at,
                        // Only increment unread count if:
                        // 1. Message is NOT from current user AND
                        // 2. User is NOT currently viewing this chat
                        unread_count: (!isCurrentUserMessage && !isCurrentChat) 
                            ? chat.unread_count + 1 
                            : chat.unread_count
                    };
                }
                return chat; // Return original reference for unchanged chats
            });
            
            // Only sort if something actually changed to minimize work
            const chatUpdated = prevChats.some(chat => chat.chat_id === chat_id);
            return chatUpdated ? 
                updatedChats.sort((a, b) => new Date(b.last_message_timestamp) - new Date(a.last_message_timestamp)) :
                prevChats;
        });

        // Update total unread count if message is not from current user and not in current chat
        if (!isCurrentUserMessage && !isCurrentChat) {
            setTotalUnreadCount(prev => prev + 1);
            
            // Dispatch custom event for navbar
            window.dispatchEvent(new CustomEvent('unreadCountChanged', { 
                detail: { count: Date.now() } // Use timestamp to trigger update
            }));
        }
        
        debugLog('[WEBSOCKET] 📨 Message handling completed - Handler Call ID:', handlerCallId);
    }, []); // ✅ No dependencies - use refs instead

    const handleMessagesRead = useCallback((data) => {
        const { chat_id, user_id } = data;
        
        // Only update if it's not the current user who marked them as read
        if (user_id !== currentUserRef.current?.user_id) {
            // Mark messages as read in the current view
            setMessages(prevMessages => {
                return prevMessages.map(msg => {
                    if (msg.sender_id === currentUserRef.current?.user_id) {
                        return { ...msg, is_read: true };
                    }
                    return msg;
                });
            });
        }
    }, []);

    const handleChatDeleted = useCallback((data) => {
        const { chat_id, deleted_by } = data;
        
        // Remove chat from chat list
        setChats(prevChats => prevChats.filter(chat => chat.chat_id !== chat_id));
        
        // Show notification
        const message = deleted_by === currentUserRef.current?.user_id 
            ? 'Chat deleted successfully' 
            : 'This chat has been deleted';
        showToast(message);
        
        // Navigate away if this is the current chat
        if (currentChatRef.current && currentChatRef.current.chat_id === chat_id) {
            navigate('/messages');
        }
    }, [navigate, showToast]);

    // Effects with proper dependency arrays
    // Check WebSocket server availability on mount
    useEffect(() => {
        checkWebSocketServerAvailability();
    }, [checkWebSocketServerAvailability]);

    // Fetch current user on component mount
    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    // WebSocket connection setup - AUTO-CONNECT FOR REAL-TIME MESSAGING
    useEffect(() => {
        // Only set up WebSocket if server is available
        if (isSocketServerAvailable !== true) {
            return;
        }
        
        // Listen for connection status changes
        const handleConnectionStatus = (data) => {
            setIsSocketConnected(data.connected);
        };
        
        socketService.on('connection_status_changed', handleConnectionStatus);
        
        // Check if already connected (from global initialization)
        if (!socketService.getConnectionStatus()) {
            // If not connected globally, try to connect here
            debugLog('[WEBSOCKET] Connecting WebSocket for real-time messaging...');
            socketService.connect().catch(error => {
                console.error('[WEBSOCKET] Auto-connect failed:', error);
                showToast('Failed to connect to real-time messaging ⚠️', 4000);
            });
        } else {
            debugLog('[WEBSOCKET] WebSocket already connected globally ✅');
        }
        
        // Initial status check
        setIsSocketConnected(socketService.getConnectionStatus());
        
        return () => {
            socketService.off('connection_status_changed', handleConnectionStatus);
        };
    }, [isSocketServerAvailable, showToast]);

    // Setup event handlers when connected - PREVENT DUPLICATE REGISTRATIONS
    useEffect(() => {
        if (!isSocketConnected || !currentUser?.user_id) {
            // Clean up if disconnected or no user
            if (handlersRegisteredRef.current) {
                debugLog('[WEBSOCKET] Cleaning up handlers due to disconnect/logout');
                socketService.off('message_received', handleNewMessage);
                socketService.off('messages_marked_read', handleMessagesRead);
                socketService.off('chat_was_deleted', handleChatDeleted);
                handlersRegisteredRef.current = false;
            }
            return;
        }
        
        // Only register if not already registered
        if (!handlersRegisteredRef.current) {
            debugLog('[WEBSOCKET] Setting up event handlers for user:', currentUser.user_id);
            debugLog('[WEBSOCKET] Current message_received listeners before setup:', socketService.listeners.get('message_received')?.length || 0);
            
            // SAFETY: Clean up any existing handlers first to prevent duplicates
            socketService.off('message_received', handleNewMessage);
            socketService.off('messages_marked_read', handleMessagesRead);
            socketService.off('chat_was_deleted', handleChatDeleted);
            
            debugLog('[WEBSOCKET] After cleanup - message_received listeners:', socketService.listeners.get('message_received')?.length || 0);
            
            // Now register fresh handlers
            socketService.on('message_received', handleNewMessage);
            socketService.on('messages_marked_read', handleMessagesRead);
            socketService.on('chat_was_deleted', handleChatDeleted);
            handlersRegisteredRef.current = true;
            
            debugLog('[WEBSOCKET] Current message_received listeners after setup:', socketService.listeners.get('message_received')?.length || 0);
        } else {
            debugLog('[WEBSOCKET] Handlers already registered, skipping setup');
            debugLog('[WEBSOCKET] Current message_received listeners count:', socketService.listeners.get('message_received')?.length || 0);
        }
        
        return () => {
            // Only clean up on component unmount, not on dependency changes
            debugLog('[WEBSOCKET] Effect cleanup - keeping handlers registered for now');
        };
    }, [isSocketConnected, currentUser?.user_id]); // Minimal dependencies
    
    // Clean up handlers only on component unmount
    useEffect(() => {
        return () => {
            if (handlersRegisteredRef.current) {
                debugLog('[WEBSOCKET] Component unmounting - cleaning up all handlers');
                socketService.off('message_received', handleNewMessage);
                socketService.off('messages_marked_read', handleMessagesRead);
                socketService.off('chat_was_deleted', handleChatDeleted);
                handlersRegisteredRef.current = false;
            }
        };
    }, []); // Empty dependency array = only on unmount

    // Join/leave chat rooms when current chat changes
    useEffect(() => {
        if (!currentUser || !currentChat || !isSocketConnected) {
            return;
        }

        // Add a small delay to ensure WebSocket is fully connected before joining
        const joinTimer = setTimeout(() => {
            debugLog('[WEBSOCKET] Joining chat room:', currentChat.chat_id);
            socketService.joinChat(currentChat.chat_id, currentUser.user_id);
        }, 100);

        // Leave room when component unmounts or chat changes
        return () => {
            clearTimeout(joinTimer);
            if (currentChat && isSocketConnected) {
                debugLog('[WEBSOCKET] Leaving chat room:', currentChat.chat_id);
                socketService.leaveChat(currentChat.chat_id, currentUser.user_id);
            }
        };
    }, [currentUser?.user_id, currentChat?.chat_id, isSocketConnected]);

    // Fetch chats when component mounts and user is available
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        // Always stop main loading after initialization, regardless of connection success
        dispatchLoading({ type: 'SET_MAIN_LOADING', payload: false });

        if (currentUser) {
            fetchChats();
        }
    }, [token, navigate, currentUser, fetchChats]);

    // Fetch specific chat when chatId changes
    useEffect(() => {
        if (chatId && currentUser) {
            fetchChat(chatId);
        }
    }, [chatId, currentUser, fetchChat]);

    // Mark messages as read when chat becomes visible (user actually opens/views the chat)
    useEffect(() => {
        if (currentChat && currentChat.chat_id && currentChat.unread_count > 0) {
            // Mark as read immediately when chat becomes active
            markMessagesAsRead(currentChat.chat_id);
        }
    }, [currentChat?.chat_id, markMessagesAsRead]); // Only depend on chat_id change, not unread_count

    // Filter chats based on search term
    const filteredChats = chats.filter(chat => 
        chat.participant?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.participant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    // WebSocket control functions
    const connectWebSocket = useCallback(async () => {
        // Check if server is available before attempting connection
        if (isSocketServerAvailable !== true) {
            const isAvailable = await checkWebSocketServerAvailability();
            if (!isAvailable) {
                showToast('WebSocket server is not available ❌', 3000);
                return;
            }
        }
        
        try {
            await socketService.connect();
            showToast('WebSocket connected! 🟢', 7000);
        } catch (error) {
            showToast('Failed to connect WebSocket ❌', 3000);
        }
    }, [showToast, isSocketServerAvailable, checkWebSocketServerAvailability]);

    const disconnectWebSocket = useCallback(() => {
        socketService.disconnect();
        showToast('WebSocket disconnected 🔴', 7000);
    }, [showToast]);

    // Initialize read status management for viewport-based read receipts
    const { registerMessage, unregisterMessage, markAllVisibleAsRead } = useMessageReadStatus({
        messages,
        currentUser,
        currentChatId: currentChat?.chat_id,
        onMarkAsRead: markMessagesAsRead,
        isSocketConnected
    });

    // Return state and actions for components
    return {
        // State
        chats: filteredChats,
        currentChat,
        messages,
        newMessage,
        searchTerm,
        totalUnreadCount,
        currentUser,
        loadingState,
        connectionError,
        showSuccessToast,
        toastMessage,
        confirmState,
        isSocketConnected,
        isSocketServerAvailable,
        
        // Actions
        setNewMessage: optimizedSetNewMessage,
        setSearchTerm,
        sendMessage,
        updateMessage,
        deleteMessage,
        deleteChat,
        fetchChat,
        markMessagesAsRead,
        showConfirmation,
        hideConfirmation,
        showToast,
        dispatchLoading,
        navigate,
        connectWebSocket,
        disconnectWebSocket,
        checkWebSocketServerAvailability,
        
        // Read status management
        registerMessage,
        unregisterMessage,
        markAllVisibleAsRead,
    };
};