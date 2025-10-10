import React from "react";
import UserAvatar from "../../../components/UserAvatar";
import { formatTime } from "../../utils/formatTime";

/**
 * Single chat row item
 * @param {Object}   chat     - Chat object with participant info
 * @param {boolean}  isActive - Whether this chat is currently selected
 * @param {function} onClick  - Function to call when chat is clicked
 */
const ChatItem = ({ chat, isActive, onClick }) => {
    return (
        <div
            className={`d-flex align-items-center p-3 border-bottom cursor-pointer hover-bg-light ${
                isActive ? 'bg-primary bg-opacity-10' : ''
            }`}
            onClick={onClick}
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
                        { 
                            // Handle both last_message_timestamp (from WebSocket updates) and last_message.created_at (from API)
                            chat.last_message_timestamp ? formatTime(chat.last_message_timestamp) :
                            chat.last_message?.created_at ? formatTime(chat.last_message.created_at) : ''
                        }
                    </small>
                </div>
                

                <div className="d-flex justify-content-between align-items-center">
                    <p className="mb-0 text-muted text-truncate small">
                        { 
                            // Handle both string content (from WebSocket updates) and object content (from API)
                            typeof chat.last_message === 'string' ? chat.last_message :
                            chat.last_message?.content || 'No messages yet'
                        }
                    </p>
                    { chat.unread_count > 0 && (
                        <div className="position-relative">
                            <span className="badge bg-primary rounded-pill ms-2">
                                { chat.unread_count }
                            </span>
                            {/* Small pulse indicator for unread messages */}
                            <span 
                                className="position-absolute top-0 start-100 translate-middle badge bg-danger rounded-circle p-1"
                                style={{
                                    fontSize: '0.5rem',
                                    animation: 'pulse 2s infinite',
                                    width: '8px',
                                    height: '8px'
                                }}
                            >
                                <span className="visually-hidden">New messages</span>
                            </span>
                        </div>
                    )}
                </div>

            </div>


        </div>
    );
};

export default ChatItem;