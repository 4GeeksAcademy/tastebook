import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Grid3X3, List, X, RotateCcw, User, Utensils } from 'lucide-react';
import { LikeIcon } from '../components/LikeButton';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const AllRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        dietary: '',
        maxCookingTime: '',
        minLikes: ''
    });
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 12,
        offset: 0,
        hasMore: false
    });
    const [view, setView] = useState('grid'); // 'grid' or 'list'

    // Fetch recipes from API
    const fetchRecipes = async (params = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const queryParams = new URLSearchParams({
                limit: pagination.limit,
                offset: params.offset || pagination.offset,
                ...(searchTerm && { search: searchTerm }),
                ...(filters.category && { category: filters.category }),
                ...(filters.dietary && { dietary: filters.dietary }),
                ...(filters.maxCookingTime && { max_cooking_time: filters.maxCookingTime }),
                ...(filters.minLikes && { min_likes: filters.minLikes })
            });

            const response = await fetch(`${BACKEND_URL}/api/recipes?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (params.offset === 0) {
                setRecipes(data.recipes);
            } else {
                setRecipes(prev => [...prev, ...data.recipes]);
            }
            
            setPagination(prev => ({
                ...prev,
                total: data.pagination.total,
                offset: data.pagination.offset,
                hasMore: data.pagination.has_more
            }));
            
        } catch (err) {
            console.error('Error fetching recipes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchRecipes({ offset: 0 });
    }, [searchTerm, filters]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, offset: 0 }));
        fetchRecipes({ offset: 0 });
    };

    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            category: '',
            dietary: '',
            maxCookingTime: '',
            minLikes: ''
        });
        setSearchTerm('');
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    // Load more recipes
    const loadMore = () => {
        const newOffset = pagination.offset + pagination.limit;
        setPagination(prev => ({ ...prev, offset: newOffset }));
        fetchRecipes({ offset: newOffset });
    };

    // Recipe Card Component
    const RecipeCard = ({ recipe }) => (
        <div className={`card h-100 shadow-sm border-0 ${view === 'list' ? 'd-flex flex-row' : ''}`}
             style={{ 
                 transition: 'all 0.3s ease',
                 cursor: 'pointer'
             }}
             onMouseEnter={(e) => {
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
             }}
             onMouseLeave={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)';
             }}>
            <div className={`${view === 'list' ? 'col-md-4 p-0' : ''}`}>
                <Link to={`/recipe/${recipe.recipe_id}`} className="text-decoration-none">
                    <div className={`position-relative overflow-hidden ${view === 'list' ? 'h-100' : 'rounded-top'}`} 
                         style={{ height: view === 'grid' ? '220px' : '200px' }}>
                        {recipe.primary_image ? (
                            <img 
                                src={recipe.primary_image.url} 
                                alt={recipe.title}
                                className="w-100 h-100"
                                style={{ 
                                    objectFit: 'cover',
                                    transition: 'transform 0.3s ease'
                                }}
                                loading="lazy"
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                }}
                            />
                        ) : (
                            <div className="bg-light w-100 h-100 d-flex align-items-center justify-content-center border-bottom">
                                <Utensils size={48} className="text-muted" />
                            </div>
                        )}
                    </div>
                </Link>
            </div>
            <div className={`card-body d-flex flex-column p-4 ${view === 'list' ? 'col-md-8' : ''}`}>
                <Link to={`/recipe/${recipe.recipe_id}`} className="text-decoration-none text-reset">
                    <h5 className="card-title fw-bold mb-2 lh-sm text-dark" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        fontSize: '1.1rem'
                    }}>
                        {recipe.title}
                    </h5>
                    {recipe.description && (
                        <p className="card-text text-muted mb-3" style={{ 
                            display: '-webkit-box', 
                            WebkitLineClamp: view === 'list' ? 2 : 3, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden',
                            fontSize: '0.9rem',
                            lineHeight: '1.5'
                        }}>
                            {recipe.description.length > 100 
                                ? `${recipe.description.substring(0, 100)}...` 
                                : recipe.description
                            }
                        </p>
                    )}
                </Link>
                <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            {recipe.author?.cloudinary_url ? (
                                <img 
                                    src={recipe.author.cloudinary_url} 
                                    alt={recipe.author.username}
                                    className="rounded-circle me-2 border shadow-sm"
                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2 border shadow-sm" 
                                     style={{ width: '32px', height: '32px' }}>
                                    <User size={14} className="text-muted" />
                                </div>
                            )}
                            <small className="text-muted fw-medium">
                                {recipe.author?.full_name || recipe.author?.username || 'Unknown'}
                            </small>
                        </div>
                        <small className="text-muted">
                            {new Date(recipe.created_at).toLocaleDateString()}
                        </small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <LikeIcon 
                            recipeId={recipe.recipe_id}
                            initialLikeCount={recipe.like_count || 0}
                            initialIsLiked={recipe.is_liked_by_user || false}
                            size={16}
                        />
                        <small className="text-muted d-flex align-items-center">
                            <Utensils size={14} className="me-1" />
                            {recipe.ingredients?.length || 0} ingredients
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading && recipes.length === 0) {
        return (
            <div className="bg-light min-vh-100 py-5">
                <div className="container">
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                        <div className="spinner-border text-primary mb-4" style={{ width: '3rem', height: '3rem' }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h4 className="text-primary mb-2">Loading delicious recipes...</h4>
                        <p className="text-muted">Please wait while we fetch the latest recipes for you</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100 py-4">
            <div className="container">
                {/* Header Section */}
                <div className="text-center mb-5">
                    <div className="mx-auto" style={{ maxWidth: '800px' }}>
                        <h1 className="display-4 fw-bold text-primary mb-3">
                            All Recipes
                        </h1>
                        <p className="lead text-muted mb-1">
                            Discover amazing recipes from our community of chefs
                        </p>
                        {pagination.total > 0 && (
                            <div className="mt-3">
                                <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill">
                                    {pagination.total} recipe{pagination.total !== 1 ? 's' : ''} available
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-light border rounded-3 p-4 mb-4 shadow-sm">
                    <div className="mb-4">
                        <form onSubmit={handleSearch} className="mx-auto" style={{ maxWidth: '600px' }}>
                            <div className="input-group input-group-lg shadow-sm">
                                <span className="input-group-text bg-white border-end-0">
                                    <Search size={20} className="text-muted" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search recipes by title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-control border-start-0 border-end-0 px-3"
                                    style={{ fontSize: '1rem' }}
                                />
                                <button type="submit" className="btn btn-primary px-4 fw-semibold">
                                    <span className="d-none d-sm-inline">Search</span>
                                    <Search size={16} className="d-sm-none" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Filter Controls */}
                    <div className="border-top pt-4">
                        <h6 className="text-secondary mb-3 fw-semibold">
                            <i className="fas fa-filter me-2"></i>
                            Filter Options
                        </h6>
                        <div className="row g-3">
                            <div className="col-lg-3 col-md-6">
                                <label htmlFor="category-filter" className="form-label text-secondary small fw-semibold">
                                    Category
                                </label>
                                <select
                                    id="category-filter"
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">All Categories</option>
                                    <option value="appetizer">Appetizers</option>
                                    <option value="main-course">Main Courses</option>
                                    <option value="dessert">Desserts</option>
                                    <option value="beverage">Beverages</option>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snacks</option>
                                </select>
                            </div>

                            <div className="col-lg-3 col-md-6">
                                <label htmlFor="dietary-filter" className="form-label text-secondary small fw-semibold">
                                    Dietary Preferences
                                </label>
                                <select
                                    id="dietary-filter"
                                    value={filters.dietary}
                                    onChange={(e) => handleFilterChange('dietary', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">All Diets</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="gluten-free">Gluten-Free</option>
                                    <option value="dairy-free">Dairy-Free</option>
                                    <option value="keto">Keto</option>
                                    <option value="paleo">Paleo</option>
                                    <option value="low-carb">Low-Carb</option>
                                </select>
                            </div>

                            <div className="col-lg-2 col-md-6">
                                <label htmlFor="cooking-time-filter" className="form-label text-secondary small fw-semibold">
                                    Max Time
                                </label>
                                <select
                                    id="cooking-time-filter"
                                    value={filters.maxCookingTime}
                                    onChange={(e) => handleFilterChange('maxCookingTime', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">Any Time</option>
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="60">1 hour</option>
                                    <option value="120">2 hours</option>
                                    <option value="180">3+ hours</option>
                                </select>
                            </div>

                            <div className="col-lg-2 col-md-6">
                                <label htmlFor="likes-filter" className="form-label text-secondary small fw-semibold">
                                    Min Likes
                                </label>
                                <input
                                    type="number"
                                    id="likes-filter"
                                    placeholder="0"
                                    value={filters.minLikes}
                                    onChange={(e) => handleFilterChange('minLikes', e.target.value)}
                                    className="form-control"
                                    min="0"
                                />
                            </div>

                            <div className="col-lg-2 col-md-12">
                                <label className="form-label text-secondary small fw-semibold d-block">
                                    Actions
                                </label>
                                <button 
                                    onClick={clearFilters}
                                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                                    type="button"
                                    title="Clear All Filters"
                                >
                                    <X size={16} className="me-2" />
                                    <span className="d-none d-md-inline">Clear</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="d-flex justify-content-center mt-4 pt-4 border-top">
                        <div className="btn-group shadow-sm" role="group" aria-label="View toggle">
                            <button
                                className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center`}
                                onClick={() => setView('grid')}
                                title="Grid View"
                            >
                                <Grid3X3 size={18} className="me-2" />
                                <span className="d-none d-sm-inline">Grid</span>
                            </button>
                            <button
                                className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center`}
                                onClick={() => setView('list')}
                                title="List View"
                            >
                                <List size={18} className="me-2" />
                                <span className="d-none d-sm-inline">List</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="my-4">
                        <div className="alert alert-danger d-flex align-items-center justify-content-between shadow-sm border-0" role="alert">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-exclamation-triangle me-3 fs-5"></i>
                                <div>
                                    <strong>Error loading recipes</strong>
                                    <div className="small text-danger-emphasis">{error}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => fetchRecipes({ offset: 0 })}
                                className="btn btn-outline-danger btn-sm"
                            >
                                <i className="fas fa-redo me-1"></i>
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Recipes Grid/List */}
                {recipes.length > 0 ? (
                    <div className="mb-5">
                        <div className={view === 'grid' ? 'row g-4' : 'd-flex flex-column gap-3'}>
                            {recipes.map((recipe) => (
                                <div key={recipe.recipe_id} className={view === 'grid' ? 'col-xl-4 col-lg-6 col-md-6' : ''}>
                                    <RecipeCard recipe={recipe} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : !loading && (
                    <div className="my-5">
                        <div className="text-center py-5">
                            <div className="mb-4">
                                <Search size={64} className="text-muted opacity-50" />
                            </div>
                            <h3 className="text-secondary mb-3">No recipes found</h3>
                            <p className="text-muted mb-4 lead">
                                We couldn't find any recipes matching your criteria.<br />
                                <small>Try adjusting your search terms or filters</small>
                            </p>
                            {(searchTerm || Object.values(filters).some(f => f)) && (
                                <button 
                                    onClick={clearFilters} 
                                    className="btn btn-outline-primary d-flex align-items-center mx-auto"
                                >
                                    <RotateCcw size={16} className="me-2" />
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Load More Button */}
                {pagination.hasMore && (
                    <div className="text-center my-5">
                        <button 
                            onClick={loadMore}
                            disabled={loading}
                            className="btn btn-primary btn-lg px-5 py-3 shadow-sm d-flex align-items-center mx-auto"
                            style={{ 
                                borderRadius: '50px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    Loading more recipes...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus me-2"></i>
                                    Load More Recipes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};