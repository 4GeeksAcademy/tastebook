import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './pagesCSS/AllRecipes.css';

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
        <div className={`recipe-card ${view}`}>
            <Link to={`/recipe/${recipe.recipe_id}`} className="recipe-link">
                <div className="recipe-image-container">
                    {recipe.primary_image ? (
                        <img 
                            src={recipe.primary_image.url} 
                            alt={recipe.title}
                            className="recipe-image"
                            loading="lazy"
                        />
                    ) : (
                        <div className="recipe-image-placeholder">
                            <i className="fas fa-utensils"></i>
                        </div>
                    )}
                </div>
                <div className="recipe-content">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    {recipe.description && (
                        <p className="recipe-description">
                            {recipe.description.length > 100 
                                ? `${recipe.description.substring(0, 100)}...` 
                                : recipe.description
                            }
                        </p>
                    )}
                    <div className="recipe-meta">
                        <div className="recipe-author">
                            {recipe.author?.cloudinary_url ? (
                                <img 
                                    src={recipe.author.cloudinary_url} 
                                    alt={recipe.author.username}
                                    className="author-avatar"
                                />
                            ) : (
                                <div className="author-avatar-placeholder">
                                    <i className="fas fa-user"></i>
                                </div>
                            )}
                            <span className="author-name">
                                {recipe.author?.full_name || recipe.author?.username || 'Unknown'}
                            </span>
                        </div>
                        <div className="recipe-date">
                            {new Date(recipe.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );

    if (loading && recipes.length === 0) {
        return (
            <div className="all-recipes-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading delicious recipes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="all-recipes-container">
            <div className="all-recipes-header">
                <h1 className="page-title">All Recipes</h1>
                <p className="page-subtitle">
                    Discover amazing recipes from our community of chefs
                    {pagination.total > 0 && (
                        <span className="recipe-count"> • {pagination.total} recipes</span>
                    )}
                </p>
            </div>

            {/* Search and Filters */}
            <div className="search-filter-section">
                <div className="search-container">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-group">
                            <i className="fas fa-search search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search recipes by title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="search-button">
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                {/* Future-proof Filter Controls */}
                <div className="filter-section">
                    <div className="filter-controls">
                        <div className="filter-group">
                            <label htmlFor="category-filter">Category:</label>
                            <select
                                id="category-filter"
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="filter-select"
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

                        <div className="filter-group">
                            <label htmlFor="dietary-filter">Dietary:</label>
                            <select
                                id="dietary-filter"
                                value={filters.dietary}
                                onChange={(e) => handleFilterChange('dietary', e.target.value)}
                                className="filter-select"
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

                        <div className="filter-group">
                            <label htmlFor="cooking-time-filter">Max Cooking Time:</label>
                            <select
                                id="cooking-time-filter"
                                value={filters.maxCookingTime}
                                onChange={(e) => handleFilterChange('maxCookingTime', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Any Time</option>
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="120">2 hours</option>
                                <option value="180">3+ hours</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="likes-filter">Min Likes:</label>
                            <input
                                type="number"
                                id="likes-filter"
                                placeholder="0"
                                value={filters.minLikes}
                                onChange={(e) => handleFilterChange('minLikes', e.target.value)}
                                className="filter-input"
                                min="0"
                            />
                        </div>

                        <div className="filter-actions">
                            <button 
                                onClick={clearFilters}
                                className="clear-filters-button"
                                type="button"
                            >
                                <i className="fas fa-times"></i>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="view-controls">
                    <button
                        className={`view-toggle ${view === 'grid' ? 'active' : ''}`}
                        onClick={() => setView('grid')}
                        title="Grid View"
                    >
                        <i className="fas fa-th"></i>
                    </button>
                    <button
                        className={`view-toggle ${view === 'list' ? 'active' : ''}`}
                        onClick={() => setView('list')}
                        title="List View"
                    >
                        <i className="fas fa-list"></i>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-container">
                    <div className="error-message">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>Error loading recipes: {error}</span>
                        <button 
                            onClick={() => fetchRecipes({ offset: 0 })}
                            className="retry-button"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* Recipes Grid/List */}
            {recipes.length > 0 ? (
                <div className={`recipes-container ${view}`}>
                    {recipes.map((recipe) => (
                        <RecipeCard key={recipe.recipe_id} recipe={recipe} />
                    ))}
                </div>
            ) : !loading && (
                <div className="no-recipes-container">
                    <div className="no-recipes-message">
                        <i className="fas fa-search"></i>
                        <h3>No recipes found</h3>
                        <p>Try adjusting your search criteria or filters</p>
                        {(searchTerm || Object.values(filters).some(f => f)) && (
                            <button onClick={clearFilters} className="clear-filters-button">
                                Clear All Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Load More Button */}
            {pagination.hasMore && (
                <div className="load-more-container">
                    <button 
                        onClick={loadMore}
                        disabled={loading}
                        className="load-more-button"
                    >
                        {loading ? (
                            <>
                                <div className="loading-spinner small"></div>
                                Loading...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-plus"></i>
                                Load More Recipes
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};