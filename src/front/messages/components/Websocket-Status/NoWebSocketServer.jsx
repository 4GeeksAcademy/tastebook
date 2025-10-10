import React from 'react';
import { WifiOff, Terminal, Play, RefreshCw } from 'lucide-react';

/**
 * NoWebSocketServer Component
 * Shows when WebSocket server is not available/running
 * Takes up the full page space, with instructions
 */

const NoWebSocketServer = ({ onRetry, isRetrying = false }) => {
    return (
        <div 
            className="d-flex flex-column justify-content-center align-items-center text-center w-100 h-100"
            style={{
                minHeight: "400px",
                padding: "2rem",
                boxSizing: "border-box"
            }}
        >
            {/* Main Icon */}
            <div className="mb-4">
                <WifiOff 
                    size={80} 
                    className=""
                    style={{ opacity: 0.7 }}
                />
            </div>

            {/* Main Message */}
            <h2 className="text-muted mb-3">
                WebSocket Not Available
            </h2>
            
            <p className="text-muted mb-4 fs-5" style={{ maxWidth: "500px" }}>
                If you want to see messages, initialize the WebSocket server
            </p>

            {/* Instructions Card */}
            <div className="card border-0 shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
                <div className="card-body">
                    <h5 className="card-title d-flex align-items-center mb-3">
                        <Terminal size={20} className="me-2 text-primary" />
                        How to start the WebSocket server
                    </h5>
                    
                    <div className="text-start">
                        <p className="mb-3">
                            <strong>Option 1:</strong> Start both REST API and WebSocket servers together
                        </p>
                        <div className="bg-dark text-white p-3 rounded mb-3">
                            <code>./dev_server.sh start</code>
                        </div>

                        <p className="mb-3">
                            <strong>Option 2:</strong> Start only the WebSocket server (if REST API is already running)
                        </p>
                        <div className="bg-dark text-white p-3 rounded mb-3">
                            <code>pipenv run python src/socket_app.py</code>
                        </div>

                        <div className="alert alert-info mb-0">
                            <div className="d-flex align-items-start">
                                <Play size={16} className="me-2 mt-1 text-info" />
                                <div>
                                    <strong>Note:</strong> The WebSocket server runs on port 3002, separate from the REST API (port 3001).
                                    Both servers need to be running for full messaging functionality.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 text-muted small" style={{ maxWidth: "500px" }}>
                <p className="mb-1">
                    <strong>Current status:</strong> Only REST API is available
                </p>
                <p className="mb-0">
                    Real-time messaging requires the WebSocket server to be running
                </p>
            </div>

            {/* Retry Button */}
            {onRetry && (
                <div className="mt-4">
                    <button 
                        className="btn btn-primary"
                        onClick={onRetry}
                        disabled={isRetrying}
                    >
                        {isRetrying ? (
                            <>
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                Checking...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} className="me-2" />
                                Check Again
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NoWebSocketServer;