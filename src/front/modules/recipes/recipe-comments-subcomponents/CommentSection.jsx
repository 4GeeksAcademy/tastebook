import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, SortAsc, SortDesc } from 'lucide-react';
import Comment from './Comment';
import CommentForm from './CommentForm';

/**
 * CommentSection Component
 * 
 * Main container component that manages all comments for a recipe.
 * Features:
 * - Fetches and displays comments hierarchically
 * - Handles comment creation, editing, deletion
 * - Supports pagination and sorting
 * - Manages like interactions
 * - Pin/unpin functionality for recipe owners
 * - Real-time updates after actions
 * 
 * @param {Object} props
 * @param {number} props.recipeId - The ID of the recipe
 * @param {Object|null} props.currentUser - Current logged-in user data
 * @param {boolean} props.isRecipeOwner - Whether current user owns the recipe
 */
export const CommentSection = ({ 
  recipeId, 
  currentUser, 
  isRecipeOwner = false 
}) => {
  
  // Component state
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total_comments: 0,
    main_comments: 0,
    has_pinned: false
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    has_more: false
  });
  
  // UI state
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'likes'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewCommentForm, setShowNewCommentForm] = useState(false);

  /**
   * Fetch comments from API
   */
  const fetchComments = async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError('');

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: append ? pagination.offset.toString() : '0',
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const response = await fetch(`${backendUrl}/api/recipe/${recipeId}/comments?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Include auth header to get like status for logged-in users
          ...(currentUser && localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (append) {
          setComments(prev => [...prev, ...data.comments]);
          setPagination(prev => ({
            ...prev,
            offset: prev.offset + prev.limit,
            has_more: data.pagination.has_more
          }));
        } else {
          // Sort comments so pinned comments appear first
          const sortedComments = [...data.comments].sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return 0; // Keep original order for non-pinned comments
          });
          
          setComments(sortedComments);
          setPagination({
            ...data.pagination,
            offset: data.pagination.limit // Set offset for next fetch
          });
        }
        
        setStats(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    setIsRefreshing(true);
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchComments(false);
  };

  /**
   * Handle load more comments
   */
  const handleLoadMore = () => {
    fetchComments(true);
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (newSortBy) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  /**
   * Handle new comment submission
   */
  const handleNewComment = (newComment) => {
    // Add new comment to the beginning of the list
    setComments(prev => [newComment, ...prev]);
    setStats(prev => ({
      ...prev,
      total_comments: prev.total_comments + 1,
      main_comments: prev.main_comments + 1
    }));
    setShowNewCommentForm(false);
  };

  /**
   * Handle comment update (edit, pin/unpin)
   */
  const handleCommentUpdate = (updatedComment) => {
    setComments(prev => {
      let updatedComments = prev.map(comment => {
        // If this comment was pinned, unpin any previously pinned comment
        if (updatedComment.is_pinned && comment.comment_id !== updatedComment.comment_id && comment.is_pinned) {
          return { ...comment, is_pinned: false };
        }
        
        if (comment.comment_id === updatedComment.comment_id) {
          return updatedComment;
        }
        
        // Also check replies
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => 
            reply.comment_id === updatedComment.comment_id ? updatedComment : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });

      // Sort comments so pinned comment appears first
      updatedComments.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0; // Keep original order for non-pinned comments
      });

      return updatedComments;
    });
    
    // Update stats if pinned status changed
    if (updatedComment.is_pinned !== undefined) {
      setStats(prev => ({ ...prev, has_pinned: updatedComment.is_pinned }));
    }
  };

  /**
   * Handle comment deletion
   */
  const handleCommentDelete = (deletedCommentId) => {
    setComments(prev => {
      // Filter out main comment or update replies
      return prev.map(comment => {
        if (comment.comment_id === deletedCommentId) {
          return null; // Will be filtered out
        }
        // Remove from replies
        if (comment.replies) {
          const filteredReplies = comment.replies.filter(reply => reply.comment_id !== deletedCommentId);
          return {
            ...comment,
            replies: filteredReplies,
            replies_count: filteredReplies.length
          };
        }
        return comment;
      }).filter(Boolean); // Remove null entries
    });
    
    // Update stats
    setStats(prev => ({
      ...prev,
      total_comments: Math.max(0, prev.total_comments - 1),
      main_comments: Math.max(0, prev.main_comments - 1) // Simplified; in real app, check if it was main comment
    }));
  };

  /**
   * Handle reply submission
   */
  const handleReply = (newReply, parentCommentId) => {
    setComments(prev => prev.map(comment => {
      if (comment.comment_id === parentCommentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
          replies_count: (comment.replies_count || 0) + 1
        };
      }
      return comment;
    }));
    
    // Update total comments count
    setStats(prev => ({
      ...prev,
      total_comments: prev.total_comments + 1
    }));
  };

  // Fetch comments on component mount and when sort changes
  useEffect(() => {
    fetchComments(false);
  }, [recipeId, sortBy, sortOrder]);

  return (
    <div className="mt-4">
      
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="d-flex align-items-center mb-0">
          <MessageSquare className="me-2 text-primary" size={24} />
          Comments
          {stats.total_comments > 0 && (
            <span className="badge bg-light text-dark ms-2">
              {stats.total_comments}
            </span>
          )}
        </h4>

        {/* Actions */}
        <div className="d-flex gap-2">
          {/* Refresh button */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh comments"
          >
            {isRefreshing ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <RefreshCw size={14} />
            )}
          </button>

          {/* Sort buttons */}
          {comments.length > 1 && (
            <>
              <button
                type="button"
                className={`btn btn-sm ${sortBy === 'date' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleSortChange('date')}
                title={`Sort by date ${sortBy === 'date' && sortOrder === 'desc' ? '(newest first)' : '(oldest first)'}`}
              >
                Date
                {sortBy === 'date' && (
                  sortOrder === 'desc' ? <SortDesc size={12} className="ms-1" /> : <SortAsc size={12} className="ms-1" />
                )}
              </button>
              
              <button
                type="button"
                className={`btn btn-sm ${sortBy === 'likes' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleSortChange('likes')}
                title={`Sort by likes ${sortBy === 'likes' && sortOrder === 'desc' ? '(most liked first)' : '(least liked first)'}`}
              >
                Likes
                {sortBy === 'likes' && (
                  sortOrder === 'desc' ? <SortDesc size={12} className="ms-1" /> : <SortAsc size={12} className="ms-1" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* New Comment Form */}
      {currentUser ? (
        <div className="mb-4">
          {showNewCommentForm ? (
            <CommentForm
              recipeId={recipeId}
              onSubmit={handleNewComment}
              onCancel={() => setShowNewCommentForm(false)}
              placeholder="Share your thoughts about this recipe..."
              buttonText="Post Comment"
              isReply={false}
            />
          ) : (
            <button
              type="button"
              className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
              onClick={() => setShowNewCommentForm(true)}
            >
              <MessageSquare size={16} className="me-2" />
              Add a comment...
            </button>
          )}
        </div>
      ) : (
        <div className="alert alert-info mb-4">
          <MessageSquare size={16} className="me-2" />
          Please <strong>log in</strong> to leave a comment and like other comments.
        </div>
      )}

      {/* Loading State */}
      {loading && comments.length === 0 && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading comments...</span>
          </div>
          <p className="text-muted">Loading comments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <div className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleRefresh}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {!loading && !error && (
        <>
          {comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.comment_id} className="mb-4">
                  <Comment
                    comment={comment}
                    recipeId={recipeId}
                    currentUser={currentUser}
                    isRecipeOwner={isRecipeOwner}
                    hasPinnedComment={stats.has_pinned}
                    onUpdate={handleCommentUpdate}
                    onDelete={handleCommentDelete}
                    onReply={handleReply}
                  />
                </div>
              ))}

              {/* Load More Button */}
              {pagination.has_more && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More Comments'
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-5">
              <MessageSquare size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No comments yet</h5>
              <p className="text-muted mb-0">
                {currentUser 
                  ? "Be the first to share your thoughts about this recipe!"
                  : "Log in to be the first to comment on this recipe."
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentSection;