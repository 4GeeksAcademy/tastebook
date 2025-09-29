import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';

export const CollectionModal = ({ 
  show, 
  onClose, 
  mode = 'create', // 'create' or 'edit'
  collectionId = null,
  onSuccess = null 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem('token');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (show) {
      if (mode === 'create') {
        // Reset to defaults for create mode
        setTitle('');
        setDescription('');
        setIsPublic(false);
        setMessage(null);
      } else if (mode === 'edit' && collectionId) {
        // Fetch existing collection data for edit mode
        fetchCollectionData();
      }
    } else {
      // Reset everything when modal closes
      setTitle('');
      setDescription('');
      setIsPublic(false);
      setMessage(null);
      setLoading(false);
      setFetchingData(false);
    }
  }, [show, mode, collectionId]);

  const fetchCollectionData = async () => {
    if (!collectionId || !token) return;

    setFetchingData(true);
    try {
      const response = await fetch(`${backendUrl}/api/collection/${collectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const collection = data.collection;
        
        setTitle(collection.title || '');
        setDescription(collection.description || '');
        setIsPublic(collection.is_public || false);
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: 'danger', 
          text: errorData.error || 'Failed to load collection data' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: 'Failed to load collection data' 
      });
    } finally {
      setFetchingData(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setMessage({ type: 'danger', text: 'Collection title is required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const requestData = {
        title: title.trim(),
        description: description.trim(),
        is_public: isPublic
      };

      let response;
      if (mode === 'create') {
        response = await fetch(`${backendUrl}/api/collection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        });
      } else {
        response = await fetch(`${backendUrl}/api/collection/${collectionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        });
      }

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: data.msg || `Collection ${mode === 'create' ? 'created' : 'updated'} successfully!` 
        });
        
        // Call success callback and close modal after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(data.collection);
          }
          onClose();
        }, 1000);
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: 'danger', 
          text: errorData.error || `Failed to ${mode} collection` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: `Failed to ${mode} collection` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !fetchingData) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center">
              {mode === 'create' ? (
                <>
                  <Plus size={20} className="me-2 text-primary" />
                  Create New Collection
                </>
              ) : (
                <>
                  <Save size={20} className="me-2 text-primary" />
                  Edit Collection
                </>
              )}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              disabled={loading || fetchingData}
            ></button>
          </div>

          <div className="modal-body">
            
            {message && (
              <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                {message.text}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setMessage(null)}
                ></button>
              </div>
            )}

            {fetchingData ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading collection data...</span>
                </div>
                <p className="text-muted mt-2">Loading collection data...</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                
                <div className="mb-3">
                  <label htmlFor="collectionTitle" className="form-label fw-semibold">
                    Collection Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="collectionTitle"
                    placeholder="Enter collection title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="collectionDescription" className="form-label fw-semibold">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="collectionDescription"
                    rows="3"
                    placeholder="Describe your collection (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="collectionPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={loading}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="collectionPublic">
                      Make collection public
                    </label>
                  </div>
                  <small className="text-muted">
                    {isPublic 
                      ? "Public collections can be viewed by anyone"
                      : "Private collections are only visible to you"
                    }
                  </small>
                </div>

              </form>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClose}
              disabled={loading || fetchingData}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={loading || fetchingData || !title.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <Plus size={16} className="me-2" />
                      Create Collection
                    </>
                  ) : (
                    <>
                      <Save size={16} className="me-2" />
                      Save Changes
                    </>
                  )}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CollectionModal;