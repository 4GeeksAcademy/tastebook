import { useState, useEffect, useRef, useReducer, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import socketService from "../../utils/socketService";
import { normalizeMessage, normalizeChat } from "../utils/normalize";

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
    
    // Loading state management with reducer
    const [loadingState, dispatchLoading] = useReducer(loadingReducer, initialLoadingState);
    
    // Confirmation modal state
    const [confirmState, dispatchConfirm] = useReducer(confirmationReducer, initialConfirmState);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Keep currentUser reference up to date
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

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

    // API Functions
    const fetchCurrentUser = useCallback(async () => {
        if (!token || !backendUrl) {
            setCurrentUser(null);
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/settings`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.current_user);
            } else {
                setCurrentUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch current user:", error);
            setCurrentUser(null);
        }
    }, [token, backendUrl]);

    const fetchChats = useCallback(async () => {
        if (!token) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/chats`, {
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
            } else {
                const errorData = await response.json();
                console.error("Failed to fetch chats:", errorData);
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        }
    }, [token, backendUrl]);

    const fetchChat = useCallback(async (chatIdToFetch) => {
        if (!token || !chatIdToFetch) return;
        
        dispatchLoading({ type: 'SET_CHAT_LOADING', payload: true });
        
        try {
            const response = await fetch(`${backendUrl}/api/chat/${chatIdToFetch}`, {
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
    }, [token, backendUrl, showToast]);

    const handleNewChatFromId = useCallback(async (chatIdToFetch) => {
        try {
            // For new chats that don't exist yet, we need to get the chat info from the backend
            // The backend should have created the chat, so let's try fetching it again with a delay
            setTimeout(async () => {
                const response = await fetch(`${backendUrl}/api/chat/${chatIdToFetch}`, {
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
    }, [token, backendUrl, navigate]);

    const markMessagesAsRead = useCallback(async (chatIdToMark) => {
        if (!token) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/chat/${chatIdToMark}/mark-read`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Update the chats state immediately to reflect read status
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat.chat_id === chatIdToMark 
                            ? { ...chat, unread_count: 0 }
                            : chat
                    )
                );
                
                // Update total unread count
                setTotalUnreadCount(prev => {
                    // Find the chat being marked as read in current state
                    setChats(currentChats => {
                        const currentChatInList = currentChats.find(chat => chat.chat_id === chatIdToMark);
                        const previousUnread = currentChatInList?.unread_count || 0;
                        setTotalUnreadCount(prevTotal => Math.max(0, prevTotal - previousUnread));
                        return currentChats;
                    });
                    return prev;
                });
                
                // Notify Navbar to update its unread count
                window.dispatchEvent(new CustomEvent('messageUpdate'));
            } else {
                console.error("Failed to mark messages as read");
            }
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    }, [token, backendUrl]);

    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentChat || loadingState.sendingMessage) return;

        console.log('[SEND_MESSAGE] 📤 Starting send message process');
        console.log('[SEND_MESSAGE] Message content:', newMessage.trim());
        console.log('[SEND_MESSAGE] Current chat:', currentChat.chat_id);

        dispatchLoading({ type: 'SET_SENDING_MESSAGE', payload: true });
        
        try {
            const url = `${backendUrl}/api/chat/${currentChat.chat_id}/message`;
            
            const requestBody = {
                content: newMessage.trim()
            };

            console.log('[SEND_MESSAGE] Sending POST request to:', url);
            console.log('[SEND_MESSAGE] Request body:', requestBody);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('[SEND_MESSAGE] Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                const normalizedMessage = normalizeMessage(data.message);
                
                console.log('[SEND_MESSAGE] ✅ Message sent successfully:', normalizedMessage);
                
                // Clear the input immediately for better UX
                setNewMessage("");
                
                console.log('[SEND_MESSAGE] ⏳ Waiting for WebSocket update...');
                
                // Don't add message locally - let WebSocket handle it for real-time consistency
                // The backend should emit the message via WebSocket to all connected clients
                
                // Update the chat in the chats list with the new last message
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat.chat_id === currentChat.chat_id 
                            ? { 
                                ...chat, 
                                last_message: normalizedMessage.content,
                                last_message_timestamp: normalizedMessage.created_at,
                                updated_at: normalizedMessage.created_at
                              }
                            : chat
                    )
                );
            } else {
                const errorData = await response.json();
                console.error("[SEND_MESSAGE] ❌ Failed to send message:", response.status, errorData);
                showToast("Failed to send message. Please try again.", 3000);
            }
        } catch (error) {
            console.error("[SEND_MESSAGE] ❌ Error sending message:", error);
            showToast("Failed to send message. Please try again.", 3000);
        } finally {
            dispatchLoading({ type: 'SET_SENDING_MESSAGE', payload: false });
        }
    }, [newMessage, currentChat, loadingState.sendingMessage, backendUrl, token, showToast]);

    const updateMessage = useCallback(async (messageId, newContent) => {
        if (!token || !newContent.trim()) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/message/${messageId}`, {
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
    }, [token, backendUrl, showToast]);

    const deleteMessage = useCallback(async (messageId) => {
        const confirmDelete = () => {
            hideConfirmation();
            
            fetch(`${backendUrl}/api/message/${messageId}`, {
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
    }, [token, backendUrl, showConfirmation, hideConfirmation, fetchChats, showToast]);

    const deleteChat = useCallback(async (chatIdToDelete) => {
        const confirmDelete = () => {
            hideConfirmation();
            
            fetch(`${backendUrl}/api/chat/${chatIdToDelete}`, {
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
    }, [token, backendUrl, currentChat, navigate, showConfirmation, hideConfirmation, showToast]);

    // WebSocket event handlers
    const handleNewMessage = useCallback((data) => {
        console.log('[WEBSOCKET] 📨 RAW MESSAGE RECEIVED:', data);
        console.log('[WEBSOCKET] Current chat ID:', currentChat?.chat_id);
        console.log('[WEBSOCKET] Current user ID:', currentUserRef.current?.user_id);
        
        const { chat_id, message } = data;
        const normalizedMessage = normalizeMessage(message);
        
        console.log('[WEBSOCKET] 📨 NORMALIZED MESSAGE:', normalizedMessage);
        
        // Always add the message to the current chat if we're viewing it,
        // regardless of sender (this ensures real-time updates for all users)
        if (currentChat && currentChat.chat_id === chat_id) {
            console.log('[WEBSOCKET] ✅ Adding to current chat - chat IDs match');
            setMessages(prevMessages => {
                console.log('[WEBSOCKET] Previous messages count:', prevMessages.length);
                
                // Check if message already exists to avoid duplicates
                const messageExists = prevMessages.some(msg => 
                    msg.message_id === normalizedMessage.message_id || 
                    (msg.content === normalizedMessage.content && 
                     msg.sender_id === normalizedMessage.sender_id &&
                     Math.abs(new Date(msg.created_at) - new Date(normalizedMessage.created_at)) < 1000)
                );
                
                if (!messageExists) {
                    console.log('[WEBSOCKET] ✅ Adding NEW message to current chat:', normalizedMessage);
                    const newMessages = [...prevMessages, normalizedMessage];
                    console.log('[WEBSOCKET] New messages count:', newMessages.length);
                    return newMessages;
                }
                
                console.log('[WEBSOCKET] ⚠️ Message already exists, skipping duplicate');
                return prevMessages;
            });
        } else {
            console.log('[WEBSOCKET] ❌ NOT adding to current chat - chat IDs don\'t match or no current chat');
            console.log('[WEBSOCKET] Current chat:', currentChat?.chat_id, 'Message chat:', chat_id);
        }
        
        // Always update chat list to show latest message and time (for all users)
        setChats(prevChats => {
            console.log('[WEBSOCKET] Updating chats list for message');
            return prevChats.map(chat => {
                if (chat.chat_id === chat_id) {
                    const isCurrentUserMessage = normalizedMessage.sender_id === currentUserRef.current?.user_id;
                    const isCurrentChat = currentChat && currentChat.chat_id === chat_id;
                    
                    console.log('[WEBSOCKET] Updating chat in list:', {
                        chat_id,
                        isCurrentUserMessage,
                        isCurrentChat
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
                return chat;
            }).sort((a, b) => new Date(b.last_message_timestamp) - new Date(a.last_message_timestamp));
        });

        // Update total unread count if message is not from current user and not in current chat
        const isCurrentUserMessage = normalizedMessage.sender_id === currentUserRef.current?.user_id;
        const isCurrentChat = currentChat && currentChat.chat_id === chat_id;
        
        if (!isCurrentUserMessage && !isCurrentChat) {
            setTotalUnreadCount(prev => prev + 1);
            
            // Dispatch custom event for navbar
            window.dispatchEvent(new CustomEvent('unreadCountChanged', { 
                detail: { count: Date.now() } // Use timestamp to trigger update
            }));
        }
        
        console.log('[WEBSOCKET] 📨 Message handling completed');
    }, [currentChat]);

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
        if (currentChat && currentChat.chat_id === chat_id) {
            navigate('/messages');
        }
    }, [currentChat, navigate, showToast]);

    // Effects with proper dependency arrays
    // Fetch current user on component mount
    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    // Initialize WebSocket connection and event listeners
    useEffect(() => {
        if (!currentUser) {
            return;
        }

        // Only connect once per user session
        if (!socketConnectedRef.current) {
            console.log('[WEBSOCKET] Initializing connection for user:', currentUser.user_id);
            
            // Connect to WebSocket server
            socketService.connect();
            socketConnectedRef.current = true;

            // Register event listeners
            socketService.on('message_received', handleNewMessage);
            socketService.on('messages_marked_read', handleMessagesRead);
            socketService.on('chat_was_deleted', handleChatDeleted);
        }

        // Cleanup function
        return () => {
            // Only cleanup when component unmounts, not on user changes
            if (socketConnectedRef.current) {
                console.log('[WEBSOCKET] Cleaning up connection');
                socketService.off('message_received', handleNewMessage);
                socketService.off('messages_marked_read', handleMessagesRead);
                socketService.off('chat_was_deleted', handleChatDeleted);
                socketService.disconnect();
                socketConnectedRef.current = false;
            }
        };
    }, [currentUser?.user_id, handleNewMessage, handleMessagesRead, handleChatDeleted]);

    // Join/leave chat rooms when current chat changes
    useEffect(() => {
        if (!currentUser || !currentChat || !socketConnectedRef.current) {
            return;
        }

        // Add a small delay to ensure WebSocket is fully connected before joining
        const joinTimer = setTimeout(() => {
            console.log('[WEBSOCKET] Joining chat room:', currentChat.chat_id);
            socketService.joinChat(currentChat.chat_id, currentUser.user_id);
        }, 100);

        // Leave room when component unmounts or chat changes
        return () => {
            clearTimeout(joinTimer);
            if (currentChat && socketConnectedRef.current) {
                console.log('[WEBSOCKET] Leaving chat room:', currentChat.chat_id);
                socketService.leaveChat(currentChat.chat_id, currentUser.user_id);
            }
        };
    }, [currentUser?.user_id, currentChat?.chat_id]);

    // Fetch chats when component mounts and user is available
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        if (currentUser) {
            fetchChats();
            dispatchLoading({ type: 'SET_MAIN_LOADING', payload: false });
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
        showSuccessToast,
        toastMessage,
        confirmState,
        
        // Actions
        setNewMessage,
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
        navigate
    };
};