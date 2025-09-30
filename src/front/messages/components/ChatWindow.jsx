import React from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

/**
 * Chat area container component
 * @param {Object} currentChat - Current chat object
 * @param {Array} messages - Array of messages in current chat
 * @param {Object} currentUser - Current user object
 * @param {boolean} loading - Whether chat is loading
 * @param {string} newMessage - Current new message input value
 * @param {function} onNewMessageChange - Function to handle new message input change
 * @param {function} onSendMessage - Function to handle sending a message
 * @param {function} onEditMessage - Function to handle editing a message
 * @param {function} onDeleteMessage - Function to handle deleting a message
 * @param {function} onDeleteChat - Function to handle deleting the chat
 * @param {function} onMarkAsRead - Function to mark messages as read
 * @param {boolean} sendingMessage - Whether a message is being sent
 * @param {string|null} editingMessageId - ID of message being edited
 * @param {function} onStartEdit - Function to start editing a message
 * @param {function} onCancelEdit - Function to cancel editing
 * @param {function} onNavigateBack - Function to navigate back to chat list
 * @param {boolean} connectionError - Whether there's a connection error
 * @param {boolean} isVisible - Whether chat window is visible (responsive)
 */
const ChatWindow = ({ 
    currentChat, 
    messages, 
    currentUser,
    loading,
    newMessage,
    onNewMessageChange,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
    onDeleteChat,
    onMarkAsRead,
    sendingMessage,
    editingMessageId,
    onStartEdit,
    onCancelEdit,
    onNavigateBack,
    connectionError = false,
    isVisible = true
}) => {
    if (loading) {
        return (
            <div 
                className={`col-md-8 col-lg-9 d-flex flex-column px-0 ${!isVisible ? 'd-none d-md-flex' : ''}`}
                style={{
                    height: "calc(100vh - 120px)", // Account for navbar and footer
                    maxHeight: "calc(100vh - 120px)"
                }}
            >
                <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden"> Loading chat... </span>
                        </div>
                        <h6 className="text-muted"> Loading conversation... </h6>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentChat) {
        return (
            <div 
                className={`col-md-8 col-lg-9 d-flex flex-column ${!isVisible ? 'd-none d-md-flex' : ''}`}
                style={{
                    height: "calc(100vh - 120px)", // Account for navbar and footer
                    maxHeight: "calc(100vh - 120px)"
                }}
            >
                <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                        {connectionError ? (
                            <>
                                <h5 className="text-danger"> Could not connect to server </h5>
                                <p className="text-muted"> Unable to load conversations. Please check your internet connection and try again. </p>
                                <button 
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => window.location.reload()}
                                >
                                    Retry Connection
                                </button>
                            </>
                        ) : (
                            <>
                                <h5 className="text-muted"> Select a conversation </h5>
                                <p className="text-muted"> Choose a conversation from the sidebar to start messaging </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`col-md-8 col-lg-9 d-flex flex-column px-0 ${!isVisible ? 'd-none d-md-flex' : ''}`}
            // style={{
            //     height: "calc(100vh - 130px)", // Account for navbar and footer
            //     maxHeight: "calc(100vh - 130px)"
            // }}
        >
            <div className="d-flex flex-column h-100 px-0">
                {/* Chat Header */}
                <ChatHeader
                    participant={currentChat.participant}
                    onDeleteChat={() => onDeleteChat(currentChat.chat_id)}
                    onNavigateBack={onNavigateBack}
                />

                {/* Messages Area */}
                <MessageList
                    messages={messages}
                    currentUser={currentUser}
                    currentChat={currentChat}
                    editingMessageId={editingMessageId}
                    onEditMessage={onEditMessage}
                    onDeleteMessage={onDeleteMessage}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                    onMarkAsRead={onMarkAsRead}
                    onNewMessageChange={onNewMessageChange}
                />

                {/* Message Input */}
                <MessageInput
                    value={newMessage}
                    onChange={onNewMessageChange}
                    onSubmit={onSendMessage}
                    loading={sendingMessage}
                    placeholder={`Message ${currentChat?.participant?.full_name || currentChat?.participant?.username || 'user'}...`}
                />
            </div>
        </div>
    );
};

export default ChatWindow;