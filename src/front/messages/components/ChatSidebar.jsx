import React from "react";
import { Search, MessageCircleMore } from "lucide-react";
import ChatItem from "./ChatItem";

/**
 * Chat Sidebar component with search and chat list
 * @param {Array} chats - List of chat objects
 * @param {string} currentChatId - ID of currently selected chat
 * @param {string} searchTerm - Current search term
 * @param {function} onSearch - Function to handle search input change
 * @param {function} onSelectChat - Function to handle chat selection
 * @param {boolean} loading - Whether chats are loading
 * @param {function} navigate - Navigation function
 * @param {boolean} isVisible - Whether sidebar is visible (responsive)
 */
const ChatSidebar = ({ 
    chats, 
    currentChatId, 
    searchTerm, 
    onSearch, 
    onSelectChat, 
    loading, 
    navigate,
    isVisible = true 
}) => {
    return (
        <div className={`col-md-4 col-lg-3 border-end d-flex flex-column ${!isVisible ? 'd-none d-md-flex' : ''}`}>
            {/* Header with Search */}
            <div className="p-3 border-bottom bg-white">
                <h5 className="mb-3"> Messages </h5>
                
                {/* Search */}
                <div className="position-relative">
                    <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={16} />
                    <input
                        type="text"
                        className="form-control ps-5"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Chat List - Scrollable */}
            <div className="flex-grow-1 overflow-auto scrollarea">
                { loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden"> Loading chats... </span>
                        </div>
                        <p className="text-muted"> Loading your conversations... </p>
                    </div>
                ) : chats.length === 0 ? (
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
                    </div>
                ) : (
                    chats.map(chat => (
                        <ChatItem
                            key={chat.chat_id}
                            chat={chat}
                            isActive={currentChatId === chat.chat_id}
                            onClick={() => onSelectChat(chat)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;