import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Users, ChefHat, Calendar, ArrowLeft, Camera, User, ExternalLink, Share2, Edit } from 'lucide-react';
import CommentSection from '../components/CommentSection';

export const Recipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchRecipe();
    fetchCurrentUser();
  }, [id]);

  useEffect(() => {
    // Update page title when recipe loads
    if (recipe) {
      document.title = `${recipe.title} - TasteBook Recipe`;
    }
    return () => {
      document.title = 'TasteBook';
    };
  }, [recipe]);

  const handleShare = async () => {
    const shareData = {
      title: recipe.title,
      text: recipe.description || `Check out this delicious recipe: ${recipe.title}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Recipe link copied to clipboard!');
      }
    } catch (error) {
      console.log('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Recipe link copied to clipboard!');
      } catch (clipboardError) {
        console.log('Error copying to clipboard:', clipboardError);
      }
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.current_user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate recipe ID
      if (!id || isNaN(parseInt(id))) {
        throw new Error('Invalid recipe ID');
      }

      // Ensure we have a backend URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const apiUrl = `${backendUrl}/api/recipe/${id}`;
      
      console.log('Fetching recipe from:', apiUrl); // Debug log

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Recipe data received:', data); // Debug log
        
        if (data.recipe) {
          setRecipe(data.recipe);
        } else {
          throw new Error('Recipe data is missing from response');
        }
        
        // Set primary image as selected, or first image if no primary
        if (data.recipe.images && data.recipe.images.length > 0) {
          const primaryIndex = data.recipe.images.findIndex(img => img.is_primary);
          setSelectedImageIndex(primaryIndex !== -1 ? primaryIndex : 0);
        } else {
          setSelectedImageIndex(0);
        }
      } else if (response.status === 404) {
        setError('Recipe not found');
      } else {
        setError('Failed to load recipe');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Error loading recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isRecipeOwner = () => {
    return currentUser && recipe && currentUser.user_id === recipe.author?.user_id;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const renderIngredient = (ingredient, index) => {
    const { quantity, unit, ingredient: name } = ingredient;
    return (
      <li key={index} className="ingredient-item d-flex align-items-center border-bottom">
        <div className="me-3">
          <span className="badge bg-primary rounded-pill">{index + 1}</span>
        </div>
        <div className="flex-grow-1">
          {quantity && (
            <span className="fw-bold text-primary me-2">
              {quantity} {unit && unit}
            </span>
          )}
          <span>{name}</span>
        </div>
      </li>
    );
  };

  const renderInstruction = (instruction, index) => {
    return (
      <li key={index} className="instruction-step d-flex align-items-start border-bottom">
        <div className="me-3">
          <div className="step-number">
            {index + 1}
          </div>
        </div>
        <div className="flex-grow-1">
          <p className="mb-0">{instruction}</p>
        </div>
      </li>
    );
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Oops!</h4>
            <p>{error}</p>
            <hr />
            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
              <button 
                className="btn btn-outline-primary"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={16} className="me-1" />
                Go Home
              </button>
              <button 
                className="btn btn-primary"
                onClick={fetchRecipe}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  // Helper function to get the image to display
  const getDisplayImage = () => {
    if (!recipe?.images || recipe.images.length === 0) {
      return null;
    }
    
    // Try to get the selected image first
    if (selectedImageIndex >= 0 && selectedImageIndex < recipe.images.length) {
      return recipe.images[selectedImageIndex];
    }
    
    // Fallback to primary image
    const primaryImage = recipe.images.find(img => img.is_primary);
    if (primaryImage) {
      return primaryImage;
    }
    
    // Fallback to first image
    return recipe.images[0];
  };

  const displayImage = getDisplayImage();

  return (
    <div className="container py-4">
      {/* Header with back button */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="d-flex gap-2">
            <Link to="/all-recipes" className="btn btn-outline-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to All Recipes
            </Link>
            {isRecipeOwner() ? (
              <Link to={`/recipe/${id}/modify`} className="btn btn-warning">
                <Edit size={16} className="me-2" />
                Modify Recipe
              </Link>
            ) : (
              <Link to="/" className="btn btn-outline-secondary">
                Home
              </Link>
            )}
          </div>
        </div>
        <div className="col-md-6 d-flex justify-content-md-end mt-2 mt-md-0">
          <button 
            onClick={handleShare}
            className="btn btn-outline-secondary"
            title="Share this recipe"
          >
            <Share2 size={16} className="me-2" />
            Share Recipe
          </button>
        </div>
      </div>

      <div className="row">
        {/* Main Content */}
        <div className="col-lg-8">
          {/* Recipe Title and Info */}
          <div className="mb-4">
            <h1 className="display-5 fw-bold mb-3">{recipe.title}</h1>
            
            {/* Recipe Meta Information */}
            <div className="d-flex flex-wrap gap-3 mb-3">
              {recipe.created_at && (
                <div className="d-flex align-items-center text-muted">
                  <Calendar size={16} className="me-1" />
                  <small>Created {formatDate(recipe.created_at)}</small>
                </div>
              )}
              
              <div className="d-flex align-items-center text-muted">
                <ChefHat size={16} className="me-1" />
                <small>{recipe.ingredients ? recipe.ingredients.length : 0} ingredients</small>
              </div>
              
              <div className="d-flex align-items-center text-muted">
                <Clock size={16} className="me-1" />
                <small>{recipe.instructions ? recipe.instructions.length : 0} steps</small>
              </div>
            </div>

            {/* Author Information */}
            {recipe.author && (
              <div className="author-card card border-0 p-3 mb-4">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    {recipe.author.cloudinary_url ? (
                      <img 
                        src={recipe.author.cloudinary_url} 
                        alt={recipe.author.full_name}
                        className="rounded-circle"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                        style={{ width: '50px', height: '50px' }}
                      >
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h6 className="mb-0">{recipe.author.full_name}</h6>
                    <small className="text-muted">@{recipe.author.username}</small>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {recipe.description ? (
              <div className="mb-4">
                <p className="lead">{recipe.description}</p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-muted fst-italic">No description provided for this recipe.</p>
              </div>
            )}
          </div>

          {/* Recipe Images */}
          {recipe.images && recipe.images.length > 0 ? (
            <div className="mb-4">
              <div className="recipe-image-container card">
                <div className="card-body p-0">
                  {/* Main Image */}
                  <div className="position-relative">
                    {displayImage && displayImage.url ? (
                      <img
                        src={displayImage.url}
                        alt={recipe.title}
                        className="img-fluid w-100"
                        style={{ height: '400px', objectFit: 'cover' }}
                        onError={(e) => {
                          console.error('Main image failed to load:', e.target.src);
                          // Replace with placeholder
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {/* Error fallback for main image */}
                    <div className="d-none align-items-center justify-content-center bg-light" style={{ height: '400px' }}>
                      <div className="text-center">
                        <Camera size={48} className="text-muted mb-2" />
                        <p className="text-muted">Image failed to load</p>
                      </div>
                    </div>
                    {(!displayImage || !displayImage.url) && (
                      <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '400px' }}>
                        <div className="text-center">
                          <Camera size={48} className="text-muted mb-2" />
                          <p className="text-muted">Image not available</p>
                        </div>
                      </div>
                    )}
                    {recipe.images.length > 1 && (
                      <div className="position-absolute bottom-0 end-0 m-3">
                        <div className="bg-dark bg-opacity-75 text-white px-2 py-1 rounded">
                          <Camera size={16} className="me-1" />
                          {selectedImageIndex + 1} / {recipe.images.length}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Image Thumbnails */}
                  {recipe.images.length > 1 && (
                    <div className="p-3">
                      <div className="row g-2">
                        {recipe.images.map((image, index) => (
                          <div key={image.id} className="col-auto">
                            <button
                              className={`recipe-thumbnail btn p-0 border-0 ${index === selectedImageIndex ? 'active opacity-100' : 'opacity-75'}`}
                              onClick={() => setSelectedImageIndex(index)}
                              style={{ width: '60px', height: '60px' }}
                            >
                              <img
                                src={image.url}
                                alt={`${recipe.title} - image ${index + 1}`}
                                className="img-thumbnail w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  console.error('Thumbnail failed to load:', e.target.src);
                                  e.target.style.opacity = '0.5';
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1nPC90ZXh0Pjwvc3ZnPg==';
                                }}
                              />
                              {image.is_primary && (
                                <span 
                                  className="position-absolute top-0 start-0 badge bg-warning"
                                  style={{ fontSize: '0.6rem' }}
                                >
                                  ★
                                </span>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder for recipes without images */
            <div className="mb-4">
              <div className="card bg-light text-center py-5">
                <div className="card-body">
                  <Camera size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No images available</h5>
                  <p className="text-muted mb-0">This recipe doesn't have any images yet.</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-4">
            <h3 className="h4 mb-3 d-flex align-items-center">
              <ChefHat className="me-2 text-primary" size={24} />
              Instructions
            </h3>
            <div className="card">
              <div className="card-body">
                {recipe.instructions && recipe.instructions.length > 0 ? (
                  <ol className="list-unstyled mb-0">
                    {recipe.instructions.map((instruction, index) => 
                      renderInstruction(instruction, index)
                    )}
                  </ol>
                ) : (
                  <div className="text-center py-4">
                    <ChefHat size={48} className="text-muted mb-3" />
                    <h5 className="text-muted">No instructions available</h5>
                    <p className="text-muted mb-0">This recipe doesn't have cooking instructions yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Ingredients */}
          <div className="card sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Users className="me-2" size={20} />
                Ingredients
              </h5>
            </div>
            <div className="card-body">
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {recipe.ingredients.map((ingredient, index) => 
                    renderIngredient(ingredient, index)
                  )}
                </ul>
              ) : (
                <div className="text-center py-3">
                  <Users size={32} className="text-muted mb-2" />
                  <p className="text-muted mb-0">No ingredients listed for this recipe.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="border-top pt-4">
            <CommentSection
              recipeId={parseInt(id)}
              currentUser={currentUser}
              isRecipeOwner={isRecipeOwner()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
