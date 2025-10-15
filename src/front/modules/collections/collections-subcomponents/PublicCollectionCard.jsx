import React from 'react';
import { Link } from 'react-router-dom';
import { Grid } from 'lucide-react';

export const PublicCollectionCard = ({ collection }) => {
    return (
        <div className="card h-100 shadow-sm border-0">
            <div className="card-body p-3 d-flex flex-column">

                <div className="d-flex align-items-center mb-3">
                    <div className="bg-light rounded me-3 d-flex align-items-center justify-content-center" style={{ width: 72, height: 72 }}>
                        <Grid size={28} className="text-muted" />
                    </div>
                    <div className="flex-grow-1">
                        <h5 className="mb-1" style={{ fontSize: '1rem' }}>{collection.title}</h5>
                        <p className="text-muted small mb-1">
                            {collection.recipe_count || 0} recipe{(collection.recipe_count || 0) !== 1 ? 's' : ''}
                        </p>
                        {collection.owner && (
                            <p className="text-muted small mb-0">
                                by <Link to={`/user/${collection.owner.username}`} className="text-decoration-none">{collection.owner.username}</Link>
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-muted small mb-3 flex-grow-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {collection.description || 'No description available'}
                </p>

                <div className="mt-auto">
                    <Link
                        to={`/collection/${collection.collection_id}`}
                        className="btn btn-outline-primary btn-sm w-100"
                    >
                        View Collection
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PublicCollectionCard;