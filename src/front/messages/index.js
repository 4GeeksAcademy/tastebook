// Export the main Messages page component
export { Messages } from './pages/Messages';

// Export individual components for potential reuse elsewhere
export { default as ChatSidebar } from './components/ChatSidebar';
export { default as ChatItem } from './components/ChatItem';
export { default as ChatWindow } from './components/ChatWindow';
export { default as ChatHeader } from './components/ChatHeader';
export { default as MessageList } from './components/MessageList';
export { default as MessageBubble } from './components/MessageBubble';
export { default as MessageInput } from './components/MessageInput';
export { default as Toast } from './components/Toast';
export { default as ConfirmationModal } from './components/ConfirmationModal';

// Export the hook for potential reuse
export { useMessages } from './hooks/useMessages';

// Export utilities
export { formatTime } from './utils/formatTime';
export { normalizeMessage, normalizeChat } from './utils/normalize';