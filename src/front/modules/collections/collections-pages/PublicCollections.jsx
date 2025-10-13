import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Grid, List as ListIcon, ChevronDown, User, BookOpen } from 'lucide-react';
import CollectionCard from '../collections-subcomponents/CollectionCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const PublicCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('collection'); // 'collection' or 'username'
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 12,
    offset: 0,
    hasMore: false
  });

  // Search suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs for search functionality
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Fetch public collections from API
  const fetchCollections = async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        limit: pagination.limit,
        offset: params.offset || pagination.offset,
        sort_by: sortBy,
        order: order,
        ...(searchTerm && { 
          [searchType === 'collection' ? 'search' : 'username']: searchTerm 
        })
      });

      const response = await fetch(`${BACKEND_URL}/api/collections/public?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (params.offset === 0) {
        setCollections(data.collections || []);
      } else {
        setCollections(prev => [...prev, ...(data.collections || [])]);
      }
      
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || data.collections?.length || 0,
        offset: data.pagination?.offset || 0,
        hasMore: data.pagination?.has_more || false
      }));
      
    } catch (err) {
      console.error('Error fetching public collections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch search suggestions
  const fetchSuggestions = async (term, type) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const queryParams = new URLSearchParams({
        limit: 5,
        [type === 'collection' ? 'search' : 'username']: term
      });

      const response = await fetch(`${BACKEND_URL}/api/collections/public?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        const collections = data.collections || [];
        
        if (type === 'collection') {
          // Extract unique collection titles
          const titles = [...new Set(
            collections
              .map(c => c.title)
              .filter(title => title.toLowerCase().includes(term.toLowerCase()))
          )].slice(0, 5);
          setSuggestions(titles);
        } else {
          // Extract unique usernames
          const usernames = [...new Set(
            collections
              .map(c => c.owner?.username)
              .filter(username => username && username.toLowerCase().includes(term.toLowerCase()))
          )].slice(0, 5);
          setSuggestions(usernames);
        }
        
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback((term, type) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(term, type);
    }, 300);
  }, []);

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 2) {
      debouncedSearch(value, searchType);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    // Trigger search immediately
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !searchInputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchCollections({ offset: 0 });
  }, [searchTerm, searchType, sortBy, order]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchCollections({ offset: 0 });
  };

  // Handle sort changes
  const handleSortChange = (newSortBy, newOrder = order) => {
    setSortBy(newSortBy);
    setOrder(newOrder);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // Load more collections
  const loadMore = () => {
    const newOffset = pagination.offset + pagination.limit;
    setPagination(prev => ({ ...prev, offset: newOffset }));
    fetchCollections({ offset: newOffset });
  };

  // Collection Card without visibility badge
  const PublicCollectionCard = ({ collection }) => {
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

  if (loading && collections.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading public collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error loading collections</h4>
            <p className="mb-0">{error}</p>
          </div>
          <button 
            className="btn btn-primary mt-3" 
            onClick={() => fetchCollections({ offset: 0 })}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="h3 mb-2">Public Collections</h1>
          <p className="text-muted">
            Discover recipe collections shared by the community
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <form onSubmit={handleSearch}>
            <div className="position-relative">
              <div className="input-group">
                {/* Search Type Dropdown */}
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center rounded-0 rounded-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ minWidth: '140px' }}
                  >
                    {searchType === 'collection' ? (
                      <>
                        <BookOpen size={16} className="me-2" />
                        Collection
                      </>
                    ) : (
                      <>
                        <User size={16} className="me-2" />
                        Username
                      </>
                    )}
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className={`dropdown-item d-flex align-items-center ${searchType === 'collection' ? 'active' : ''}`}
                        type="button"
                        onClick={() => {
                          setSearchType('collection');
                          setShowSuggestions(false);
                          setSuggestions([]);
                        }}
                      >
                        <BookOpen size={16} className="me-2" />
                        Collection Name
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item d-flex align-items-center ${searchType === 'username' ? 'active' : ''}`}
                        type="button"
                        onClick={() => {
                          setSearchType('username');
                          setShowSuggestions(false);
                          setSuggestions([]);
                        }}
                      >
                        <User size={16} className="me-2" />
                        Username
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Search Input */}
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control"
                  placeholder={`Search by ${searchType === 'collection' ? 'collection name' : 'username'}...`}
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchTerm.length >= 2 && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  autoComplete="off"
                />

                {/* Search Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  <Search size={16} />
                </button>

                {/* Clear Button */}
                {searchTerm && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={clearSearch}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (
                <div 
                  ref={suggestionsRef}
                  className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg"
                  style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}
                >
                  {loadingSuggestions ? (
                    <div className="p-3 text-center">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2 text-muted">Searching...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <>
                      <div className="px-3 py-2 border-bottom bg-light">
                        <small className="text-muted fw-semibold">
                          {searchType === 'collection' ? 'Collection Names' : 'Usernames'}
                        </small>
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`w-100 text-start border-0 bg-transparent p-3 d-flex align-items-center ${
                            index === selectedSuggestionIndex ? 'bg-primary text-white' : ''
                          }`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                          style={{ 
                            transition: 'background-color 0.15s ease-in-out',
                            ...(index !== selectedSuggestionIndex && {
                              ':hover': { backgroundColor: '#f8f9fa' }
                            })
                          }}
                          onMouseOver={(e) => {
                            if (index !== selectedSuggestionIndex) {
                              e.target.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (index !== selectedSuggestionIndex) {
                              e.target.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {searchType === 'collection' ? (
                            <BookOpen size={16} className="me-2 flex-shrink-0" />
                          ) : (
                            <User size={16} className="me-2 flex-shrink-0" />
                          )}
                          <span className="text-truncate">{suggestion}</span>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="p-3 text-center text-muted">
                      <small>No suggestions found</small>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
        
        <div className="col-md-6 mb-3">
          <div className="d-flex gap-2 justify-content-end">
            <select 
              className="form-select w-auto"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="created_at">Newest</option>
              <option value="title">Title</option>
              <option value="recipe_count">Recipe Count</option>
            </select>
            <select 
              className="form-select w-auto"
              value={order}
              onChange={(e) => handleSortChange(sortBy, e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {collections.length > 0 && (
        <div className="row mb-3">
          <div className="col-12">
            <p className="text-muted mb-0">
              Showing {collections.length} of {pagination.total} public collections
              {searchTerm && ` for "${searchTerm}" ${searchType === 'collection' ? 'in collection names' : 'by username'}`}
            </p>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {collections.length > 0 ? (
        <>
          <div className="row g-4">
            {collections.map(collection => (
              <div key={collection.collection_id} className="col-sm-6 col-lg-4 col-xl-3">
                <PublicCollectionCard collection={collection} />
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="text-center mt-5">
              <button 
                className="btn btn-outline-primary"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Loading...
                  </>
                ) : (
                  'Load More Collections'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-5">
          <Grid size={48} className="mb-3" />
          <h5 className="text-muted">No public collections found</h5>
          <p className="text-muted mb-0">
            {searchTerm 
              ? `No collections match your search for "${searchTerm}" ${searchType === 'collection' ? 'in collection names' : 'by username'}`
              : "There are no public collections available at the moment"
            }
          </p>
          {searchTerm && (
            <button 
              className="btn btn-outline-primary mt-3"
              onClick={clearSearch}
            >
              Clear search
            </button>
          )}
        </div>
      )}

    </div>
  );
};

export default PublicCollections;