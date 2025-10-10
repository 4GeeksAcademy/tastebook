import React, { useEffect, useRef, memo } from "react";
import { MoreVertical, Edit3, Trash2 } from "lucide-react";
import { formatTime } from "../utils/formatTime";

/**
 * Single message bubble component
 * @param {Object}   message       - Message object
 * @param {boolean}  isCurrentUser - Whether message is from current user
 * @param {boolean}  isEditing     - Whether this message is being edited
 * @param {function} onEdit        - Function to handle message editing
 * @param {function} onDelete      - Function to handle message deletion
 * @param {function} onStartEdit   - Function to start editing this message
 * @param {function} onCancelEdit  - Function to cancel editing
 * @param {function} onRegisterForReadTracking - Function to register message for read status tracking
 */
const MessageBubble = memo(({ 
    message, 
    isCurrentUser, 
    isEditing, 
    onEdit, 
    onDelete, 
    onStartEdit, 
    onCancelEdit,
    onRegisterForReadTracking
}) => {
    const messageRef = useRef(null);

    // Register this message for viewport tracking (for read status)
    useEffect(() => {
        if (messageRef.current && message.message_id && onRegisterForReadTracking) {
            onRegisterForReadTracking(message.message_id, messageRef.current);
        }
    }, [message.message_id, onRegisterForReadTracking]);

    const handleEditSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        onEdit(message.message_id, formData.get('content'));
    };

    return (
        <div 
            ref={messageRef}
            className={`d-flex mb-2 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}
        >
            <div
                className={`message-bubble py-2 px-3 rounded-3 position-relative shadow-sm ${
                    isCurrentUser 
                        ? 'bg-primary text-white' 
                        : 'bg-light border'
                }`}
                style={{ maxWidth: "75%", minWidth: "80px" }}
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
                        <div className="mt-2 d-flex justify-content-end">
                            <button type="submit" className="btn btn-sm btn-success me-2">
                                Save
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={onCancelEdit}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <p className="mb-0" style={{whiteSpace: "pre-wrap", wordBreak: "break-word"}}> { message.content } </p>
                        <div className="d-flex justify-content-end align-items-center mt-1">
                            <small className={`opacity-75 me-2 ${isCurrentUser ? 'text-white-50' : 'text-muted'}`}>
                                { message.is_edited && "edited" }
                            </small>
                            <small className={`opacity-75 ${isCurrentUser ? 'text-white-50' : 'text-muted'}`}>
                                { formatTime(message.created_at) }
                            </small>
                            
                            { isCurrentUser && (
                                <div className="dropdown ms-1">
                                    <button
                                        className="btn btn-link p-0"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                        style={{ 
                                            lineHeight: 1,
                                            color: 'rgba(255, 255, 255, 0.7)'
                                        }}
                                    >
                                        <MoreVertical size={16} />
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
                                            <hr className="dropdown-divider my-1" />
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
});

// Add display name for debugging
MessageBubble.displayName = 'MessageBubble';

// Only re-render if relevant props change
function areEqual(prevProps, nextProps) {
    return (
        prevProps.message.message_id === nextProps.message.message_id &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.is_edited === nextProps.message.is_edited &&
        prevProps.message.created_at === nextProps.message.created_at &&
        prevProps.isCurrentUser === nextProps.isCurrentUser &&
        prevProps.isEditing === nextProps.isEditing
    );
}

export default React.memo(MessageBubble, areEqual);