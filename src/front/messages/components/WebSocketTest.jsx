import React, { useEffect, useState } from 'react';
import socketService from '../../utils/socketService';

/**
 * WebSocket Connection Test Component
 * This component helps debug WebSocket connectivity issues
 */
const WebSocketTest = () => {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // Connect to WebSocket
        socketService.connect();

        // Listen for connection status changes
        const checkConnection = () => {
            const status = socketService.getConnectionStatus();
            setConnectionStatus(status ? 'Connected' : 'Disconnected');
        };

        // Check connection every second
        const interval = setInterval(checkConnection, 1000);

        // Listen for test events
        const handleTestEvent = (data) => {
            setEvents(prev => [...prev, { 
                type: 'test_event', 
                data, 
                timestamp: new Date().toISOString() 
            }]);
        };

        const handleMessageReceived = (data) => {
            setEvents(prev => [...prev, { 
                type: 'message_received', 
                data, 
                timestamp: new Date().toISOString() 
            }]);
        };

        socketService.on('test_event', handleTestEvent);
        socketService.on('message_received', handleMessageReceived);

        return () => {
            clearInterval(interval);
            socketService.off('test_event', handleTestEvent);
            socketService.off('message_received', handleMessageReceived);
        };
    }, []);

    const sendTestMessage = () => {
        if (socketService.socket) {
            socketService.socket.emit('test_message', { 
                message: 'Test from frontend', 
                timestamp: new Date().toISOString() 
            });
        }
    };

    const clearEvents = () => {
        setEvents([]);
    };

    return (
        <div className="card m-3">
            <div className="card-header">
                <h5 className="mb-0">WebSocket Connection Test</h5>
            </div>
            <div className="card-body">
                <div className="mb-3">
                    <strong>Connection Status: </strong>
                    <span className={`badge ${connectionStatus === 'Connected' ? 'bg-success' : 'bg-danger'}`}>
                        {connectionStatus}
                    </span>
                </div>
                
                <div className="mb-3">
                    <button className="btn btn-primary me-2" onClick={sendTestMessage}>
                        Send Test Message
                    </button>
                    <button className="btn btn-secondary" onClick={clearEvents}>
                        Clear Events
                    </button>
                </div>

                <div>
                    <h6>Recent Events:</h6>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {events.length === 0 ? (
                            <p className="text-muted">No events received yet...</p>
                        ) : (
                            events.slice(-10).reverse().map((event, index) => (
                                <div key={index} className="border-bottom pb-2 mb-2">
                                    <div className="d-flex justify-content-between">
                                        <strong>{event.type}</strong>
                                        <small className="text-muted">{event.timestamp}</small>
                                    </div>
                                    <pre className="small mt-1" style={{ fontSize: '0.8rem' }}>
                                        {JSON.stringify(event.data, null, 2)}
                                    </pre>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebSocketTest;