import React from "react";

/**
 * Reusable Toast component for notifications
 * @param {boolean} show - Whether to show the toast
 * @param {string} message - Message to display
 * @param {function} onClose - Function to call when closing the toast
 * @param {string} type - Type of toast (success, error, warning, info)
 */

const Toast = ({ show, message, onClose, type = "success" }) => {
    if (!show) return null;

    const getTypeClass = () => {
        switch (type) {
            case 'error':
                return 'bg-danger';
            case 'warning':
                return 'bg-warning';
            case 'info':
                return 'bg-info';
            default:
                return 'bg-success';
        }
    };

    return (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
            <div className="toast show" role="alert">
                <div className={`toast-header ${getTypeClass()} text-white`}>
                    <strong className="me-auto"> TasteBook Messages </strong>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white" 
                        onClick={onClose}
                    ></button>
                </div>
                <div className="toast-body">
                    { message }
                </div>
            </div>
        </div>
    );
};

export default Toast;