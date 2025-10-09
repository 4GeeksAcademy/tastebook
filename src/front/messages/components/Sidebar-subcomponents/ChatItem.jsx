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
    );
};

export default ChatItem;