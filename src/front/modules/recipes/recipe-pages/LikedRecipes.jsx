import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Grid3X3, List, X, RotateCcw, User, Utensils, Heart, Trash2, Clock, Calendar } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const LikedRecipes = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        sort_by: 'liked_date',
        order: 'desc'
    });
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 12,
        total: 0,
        pages: 0,
        has_prev: false,
        has_next: false
    });
    const [view, setView] = useState('grid'); // 'grid' or 'list'
    const [showUnlikeModal, setShowUnlikeModal] = useState(null);

    // Check if user is authenticated
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
    }, [token, navigate]);

    // Fetch liked recipes from API
    const fetchLikedRecipes = async (params = {}) => {
        if (!token) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const queryParams = new URLSearchParams({
                page: params.page || pagination.page,
                per_page: pagination.per_page,
                ...(searchTerm && { search: searchTerm }),
                sort_by: filters.sort_by,
                order: filters.order
            });

            const response = await fetch(`${BACKEND_URL}/api/user/liked-recipes?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    navigate('/login');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            setRecipes(data.recipes);
            setPagination(data.pagination);
            
        } catch (err) {
            console.error('Error fetching liked recipes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (token) {
            fetchLikedRecipes({ page: 1 });
        }
    }, [token, searchTerm, filters]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchLikedRecipes({ page: 1 });
    };

    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            sort_by: 'liked_date',
            order: 'desc'
        });
        setSearchTerm('');
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        fetchLikedRecipes({ page: newPage });
    };

    // Handle unlike recipe
    const handleUnlikeRecipe = async (recipeId) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/recipe/${recipeId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to unlike recipe');
            }

            // Remove the recipe from the list
            setRecipes(prev => prev.filter(recipe => recipe.recipe_id !== recipeId));
            
            // Update pagination total
            setPagination(prev => ({
                ...prev,
                total: prev.total - 1
            }));

            setShowUnlikeModal(null);

        } catch (err) {
            console.error('Error unliking recipe:', err);
            alert('Failed to unlike recipe. Please try again.');
        }
    };

    // Unlike confirmation modal
    const UnlikeModal = ({ recipe, onConfirm, onCancel }) => (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-bottom-0">
                        <h5 className="modal-title d-flex align-items-center">
                            <Heart size={20} className="text-danger me-2" />
                            Unlike Recipe
                        </h5>
                        <button type="button" className="btn-close" onClick={onCancel}></button>
                    </div>
                    <div className="modal-body text-center py-4">
                        <p className="mb-3">
                            Are you sure you want to remove <strong>"{recipe.title}"</strong> from your liked recipes?
                        </p>
                        <small className="text-muted">
                            You can always like it again later by visiting the recipe page.
                        </small>
                    </div>
                    <div className="modal-footer border-top-0 justify-content-center">
                        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => onConfirm(recipe.recipe_id)}>
                            <Heart size={16} className="me-1" />
                            Unlike Recipe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Recipe Card Component
    const LikedRecipeCard = ({ recipe }) => (
        <div className={`card h-100 shadow-sm border-0 ${view === 'list' ? 'd-flex flex-row' : ''}`}>
            <div className={`position-relative ${view === 'list' ? 'col-md-4 p-0' : ''}`}>
                <Link to={`/recipe/${recipe.recipe_id}`} className="text-decoration-none">
                    <div className={`position-relative overflow-hidden ${view === 'list' ? 'h-100' : ''}`} style={{ height: view === 'grid' ? '220px' : '200px' }}>
                        {recipe.primary_image ? (
                            <img 
                                src={recipe.primary_image.url} 
                                alt={recipe.title}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                loading="lazy"
                            />
                        ) : (
                            <div className="bg-light w-100 h-100 d-flex align-items-center justify-content-center">
                                <Utensils size={48} className="text-muted" />
                            </div>
                        )}
                        {/* Like badge */}
                        <div className="position-absolute top-0 end-0 m-2">
                            <span className="badge bg-danger bg-opacity-90 d-flex align-items-center">
                                <Heart size={12} className="me-1" fill="currentColor" />
                                {recipe.like_count}
                            </span>
                        </div>
                    </div>
                </Link>
                
                {/* Unlike button */}
                <div className="position-absolute bottom-0 end-0 m-2">
                    <button
                        className="btn btn-danger shadow-sm"
                        onClick={() => setShowUnlikeModal(recipe)}
                        title="Unlike recipe"
                    >
                        <Heart size={16} fill="currentColor" className="text-white" />
                    </button>
                </div>
            </div>

            <div className={`card-body d-flex flex-column ${view === 'list' ? 'col-md-8' : ''}`}>
                <Link to={`/recipe/${recipe.recipe_id}`} className="text-decoration-none text-reset">
                    <h5 className="card-title mb-2 lh-sm" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                    }}>
                        {recipe.title}
                    </h5>
                    {recipe.description && (
                        <p className="card-text text-muted small mb-3" style={{ 
                            display: '-webkit-box', 
                            WebkitLineClamp: view === 'list' ? 2 : 3, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden' 
                        }}>
                            {recipe.description.length > 100 
                                ? `${recipe.description.substring(0, 100)}...` 
                                : recipe.description
                            }
                        </p>
                    )}
                </Link>

                <div className="mt-auto">
                    {/* Author info */}
                    <div className="d-flex align-items-center mb-2">
                        {recipe.author?.cloudinary_url ? (
                            <img 
                                src={recipe.author.cloudinary_url} 
                                alt={recipe.author.username}
                                className="rounded-circle me-2 border"
                                style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2 border" style={{ width: '30px', height: '30px' }}>
                                <User size={14} className="text-muted" />
                            </div>
                        )}
                        <small className="text-muted">
                            by {recipe.author?.full_name || recipe.author?.username || 'Unknown'}
                        </small>
                    </div>

                    {/* Dates */}
                    <div className="d-flex justify-content-between align-items-center text-muted">
                        <small className="d-flex align-items-center">
                            <Calendar size={12} className="me-1" />
                            Created {new Date(recipe.created_at).toLocaleDateString()}
                        </small>
                        <small className="d-flex align-items-center">
                            <Heart size={12} className="me-1 text-danger" />
                            Liked {new Date(recipe.liked_at).toLocaleDateString()}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading && recipes.length === 0) {
        return (
            <div className="py-4" style={{ minHeight: '70vh' }}>
                <div className="container">
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                        <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem', color: '#dc3545' }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Loading your liked recipes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-4" style={{ minHeight: '70vh' }}>
            <div className="container">
                {/* Header Section */}
                <div className="text-center mb-5">
                    <div className="mx-auto" style={{ maxWidth: '800px' }}>
                        <h1 className="display-4 fw-bold mb-3">
                            <Heart size={48} className="text-danger me-3" />
                            My Liked Recipes
                        </h1>
                        <p className="lead text-muted">
                            Your collection of favorite recipes
                            {pagination.total > 0 && (
                                <span className="fw-semibold text-danger"> • {pagination.total} recipes</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="border rounded-3 p-4 mb-4">
                    <form onSubmit={handleSearch}>
                        <div className="row g-3 align-items-end">
                            {/* Search Bar */}
                            <div className="col-md-6">
                                <label htmlFor="search" className="form-label fw-semibold">Search Recipes</label>
                                <div className="input-group">
                                    <span className="input-group-text border-end-0">
                                        <Search size={16} />
                                    </span>
                                    <input
                                        id="search"
                                        type="text"
                                        className="form-control border-start-0"
                                        placeholder="Search by title or description..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Sort By */}
                            <div className="col-md-3">
                                <label htmlFor="sortBy" className="form-label fw-semibold">Sort By</label>
                                <select
                                    id="sortBy"
                                    className="form-select"
                                    value={filters.sort_by}
                                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                >
                                    <option value="liked_date">Date Liked</option>
                                    <option value="recipe_name">Recipe Name</option>
                                    <option value="author_name">Author Name</option>
                                </select>
                            </div>

                            {/* Order */}
                            <div className="col-md-2">
                                <label htmlFor="order" className="form-label fw-semibold">Order</label>
                                <select
                                    id="order"
                                    className="form-select"
                                    value={filters.order}
                                    onChange={(e) => handleFilterChange('order', e.target.value)}
                                >
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            <div className="col-md-1">
                                <button 
                                    onClick={clearFilters}
                                    className="btn btn-secondary w-100 d-flex align-items-center justify-content-center"
                                    type="button"
                                    title="Clear Filters"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* View Toggle */}
                    <div className="d-flex justify-content-center gap-2 mt-4 pt-4 border-top">
                        <button
                            className={`btn ${view === 'grid' ? 'btn-danger' : 'btn-outline-secondary'}`}
                            onClick={() => setView('grid')}
                            title="Grid View"
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button
                            className={`btn ${view === 'list' ? 'btn-danger' : 'btn-outline-secondary'}`}
                            onClick={() => setView('list')}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
                        <div className="d-flex align-items-center">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            <span>Error loading liked recipes: {error}</span>
                        </div>
                        <button 
                            onClick={() => fetchLikedRecipes({ page: 1 })}
                            className="btn btn-sm btn-outline-danger"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Recipes Grid/List */}
                {recipes.length > 0 ? (
                    <>
                        <div className={view === 'grid' ? 'row g-4 mb-4' : 'd-flex flex-column gap-3 mb-4'}>
                            {recipes.map((recipe) => (
                                <div key={recipe.recipe_id} className={view === 'grid' ? 'col-lg-4 col-md-6' : ''}>
                                    <LikedRecipeCard recipe={recipe} />
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <nav aria-label="Liked recipes pagination">
                                <ul className="pagination justify-content-center">
                                    <li className={`page-item ${!pagination.has_prev ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={!pagination.has_prev}
                                        >
                                            Previous
                                        </button>
                                    </li>
                                    
                                    {[...Array(pagination.pages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        return (
                                            <li key={pageNum} className={`page-item ${pageNum === pagination.page ? 'active' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}
                                    
                                    <li className={`page-item ${!pagination.has_next ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={!pagination.has_next}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </>
                ) : !loading && (
                    <div className="text-center py-5">
                        <Heart size={64} className="text-muted mb-3" />
                        <h3 className="text-secondary">No liked recipes found</h3>
                        <p className="text-muted mb-4">
                            {searchTerm || (filters.sort_by !== 'liked_date' || filters.order !== 'desc') 
                                ? "Try adjusting your search criteria or filters" 
                                : "Start exploring recipes and like the ones you love!"
                            }
                        </p>
                        {(searchTerm || (filters.sort_by !== 'liked_date' || filters.order !== 'desc')) && (
                            <button onClick={clearFilters} className="btn btn-outline-secondary d-flex align-items-center mx-auto">
                                <RotateCcw size={16} className="me-2" />
                                Clear All Filters
                            </button>
                        )}
                        {(!searchTerm && filters.sort_by === 'liked_date' && filters.order === 'desc') && (
                            <Link to="/all-recipes" className="btn btn-danger d-flex align-items-center mx-auto" style={{ width: 'fit-content' }}>
                                <Search size={16} className="me-2" />
                                Explore Recipes
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Unlike Confirmation Modal */}
            {showUnlikeModal && (
                <UnlikeModal 
                    recipe={showUnlikeModal}
                    onConfirm={handleUnlikeRecipe}
                    onCancel={() => setShowUnlikeModal(null)}
                />
            )}
        </div>
    );
};