import React, { useState, useEffect } from "react";
import { Edit, X, Save } from "lucide-react";

export const EditDescriptionModal = ({ 
  isOpen, 
  onClose, 
  currentDescription = "", 
  onSave, 
  loading = false 
}) => {
  const [description, setDescription] = useState(currentDescription || "");
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    
    // Validate description length (optional)
    if (description.length > 500) {
      setError("Description must be 500 characters or less");
      return;
    }
    
    onSave(description);
  };

  const handleClose = () => {
    setDescription(currentDescription || "");
    setError("");
    onClose();
  };

  // Reset description when modal opens with new currentDescription
  useEffect(() => {
    if (isOpen) {
      setDescription(currentDescription || "");
      setError("");
    }
  }, [isOpen, currentDescription]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={handleClose}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            
            {/* Modal Header */}
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center">
                <Edit size={20} className="me-2 text-primary" />
                Edit Description
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={handleClose}
                disabled={loading}
              ></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button 
                    type="button" 
                    className="btn-close btn-close-sm" 
                    onClick={() => setError("")}
                  ></button>
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="description" className="form-label fw-semibold">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form-control"
                  rows="4"
                  placeholder="Tell others about yourself, your cooking style, favorite cuisines, or anything you'd like to share..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  maxLength={500}
                />
                <div className="form-text d-flex justify-content-between">
                  <span>Share a bit about yourself with the community</span>
                  <span className={description.length > 450 ? "text-warning" : "text-muted"}>
                    {description.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleClose}
                disabled={loading}
              >
                <X size={16} className="me-1" />
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="me-1" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};