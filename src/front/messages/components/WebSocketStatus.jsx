import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * WebSocket Status Component
 * Shows connection status and provides connect/disconnect controls
 */
const WebSocketStatus = ({ isConnected, onConnect, onDisconnect }) => {
    if (isConnected) {
        return (
            <div className="alert alert-success d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <Wifi size={20} className="me-2" />
                    <span>WebSocket connected - Real-time messaging active</span>
                </div>
                <button 
                    className="btn btn-sm btn-outline-success"
                    onClick={onDisconnect}
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
                <WifiOff size={24} className="me-2" />
                <div>
                    <strong>WebSocket Disconnected</strong>
                    <p className="mb-0 small">Connect to enable real-time messaging features</p>
                </div>
            </div>
            <button 
                className="btn btn-sm btn-warning"
                onClick={onConnect}
            >
                <Wifi size={16} className="me-1" />
                Connect WebSocket
            </button>
        </div>
    );
};

export default WebSocketStatus;
