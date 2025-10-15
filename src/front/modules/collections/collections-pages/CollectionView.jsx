import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, List, Trash, Globe, Lock, AlertTriangle } from 'lucide-react';

export const CollectionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchCollection = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const resp = await fetch(`${backendUrl}/api/collection/${id}?include_recipes=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await resp.json();
      
      if (resp.ok) {
        setCollection(data.collection);
      } else {
        if (resp.status === 403) {
          setAccessDenied(true);
          setMessage({ type: 'warning', text: 'This collection is private and you do not have access to view it.' });
        } else if (resp.status === 401) {
          setAccessDenied(true);
          setMessage({ type: 'warning', text: 'Authentication required to view this private collection.' });
        } else {
          setMessage({ type: 'danger', text: data.error || 'Failed to load collection' });
        }
      }
    } catch (e) {
      setMessage({ type: 'danger', text: 'Failed to load collection' });
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchCollection(); }, [id]);

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted mt-2">Loading collection...</p>
    </div>
  );

  if (accessDenied) return (
    <div className="container py-5">
      <div className="text-center py-5">
        <AlertTriangle size={64} className="text-warning mb-3" />
        <h3 className="h5 text-muted mb-3">Access Denied</h3>
        {message && (
          <div className={`alert alert-${message.type} d-inline-block`}>
            {message.text}
          </div>
        )}
        <div className="mt-4">
          <Link to="/my-collections" className="btn btn-primary me-2">
            My Collections
          </Link>
          <Link to="/" className="btn btn-outline-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );

  if (!collection) return (
    <div className="container py-5 text-center">
      <p className="text-muted">Collection not found</p>
      <Link to="/my-collections" className="btn btn-primary">
        Back to Collections
      </Link>
    </div>
  );

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h4 mb-1">{collection.title}</h1>
          <p className="text-muted small mb-0">By {collection.owner?.username} • {collection.recipe_count || 0} recipes</p>
        </div>
        <div className="d-flex gap-2">
          {collection.is_public ? (
            <span className="badge bg-success px-3 py-2 d-flex align-items-center">
              <Globe size={16} className="me-2" />
              Public
            </span>
          ) : (
            <span className="badge bg-secondary px-3 py-2 d-flex align-items-center">
              <Lock size={16} className="me-2" />
              Private
            </span>
          )}
        </div>
      </div>

      {collection.description && (
        <div className="mb-4">
          <div className="card border">
            <div className="card-body py-3 px-4">
              <h6 className="text-muted mb-2 fw-semibold">Description</h6>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {collection.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="row g-4">
        {collection.recipes && collection.recipes.length > 0 ? collection.recipes.map(item => (
          <div key={item.collection_recipe_id} className="col-sm-6 col-lg-4 col-xl-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body d-flex flex-column">
                <h5 className="mb-2">{item.recipe?.title || 'Unknown Recipe'}</h5>
                <p className="text-muted small mb-3 flex-grow-1">
                  {item.recipe?.description || 'No description available'}
                </p>
                <div className="mt-auto">
                  <Link 
                    to={`/recipe/${item.recipe?.recipe_id}`} 
                    className="btn btn-outline-primary btn-sm w-100"
                  >
                    View Recipe
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-12">
            <div className="text-center py-5">
              <List size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No recipes in this collection</h5>
              <p className="text-muted mb-0">This collection is empty.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionView;
