import React from "react";
import { MoreVertical, Edit3, Trash2 } from "lucide-react";
import { formatTime } from "../utils/formatTime";

/**
 * Single message bubble component
 * @param {Object} message - Message object
 * @param {boolean} isCurrentUser - Whether message is from current user
 * @param {boolean} isEditing - Whether this message is being edited
 * @param {function} onEdit - Function to handle message editing
 * @param {function} onDelete - Function to handle message deletion
 * @param {function} onStartEdit - Function to start editing this message
 * @param {function} onCancelEdit - Function to cancel editing
 */
const MessageBubble = ({ 
    message, 
    isCurrentUser, 
    isEditing, 
    onEdit, 
    onDelete, 
    onStartEdit, 
    onCancelEdit 
}) => {
    const handleEditSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        onEdit(message.message_id, formData.get('content'));
    };

    return (
        <div className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}>
            <div
                className={`message-bubble p-3 rounded-3 position-relative ${
                    isCurrentUser 
                        ? 'bg-primary text-white' 
                        : 'bg-white border'
                }`}
                style={{ maxWidth: "70%" }}
            >
                { isEditing ? (
                    <form onSubmit={handleEditSubmit}>
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
                                onClick={onCancelEdit}
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
                                                onClick={() => onStartEdit(message.message_id)}
                                            >
                                                <Edit3 size={14} className="me-2" />
                                                Edit
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={() => onDelete(message.message_id)}
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
    );
};

export default MessageBubble;