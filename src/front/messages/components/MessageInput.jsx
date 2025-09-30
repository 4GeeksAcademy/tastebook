import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";

/**
 * Message input component with send button
 * @param {string} value - Current input value
 * @param {function} onChange - Function to handle input change
 * @param {function} onSubmit - Function to handle form submission
 * @param {boolean} loading - Whether message is being sent
 * @param {string} placeholder - Input placeholder text
 * @param {boolean} autoFocus - Whether to auto-focus the input
 */
const MessageInput = ({ 
    value, 
    onChange, 
    onSubmit, 
    loading = false, 
    placeholder = "Type a message...",
    autoFocus = true
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    return (
        <form onSubmit={onSubmit} className="p-3 border-top bg-white flex-shrink-0">
            <div className="d-flex align-items-center">
                <div className="flex-grow-1 me-3">
                    <input
                        ref={inputRef}
                        type="text"
                        className="form-control"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={loading}
                        autoFocus={autoFocus}
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!value.trim() || loading}
                >
                    { loading ? (
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden"> Loading... </span>
                        </div>
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
        </form>
    );
};

export default MessageInput;