import React from "react";

import { useParams } from "react-router-dom";
import { useMessages } from "../hooks/useMessages";

import ChatSidebar            from "../components/ChatSidebar";
import ChatConversation       from "../components/ChatConversation";
import Toast                  from "../components/Modals-and-Toasts/Toast";
import ConfirmationModal      from "../components/Modals-and-Toasts/ConfirmationModal";
import WebSocketConnectButton from "../components/Websocket-Status/WebSocketConnectButton";
import NoWebSocketServer      from "../components/Websocket-Status/NoWebSocketServer";



/**
 * Main Messages page component - entry point from router
 * This component handles only routing-level logic and delegates
 * all business logic to the useMessages hook and UI to modular components
 */
export const Messages = () => {
    const { chatId } = useParams();
    const [isRetryingServer, setIsRetryingServer] = React.useState(false);
    
    // Get all state and actions from the useMessages hook
    const {
        // State
        chats,
        currentChat,
        messages,
        newMessage,
        searchTerm,
        currentUser,
        loadingState,
        connectionError,
        showSuccessToast,
        toastMessage,
        confirmState,
        isSocketConnected,
        isSocketServerAvailable,
        
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
        navigate,
        connectWebSocket,
        disconnectWebSocket,
        checkWebSocketServerAvailability,
        
        // Read status management
        registerMessage,
        unregisterMessage,
        markAllVisibleAsRead,
    } = useMessages(chatId);

    // Handle chat selection
    const handleSelectChat = (chat) => {
        navigate(`/messages/${chat.chat_id}`);
        fetchChat(chat.chat_id);
        
        // Immediately mark as read when user clicks on the chat
        if (chat.unread_count > 0) {
            markMessagesAsRead(chat.chat_id);
        }
    };

    // Handle navigating back to chat list (mobile)
    const handleNavigateBack = () => {
        navigate("/messages");
    };

    // Handle starting message edit
    const handleStartEdit = (messageId) => {
        dispatchLoading({ type: 'SET_EDITING_MESSAGE', payload: messageId });
    };

    // Handle canceling message edit
    const handleCancelEdit = () => {
        dispatchLoading({ type: 'SET_EDITING_MESSAGE', payload: null });
    };

    // Handle retry WebSocket server check
    const handleRetryServerCheck = async () => {
        setIsRetryingServer(true);
        try {
            await checkWebSocketServerAvailability();
        } finally {
            setIsRetryingServer(false);
        }
    };

    // Show loading spinner while main data is loading
    if (loadingState.main) {
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

    // Show NoWebSocketServer component if WebSocket server is not available
    if (isSocketServerAvailable === false) {
        return (
            <div 
                className="d-flex flex-column" 
                style={{
                    minHeight: "calc(100vh - 120px)", // Account for navbar and footer
                    overflow: "auto"
                }}
            >
                <NoWebSocketServer 
                    onRetry={handleRetryServerCheck}
                    isRetrying={isRetryingServer}
                />
                
                {/* Toast notifications still work */}
                <Toast
                    show={showSuccessToast}
                    message={toastMessage}
                    onClose={() => showToast('')}
                    type="success"
                />
            </div>
        );
    }

    // Show loading spinner while checking WebSocket server availability
    if (isSocketServerAvailable === null) {
        return (
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Checking WebSocket server...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (

        <div 
            className="d-flex flex-column" 
            style={{
                height: "calc(100vh - 120px)", // Account for navbar and footer
                maxHeight: "calc(100vh - 120px)",
                // allow the page to scroll so sticky elements can remain visible
                overflow: "auto"
            }}
        >


        {/* Different version for testing */}
        
        {/* <div 
            className="d-flex flex-column" 
            style={{
                minHeight: "calc(100vh - 120px)", // Account for navbar and footer
                overflow: "auto"
            }}
        > */}
            
            {/* WebSocket Status Banner - TESTING - ONLY SHOWS IN DEVELOPMENT MODE */}
            {import.meta.env.MODE === 'development' && (
                <div className="container-fluid px-3 pt-3 border sticky-top bg-white" style={{ zIndex: 2000 }}>
                    <WebSocketConnectButton 
                        // isConnected={isSocketConnected} --- IGNORE ---
                        onConnect={connectWebSocket}
                        onDisconnect={disconnectWebSocket}
                    />
                </div>
            )}
            

            <div className="row g-0 flex-grow-1" style={{ height: "100%" }}>

                {/* Chat Sidebar */}
                <ChatSidebar
                    chats={chats}
                    currentChatId={currentChat?.chat_id}
                    searchTerm={searchTerm}
                    onSearch={setSearchTerm}
                    onSelectChat={handleSelectChat}
                    connectionError={connectionError}
                    isVisible={!chatId}
                />

                {/* Chat Window */}
                <ChatConversation
                    currentChat={currentChat}
                    messages={messages}
                    currentUser={currentUser}
                    loading={loadingState.chat}
                    newMessage={newMessage}
                    onNewMessageChange={setNewMessage}
                    onSendMessage={sendMessage}
                    onEditMessage={updateMessage}
                    onDeleteMessage={deleteMessage}
                    onDeleteChat={deleteChat}
                    onMarkAsRead={markMessagesAsRead}
                    sendingMessage={loadingState.sendingMessage}
                    editingMessageId={loadingState.editingMessage}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onNavigateBack={handleNavigateBack}
                    connectionError={connectionError}
                    isVisible={!!chatId}
                    onRegisterMessage={registerMessage}
                />
            </div>

            {/* Toast and Confirmation Modal */}
            <Toast
                show={showSuccessToast}
                message={toastMessage}
                onClose={() => showToast('')}
                type="success"
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={confirmState.show}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={hideConfirmation}
                type={confirmState.type}
            />
        </div>
    );
};