import React, { useState, useEffect } from 'react';
import { Plus, Bookmark, X, Check } from 'lucide-react';

export const AddToCollectionModal = ({ recipeId, recipeName, show, onClose }) => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const token = localStorage.getItem('token');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        if (show) {
            fetchCollections();
        }
    }, [show]);

    const fetchCollections = async () => {
        if (!token || !backendUrl) return;
        
        setLoading(true);
        try {
            const resp = await fetch(`${backendUrl}/api/user/collections`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = await resp.json();
            if (resp.ok) {
                setCollections(data.collections || []);
            } else {
                setMessage({ type: 'danger', text: data.error || 'Failed to load collections' });
            }
        } catch (e) {
            setMessage({ type: 'danger', text: 'Failed to load collections' });
        } finally {
            setLoading(false);
        }
    };

    const addToCollection = async (collectionId) => {
        try {
            const resp = await fetch(`${backendUrl}/api/collection/${collectionId}/add-recipe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ recipe_id: recipeId })
            });
            
            const data = await resp.json();
            if (resp.ok) {
                setMessage({ type: 'success', text: data.msg || 'Recipe added to collection!' });
                // Update the collection in the list to show it now contains this recipe
                setCollections(prev => prev.map(c => 
                    c.collection_id === collectionId 
                        ? { ...c, recipe_count: (c.recipe_count || 0) + 1 }
                        : c
                ));
            } else {
                setMessage({ type: 'warning', text: data.msg || data.error || 'Failed to add recipe' });
            }
        } catch (e) {
            setMessage({ type: 'danger', text: 'Failed to add recipe to collection' });
        }
        
        setTimeout(() => setMessage(null), 2500);
    };

    const createNewCollection = () => {
        onClose();
        // Navigate to create collection page
        window.location.href = '/collection/new';
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    
                    <div className="modal-header">
                        <h5 className="modal-title d-flex align-items-center">
                            <Bookmark size={20} className="me-2 text-primary" />
                            Add to Collection
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        
                        {message && (
                            <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                                {message.text}
                                <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                            </div>
                        )}

                        <div className="mb-3">
                            <p className="text-muted mb-3">
                                Choose a collection to add <strong>"{recipeName}"</strong> to:
                            </p>
                        </div>

                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {collections.length > 0 ? (
                                    <div className="list-group mb-3">
                                        {collections.map(collection => (
                                            <button
                                                key={collection.collection_id}
                                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                                onClick={() => addToCollection(collection.collection_id)}
                                            >
                                                <div>
                                                    <div className="fw-semibold">{collection.title}</div>
                                                    <small className="text-muted">
                                                        {collection.recipe_count || 0} recipe{(collection.recipe_count || 0) !== 1 ? 's' : ''}
                                                        {collection.is_public && ' • Public'}
                                                        {!collection.is_public && ' • Private'}
                                                    </small>
                                                </div>
                                                <Plus size={16} className="text-primary" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Bookmark size={48} className="text-muted mb-3" />
                                        <p className="text-muted">You don't have any collections yet.</p>
                                    </div>
                                )}

                                <div className="d-grid">
                                    <button 
                                        className="btn btn-outline-primary"
                                        onClick={createNewCollection}
                                    >
                                        <Plus size={16} className="me-2" />
                                        Create New Collection
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddToCollectionModal;