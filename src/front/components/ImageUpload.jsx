import React, { useState, useRef } from 'react';
import { Upload, X, Camera, Trash2, User } from 'lucide-react';

const ImageUpload = ({ 
  currentImageUrl, 
  onImageUpload, 
  onImageDelete, 
  loading, 
  className = "",
  size = "large" // "small", "medium", "large"
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24", 
    large: "w-32 h-32"
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    if (onImageUpload) {
      onImageUpload(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your profile image?')) {
      clearPreview();
      if (onImageDelete) {
        onImageDelete();
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const displayImage = preview || currentImageUrl;

  return (
    <div className={`image-upload-container d-flex flex-column align-items-center ${className}`}>
      {/* Image Display Area */}
      <div className={`position-relative ${sizeClasses[size]} mb-3`}>
        {displayImage ? (
          <div className="position-relative w-100 h-100">
            <img
              src={displayImage}
              alt="Profile"
              className="profile-image-preview w-100 h-100 rounded-circle border border-2 border-light"
            />
            {/* Delete Button Overlay */}
            {(currentImageUrl || preview) && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="image-delete-btn btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-0"
                style={{ transform: 'translate(25%, -25%)' }}
                title="Delete image"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="profile-image-placeholder w-100 h-100 rounded-circle border border-2 border-dashed d-flex align-items-center justify-content-center">
            <User size={size === 'large' ? 48 : size === 'medium' ? 32 : 24} className="text-muted" />
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div className="text-center w-100" style={{ maxWidth: '400px' }}>
        {/* Drag & Drop Area */}
        <div
          className={`image-upload-dropzone border border-2 border-dashed rounded p-4 text-center ${
            dragActive ? 'active' : ''
          } ${loading ? 'image-loading' : ''}`}
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
                <small className="text-muted">Uploading image...</small>
              </>
            ) : (
              <>
                <Upload size={24} className="text-muted mb-2" />
                <small className="text-muted mb-1">
                  <strong>Click to upload</strong> or drag and drop
                </small>
                <small className="text-muted">
                  PNG, JPG, GIF up to 5MB
                </small>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 d-flex gap-2 justify-content-center flex-wrap">
          <button
            type="button"
            onClick={openFileDialog}
            disabled={loading}
            className="btn btn-outline-primary btn-sm"
          >
            <Camera size={16} className="me-1" />
            {currentImageUrl ? 'Change Image' : 'Choose Image'}
          </button>
          
          {preview && (
            <button
              type="button"
              onClick={clearPreview}
              disabled={loading}
              className="btn btn-outline-secondary btn-sm"
            >
              <X size={16} className="me-1" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
