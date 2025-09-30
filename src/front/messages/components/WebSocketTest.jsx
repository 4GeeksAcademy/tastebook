import React, { useEffect, useState } from 'react';
import socketService from '../../utils/socketService';

/**
 * WebSocket Connection Test Component
 * This component helps debug WebSocket connectivity issues
 */
const WebSocketTest = () => {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [events, setEvents] = useState([]);
    const [testChatId, setTestChatId] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');

    useEffect(() => {
        // Get user ID from localStorage
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.sub || '');
            } catch (e) {
                console.warn('Could not parse token for user ID');
            }
        }

        // Listen for connection status changes
        const checkConnection = () => {
            const status = socketService.getConnectionStatus();
            setConnectionStatus(status ? 'Connected' : 'Disconnected');
        };

        // Check connection every second
        const interval = setInterval(checkConnection, 1000);

        // Listen for all WebSocket events
        const handleMessageReceived = (data) => {
            setEvents(prev => [...prev, { 
                type: 'message_received', 
                data, 
                timestamp: new Date().toISOString() 
            }]);
        };

        const handleJoinedChat = (data) => {
            setEvents(prev => [...prev, { 
                type: 'joined_chat', 
                data, 
                timestamp: new Date().toISOString() 
            }]);
        };

        const handleLeftChat = (data) => {
            setEvents(prev => [...prev, { 
                type: 'left_chat', 
                data, 
                timestamp: new Date().toISOString() 
            }]);
        };

        socketService.on('message_received', handleMessageReceived);
        socketService.on('joined_chat', handleJoinedChat);
        socketService.on('left_chat', handleLeftChat);

        return () => {
            clearInterval(interval);
            socketService.off('message_received', handleMessageReceived);
            socketService.off('joined_chat', handleJoinedChat);
            socketService.off('left_chat', handleLeftChat);
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

    const joinTestChat = () => {
        if (testChatId && currentUserId && socketService.socket) {
            console.log('[WEBSOCKET_TEST] Joining chat:', testChatId);
            socketService.joinChat(parseInt(testChatId), parseInt(currentUserId));
        }
    };

    const leaveTestChat = () => {
        if (testChatId && currentUserId && socketService.socket) {
            console.log('[WEBSOCKET_TEST] Leaving chat:', testChatId);
            socketService.leaveChat(parseInt(testChatId), parseInt(currentUserId));
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
                    <br />
                    <small className="text-muted">Current User ID: {currentUserId || 'Not available'}</small>
                </div>
                
                <div className="mb-3">
                    <div className="row">
                        <div className="col-md-4">
                            <input 
                                type="number" 
                                className="form-control form-control-sm mb-2" 
                                placeholder="Chat ID" 
                                value={testChatId}
                                onChange={(e) => setTestChatId(e.target.value)}
                            />
                        </div>
                        <div className="col-md-8">
                            <button className="btn btn-success btn-sm me-2" onClick={joinTestChat}>
                                Join Chat
                            </button>
                            <button className="btn btn-warning btn-sm me-2" onClick={leaveTestChat}>
                                Leave Chat
                            </button>
                        </div>
                    </div>
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