import React from 'react';
import { Link } from 'react-router-dom';
import { Image, List, Lock, Globe, Edit } from 'lucide-react';

export const CollectionCard = ({ 
  collection, 
  isPersonalCollection = false, 
  onEdit = null 
}) => {
  
  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(collection.collection_id);
    }
  };

  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body p-3 d-flex flex-column">
        
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">

            {/* Don't use the image */}
            {/* <div className="bg-light rounded me-3 d-flex align-items-center justify-content-center" style={{ width: 72, height: 72 }}>
              <Image size={28} className="text-muted" />
            </div> */}

            <div>
              <h5 className="mb-1" style={{ fontSize: '1rem' }}>{collection.title}</h5>
              <p className="text-muted small mb-0">{collection.recipe_count || 0} recipe{(collection.recipe_count || 0) !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="ms-2 d-flex align-items-center gap-2">
            {collection.is_public ? (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
                <Globe size={12} className="me-1" />
                Public
              </span>
            ) : (
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
                <Lock size={12} className="me-1" />
                Private
              </span>
            )}

            {isPersonalCollection && (
              <button 
                className="btn btn-link p-1 text-muted"
                onClick={handleEditClick}
                title="Edit collection"
                style={{ lineHeight: 1 }}
              >
                <Edit size={16} />
              </button>
            )}
          </div>
        </div>

        <p className="text-muted small mb-3 flex-grow-1" style={{ whiteSpace: 'pre-wrap' }}>{collection.description || ''}</p>

        <div className="mt-auto">
          <Link to={`/collection/${collection.collection_id}`} className="btn btn-outline-primary btn-sm w-100">View Collection</Link>
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;
