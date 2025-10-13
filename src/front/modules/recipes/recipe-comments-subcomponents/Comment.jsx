import React, { useState } from 'react';

import { 
  ThumbsUp, 
  MessageSquare, 
  Pin, 
  Edit3, 
  Trash2, 
  MoreVertical,
  User,
  Check,
  X
} from 'lucide-react';

import CommentForm from './CommentForm';


/**
 * Comment Component
 * 
 * Displays an individual comment with all its functionality:
 * - Like/unlike functionality
 * - Edit capability (for comment owner)
 * - Delete capability (for comment owner)
 * - Pin/unpin capability (for recipe owner)
 * - Reply functionality with collapsible nested replies
 * - Show edit status and pin indicator
 * 
 * @param {Object} props
 * @param {Object} props.comment - The comment object with all data
 * @param {number} props.recipeId - The ID of the recipe this comment belongs to
 * @param {Object|null} props.currentUser - Current logged-in user data
 * @param {boolean} props.isRecipeOwner - Whether current user owns the recipe
 * @param {boolean} props.hasPinnedComment - Whether there's already a pinned comment
 * @param {Function} props.onUpdate - Callback when comment is updated
 * @param {Function} props.onDelete - Callback when comment is deleted
 * @param {Function} props.onReply - Callback when a reply is added
 */
