import React, { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import MessageBubble from "../MessageBubble";

/**
 * Scrollable list of messages component
 * @param {Array}        messages           - Array of message objects
 * @param {Object}       currentUser        - Current user object
 * @param {Object}       currentChat        - Current chat object
 * @param {string|null}  editingMessageId   - ID of message being edited
 * @param {function}     onEditMessage      - Function to handle message editing
 * @param {function}     onDeleteMessage    - Function to handle message deletion
 * @param {function}     onStartEdit        - Function to start editing a message
 * @param {function}     onCancelEdit       - Function to cancel editing
 * @param {function}     onMarkAsRead       - Function to mark messages as read
 * @param {function}     onNewMessageChange - Function to set a new message (for conversation starters)
 */
const MessageListWindow = ({ 
    messages, 
    currentUser, 
    currentChat,
    editingMessageId,
    onEditMessage,
    onDeleteMessage,
    onStartEdit,
    onCancelEdit,
    onMarkAsRead,
    onNewMessageChange
}) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleMarkAsRead = () => {
        if (currentChat && currentChat.unread_count > 0) {
            onMarkAsRead(currentChat.chat_id);
        }
    };

    return (
        <div 
            className="flex-grow-1 overflow-auto custom-scrollbar p-3" 
            style={{ 
                backgroundColor: "var(--main-bg-color)", 
                minHeight: "0",
                height: "0", // Forces flex container to calculate height properly
                scrollBehavior: "smooth"
            }}
            onFocus={handleMarkAsRead}
            onClick={handleMarkAsRead}
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
                                className="btn btn-outline-primary btn-sm rounded-pill"
                                onClick={() => onNewMessageChange("Hi! I saw your recipes and wanted to chat 👋")}
                            >
                                👋 Say Hi
                            </button>
                            <button 
                                className="btn btn-outline-primary btn-sm rounded-pill"
                                onClick={() => onNewMessageChange("Love your recipes! Do you have any cooking tips to share?")}
                            >
                                🍳 Ask about cooking
                            </button>
                            <button 
                                className="btn btn-outline-primary btn-sm rounded-pill"
                                onClick={() => onNewMessageChange("Would you like to share recipe ideas?")}
                            >
                                📝 Share ideas
                            </button>
                        </div>
                    </div>
                    
                    <small className="text-muted"> Or type a custom message below </small>
                </div>
            ) : (
                messages.map((message, index) => {
                    // More robust check for current user - handle both sender_id and sender.user_id
                    const isCurrentUser = message.sender_id === currentUser?.user_id || 
                                         message.sender?.user_id === currentUser?.user_id;
                    
                    // Safe date handling for date separators
                    const showDate = index === 0 || (() => {
                        const currentDate = new Date(message.created_at);
                        const prevDate = new Date(messages[index - 1].created_at);
                        
                        // Only show date separator if both dates are valid
                        if (isNaN(currentDate.getTime()) || isNaN(prevDate.getTime())) {
                            return false;
                        }
                        
                        return currentDate.toDateString() !== prevDate.toDateString();
                    })();

                    // Create unique key to prevent React warnings
                    const messageKey = message.is_temp 
                        ? `temp-${message.id}` 
                        : `msg-${message.message_id || message.id}`;

                    return (
                        <React.Fragment key={messageKey}>
                            {showDate && (
                                <div className="text-center my-3">
                                    <span className="badge bg-secondary bg-opacity-25 text-dark rounded-pill">
                                        {(() => {
                                            const messageDate = new Date(message.created_at);
                                            if (isNaN(messageDate.getTime())) {
                                                return 'Today';
                                            }
                                            return messageDate.toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            });
                                        })()}
                                    </span>
                                </div>
                            )}
                            <MessageBubble
                                message={message}
                                isCurrentUser={isCurrentUser}
                                isEditing={editingMessageId === message.message_id}
                                onEdit={onEditMessage}
                                onDelete={onDeleteMessage}
                                onStartEdit={onStartEdit}
                                onCancelEdit={onCancelEdit}
                            />
                        </React.Fragment>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageListWindow;