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
        <div className={`card recipe-card h-100 ${view === 'list' ? 'd-flex flex-row' : ''}`}>
            <div className={`${view === 'list' ? 'col-md-4 p-0' : ''}`}>
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
                            <div className="recipe-image-placeholder w-100 h-100 d-flex align-items-center justify-content-center">
                                <Utensils size={48} className="text-muted" />
                            </div>
                        )}
                    </div>
                </Link>
            </div>
            <div className={`card-body d-flex flex-column ${view === 'list' ? 'col-md-8' : ''}`}>
                <Link to={`/recipe/${recipe.recipe_id}`} className="text-decoration-none text-reset">
                    <h5 className="card-title recipe-card-title mb-2 lh-sm" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                    }}>
                        {recipe.title}
                    </h5>
                    {recipe.description && (
                        <p className="card-text recipe-card-text small mb-3" style={{ 
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
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                            {recipe.author?.cloudinary_url ? (
                                <img 
                                    src={recipe.author.cloudinary_url} 
                                    alt={recipe.author.username}
                                    className="rounded-circle me-2 border"
                                    style={{ width: '35px', height: '35px', objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2 border" style={{ width: '35px', height: '35px' }}>
                                    <User size={16} className="text-muted" />
                                </div>
                            )}
                            <small className="recipe-author-name">
                                {recipe.author?.full_name || recipe.author?.username || 'Unknown'}
                            </small>
                        </div>
                        <small className="recipe-meta-text">
                            {new Date(recipe.created_at).toLocaleDateString()}
                        </small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                        <LikeIcon 
                            recipeId={recipe.recipe_id}
                            initialLikeCount={recipe.like_count || 0}
                            initialIsLiked={recipe.is_liked_by_user || false}
                            size={16}
                        />
                        <small className="text-muted">
                            {recipe.ingredients?.length || 0} ingredients
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading && recipes.length === 0) {
        return (
            <div className="recipe-container py-4">
                <div className="container">
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                        <div className="spinner-border recipe-loading-spinner mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Loading delicious recipes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="recipe-container py-4">
            <div className="container">
                {/* Header Section */}
                <div className="text-center mb-5">
                    <div className="mx-auto" style={{ maxWidth: '800px' }}>
                        <h1 className="display-4 fw-bold recipe-title-gradient mb-3">All Recipes</h1>
                        <p className="lead text-muted">
                            Discover amazing recipes from our community of chefs
                            {pagination.total > 0 && (
                                <span className="fw-semibold" style={{ color: 'var(--recipe-primary)' }}> • {pagination.total} recipes</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="recipe-header-section p-4 mb-4">
                    <div className="mb-4">
                        <form onSubmit={handleSearch} className="mx-auto" style={{ maxWidth: '600px' }}>
                            <div className="recipe-search-container p-2 d-flex align-items-center">
                                <Search size={20} className="text-muted ms-3" />
                                <input
                                    type="text"
                                    placeholder="Search recipes by title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="recipe-search-input form-control border-0 px-3 py-2 fs-6"
                                />
                                <button type="submit" className="btn recipe-btn-primary px-4 py-2 rounded-pill fw-semibold">
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Filter Controls */}
                    <div className="border-top pt-4">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label htmlFor="category-filter" className="form-label fw-semibold text-secondary small">Category:</label>
                                <select
                                    id="category-filter"
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="form-select recipe-filter-select"
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

                            <div className="col-md-3">
                                <label htmlFor="dietary-filter" className="form-label fw-semibold text-secondary small">Dietary:</label>
                                <select
                                    id="dietary-filter"
                                    value={filters.dietary}
                                    onChange={(e) => handleFilterChange('dietary', e.target.value)}
                                    className="form-select recipe-filter-select"
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

                            <div className="col-md-3">
                                <label htmlFor="cooking-time-filter" className="form-label fw-semibold text-secondary small">Max Cooking Time:</label>
                                <select
                                    id="cooking-time-filter"
                                    value={filters.maxCookingTime}
                                    onChange={(e) => handleFilterChange('maxCookingTime', e.target.value)}
                                    className="form-select recipe-filter-select"
                                >
                                    <option value="">Any Time</option>
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="120">2 hours</option>
                                    <option value="180">3+ hours</option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label htmlFor="likes-filter" className="form-label fw-semibold text-secondary small">Min Likes:</label>
                                <input
                                    type="number"
                                    id="likes-filter"
                                    placeholder="0"
                                    value={filters.minLikes}
                                    onChange={(e) => handleFilterChange('minLikes', e.target.value)}
                                    className="form-control recipe-filter-input"
                                    min="0"
                                />
                            </div>

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
                    </div>

                    {/* View Toggle */}
                    <div className="d-flex justify-content-center gap-2 mt-4 pt-4 border-top">
                        <button
                            className={`btn recipe-view-toggle ${view === 'grid' ? 'active' : ''}`}
                            onClick={() => setView('grid')}
                            title="Grid View"
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button
                            className={`btn recipe-view-toggle ${view === 'list' ? 'active' : ''}`}
                            onClick={() => setView('list')}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="container my-4">
                        <div className="alert recipe-error-container d-flex align-items-center justify-content-between" role="alert">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                <span>Error loading recipes: {error}</span>
                            </div>
                            <button 
                                onClick={() => fetchRecipes({ offset: 0 })}
                                className="btn btn-sm btn-outline-danger"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Recipes Grid/List */}
                {recipes.length > 0 ? (
                    <div className="container my-4">
                        <div className={view === 'grid' ? 'row g-4' : 'd-flex flex-column gap-3'}>
                            {recipes.map((recipe) => (
                                <div key={recipe.recipe_id} className={view === 'grid' ? 'col-lg-4 col-md-6' : ''}>
                                    <RecipeCard recipe={recipe} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : !loading && (
                    <div className="container my-5">
                        <div className="text-center py-5">
                            <Search size={64} className="text-muted mb-3" />
                            <h3 className="text-secondary">No recipes found</h3>
                            <p className="text-muted mb-4">Try adjusting your search criteria or filters</p>
                            {(searchTerm || Object.values(filters).some(f => f)) && (
                                <button onClick={clearFilters} className="btn btn-outline-secondary d-flex align-items-center mx-auto">
                                    <RotateCcw size={16} className="me-2" />
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Load More Button */}
                {pagination.hasMore && (
                    <div className="container text-center my-5">
                        <button 
                            onClick={loadMore}
                            disabled={loading}
                            className="btn recipe-btn-primary px-4 py-2 rounded-pill fw-semibold d-flex align-items-center mx-auto"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    Loading...
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