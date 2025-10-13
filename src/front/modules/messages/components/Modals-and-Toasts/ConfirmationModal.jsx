import React from "react";

/**
 * Reusable Confirmation Modal component
 * @param {boolean}  show        - Whether to show the modal
 * @param {string}   message     - Confirmation message to display
 * @param {function} onConfirm   - Function to call when confirming
 * @param {function} onCancel    - Function to call when canceling
 * @param {string}   type        - Type of confirmation (default, danger)
 * @param {string}   confirmText - Text for confirm button
 * @param {string}   cancelText  - Text for cancel button
 */

const ConfirmationModal = ({ 
    show, 
    message, 
    onConfirm, 
    onCancel, 
    type =        'default',
    confirmText = 'Confirm',
    cancelText =  'Cancel'
}) => {

    if (!show) return null;

    const getConfirmButtonClass = () => {
        switch (type) {
            case 'danger':
                return 'btn-danger';
            case 'warning':
                return 'btn-warning';
            default:
                return 'btn-primary';
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            
            <div className="modal-dialog">

                <div className="modal-content">

                    <div className="modal-header">
                        <h5 className="modal-title"> Confirm Action </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onCancel}
                        ></button>
                    </div>


                    <div className="modal-body">
                        <p>{ message }</p>
                    </div>


                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={onCancel}
                        >
                            { cancelText }
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${getConfirmButtonClass()}`}
                            onClick={onConfirm}
                        >
                            { confirmText }
                        </button>
                    </div>

                    
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;