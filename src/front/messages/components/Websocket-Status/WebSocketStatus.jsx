import React, { useEffect, useState } from 'react';
import socketService from '../../../utils/socketService';

/**
 * WebSocket Status Component
 * A minimal component to show WebSocket connection status
 */
const WebSocketStatus = () => {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');

    useEffect(() => {
        // Handler for connection status changes
        const handleConnectionStatusChange = (data) => {
            setConnectionStatus(data.connected ? 'Connected' : 'Disconnected');
        };

        // Listen to real-time connection status changes
        socketService.on('connection_status_changed', handleConnectionStatusChange);

        // Set initial status
        const initialStatus = socketService.getConnectionStatus();
        setConnectionStatus(initialStatus ? 'Connected' : 'Disconnected');

        return () => {
            socketService.off('connection_status_changed', handleConnectionStatusChange);
        };
    }, []);

    return (
        <div className="d-inline-block">
            <small className="fw-bold me-2">WebSocket Status:</small>
            <span className={`badge badge-sm ${connectionStatus === 'Connected' ? 'bg-success' : 'bg-danger'}`}>
                {connectionStatus}
            </span>
        </div>
    );
};

export default WebSocketStatus;