import React from "react";

import ChatList      from "./Sidebar-subcomponents/ChatList";
import SidebarHeader from "./Sidebar-subcomponents/SidebarHeader";


/**
 * Chat Sidebar component with search and chat list
 * @param {Array}    chats           - List of chat objects
 * @param {string}   currentChatId   - ID of currently selected chat
 * @param {string}   searchTerm      - Current search term
 * @param {function} onSearch        - Function to handle search input change
 * @param {function} onSelectChat    - Function to handle chat selection
 * @param {boolean}  loading         - Whether chats are loading
 * @param {boolean}  connectionError - Whether there's a connection error
 * @param {boolean}  isVisible       - Whether sidebar is visible (responsive)
 */
const ChatSidebar = ({ 
    chats, 
    currentChatId, 
    searchTerm, 
    onSearch, 
    onSelectChat, 
    loading, 
    connectionError = false,
    isVisible = true 
}) => {
    return (
        <div 
            className={`col-md-4 col-lg-3 border-end d-flex flex-column ${!isVisible ? 'd-none d-md-flex' : ''}`} 
            style={{
                height: "calc(100vh - 120px)", // Account for navbar and footer
                maxHeight: "calc(100vh - 120px)",
                position: "relative"
            }}
        >


            {/* Header with Search bar */}
            <SidebarHeader
                searchTerm={searchTerm}
                onSearch={onSearch}
            />


            {/* Chat List - Scrollable */}
            <ChatList
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={onSelectChat}
                loading={loading}
                connectionError={connectionError}
            />


        </div>

    );
};

export default ChatSidebar;