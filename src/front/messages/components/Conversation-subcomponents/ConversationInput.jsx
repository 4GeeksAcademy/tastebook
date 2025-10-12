import React, { useRef, useEffect, useState, useCallback, memo } from "react";

import { Send } from "lucide-react";

/**
 * Optimized message input component that prevents expensive re-renders
 * Uses local state and only communicates with parent on form submission
 * 
 * @param {string}   value       - Current input value (for conversation starters only)
 * @param {function} onChange    - Function to handle input change (DEPRECATED - not used)
 * @param {function} onSubmit    - Function to handle form submission (receives currentInputValue in event)
 * @param {boolean}  loading     - Whether message is being sent
 * @param {string}   placeholder - Input placeholder text
 * @param {boolean}  autoFocus   - Whether to auto-focus the input
 */
const ConversationInput = memo(({ 
    value, 
    onChange, 
    onSubmit, 
    loading = false, 
    placeholder = "Type a message...",
    autoFocus = true
}) => {
    const inputRef = useRef(null);
    const shouldRefocusRef = useRef(false);
    
    // Local state to handle typing without triggering parent re-renders
    const [localValue, setLocalValue] = useState(value || "");
    
    // Only sync parent value changes (like conversation starters)
    useEffect(() => {
        if (value !== localValue && value !== undefined) {
            setLocalValue(value);
        }
    }, [value]);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Handle input changes locally only - NO parent updates during typing
    const handleInputChange = useCallback((e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        // DO NOT call onChange here - only on submit or when user stops typing
    }, []);

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

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        
        if (!localValue.trim()) return;
        
        // Track if input was focused when submitting
        shouldRefocusRef.current = document.activeElement === inputRef.current;
        
        // Add the current input value to the event object without breaking it
        e.currentInputValue = localValue.trim();
        
        // Call the original onSubmit with the enhanced event
        onSubmit(e);
        
        // Clear local value after submit
        setLocalValue("");
    }, [localValue, onSubmit]);

    return (
        <form onSubmit={handleSubmit} className="p-3 border-top flex-shrink-0 m-0">
            <div className="input-group">
                <input
                    ref={inputRef}
                    type="text"
                    className="form-control rounded-pill"
                    placeholder={placeholder}
                    value={localValue}
                    onChange={handleInputChange}
                    disabled={loading}
                    autoFocus={autoFocus}
                    style={{padding: "0.75rem 1.25rem"}}
                />
                <button
                    type="submit"
                    className="btn btn-primary rounded-circle ms-2"
                    disabled={!localValue.trim() || loading}
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
});

// Add display name for debugging
ConversationInput.displayName = 'ConversationInput';

export default ConversationInput;