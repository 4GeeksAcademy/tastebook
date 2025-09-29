import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Send, MoreVertical, ArrowLeft, Search, Edit3, Trash2, MessageCircleMore } from "lucide-react";
import UserAvatar from "../components/UserAvatar";

export const Messages = () => {
    const navigate = useNavigate();
    const { chatId } = useParams();
    const token = localStorage.getItem("token");
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    
    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingMessage, setEditingMessage] = useState(null);
    const [showChatOptions, setShowChatOptions] = useState(null);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch current user data
    const fetchCurrentUser = async () => {
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
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch current user on component mount
    useEffect(() => {
        fetchCurrentUser();
    }, [token, backendUrl]);

    // Fetch all chats for the user
    const fetchChats = async () => {
        if (!token) return;
        
        console.log("[DEBUG CHATS] Fetching chats...");
        console.log("[DEBUG CHATS] Backend URL:", backendUrl);
        console.log("[DEBUG CHATS] Token exists:", !!token);
        
        try {
            const response = await fetch(`${backendUrl}/api/chats`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            console.log("[DEBUG CHATS] Response status:", response.status);
            console.log("[DEBUG CHATS] Response ok:", response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log("[DEBUG CHATS] Chats data received:", data);
                console.log("[DEBUG CHATS] Number of chats:", data.chats?.length || 0);
                setChats(data.chats);
                setTotalUnreadCount(data.total_unread);
            } else {
                const errorData = await response.json();
                console.error("[DEBUG CHATS] Failed to fetch chats:", errorData);
            }
        } catch (error) {
            console.error("[DEBUG CHATS] Error fetching chats:", error);
        }
    };

    // Fetch specific chat with messages
    const fetchChat = async (chatIdToFetch) => {
        if (!token || !chatIdToFetch) return;
        
        setChatLoading(true);
        console.log("Fetching chat with ID:", chatIdToFetch);
        
        try {
            const response = await fetch(`${backendUrl}/api/chat/${chatIdToFetch}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            console.log("Fetch chat response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("Chat data received:", data);
                setCurrentChat(data.chat);
                setMessages(data.chat.messages || []);
                
                // Show welcome message for new chats
                if (!data.chat.messages || data.chat.messages.length === 0) {
                    setToastMessage(`Conversation started with ${data.chat.participant?.full_name || data.chat.participant?.username}! 💬`);
                    setShowSuccessToast(true);
                    setTimeout(() => setShowSuccessToast(false), 4000);
                }
                
                // Update the chat in the chats list immediately
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat.chat_id === chatIdToFetch 
                            ? { ...chat, ...data.chat }
                            : chat
                    )
                );
                
                // Refresh the chats list to ensure it includes this chat
                setTimeout(() => {
                    fetchChats();
                }, 300);
            } else {
                console.error("Failed to fetch chat:", response.status);
                // If chat doesn't exist, try to create a placeholder
                await handleNewChatFromId(chatIdToFetch);
            }
        } catch (error) {
            console.error("Error fetching chat:", error);
        } finally {
            setChatLoading(false);
        }
    };

    // Handle when a chat ID doesn't exist yet - get user info and create proper chat interface
    const handleNewChatFromId = async (chatIdToFetch) => {
        try {
            console.log("Chat not found, attempting retry in 1 second...");
            // For new chats that don't exist yet, we need to get the chat info from the backend
            // The backend should have created the chat, so let's try fetching it again with a delay
            setTimeout(async () => {
                console.log("Retrying chat fetch...");
                const response = await fetch(`${backendUrl}/api/chat/${chatIdToFetch}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Chat found on retry:", data);
                    setCurrentChat(data.chat);
                    setMessages(data.chat.messages || []);
                    fetchChats(); // Refresh chats list
                } else {
                    console.error("Chat still not found on retry");
                    // If chat still doesn't exist, navigate back to messages
                    navigate("/messages");
                }
                setChatLoading(false);
            }, 1000);
        } catch (error) {
            console.error("Error handling new chat:", error);
            setChatLoading(false);
        }
    };

    // Mark messages as read
    const markMessagesAsRead = async (chatIdToMark) => {
        if (!token) return;
        
        console.log("[DEBUG READ] Marking messages as read for chat:", chatIdToMark);
        
        try {
            const response = await fetch(`${backendUrl}/api/chat/${chatIdToMark}/mark-read`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log("[DEBUG READ] Successfully marked messages as read:", data);
                
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
                    const currentChat = chats.find(chat => chat.chat_id === chatIdToMark);
                    const previousUnread = currentChat?.unread_count || 0;
                    return Math.max(0, prev - previousUnread);
                });
                
                // Notify Navbar to update its unread count
                window.dispatchEvent(new CustomEvent('messageUpdate'));
                
                // Also refresh from server to ensure consistency
                setTimeout(() => {
                    fetchChats();
                }, 500);
            } else {
                console.error("[DEBUG READ] Failed to mark messages as read");
            }
        } catch (error) {
            console.error("[DEBUG READ] Error marking messages as read:", error);
        }
    };

    // Send new message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentChat || sendingMessage) return;

        console.log("[DEBUG FRONTEND] Starting sendMessage...");
        console.log("[DEBUG FRONTEND] Message content:", newMessage.trim());
        console.log("[DEBUG FRONTEND] Current chat:", currentChat);
        console.log("[DEBUG FRONTEND] Chat ID:", currentChat?.chat_id);

        setSendingMessage(true);
        
        try {
            const url = `${backendUrl}/api/chat/${currentChat.chat_id}/message`;
            console.log("[DEBUG FRONTEND] Request URL:", url);
            
            const requestBody = {
                content: newMessage.trim()
            };
            console.log("[DEBUG FRONTEND] Request body:", requestBody);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log("[DEBUG FRONTEND] Response status:", response.status);
            console.log("[DEBUG FRONTEND] Response ok:", response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log("[DEBUG FRONTEND] SUCCESS: Response data:", data);
                
                // Add message to current chat
                setMessages(prev => [...prev, data.message]);
                setNewMessage("");
                
                // Update the chat in the chats list with the new last message
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat.chat_id === currentChat.chat_id 
                            ? { 
                                ...chat, 
                                last_message: data.message,
                                updated_at: data.message.created_at
                              }
                            : chat
                    )
                );
                
                // Refresh chats to ensure everything is in sync
                setTimeout(() => {
                    fetchChats();
                }, 200);
            } else {
                const errorData = await response.json();
                console.error("[DEBUG FRONTEND] ERROR: Failed to send message");
                console.error("[DEBUG FRONTEND] Error status:", response.status);
                console.error("[DEBUG FRONTEND] Error data:", errorData);
            }
        } catch (error) {
            console.error("[DEBUG FRONTEND] EXCEPTION: Error sending message:", error);
        } finally {
            setSendingMessage(false);
        }
    };

    // Update message
    const updateMessage = async (messageId, newContent) => {
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
                setMessages(prev => prev.map(msg => 
                    msg.message_id === messageId ? data.message : msg
                ));
                setEditingMessage(null);
            } else {
                console.error("Failed to update message");
            }
        } catch (error) {
            console.error("Error updating message:", error);
        }
    };

    // Delete message
    const deleteMessage = async (messageId) => {
        if (!token || !confirm("Are you sure you want to delete this message?")) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/message/${messageId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                setMessages(prev => prev.filter(msg => msg.message_id !== messageId));
                fetchChats(); // Refresh chats to update last message
            } else {
                console.error("Failed to delete message");
            }
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    // Delete chat
    const deleteChat = async (chatIdToDelete) => {
        if (!token || !confirm("Are you sure you want to delete this entire conversation?")) return;
        
        console.log("[DEBUG DELETE] Starting chat deletion...");
        console.log("[DEBUG DELETE] Chat ID to delete:", chatIdToDelete);
        console.log("[DEBUG DELETE] Current chat ID:", currentChat?.chat_id);
        
        try {
            const response = await fetch(`${backendUrl}/api/chat/${chatIdToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            console.log("[DEBUG DELETE] Delete response status:", response.status);
            console.log("[DEBUG DELETE] Delete response ok:", response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log("[DEBUG DELETE] Delete response data:", data);
                
                // Immediately remove from chats list (React state update)
                setChats(prev => {
                    const filteredChats = prev.filter(chat => chat.chat_id !== chatIdToDelete);
                    console.log("[DEBUG DELETE] Chats before filter:", prev.length);
                    console.log("[DEBUG DELETE] Chats after filter:", filteredChats.length);
                    return filteredChats;
                });
                
                // If we're currently viewing the deleted chat, navigate away
                if (currentChat && currentChat.chat_id === chatIdToDelete) {
                    console.log("[DEBUG DELETE] Clearing current chat and navigating to /messages");
                    setCurrentChat(null);
                    setMessages([]);
                    navigate("/messages");
                }
                
                // Update total unread count
                setTotalUnreadCount(prev => {
                    const deletedChat = chats.find(chat => chat.chat_id === chatIdToDelete);
                    const unreadToRemove = deletedChat?.unread_count || 0;
                    return Math.max(0, prev - unreadToRemove);
                });
                
                // Notify navbar to update
                window.dispatchEvent(new CustomEvent('messageUpdate'));
                
                console.log("[DEBUG DELETE] Chat successfully deleted from frontend");
            } else {
                const errorData = await response.json();
                console.error("[DEBUG DELETE] Failed to delete chat:", response.status, errorData);
                alert(`Failed to delete conversation: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("[DEBUG DELETE] Error deleting chat:", error);
            alert("Failed to delete conversation. Please try again.");
        }
    };

    // Filter chats based on search term
    const filteredChats = chats.filter(chat => 
        chat.participant?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.participant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays <= 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        if (currentUser) {
            fetchChats();
            setLoading(false);
        }
    }, [token, navigate, currentUser]);

    useEffect(() => {
        if (chatId && currentUser) {
            fetchChat(chatId);
        }
    }, [chatId, currentUser]);

    // Mark messages as read when chat becomes visible (user actually opens/views the chat)
    useEffect(() => {
        if (currentChat && currentChat.chat_id && currentChat.unread_count > 0) {
            console.log("[DEBUG READ] Chat opened with unread messages, marking as read");
            console.log("[DEBUG READ] Chat ID:", currentChat.chat_id);
            console.log("[DEBUG READ] Unread count:", currentChat.unread_count);
            
            // Mark as read immediately when chat becomes active
            markMessagesAsRead(currentChat.chat_id);
        }
    }, [currentChat?.chat_id]); // Only depend on chat_id change, not unread_count

    // Focus message input when chat loads
    useEffect(() => {
        if (currentChat && messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [currentChat]);

    if (loading) {
        return (
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden"> Loading... </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid px-0" style={{ height: "calc(100vh - 80px)" }}>
            <div className="row g-0 h-100">
                {/* Chat Sidebar */}
                <div className={`col-md-4 col-lg-3 border-end ${currentChat ? 'd-none d-md-block' : ''}`}>
                    <div className="p-3 border-bottom">
                        <h5 className="mb-3"> Messages </h5>
                        
                        {/* Search */}
                        <div className="position-relative">
                            <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={16} />
                            <input
                                type="text"
                                className="form-control ps-5"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="overflow-auto" style={{ height: "calc(100% - 120px)" }}>
                        { loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden"> Loading chats... </span>
                                </div>
                                <p className="text-muted"> Loading your conversations... </p>
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="mb-4">
                                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: "60px", height: "60px"}}>
                                        <MessageCircleMore size={30} className="text-white" />
                                    </div>
                                </div>
                                <h6 className="mb-2"> No conversations yet </h6>
                                <p className="text-muted mb-3"> Start chatting with other TasteBook users! </p>
                                <div className="d-flex flex-column gap-2 align-items-center">
                                    <button 
                                        className="btn btn-primary btn-sm"
                                        onClick={() => navigate("/users")}
                                    >
                                        Find Users to Chat With
                                    </button>
                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => navigate("/all-recipes")}
                                    >
                                        Browse Recipes & Connect
                                    </button>
                                </div>
                                <small className="text-muted d-block mt-3"> 
                                    Visit someone's profile and click "Message" to start a conversation 
                                </small>
                                
                                {/* DEBUG info */}
                                {/* <div className="mt-4 p-3 bg-light rounded text-start">
                                    <small className="text-muted">
                                        <strong>Debug Info:</strong><br/>
                                        Total chats: {chats.length}<br/>
                                        Current user: {currentUser?.username || 'Loading...'}<br/>
                                        Search term: '{searchTerm}'<br/>
                                        Backend URL: {backendUrl}
                                    </small>
                                </div> */}

                            </div>
                        ) : (
                            filteredChats.map(chat => (
                                <div
                                    key={chat.chat_id}
                                    className={`d-flex align-items-center p-3 border-bottom cursor-pointer hover-bg-light ${
                                        currentChat?.chat_id === chat.chat_id ? 'bg-primary bg-opacity-10' : ''
                                    }`}
                                    onClick={() => {
                                        console.log("[DEBUG CLICK] Chat clicked:", chat.chat_id);
                                        console.log("[DEBUG CLICK] Chat has unread:", chat.unread_count);
                                        
                                        navigate(`/messages/${chat.chat_id}`);
                                        fetchChat(chat.chat_id);
                                        
                                        // Immediately mark as read when user clicks on the chat
                                        if (chat.unread_count > 0) {
                                            console.log("[DEBUG CLICK] Marking chat as read immediately");
                                            markMessagesAsRead(chat.chat_id);
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <UserAvatar
                                        imageUrl={chat.participant?.cloudinary_url}
                                        username={chat.participant?.username}
                                        fullName={chat.participant?.full_name}
                                        size="medium"
                                        className="me-3"
                                    />
                                    
                                    <div className="flex-grow-1 min-width-0">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h6 className="mb-1 text-truncate">
                                                { chat.participant?.full_name || chat.participant?.username }
                                            </h6>
                                            <small className="text-muted">
                                                { chat.last_message?.created_at ? formatTime(chat.last_message.created_at) : '' }
                                            </small>
                                        </div>
                                        
                                        <div className="d-flex justify-content-between align-items-center">
                                            <p className="mb-0 text-muted text-truncate small">
                                                { chat.last_message?.content || 'No messages yet' }
                                            </p>
                                            { chat.unread_count > 0 && (
                                                <span className="badge bg-primary rounded-pill ms-2">
                                                    { chat.unread_count }
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`col-md-8 col-lg-9 d-flex flex-column ${!currentChat ? 'd-none d-md-flex' : ''}`}>
                    { chatLoading ? (
                        <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="text-center">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden"> Loading chat... </span>
                                </div>
                                <h6 className="text-muted"> Loading conversation... </h6>
                            </div>
                        </div>
                    ) : !currentChat ? (
                        <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="text-center">
                                <h5 className="text-muted"> Select a conversation </h5>
                                <p className="text-muted"> Choose a conversation from the sidebar to start messaging </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 border-bottom bg-white d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <button
                                        className="btn btn-link d-md-none p-0 me-3"
                                        onClick={() => {
                                            setCurrentChat(null);
                                            navigate("/messages");
                                        }}
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    
                                    <UserAvatar
                                        imageUrl={currentChat.participant?.cloudinary_url}
                                        username={currentChat.participant?.username}
                                        fullName={currentChat.participant?.full_name}
                                        size="small"
                                        className="me-3"
                                    />
                                    
                                    <div>
                                        <h6 className="mb-0">
                                            { currentChat.participant?.full_name || currentChat.participant?.username }
                                        </h6>
                                        <small className="text-muted">
                                            @{ currentChat.participant?.username }
                                        </small>
                                    </div>
                                </div>

                                <div className="dropdown">
                                    <button
                                        className="btn btn-link p-1"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li>
                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={() => deleteChat(currentChat.chat_id)}
                                            >
                                                <Trash2 size={16} className="me-2" />
                                                Delete Conversation
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div 
                                className="flex-grow-1 overflow-auto p-3" 
                                style={{ backgroundColor: "#f8f9fa" }}
                                onFocus={() => {
                                    // Mark as read when messages area gets focus
                                    if (currentChat && currentChat.unread_count > 0) {
                                        console.log("[DEBUG FOCUS] Messages area focused, marking as read");
                                        markMessagesAsRead(currentChat.chat_id);
                                    }
                                }}
                                onClick={() => {
                                    // Mark as read when user clicks in messages area
                                    if (currentChat && currentChat.unread_count > 0) {
                                        console.log("[DEBUG FOCUS] Messages area clicked, marking as read");
                                        markMessagesAsRead(currentChat.chat_id);
                                    }
                                }}
                            >
                                { messages.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="mb-4">
                                            <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: "60px", height: "60px"}}>
                                                <Send size={24} className="text-primary" />
                                            </div>
                                        </div>
                                        <h6 className="mb-2"> Start a conversation </h6>
                                        <p className="text-muted mb-4"> 
                                            Send a message to { currentChat?.participant?.full_name || currentChat?.participant?.username || 'this user' } 
                                        </p>
                                        
                                        {/* Conversation Starters */}
                                        <div className="mb-4">
                                            <small className="text-muted d-block mb-3"> Quick conversation starters: </small>
                                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                                <button 
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => setNewMessage("Hi! I saw your recipes and wanted to chat 👋")}
                                                >
                                                    👋 Say Hi
                                                </button>
                                                <button 
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => setNewMessage("Love your recipes! Do you have any cooking tips to share?")}
                                                >
                                                    🍳 Ask about cooking
                                                </button>
                                                <button 
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => setNewMessage("Would you like to share recipe ideas?")}
                                                >
                                                    📝 Share ideas
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <small className="text-muted"> Or type a custom message below </small>
                                    </div>
                                ) : (
                                    messages.map((message, index) => {
                                        const isCurrentUser = message.sender_id === currentUser?.user_id;
                                        const showDate = index === 0 || 
                                            new Date(message.created_at).toDateString() !== 
                                            new Date(messages[index - 1].created_at).toDateString();

                                        return (
                                            <React.Fragment key={message.message_id}>
                                                { showDate && (
                                                    <div className="text-center my-3">
                                                        <small className="text-muted bg-white px-2 py-1 rounded">
                                                            { new Date(message.created_at).toLocaleDateString() }
                                                        </small>
                                                    </div>
                                                )}
                                                
                                                <div className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}>
                                                    <div
                                                        className={`message-bubble p-3 rounded-3 position-relative ${
                                                            isCurrentUser 
                                                                ? 'bg-primary text-white' 
                                                                : 'bg-white border'
                                                        }`}
                                                        style={{ maxWidth: "70%" }}
                                                    >
                                                        { editingMessage === message.message_id ? (
                                                            <form
                                                                onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    const formData = new FormData(e.target);
                                                                    updateMessage(message.message_id, formData.get('content'));
                                                                }}
                                                            >
                                                                <input
                                                                    type="text"
                                                                    name="content"
                                                                    defaultValue={message.content}
                                                                    className="form-control form-control-sm"
                                                                    autoFocus
                                                                />
                                                                <div className="mt-2">
                                                                    <button type="submit" className="btn btn-sm btn-primary me-2">
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-secondary"
                                                                        onClick={() => setEditingMessage(null)}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <>
                                                                <p className="mb-1"> { message.content } </p>
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <small className={`opacity-75 ${isCurrentUser ? 'text-white-50' : 'text-muted'}`}>
                                                                        { formatTime(message.created_at) }
                                                                        { message.is_edited && " • edited" }
                                                                    </small>
                                                                    
                                                                    { isCurrentUser && (
                                                                        <div className="dropdown">
                                                                            <button
                                                                                className="btn btn-link p-0 text-white-50"
                                                                                type="button"
                                                                                data-bs-toggle="dropdown"
                                                                                aria-expanded="false"
                                                                                style={{ fontSize: "0.75rem" }}
                                                                            >
                                                                                <MoreVertical size={14} />
                                                                            </button>
                                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item"
                                                                                        onClick={() => setEditingMessage(message.message_id)}
                                                                                    >
                                                                                        <Edit3 size={14} className="me-2" />
                                                                                        Edit
                                                                                    </button>
                                                                                </li>
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item text-danger"
                                                                                        onClick={() => deleteMessage(message.message_id)}
                                                                                    >
                                                                                        <Trash2 size={14} className="me-2" />
                                                                                        Delete
                                                                                    </button>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={sendMessage} className="p-3 border-top bg-white">
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 me-3">
                                        <input
                                            ref={messageInputRef}
                                            type="text"
                                            className="form-control"
                                            placeholder={`Message ${currentChat?.participant?.full_name || currentChat?.participant?.username || 'user'}...`}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            disabled={sendingMessage}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!newMessage.trim() || sendingMessage}
                                    >
                                        { sendingMessage ? (
                                            <div className="spinner-border spinner-border-sm" role="status">
                                                <span className="visually-hidden"> Loading... </span>
                                            </div>
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* Success Toast */}
            { showSuccessToast && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
                    <div className="toast show" role="alert">
                        <div className="toast-header bg-success text-white">
                            <strong className="me-auto"> TasteBook Messages </strong>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white" 
                                onClick={() => setShowSuccessToast(false)}
                            ></button>
                        </div>
                        <div className="toast-body">
                            { toastMessage }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};