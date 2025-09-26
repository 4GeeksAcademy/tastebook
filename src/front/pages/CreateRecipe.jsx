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
  const [imageUploading, setImageUploading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const navigate = useNavigate();

  // Show alert with auto-dismiss
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
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

  // Image upload handler
  const handleImageUpload = async (file) => {
    setImageUploading(true);
    
    // Add temporary image with preview
    const tempImage = {
      id: `temp-${Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      is_primary: false // No image is primary by default
    };
    
    setImages(prev => [...prev, tempImage]);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('is_primary', 'false'); // Never set as primary by default
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/recipe/temp/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the temporary image with the actual data
        setImages(prev => prev.map(img => 
          img.id === tempImage.id 
            ? { ...data.image, uploading: false }
            : img
        ));
        showAlert('Image uploaded successfully!');
      } else {
        // Remove the temporary image on error
        setImages(prev => prev.filter(img => img.id !== tempImage.id));
        showAlert('Failed to upload image', 'danger');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setImages(prev => prev.filter(img => img.id !== tempImage.id));
      showAlert('Error uploading image', 'danger');
    } finally {
      setImageUploading(false);
    }
  };

  // Image delete handler
  const handleImageDelete = async (imageId) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;

    // If it's a temporary image, just remove from state
    if (typeof imageId === 'string' && imageId.startsWith('temp-')) {
      setImages(prev => prev.filter(img => img.id !== imageId));
      return;
    }

    try {
      // For uploaded images, we'll need to store them temporarily and delete when recipe is saved
      // For now, just remove from the display
      setImages(prev => prev.filter(img => img.id !== imageId));
      showAlert('Image removed');
    } catch (error) {
      console.error('Image delete error:', error);
      showAlert('Error removing image', 'danger');
    }
  };

  // Set primary image handler
  const handleSetPrimary = (imageId) => {
    setImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));
    showAlert('Primary image updated');
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
    setIsSubmitting(true);

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
      showAlert('Please select a primary image from your uploaded images', 'danger');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        const recipeId = data.recipe.recipe_id;
        
        // If we have images that need to be associated with the recipe
        if (images.length > 0) {
          showAlert('Recipe created successfully! Processing images...', 'success');
          
          // For temp images, we'll need to re-upload them with the actual recipe ID
          // For now, let's redirect and handle images later
          setTimeout(() => {
            navigate(`/recipe/${recipeId}`);
          }, 2000);
        } else {
          showAlert('Recipe created successfully!', 'success');
          setTimeout(() => {
            navigate(`/recipe/${recipeId}`);
          }, 1500);
        }
      } else {
        const errorData = await response.json();
        showAlert(errorData.msg || 'Failed to create recipe', 'danger');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('Error creating recipe', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">


            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">
                <BadgePlus className="me-2" size={30} />
                Create New Recipe
              </h2>
            </div>


            <div className="card-body">

              {/* Alert */}
              {alert.show && (
                <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                  {alert.message}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setAlert({ show: false, message: '', type: '' })}
                  ></button>
                </div>
              )}

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
                    loading={imageUploading}
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

                {/* Submit Button */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="btn btn-outline-secondary me-md-2"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || imageUploading}
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
