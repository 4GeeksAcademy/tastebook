import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Save, BadgePlus, X } from 'lucide-react';
import MultiImageUpload from '../components/MultiImageUpload.jsx';

export const CreateRecipe = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
    instructions: ['']
  });
  
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [countdown, setCountdown] = useState(null);
  const [countdownInterval, setCountdownInterval] = useState(null);
  const [createdRecipeId, setCreatedRecipeId] = useState(null);

  const navigate = useNavigate();

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

  // Image upload handler - Just store files for later upload
  const handleImageUpload = async (file) => {
    // Add image file with preview for display
    const fileImage = {
      id: `file-${Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
      is_primary: false
    };
    
    setImages(prev => [...prev, fileImage]);
    // Remove alert - no need to notify user for every image added
  };

  // Image delete handler
  const handleImageDelete = async (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    // Remove alert - no need to notify user for every image removed
  };

  // Set primary image handler
  const handleSetPrimary = (imageId) => {
    setImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));
    // Remove alert - no need to notify user for primary image change
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
      
      // Create the recipe first
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        showAlert(errorData.msg || 'Failed to create recipe', 'danger');
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      const recipeId = data.recipe.recipe_id;
      setCreatedRecipeId(recipeId);
      
      console.log('✅ Recipe created successfully:', { recipeId, authorId: data.recipe.author_id });
      
      // If we have images, upload them - STOP EVERYTHING if any image fails
      if (images.length > 0) {
        showAlert(`Recipe created! Uploading ${images.length} image${images.length > 1 ? 's' : ''}...`, 'info');
        
        // Add a small delay to ensure database transaction is fully committed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Upload images one by one to better handle errors
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const imageFormData = new FormData();
          imageFormData.append('image', img.file);
          imageFormData.append('is_primary', img.is_primary ? 'true' : 'false');
          
          console.log(`📤 Uploading image ${i + 1}/${images.length} for recipe ${recipeId}...`);
          
          // Retry logic for image upload (handles timing issues)
          let uploadResponse;
          let uploadSuccess = false;
          const maxRetries = 3;
          
          for (let retry = 0; retry < maxRetries; retry++) {
            if (retry > 0) {
              console.log(`🔄 Retrying image upload ${i + 1}, attempt ${retry + 1}/${maxRetries}...`);
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 500 * retry));
            }
            
            uploadResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/recipe/${recipeId}/upload-image`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: imageFormData
            });
            
            if (uploadResponse.ok) {
              uploadSuccess = true;
              break;
            }
            
            // If it's the last retry, we'll handle the error below
            if (retry === maxRetries - 1) {
              break;
            }
          }
          
          if (!uploadSuccess) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            console.error('❌ Image upload failed after retries:', {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              errorData,
              recipeId,
              imageIndex: i + 1
            });
            const errorMessage = `Failed to upload image ${i + 1} after ${maxRetries} attempts: ${errorData.error || `HTTP ${uploadResponse.status} - ${uploadResponse.statusText}`}`;
            showAlert(`❌ ${errorMessage}. Recipe creation stopped.`, 'danger');
            setIsSubmitting(false);
            return; // STOP - do not continue if any image fails
          }
          
          console.log(`✅ Image ${i + 1} uploaded successfully`);
        }
        
        // All images uploaded successfully
        showAlert(`✅ Recipe created successfully with ${images.length} image${images.length > 1 ? 's' : ''}!`, 'success');
      } else {
        // No images to upload
        showAlert('✅ Recipe created successfully!', 'success');
      }

      // Start countdown to navigate
      startCountdown(20, () => navigate(`/recipe/${recipeId}`));
      
    } catch (error) {
      console.error('Submit error:', error);
      showAlert(`❌ Error creating recipe: ${error.message}`, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">


            <div className="card-header bg-primary">
              <h2 className="mb-0">
                <BadgePlus className="me-2" size={30} />
                Create New Recipe
              </h2>
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
                    <span>Redirecting to your new recipe in {countdown} seconds...</span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        clearCountdown();
                        if (createdRecipeId) {
                          navigate(`/recipe/${createdRecipeId}`);
                        }
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
                      navigate('/');
                    }}
                    className="btn btn-outline-secondary me-md-2"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || countdown !== null}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Creating Recipe...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-1" />
                        Create Recipe
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
