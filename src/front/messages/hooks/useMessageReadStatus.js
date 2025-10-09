/**
 * Hook for managing message read status with viewport detection
 * Implements WhatsApp-style read receipts where messages are marked read when visible
 */

import { useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

export const useMessageReadStatus = ({
    messages = [],
    currentUser,
    currentChatId,
    onMarkAsRead,
    isSocketConnected
}) => {
    const { observe, unobserve, visibleIds } = useIntersectionObserver({
        threshold: 0.6, // Message must be 60% visible
        rootMargin: '-20px' // Small margin to ensure message is truly visible
    });

    const messageRefs = useRef(new Map());
    const readTimeouts = useRef(new Map());
    const alreadyRead = useRef(new Set());

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            readTimeouts.current.forEach(timeout => clearTimeout(timeout));
            readTimeouts.current.clear();
        };
    }, []);

    // Register a message element for viewport tracking
    const registerMessage = useCallback((messageId, element) => {
        if (!element || !messageId || !currentUser) return;

        const message = messages.find(m => m.message_id === messageId);
        if (!message) return;

        // Only track messages from OTHER users that haven't been read yet
        const shouldTrack = (
            message.sender_id !== currentUser.user_id && // Not from current user
            !message.is_read && // Not already marked as read
            !alreadyRead.current.has(messageId) // Not already processed
        );

        if (shouldTrack) {
            messageRefs.current.set(messageId, element);
            observe(element, messageId);
        }
    }, [messages, currentUser, observe]);

    // Unregister a message element
    const unregisterMessage = useCallback((messageId) => {
        const element = messageRefs.current.get(messageId);
        if (element) {
            unobserve(element, messageId);
            messageRefs.current.delete(messageId);
        }
        
        // Clear any pending timeout
        const timeout = readTimeouts.current.get(messageId);
        if (timeout) {
            clearTimeout(timeout);
            readTimeouts.current.delete(messageId);
        }
    }, [unobserve]);

    // Handle visible messages - mark as read after a delay
    useEffect(() => {
        if (!currentUser || !currentChatId || !isSocketConnected) return;

        visibleIds.forEach(messageId => {
            // Skip if already processed or has pending timeout
            if (alreadyRead.current.has(messageId) || readTimeouts.current.has(messageId)) {
                return;
            }

            const message = messages.find(m => m.message_id === messageId);
            if (!message || message.sender_id === currentUser.user_id || message.is_read) {
                return;
            }

            // Set a timeout to mark as read after 1.5 seconds of visibility
            const timeout = setTimeout(() => {
                console.log('[READ_STATUS] Marking message as read:', messageId);
                
                // Mark locally first for immediate UI update
                alreadyRead.current.add(messageId);
                
                // Call the read function
                if (onMarkAsRead) {
                    onMarkAsRead(currentChatId, [messageId]);
                }
                
                // Clean up
                readTimeouts.current.delete(messageId);
                unregisterMessage(messageId);
            }, 1500); // 1.5 second delay

            readTimeouts.current.set(messageId, timeout);
        });
    }, [visibleIds, messages, currentUser, currentChatId, isSocketConnected, onMarkAsRead, unregisterMessage]);

    // Clean up when chat changes
    useEffect(() => {
        return () => {
            // Clear all timeouts
            readTimeouts.current.forEach(timeout => clearTimeout(timeout));
            readTimeouts.current.clear();
            
            // Clear message refs
            messageRefs.current.clear();
            
            // Reset read tracking for new chat
            alreadyRead.current.clear();
        };
    }, [currentChatId]);

    // Manual mark all visible as read (for when user clicks on chat)
    const markAllVisibleAsRead = useCallback(() => {
        if (!currentUser || !currentChatId) return;

        const unreadMessageIds = messages
            .filter(m => 
                m.sender_id !== currentUser.user_id && 
                !m.is_read && 
                !alreadyRead.current.has(m.message_id)
            )
            .map(m => m.message_id);

        if (unreadMessageIds.length > 0 && onMarkAsRead) {
            console.log('[READ_STATUS] Manually marking all messages as read:', unreadMessageIds);
            
            // Mark locally
            unreadMessageIds.forEach(id => alreadyRead.current.add(id));
            
            // Call the read function
            onMarkAsRead(currentChatId, unreadMessageIds);
        }
    }, [messages, currentUser, currentChatId, onMarkAsRead]);

    return {
        registerMessage,
        unregisterMessage,
        markAllVisibleAsRead
    };
};