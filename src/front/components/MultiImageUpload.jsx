import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, StarOff, GripVertical, Camera, Trash2, Plus } from 'lucide-react';

const MultiImageUpload = ({ 
  images = [], 
  onImagesChange, 
  onImageUpload, 
  onImageDelete, 
  onSetPrimary, 
  onReorder,
  loading = false,
  maxImages = 10,
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Handle drag events for file upload
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle file drop for upload
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
  }, []);

  // Handle file input change
  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset file input
    e.target.value = '';
  }, []);

  // Process selected files
  const handleFiles = useCallback((files) => {
    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    filesToProcess.forEach(file => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP are allowed.`);
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 5MB.`);
        return;
      }

      if (onImageUpload) {
        onImageUpload(file);
      }
    });
  }, [images.length, maxImages, onImageUpload]);

  // Handle image reordering - drag start
  const handleImageDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle image reordering - drag over
  const handleImageDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  // Handle image reordering - drop
  const handleImageDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex && onReorder) {
      onReorder(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, onReorder]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getPrimaryImage = () => images.find(img => img.is_primary);
  const hasSpace = images.length < maxImages;

  return (
    <div className={`multi-image-upload ${className}`}>
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="image-grid mb-4">
          <div className="row g-3">
            {images.map((image, index) => (
              <div key={image.id || index} className="col-6 col-md-4 col-lg-3">
                <div 
                  className={`image-card position-relative ${
                    dragOverIndex === index ? 'drag-over' : ''
                  } ${image.is_primary ? 'primary-image' : ''}`}
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, index)}
                  onDragOver={(e) => handleImageDragOver(e, index)}
                  onDrop={(e) => handleImageDrop(e, index)}
                  onDragLeave={() => setDragOverIndex(null)}
                >
                  {/* Drag Handle */}
                  <div className="drag-handle position-absolute top-0 start-0 p-1">
                    <GripVertical size={16} className="text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }} />
                  </div>

                  {/* Primary Badge */}
                  {image.is_primary && (
                    <div className="primary-badge position-absolute top-0 end-0 m-1">
                      <span className="badge bg-warning text-dark">
                        <Star size={12} className="me-1" fill="currentColor" />
                        Primary
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  <img 
                    src={image.url || image.preview} 
                    alt={`Recipe image ${index + 1}`}
                    className="w-100 h-100 object-fit-cover rounded"
                    style={{ aspectRatio: '1' }}
                  />

                  {/* Image Controls Overlay */}
                  <div className="image-controls position-absolute bottom-0 start-0 end-0 p-2 image-controls-overlay rounded-bottom">
                    <div className="d-flex justify-content-center gap-1">
                      {/* Set as Primary Button */}
                      <button
                        type="button"
                        onClick={() => onSetPrimary && onSetPrimary(image.id || index)}
                        disabled={loading}
                        className={`btn btn-sm ${image.is_primary ? 'btn-warning' : 'btn-outline-warning'}`}
                        title={image.is_primary ? 'Primary image' : 'Set as primary'}
                      >
                        {image.is_primary ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onImageDelete && onImageDelete(image.id || index)}
                        disabled={loading}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Loading Overlay */}
                  {image.uploading && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded">
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Uploading...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {hasSpace && (
        <div
          className={`upload-zone border border-2 border-dashed rounded p-4 text-center ${
            dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
          } ${loading ? 'opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
          onClick={!loading ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="d-none"
            disabled={loading}
          />
          
          <div className="d-flex flex-column align-items-center">
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                  <span className="visually-hidden">Uploading...</span>
                </div>
                <small className="text-muted">Uploading images...</small>
              </>
            ) : (
              <>
                <Upload size={32} className="text-muted mb-2" />
                <h6 className="mb-2">Add Recipe Images</h6>
                <p className="text-muted mb-2">
                  <strong>Click to upload</strong> or drag and drop images here
                </p>
                <small className="text-muted">
                  PNG, JPG, GIF up to 5MB each • {images.length}/{maxImages} images
                </small>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add More Button */}
      {images.length > 0 && hasSpace && (
        <div className="text-center mt-3">
          <button
            type="button"
            onClick={openFileDialog}
            disabled={loading}
            className="btn btn-outline-primary"
          >
            <Plus size={16} className="me-1" />
            Add More Images ({images.length}/{maxImages})
          </button>
        </div>
      )}

      {/* Instructions */}
      {images.length === 0 && (
        <div className="text-center mt-3">
          <small className="text-muted">
            Add photos to make your recipe more appealing. The first image will be set as primary.
          </small>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
