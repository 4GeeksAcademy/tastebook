import React from "react";
import { Link } from "react-router-dom";

import { MessageCircleMore } from "lucide-react";

import ChatItem from "./ChatItem";


/**
 * Chat List component that displays the list of chats with various states
 * @param {Array}    chats           - List of chat objects
 * @param {string}   currentChatId   - ID of currently selected chat
 * @param {function} onSelectChat    - Function to handle chat selection
 * @param {boolean}  loading         - Whether chats are loading
 * @param {boolean}  connectionError - Whether there's a connection error
 */
const ChatList = ({ 
    chats, 
    currentChatId, 
    onSelectChat, 
    loading, 
    connectionError = false 
}) => {
    return (
        <div 
            className="flex-grow-1 overflow-auto custom-scrollbar" 
            style={{
                height: "0", // This forces flexbox to calculate height properly
                minHeight: "0",
                maxHeight: "calc(100vh - 240px)" // Account for navbar, footer, and header
            }}
        >
            { connectionError ? (
                <div className="text-center py-5">
                    <div className="mb-4">
                        <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: "60px", height: "60px"}}>
                            <MessageCircleMore size={30} className="text-danger" />
                        </div>
                    </div>
                    <h6 className="mb-2 text-danger"> Could not connect to server </h6>
                    <p className="text-muted mb-3"> Unable to load your conversations. This might be a server problem. </p>
                    <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => window.location.reload()}
                    >
                        Retry Connection
                    </button>
                </div>

            ) : loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden"> Loading chats... </span>
                    </div>
                    <p className="text-muted"> Loading your conversations... </p>
                </div>
            ) : chats.length === 0 ? (
                <div className="text-center py-5">

                    <div className="mb-4">
                        <div className="bg-green bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: "60px", height: "60px"}}>
                            <MessageCircleMore size={30} className="text-white" />
                        </div>
                    </div>

                    <h5 className="mb-3"> No conversations yet </h5>

                    <p className="text-muted mb-3 mx-4"> Start chatting with other TasteBook users! </p>
                    
                    <div className="row g-2 my-4 mx-2">

                        <div className="col-12">
                            <Link 
                                to="/users"
                                className="btn btn-primary btn-sm text-decoration-none w-75"
                            >
                                Find Users to Chat With
                            </Link>
                        </div>

                        <div className="col-12">
                            <Link 
                                to="/all-recipes"
                                className="btn btn-outline-secondary btn-sm text-decoration-none w-75"
                            >
                                Browse Recipes & Connect
                            </Link>
                        </div>

                    </div>

                    <small className="text-muted d-block mt-3 mx-3"> 
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
    );
};

export default ChatList;