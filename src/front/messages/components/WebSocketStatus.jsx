import React, { useEffect, useState } from 'react';
import socketService from '../../utils/socketService';

/**
 * WebSocket Status Component
 * A minimal component to show WebSocket connection status
 */
const WebSocketStatus = () => {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');

    useEffect(() => {
        // Check connection status
        const checkConnection = () => {
            const status = socketService.getConnectionStatus();
            setConnectionStatus(status ? 'Connected' : 'Disconnected');
        };

        // Check connection every second
        const interval = setInterval(checkConnection, 1000);

        return () => {
            clearInterval(interval);
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