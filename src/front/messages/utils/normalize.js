/**
 * Normalize message object to ensure consistent ID usage
 * @param {Object} message - Message object from API
 * @returns {Object} Normalized message with consistent IDs
 */
export const normalizeMessage = (message) => {
    return {
        ...message,
        message_id: message.message_id || message.id,
        id: message.message_id || message.id
    };
};

/**
 * Normalize chat object to ensure consistent ID usage
 * @param {Object} chat - Chat object from API
 * @returns {Object} Normalized chat with consistent IDs and normalized messages
 */
export const normalizeChat = (chat) => {
    return {
        ...chat,
        chat_id: chat.chat_id || chat.id,
        id: chat.chat_id || chat.id,
        messages: chat.messages ? chat.messages.map(normalizeMessage) : []
    };
};