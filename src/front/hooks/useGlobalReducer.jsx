// Import necessary hooks and functions from React.
import { useContext, useReducer, createContext, useEffect } from "react";
import storeReducer, { initialStore } from "../store"  // Import the reducer and the initial state.
import socketService from "../shared/utils/socketService"; // Import socket service for global initialization

// Create a context to hold the global state of the application
// We will call this global state the "store" to avoid confusion while using local states
const StoreContext = createContext()

// Define a provider component that encapsulates the store and warps it in a context provider to 
// broadcast the information throught all the app pages and components.
export function StoreProvider({ children }) {
    // Initialize reducer with the initial state.
    const [store, dispatch] = useReducer(storeReducer, initialStore())
    
    // Initialize WebSocket connection globally for real-time messaging
    useEffect(() => {
        const initializeWebSocket = async () => {
            // Check if WebSocket server is available before connecting
            const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';
            
            try {
                // Simple health check to see if WebSocket server is running
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(`${socketUrl.replace(/\/$/, '')}/health`, {
                    method: 'GET',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    console.log('[GLOBAL] WebSocket server is available, auto-connecting...');
                    await socketService.connect();
                    console.log('[GLOBAL] ✅ WebSocket connected globally for real-time messaging');
                } else {
                    console.warn('[GLOBAL] WebSocket server health check failed');
                }
            } catch (error) {
                console.warn('[GLOBAL] WebSocket server not available:', error.message);
                // This is not a critical error - the app can work without real-time features
            }
        };
        
        // Initialize with a slight delay to let the app fully load
        const initTimer = setTimeout(initializeWebSocket, 1000);
        
        return () => {
            clearTimeout(initTimer);
        };
    }, []);
    
    // Provide the store and dispatch method to all child components.
    return <StoreContext.Provider value={{ store, dispatch }}>
        {children}
    </StoreContext.Provider>
}

// Custom hook to access the global state and dispatch function.
export default function useGlobalReducer() {
    const { dispatch, store } = useContext(StoreContext)
    return { dispatch, store };
}