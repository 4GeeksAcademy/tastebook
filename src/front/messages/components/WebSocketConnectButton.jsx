import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import socketService from '../../utils/socketService';

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
        // Check connection status
        const checkConnection = () => {
            const status = socketService.getConnectionStatus();
            setIsConnected(status);
            
            // Clear error when successfully connected
            if (status) {
                setLastError(null);
                setIsConnecting(false);
            }
        };

        // Initial check
        checkConnection();

        // Check connection every second
        const interval = setInterval(checkConnection, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

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
                className="alert alert-success d-flex flex-column flex-md-row align-items-center justify-content-between mb-3 mx-auto py-2"
                style={wrapperStyle}
                role="status"
            >
                <div className="d-flex align-items-center text-center text-md-start">
                    <Wifi size={18} className="me-2 text-success" />
                    <div>
                        <span className="small fw-bold">WebSocket connected - Real-time messaging active</span>
                        <br />
                        <span className="small text-muted">Receiving live notifications and messages</span>
                    </div>
                </div>

                <button
                    className="btn btn-sm btn-outline-danger mt-2 mt-md-0"
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
            className="alert alert-warning d-flex flex-column flex-md-row align-items-center justify-content-between mb-3 mx-auto py-2"
            style={wrapperStyle}
            role="status"
        >
            <div className="d-flex align-items-center text-center text-md-start">
                <WifiOff size={20} className="me-2 text-warning" />
                <div>
                    <strong className="d-block small text-warning">WebSocket Disconnected - Real-time messaging deactivated</strong>
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
                className={`btn btn-sm mt-2 mt-md-0 ${lastError ? 'btn-warning' : 'btn-outline-success'}`}
                onClick={handleConnect}
                disabled={isConnecting}
                title={lastError ? "Retry connection" : "Connect to enable real-time messaging"}
            >
                {isConnecting ? (
                    <>
                        <RefreshCw size={14} className="me-1 spinner-border spinner-border-sm" />
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
