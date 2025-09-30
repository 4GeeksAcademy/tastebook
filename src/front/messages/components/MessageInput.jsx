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
    const shouldRefocusRef = useRef(false);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Refocus input after message is sent if it was focused during submission
    useEffect(() => {
        if (!loading && shouldRefocusRef.current && inputRef.current) {
            // Small delay to ensure the form submission is complete
            const timeoutId = setTimeout(() => {
                inputRef.current.focus();
                shouldRefocusRef.current = false;
            }, 50);
            
            return () => clearTimeout(timeoutId);
        }
    }, [loading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Track if input was focused when submitting
        shouldRefocusRef.current = document.activeElement === inputRef.current;
        
        // Call the original onSubmit
        onSubmit(e);
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 border-top bg-light flex-shrink-0 m-0">
            <div className="input-group">
                <input
                    ref={inputRef}
                    type="text"
                    className="form-control rounded-pill"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={loading}
                    autoFocus={autoFocus}
                    style={{padding: "0.75rem 1.25rem"}}
                />
                <button
                    type="submit"
                    className="btn btn-primary rounded-circle ms-2"
                    disabled={!value.trim() || loading}
                    style={{width: "48px", height: "48px"}}
                >
                    { loading ? (
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden"> Loading... </span>
                        </div>
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </div>
        </form>
    );
};

export default MessageInput;