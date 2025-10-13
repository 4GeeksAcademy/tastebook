import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

/**
 * CommentForm Component
 * 
 * A reusable form component for creating new comments and replies.
 * Features:
 * - Text validation and character count
 * - Support for both main comments and replies
 * - Auto-expanding textarea
 * - Submission handling with loading states
 * - Bootstrap styling
 * 
 * @param {Object} props
 * @param {number} props.recipeId - The ID of the recipe to comment on
 * @param {number|null} props.parentCommentId - The ID of the parent comment (null for main comments)
 * @param {Function} props.onSubmit - Callback function when comment is submitted
 * @param {Function} props.onCancel - Callback function when form is cancelled (optional)
 * @param {string} props.placeholder - Placeholder text for the textarea
 * @param {string} props.buttonText - Text for the submit button
 * @param {boolean} props.isReply - Whether this is a reply form or main comment form
 */
export const CommentForm = ({
  recipeId,
  parentCommentId = null,
  onSubmit,
  onCancel,
  placeholder = "Share your thoughts about this recipe...",
  buttonText = "Post Comment",
  isReply = false
}) => {
  
  // Component state
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Constants
  const MAX_CHARS = 1000;
  const MIN_CHARS = 1;

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate content
    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_CHARS) {
      setError('Comment cannot be empty');
      return;
    }
    
    if (trimmedContent.length > MAX_CHARS) {
      setError(`Comment must not exceed ${MAX_CHARS} characters`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to comment');
        return;
      }

      // API call to create comment
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/recipe/${recipeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: trimmedContent,
          parent_comment_id: parentCommentId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Clear form
        setContent('');
        setError('');
        
        // Call parent's onSubmit callback with new comment data
        if (onSubmit) {
          onSubmit(data.comment);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    setContent('');
    setError('');
    if (onCancel) {
      onCancel();
    }
  };

  /**
   * Handle textarea content change
   */
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Clear error if user starts typing and content is valid
    if (error && newContent.trim().length >= MIN_CHARS) {
      setError('');
    }
  };

  /**
   * Auto-resize textarea based on content
   */
  const handleTextareaResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  // Calculate remaining characters
  const remainingChars = MAX_CHARS - content.length;
  const isNearLimit = remainingChars < 100;
  const isOverLimit = remainingChars < 0;

  return (
    <div className={isReply ? 'ps-3' : ''}>
      <form onSubmit={handleSubmit}>
        <div className={`card ${isReply ? 'border-light' : 'shadow-sm'}`}>
          <div className="card-body">
            
            {/* Form Header (only for reply forms) */}
            {isReply && (
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 d-flex align-items-center text-muted">
                  <MessageSquare size={16} className="me-2" />
                  Reply to comment
                </h6>
                {onCancel && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted p-0"
                    onClick={handleCancel}
                    aria-label="Cancel reply"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Textarea */}
            <div className="mb-3">
              <textarea
                className={`form-control ${error ? 'is-invalid' : ''}`}
                rows="3"
                placeholder={placeholder}
                value={content}
                onChange={handleContentChange}
                onInput={handleTextareaResize}
                disabled={isSubmitting}
                maxLength={MAX_CHARS + 50} // Allow typing a bit over to show error
                style={{ 
                  resize: 'none',
                  minHeight: isReply ? '80px' : '100px'
                }}
              />
              
              {/* Error message */}
              {error && (
                <div className="invalid-feedback d-block">
                  {error}
                </div>
              )}
            </div>

            {/* Form Footer */}
            <div className="d-flex justify-content-between align-items-center">
              
              {/* Character count */}
              <small className={`text-muted ${isNearLimit ? (isOverLimit ? 'text-danger' : 'text-warning') : ''}`}>
                {content.length} / {MAX_CHARS}
                {isOverLimit && (
                  <span className="ms-2 text-danger">
                    ({Math.abs(remainingChars)} over limit)
                  </span>
                )}
              </small>

              {/* Action buttons */}
              <div className="d-flex gap-2">
                
                {/* Cancel button (for replies) */}
                {isReply && onCancel && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-sm d-flex align-items-center"
                  disabled={isSubmitting || content.trim().length < MIN_CHARS || isOverLimit}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={14} className="me-2" />
                      {buttonText}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentForm;