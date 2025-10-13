/**
 * Format timestamp for display in the messages interface
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string
 */
export const formatTime = (timestamp) => {
    if (!timestamp) {
        return 'Just now';
    }
    
    const date = new Date(timestamp);
    
    // Check if date is invalid
    if (isNaN(date.getTime())) {
        console.warn('[formatTime] Invalid timestamp received:', timestamp);
        return 'Just now';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};