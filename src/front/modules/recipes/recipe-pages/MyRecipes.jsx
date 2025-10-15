import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, Search, Eye, EyeOff, Edit, Trash2, User, Heart, Utensils } from 'lucide-react';

export const MyRecipes = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private'
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState('desc');

    const [message, setMessage] = useState(null);

    const fetchRecipes = async () => {
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

            const resp = await fetch(`${backendUrl}/api/user/recipes?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await resp.json();
            if (resp.ok) {
                setRecipes(data.recipes || []);
            } else {
                setMessage({ type: 'danger', text: data.error || 'Failed to load recipes' });
            }
        } catch (e) {
            setMessage({ type: 'danger', text: 'Failed to load recipes' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [search, visibilityFilter, sortBy, order]);

    const handleEdit = (recipeId) => {
        navigate(`/recipe/modify/${recipeId}`);
    };

    const handleDelete = async (recipeId) => {
        if (!window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
            return;
        }

        try {
            const resp = await fetch(`${backendUrl}/api/recipe/${recipeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (resp.ok) {
                setMessage({ type: 'success', text: 'Recipe deleted successfully!' });
                fetchRecipes(); // Refresh the list
                setTimeout(() => setMessage(null), 3000);
            } else {
                const data = await resp.json();
                setMessage({ type: 'danger', text: data.error || 'Failed to delete recipe' });
            }
        } catch (e) {
            setMessage({ type: 'danger', text: 'Failed to delete recipe' });
        }
    };

    const RecipeCard = ({ recipe }) => (
        <div className="card h-100 shadow-sm border-0">
            <div className="position-relative">
                <Link to={`/recipe/${recipe.recipe_id}`} className="text-decoration-none">
                    <div className="position-relative overflow-hidden rounded-top" style={{ height: '200px' }}>
                        {recipe.primary_image ? (
                            <img 
                                src={recipe.primary_image.url} 
                                alt={recipe.title}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                                <Utensils size={48} className="text-muted" />
                            </div>
                        )}
                        
                        {/* Privacy Badge */}
                        <div className="position-absolute top-0 end-0 m-2">
                            <span className={`badge ${recipe.is_public ? 'bg-success' : 'bg-secondary'}`}>
                                {recipe.is_public ? (
                                    <>
                                        <Eye size={12} className="me-1" />
                                        Public
                                    </>
                                ) : (
                                    <>
                                        <EyeOff size={12} className="me-1" />
                                        Private
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </Link>
                
                {/* Action buttons */}
                <div className="position-absolute top-0 start-0 m-2">
                    <div className="btn-group-vertical" role="group">
                        <button 
                            className="btn btn-sm btn-outline-primary bg-white"
                            onClick={() => handleEdit(recipe.recipe_id)}
                            title="Edit Recipe"
                        >
                            <Edit size={14} />
                        </button>
                        <button 
                            className="btn btn-sm btn-outline-danger bg-white"
                            onClick={() => handleDelete(recipe.recipe_id)}
                            title="Delete Recipe"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="card-body d-flex flex-column">
                <Link to={`/recipe/${recipe.recipe_id}`} className="text-decoration-none text-reset">
                    <h5 className="card-title fw-bold mb-2 lh-sm" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden'
                    }}>
                        {recipe.title}
                    </h5>
                    {recipe.description && (
                        <p className="card-text text-muted mb-3" style={{ 
                            display: '-webkit-box', 
                            WebkitLineClamp: 3, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden',
                            fontSize: '0.9rem'
                        }}>
                            {recipe.description}
                        </p>
                    )}
                </Link>
                
                <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                            {new Date(recipe.created_at).toLocaleDateString()}
                        </small>
                        <small className="text-muted d-flex align-items-center">
                            <Heart size={14} className="me-1" />
                            {recipe.like_count || 0}
                        </small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <small className="text-muted d-flex align-items-center">
                            <Utensils size={14} className="me-1" />
                            {recipe.ingredients?.length || 0} ingredients
                        </small>
                        <small className="text-muted">
                            {recipe.instructions?.length || 0} steps
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container py-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0">My Recipes</h1>
                <div className="d-flex gap-2">
                    <Link to="/recipe/create" className="btn btn-primary d-flex align-items-center">
                        <PlusCircle size={16} className="me-2" /> New Recipe
                    </Link>
                </div>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}

            <div className="row mb-3">
                <div className="col-md-4 mb-2">
                    <div className="input-group">
                        <span className="input-group-text"><Search size={16} /></span>
                        <input 
                            className="form-control" 
                            placeholder="Search my recipes" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
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
                        <label className="form-check-label" htmlFor="filterPublic">
                            <Eye size={14} className="me-1" />
                            Public only
                        </label>
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
                        <label className="form-check-label" htmlFor="filterPrivate">
                            <EyeOff size={14} className="me-1" />
                            Private only
                        </label>
                    </div>
                </div>

                <div className="col-md-4 mb-2 d-flex justify-content-end gap-2">
                    <select className="form-select w-auto" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="created_at">Newest</option>
                        <option value="title">Title</option>
                        <option value="like_count">Most Liked</option>
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
                    {recipes.length > 0 ? recipes.map(recipe => (
                        <div key={recipe.recipe_id} className="col-sm-6 col-lg-4 col-xl-3">
                            <RecipeCard recipe={recipe} />
                        </div>
                    )) : (
                        <div className="text-center py-5">
                            <p className="text-muted">
                                You haven't created any recipes yet. 
                                <Link to="/recipe/create" className="text-decoration-none ms-1">
                                    Create your first recipe!
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyRecipes;