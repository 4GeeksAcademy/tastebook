import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CollectionCard from '../components/CollectionCard';
import CollectionModal from '../components/CollectionModal';
import { PlusCircle, Search } from 'lucide-react';

export const MyCollections = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private'
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  const [message, setMessage] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingCollectionId, setEditingCollectionId] = useState(null);

  const fetchCollections = async () => {
    if (!token || !backendUrl) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: search || '',
        sort_by: sortBy,
        order
      });

      // Add visibility filter
      if (visibilityFilter === 'public') {
        params.append('public_only', 'true');
      } else if (visibilityFilter === 'private') {
        params.append('private_only', 'true');
      }

      const resp = await fetch(`${backendUrl}/api/user/collections?${params.toString()}`, {
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

  useEffect(() => {
    fetchCollections();
  }, [search, visibilityFilter, sortBy, order]);

  const handleEdit = (collectionId) => {
    setModalMode('edit');
    setEditingCollectionId(collectionId);
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setModalMode('create');
    setEditingCollectionId(null);
    setShowModal(true);
  };

  const handleModalSuccess = (updatedCollection, action = null) => {
    // Refresh collections list
    fetchCollections();
    
    // Show success message
    let successMessage = 'Collection updated successfully!';
    if (action === 'deleted') {
      successMessage = 'Collection deleted successfully!';
    } else if (modalMode === 'create') {
      successMessage = 'Collection created successfully!';
    }
    
    setMessage({ 
      type: 'success', 
      text: successMessage
    });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0">My Collections</h1>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary d-flex align-items-center"
            onClick={handleCreateNew}
          >
            <PlusCircle size={16} className="me-2" /> New Collection
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <div className="input-group">
            <span className="input-group-text"><Search size={16} /></span>
            <input className="form-control" placeholder="Search collections" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="col-md-4 mb-2 d-flex align-items-center gap-3">
          <div className="form-check">
            <input 
              className="form-check-input" 
              type="radio" 
              name="visibilityFilter" 
              id="filterAll" 
              checked={visibilityFilter === 'all'} 
              onChange={() => setVisibilityFilter('all')} 
            />
            <label className="form-check-label" htmlFor="filterAll">All</label>
          </div>
          <div className="form-check">
            <input 
              className="form-check-input" 
              type="radio" 
              name="visibilityFilter" 
              id="filterPublic" 
              checked={visibilityFilter === 'public'} 
              onChange={() => setVisibilityFilter('public')} 
            />
            <label className="form-check-label" htmlFor="filterPublic">Public only</label>
          </div>
          <div className="form-check">
            <input 
              className="form-check-input" 
              type="radio" 
              name="visibilityFilter" 
              id="filterPrivate" 
              checked={visibilityFilter === 'private'} 
              onChange={() => setVisibilityFilter('private')} 
            />
            <label className="form-check-label" htmlFor="filterPrivate">Private only</label>
          </div>
        </div>

        <div className="col-md-4 mb-2 d-flex justify-content-end gap-2">
          <select className="form-select w-auto" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="created_at">Newest</option>
            <option value="title">Title</option>
          </select>
          <select className="form-select w-auto" value={order} onChange={e => setOrder(e.target.value)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="row g-4">
          {collections.length > 0 ? collections.map(c => (
            <div key={c.collection_id} className="col-sm-6 col-lg-4 col-xl-3">
              <CollectionCard 
                collection={c} 
                isPersonalCollection={true}
                onEdit={handleEdit}
              />
            </div>
          )) : (
            <div className="text-center py-5">
              <p className="text-muted">You have no collections yet. Create a new one to save your favorite recipes.</p>
            </div>
          )}
        </div>
      )}

      <CollectionModal
        show={showModal}
        onClose={() => setShowModal(false)}
        mode={modalMode}
        collectionId={editingCollectionId}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default MyCollections;