export const Comment = ({
  comment,
  recipeId,
  currentUser,
  isRecipeOwner = false,
  hasPinnedComment = false,
  onUpdate,
  onDelete,
  onReply
}) => {
  
  // Component state
  const [isLiked, setIsLiked] = useState(comment.is_liked_by_user || false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Check permissions
  const isCommentOwner = currentUser && currentUser.user_id === comment.user_id;
  const canPin = isRecipeOwner && !comment.parent_comment_id; // Only main comments can be pinned
  const canEdit = isCommentOwner;
  const canDelete = isCommentOwner;
  const isMainComment = !comment.parent_comment_id;

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return 'Today';
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return '';
    }
  };

  /**
   * Handle like/unlike toggle
   */
  const handleLikeToggle = async () => {
    if (!currentUser) {
      alert('Please log in to like comments');
      return;
    }

    if (isLiking) return;

    try {
      setIsLiking(true);
      const token = localStorage.getItem('token');
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/comment/${comment.comment_id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.is_liked);
        setLikeCount(data.like_count);
      } else {
        console.error('Error toggling like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  /**
   * Handle pin/unpin toggle
   */
  const handlePinToggle = async () => {
    if (!canPin) return;

    // If trying to pin and there's already a pinned comment (and this isn't the pinned one)
    if (!comment.is_pinned && hasPinnedComment) {
      const confirmPin = window.confirm(
        'There is already a pinned comment for this recipe. Pinning this comment will unpin the current pinned comment. Do you want to continue?'
      );
      
      if (!confirmPin) {
        return; // User cancelled the action
      }
    }

    // If unpinning, ask for confirmation
    if (comment.is_pinned) {
      const confirmUnpin = window.confirm(
        'Are you sure you want to unpin this comment?'
      );
      
      if (!confirmUnpin) {
        return; // User cancelled the action
      }
    }

    try {
      const token = localStorage.getItem('token');
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/comment/${comment.comment_id}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update the comment through parent callback
        if (onUpdate) {
          onUpdate(data.comment);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error toggling pin status');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Network error. Please try again.');
    }
  };

  /**
   * Handle comment edit
   */
  const handleEditSubmit = async () => {
    const trimmedContent = editContent.trim();
    if (!trimmedContent || trimmedContent === comment.content) {
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/comment/${comment.comment_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: trimmedContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsEditing(false);
        // Update the comment through parent callback
        if (onUpdate) {
          onUpdate(data.comment);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handle comment deletion
   */
  const handleDelete = async () => {
    if (!canDelete) return;
    
    const confirmDelete = window.confirm(
      comment.replies_count > 0 
        ? `This will delete the comment and ${comment.replies_count} replies. Are you sure?`
        : 'Are you sure you want to delete this comment?'
    );
    
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/comment/${comment.comment_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Call parent callback to remove comment from list
        if (onDelete) {
          onDelete(comment.comment_id);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Network error. Please try again.');
    }
  };

  /**
   * Handle reply submission
   */
  const handleReplySubmit = (newReply) => {
    setShowReplyForm(false);
    setShowReplies(true);
    // Call parent callback to add reply
    if (onReply) {
      onReply(newReply, comment.comment_id);
    }
  };

  return (
    <div className={isMainComment ? 'mb-3' : 'ms-3 mb-3'}>
      <div className={`card ${isMainComment ? 'border-start border-primary border-3' : 'border-start border-light border-2'}`}>
        <div className="card-body">
          
          {/* Comment Header */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="d-flex align-items-center">
              
              {/* Author Avatar */}
              <div className="me-3">
                {comment.author?.cloudinary_url ? (
                  <img
                    src={comment.author.cloudinary_url}
                    alt={comment.author.full_name}
                    className="rounded-circle"
                    style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                    style={{ width: '36px', height: '36px' }}
                  >
                    <User size={18} />
                  </div>
                )}
              </div>

              {/* Author Info and Date */}
              <div>
                <div className="d-flex align-items-center">
                  <h6 className="mb-0 me-2">{comment.author?.full_name || 'Unknown User'}</h6>
                  <small className="text-muted">@{comment.author?.username || 'unknown'}</small>
                  
                  {/* Pin indicator */}
                  {comment.is_pinned && (
                    <span className="badge bg-warning text-dark ms-2">
                      <Pin size={12} className="me-1" />
                      Pinned
                    </span>
                  )}
                </div>
                <small className="text-muted">
                  {formatDate(comment.date_created)}
                  {comment.is_edited && (
                    <span className="ms-2 fst-italic">• edited</span>
                  )}
                </small>
              </div>
            </div>

            {/* Options Menu */}
            {(canEdit || canDelete || canPin) && (
              <div className="dropdown">
                <button
                  className="btn btn-link btn-sm text-muted"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <MoreVertical size={16} />
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {canPin && (
                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center"
                        onClick={handlePinToggle}
                      >
                        <Pin size={14} className="me-2" />
                        {comment.is_pinned ? 'Unpin Comment' : 'Pin Comment'}
                      </button>
                    </li>
                  )}
                  {canEdit && (
                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 size={14} className="me-2" />
                        Edit Comment
                      </button>
                    </li>
                  )}
                  {canDelete && (
                    <>
                      {(canPin || canEdit) && <li><hr className="dropdown-divider" /></li>}
                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center text-danger"
                          onClick={handleDelete}
                        >
                          <Trash2 size={14} className="me-2" />
                          Delete Comment
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="mb-3">
            {isEditing ? (
              <div className="edit-form">
                <textarea
                  className="form-control mb-2"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows="3"
                  maxLength="1000"
                  disabled={isUpdating}
                />
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {editContent.length} / 1000
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                      disabled={isUpdating}
                    >
                      <X size={14} className="me-1" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleEditSubmit}
                      disabled={isUpdating || !editContent.trim() || editContent.trim() === comment.content}
                    >
                      {isUpdating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={14} className="me-1" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {comment.content}
              </p>
            )}
          </div>

          {/* Comment Actions */}
          {!isEditing && (
            <div className="d-flex justify-content-between align-items-center">
              
              {/* Like and Reply buttons */}
              <div className="d-flex gap-3">
                
                {/* Like button */}
                <button
                  type="button"
                  className={`btn btn-link btn-sm p-0 d-flex align-items-center ${
                    isLiked ? 'text-primary' : 'text-muted'
                  }`}
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                  title={currentUser ? (isLiked ? 'Unlike comment' : 'Like comment') : 'Login to like'}
                >
                  <ThumbsUp size={14} className={`me-1 ${isLiked ? 'fill-current' : ''}`} />
                  {likeCount > 0 && likeCount}
                  {isLiking && <span className="spinner-border spinner-border-sm ms-1" />}
                </button>

                {/* Reply button (only for main comments) */}
                {isMainComment && currentUser && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 d-flex align-items-center text-muted"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                  >
                    <MessageSquare size={14} className="me-1" />
                    Reply
                  </button>
                )}
              </div>

              {/* Replies toggle (only for main comments with replies) */}
              {isMainComment && comment.replies_count > 0 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-muted"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && isMainComment && currentUser && (
        <div className="mt-3 ms-4">
          <CommentForm
            recipeId={recipeId}
            parentCommentId={comment.comment_id}
            onSubmit={handleReplySubmit}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Write a reply..."
            buttonText="Post Reply"
            isReply={true}
          />
        </div>
      )}

      {/* Nested Replies */}
      {showReplies && isMainComment && comment.replies && comment.replies.length > 0 && (
        <div className="replies mt-3 ms-4">
          {comment.replies.map((reply) => (
            <div key={reply.comment_id} className="mb-3">
              <Comment
                comment={reply}
                recipeId={recipeId}
                currentUser={currentUser}
                isRecipeOwner={isRecipeOwner}
                hasPinnedComment={hasPinnedComment}
                onUpdate={onUpdate}
                onDelete={(deletedId) => {
                  // Handle reply deletion by calling parent's onDelete
                  if (onDelete) {
                    onDelete(deletedId);
                  }
                }}
                onReply={onReply}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;