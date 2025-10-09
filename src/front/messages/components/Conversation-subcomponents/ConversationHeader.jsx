import React from "react";
import { MoreVertical, ArrowLeft, Trash2 } from "lucide-react";
import UserAvatar from "../../../components/UserAvatar";

/**
 * Chat header component with participant info and actions
 * @param {Object}   participant    - Participant user object
 * @param {function} onDeleteChat   - Function to handle chat deletion
 * @param {function} onNavigateBack - Function to navigate back (mobile)
 */
const ConversationHeader = ({ participant, onDeleteChat, onNavigateBack }) => {
    return (
        <div className="p-3 border-bottom bg-white d-flex align-items-center justify-content-between flex-shrink-0">
            <div className="d-flex align-items-center">
                <button
                    className="btn btn-link d-md-none p-0 me-3"
                    onClick={onNavigateBack}
                >
                    <ArrowLeft size={20} />
                </button>
                
                <UserAvatar
                    imageUrl={participant?.cloudinary_url}
                    username={participant?.username}
                    fullName={participant?.full_name}
                    size="small"
                    className="me-3"
                />
                
                <div>
                    <h6 className="mb-0">
                        { participant?.full_name || participant?.username }
                    </h6>
                    <small className="text-muted">
                        @{ participant?.username }
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
                            onClick={onDeleteChat}
                        >
                            <Trash2 size={16} className="me-2" />
                            Delete Conversation
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default ConversationHeader;