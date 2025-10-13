import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import socketService from '../../../../shared/utils/socketService';

/**
 * WebSocket Connection Management Component
 * Shows connection status and provides connect/disconnect/reconnect controls
 * Enhanced for auto-connection scenarios with manual override capabilities
 * Layout: centered, max width, stacks on small screens (text above button)
 */

const WebSocketConnectButton = ({ onConnect, onDisconnect }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [lastError, setLastError] = useState(null);
    
    const wrapperStyle = { maxWidth: '720px' };

    // Listen to real-time connection status changes
    useEffect(() => {
        // Handler for connection status changes
        const handleConnectionStatusChange = (data) => {
            console.log('[WEBSOCKET BUTTON] Connection status changed:', data);
            setIsConnected(data.connected);
            
            // Clear error when successfully connected
            if (data.connected) {
                setLastError(null);
                setIsConnecting(false);
            } else if (data.error && !isConnecting) {
                // Only set error if we're not currently trying to connect
                // (to avoid overwriting connection attempt feedback)
                setLastError(data.error.message || 'Connection lost');
            }
        };

        // Listen to real-time connection status changes
        socketService.on('connection_status_changed', handleConnectionStatusChange);

        // Set initial status immediately
        const initialStatus = socketService.getConnectionStatus();
        console.log('[WEBSOCKET BUTTON] Initial status:', initialStatus);
        setIsConnected(initialStatus);

        return () => {
            socketService.off('connection_status_changed', handleConnectionStatusChange);
        };
    }, [isConnecting]);

    const handleConnect = async () => {
        if (isConnecting) return;
        
        setIsConnecting(true);
        setLastError(null);
        
        try {
            if (onConnect) {
                await onConnect();
            } else {
                await socketService.connect();
            }
        } catch (error) {
            console.error('[WEBSOCKET BUTTON] Connection failed:', error);
            setLastError(error.message || 'Connection failed');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        setLastError(null);
        if (onDisconnect) {
            onDisconnect();
        } else {
            socketService.disconnect();
        }
    };

    // Connected State - Success Alert
    if (isConnected) {
        return (
            <div
                className="alert alert-light border-3 border-success d-flex flex-column flex-md-row align-items-center justify-content-between mb-3 mx-auto py-2"
                style={wrapperStyle}
                role="status"
            >
                <div className="d-flex align-items-center text-center text-md-start">
                    <Wifi size={30} className="me-3 text-success" />
                    <div>
                        <span className="small fw-bold text-success">WebSocket connected - Real-time messaging active</span>
                        <br />
                        <span className="small">Receiving live notifications and messages</span>
                    </div>
                </div>

                <button
                    className="btn btn-sm btn-outline-danger border-3 mt-2 mt-md-0"
                    onClick={handleDisconnect}
                    title="Disconnect WebSocket (disables real-time features)"
                >
                    <WifiOff size={14} className="me-1" />
                    Disconnect
                </button>
            </div>
        );
    }

    // Disconnected State - Warning Alert with Action
    return (
        <div
            className="alert alert-danger border-3 d-flex flex-column flex-md-row align-items-center justify-content-between mb-3 mx-auto py-2"
            style={wrapperStyle}
            role="status"
        >
            <div className="d-flex align-items-center text-center text-md-start">
                <WifiOff size={20} className="me-3 text-danger" />
                <div>
                    <strong className="d-block small text-danger">WebSocket Disconnected - Real-time messaging deactivated</strong>
                    <p className="mb-0 small text-muted">
                        {lastError ? (
                            <>
                                <AlertCircle size={12} className="me-1" />
                                {lastError}
                            </>
                        ) : (
                            'Connect to receive live notifications and messages'
                        )}
                    </p>
                </div>
            </div>

            <button
                className={`btn btn-sm mt-2 mt-md-0 border-3 ${lastError ? 'btn-warning' : 'btn-outline-success'}`}
                onClick={handleConnect}
                disabled={isConnecting}
                title={lastError ? "Retry connection" : "Connect to enable real-time messaging"}
            >
                {isConnecting ? (
                    <>
                        <div className="spinner-border spinner-border-sm me-1" role="status"></div>
                        Connecting...
                    </>
                ) : lastError ? (
                    <>
                        <RefreshCw size={14} className="me-1" />
                        Retry
                    </>
                ) : (
                    <>
                        <Wifi size={14} className="me-1" />
                        Connect
                    </>
                )}
            </button>
        </div>
    );
};

export default WebSocketConnectButton;
