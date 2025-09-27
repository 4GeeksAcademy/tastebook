import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Minus, Save, Edit, X, ArrowLeft } from 'lucide-react';
import MultiImageUpload from '../components/MultiImageUpload.jsx';

export const ModifyRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
    instructions: ['']
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [countdown, setCountdown] = useState(null);
  const [countdownInterval, setCountdownInterval] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Show alert without auto-dismiss
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
  };

  // Start countdown timer
  const startCountdown = (seconds, callback) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountdownInterval(null);
          callback();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownInterval(interval);
  };

  // Clear countdown
  const clearCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    setCountdown(null);
  };

  // Fetch current user and recipe data
  useEffect(() => {
    const loadData = async () => {
      await fetchCurrentUser();
      await fetchRecipe();
    };
    loadData();
  }, [id]);

  // Authorization check when both user and recipe data are available
  useEffect(() => {
    if (currentUser && formData.title && !loading) {
      // Recipe is loaded, check authorization
      const checkAuthorization = async () => {
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const response = await fetch(`${backendUrl}/api/recipe/${id}`);
          
          if (response.ok) {
            const data = await response.json();
            const recipe = data.recipe;
            
            if (recipe.author && currentUser.user_id !== recipe.author.user_id) {
              showAlert('You are not authorized to modify this recipe', 'danger');
              setTimeout(() => navigate(`/recipe/${id}`), 2000);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking authorization:', error);
        }
      };
      
      checkAuthorization();
    }
  }, [currentUser, formData.title, loading, id, navigate]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

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
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/recipe/${id}`);
      
      if (!response.ok) {
        throw new Error('Recipe not found');
      }

      const data = await response.json();
      const recipe = data.recipe;

      // Check if user is authorized to modify this recipe
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }



      // Set form data
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        ingredients: recipe.ingredients && recipe.ingredients.length > 0 
          ? recipe.ingredients 
          : [{ ingredient: '', quantity: '', unit: '' }],
        instructions: recipe.instructions && recipe.instructions.length > 0 
          ? recipe.instructions 
          : ['']
      });

      // Set images
      if (recipe.images && recipe.images.length > 0) {
        const existingImages = recipe.images.map(img => ({
          id: img.id,
          url: img.url,
          image_id: img.image_id,
          is_primary: img.is_primary,
          display_order: img.display_order,
          existing: true // Mark as existing to differentiate from new uploads
        })).sort((a, b) => a.display_order - b.display_order);
        
        setImages(existingImages);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      showAlert('Failed to load recipe', 'danger');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient: '', quantity: '', unit: '' }]
    }));
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        ingredients: newIngredients
      }));
    }
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({
      ...prev,
      instructions: newInstructions
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index) => {
    if (formData.instructions.length > 1) {
      const newInstructions = formData.instructions.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        instructions: newInstructions
      }));
    }
  };

  // Image upload handler - For new images
  const handleImageUpload = async (file) => {
    const fileImage = {
      id: `file-${Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
      is_primary: false,
      existing: false
    };
    
    setImages(prev => [...prev, fileImage]);
  };

  // Image delete handler
  const handleImageDelete = async (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Set primary image handler
  const handleSetPrimary = (imageId) => {
    setImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));
  };

  // Image reorder handler
  const handleImageReorder = (fromIndex, toIndex) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any existing alerts and countdown
    setAlert({ show: false, message: '', type: '' });
    clearCountdown();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        showAlert('Please enter a recipe title', 'danger');
        setIsSubmitting(false);
        return;
      }

      if (formData.ingredients.some(ing => !ing.ingredient.trim())) {
        showAlert('Please fill in all ingredient names', 'danger');
        setIsSubmitting(false);
        return;
      }

      if (formData.instructions.some(inst => !inst.trim())) {
        showAlert('Please fill in all instruction steps', 'danger');
        setIsSubmitting(false);
        return;
      }

      // Validate that if there are images, at least one is set as primary
      if (images.length > 0 && !images.some(img => img.is_primary)) {
        showAlert('Please select a primary image by clicking the star on one of your images', 'danger');
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      // Update the recipe
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/recipe/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        showAlert(errorData.msg || 'Failed to update recipe', 'danger');
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      console.log('✅ Recipe updated successfully');
      
      // Handle image updates (if needed)
      const newImages = images.filter(img => !img.existing);
      if (newImages.length > 0) {
        showAlert(`Recipe updated! Uploading ${newImages.length} new image${newImages.length > 1 ? 's' : ''}...`, 'info');
        
        // Upload new images
        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i];
          const imageFormData = new FormData();
          imageFormData.append('image', img.file);
          imageFormData.append('is_primary', img.is_primary ? 'true' : 'false');
          
          const uploadResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/recipe/${id}/upload-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: imageFormData
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            console.error('❌ Image upload failed:', errorData);
            showAlert(`❌ Failed to upload image ${i + 1}: ${errorData.error || 'Unknown error'}`, 'danger');
            setIsSubmitting(false);
            return;
          }
        }
        
        showAlert(`✅ Recipe updated successfully with ${newImages.length} new image${newImages.length > 1 ? 's' : ''}!`, 'success');
      } else {
        showAlert('✅ Recipe updated successfully!', 'success');
      }

      // Start countdown to navigate back
      startCountdown(15, () => navigate(`/recipe/${id}`));
      
    } catch (error) {
      console.error('Submit error:', error);
      showAlert(`❌ Error updating recipe: ${error.message}`, 'danger');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">
                  <Edit className="me-2" size={30} />
                  Modify Recipe
                </h2>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => navigate(`/recipe/${id}`)}
                >
                  <ArrowLeft size={16} className="me-1" />
                  Back to Recipe
                </button>
              </div>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                
                {/* Recipe Images Section */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Recipe Images</label>
                  <MultiImageUpload
                    images={images}
                    onImageUpload={handleImageUpload}
                    onImageDelete={handleImageDelete}
                    onSetPrimary={handleSetPrimary}
                    onReorder={handleImageReorder}
                    loading={false}
                    maxImages={8}
                    className="mb-3"
                  />
                </div>

                {/* Recipe Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label fw-bold">Recipe Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a delicious recipe title..."
                    required
                  />
                </div>

                {/* Recipe Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="form-label fw-bold">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe your recipe..."
                  />
                </div>

                {/* Ingredients Section */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label fw-bold mb-0">Ingredients *</label>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <Plus size={16} className="me-1" />
                      Add Ingredient
                    </button>
                  </div>

                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="row g-2 mb-2 align-items-end">
                      <div className="col-md-5">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ingredient name"
                          value={ingredient.ingredient}
                          onChange={(e) => handleIngredientChange(index, 'ingredient', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Amount"
                          value={ingredient.quantity}
                          onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select"
                          value={ingredient.unit}
                          onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        >
                          <option value="">Unit</option>
                          <option value="cup">Cup</option>
                          <option value="cups">Cups</option>
                          <option value="tsp">Teaspoon</option>
                          <option value="tbsp">Tablespoon</option>
                          <option value="oz">Ounce</option>
                          <option value="lb">Pound</option>
                          <option value="g">Gram</option>
                          <option value="kg">Kilogram</option>
                          <option value="ml">Milliliter</option>
                          <option value="l">Liter</option>
                          <option value="piece">Piece</option>
                          <option value="pieces">Pieces</option>
                          <option value="clove">Clove</option>
                          <option value="cloves">Cloves</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          disabled={formData.ingredients.length === 1}
                          className="btn btn-outline-danger w-100"
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instructions Section */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label fw-bold mb-0">Instructions *</label>
                    <button
                      type="button"
                      onClick={addInstruction}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <Plus size={16} className="me-1" />
                      Add Step
                    </button>
                  </div>

                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="row g-2 mb-2 align-items-start">
                      <div className="col-1">
                        <div className="badge bg-primary rounded-pill mt-2">{index + 1}</div>
                      </div>
                      <div className="col-md-9">
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder={`Step ${index + 1}...`}
                          value={instruction}
                          onChange={(e) => handleInstructionChange(index, e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          onClick={() => removeInstruction(index)}
                          disabled={formData.instructions.length === 1}
                          className="btn btn-outline-danger w-100"
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Alert near submit button */}
                {alert.show && (
                  <div className={`alert alert-${alert.type} alert-dismissible fade show mb-3`} role="alert">
                    {alert.message}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setAlert({ show: false, message: '', type: '' });
                        clearCountdown();
                      }}
                    ></button>
                  </div>
                )}

                {/* Countdown display */}
                {countdown !== null && (
                  <div className="alert alert-info mb-3 d-flex align-items-center justify-content-between">
                    <span>Redirecting to your recipe in {countdown} seconds...</span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        clearCountdown();
                        navigate(`/recipe/${id}`);
                      }}
                    >
                      Go Now
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    onClick={() => {
                      clearCountdown();
                      navigate(`/recipe/${id}`);
                    }}
                    className="btn btn-outline-secondary me-md-2"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={isSubmitting || countdown !== null}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Updating Recipe...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-1" />
                        Update Recipe
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};