import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const LikeButton = ({ 
    recipeId, 
    initialLikeCount = 0, 
    initialIsLiked = false, 
    size = 'medium',
    showCount = true,
    className = '',
    onLikeChange = null // Callback for parent components
}) => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLoading, setIsLoading] = useState(false);

    // Size configurations
    const sizeConfig = {
        small: {
            iconSize: 16,
            buttonClass: 'btn-sm',
            fontSize: 'small'
        },
        medium: {
            iconSize: 20,
            buttonClass: '',
            fontSize: ''
        },
        large: {
            iconSize: 24,
            buttonClass: 'btn-lg',
            fontSize: 'fs-5'
        }
    };

    const config = sizeConfig[size] || sizeConfig.medium;

    const handleLikeToggle = async (e) => {
        e.preventDefault(); // Prevent parent link clicks
        e.stopPropagation(); // Prevent event bubbling

        // Check if user is authenticated
        if (!token) {
            navigate('/login');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/recipe/${recipeId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to toggle like');
            }

            const data = await response.json();
            
            // Update local state
            setIsLiked(data.is_liked);
            setLikeCount(data.like_count);

            // Call parent callback if provided
            if (onLikeChange) {
                onLikeChange({
                    recipeId,
                    isLiked: data.is_liked,
                    likeCount: data.like_count
                });
            }

        } catch (error) {
            console.error('Error toggling like:', error);
            // You could show a toast notification here
            alert('Failed to update like. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLikeToggle}
            disabled={isLoading || !token}
            className={`btn d-inline-flex align-items-center gap-2 ${config.buttonClass} ${className} ${
                isLiked 
                    ? 'btn-danger' 
                    : 'btn-outline-danger'
            }`}
            style={{ 
                transition: 'all 0.2s ease-in-out',
                ...(isLoading && { opacity: 0.7 })
            }}
            title={!token ? 'Login to like recipes' : (isLiked ? 'Unlike recipe' : 'Like recipe')}
        >
            {isLoading ? (
                <div 
                    className="spinner-border" 
                    style={{ 
                        width: `${config.iconSize}px`, 
                        height: `${config.iconSize}px` 
                    }}
                    role="status"
                    aria-hidden="true"
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
            ) : (
                <Heart 
                    size={config.iconSize} 
                    fill={isLiked ? 'currentColor' : 'none'} 
                    className={isLiked ? 'text-white' : ''}
                    style={{ 
                        transform: isLoading ? 'scale(0.9)' : 'scale(1)',
                        transition: 'transform 0.1s ease-in-out'
                    }}
                />
            )}
            
            {showCount && (
                <span className={`fw-semibold ${config.fontSize}`}>
                    {likeCount}
                </span>
            )}
        </button>
    );
};

// Simplified version for inline use (just icon with count)
export const LikeIcon = ({ 
    recipeId, 
    initialLikeCount = 0, 
    initialIsLiked = false,
    size = 16,
    onLikeChange = null
}) => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLoading, setIsLoading] = useState(false);

    const handleLikeToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!token) {
            navigate('/login');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/recipe/${recipeId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to toggle like');
            }

            const data = await response.json();
            
            setIsLiked(data.is_liked);
            setLikeCount(data.like_count);

            if (onLikeChange) {
                onLikeChange({
                    recipeId,
                    isLiked: data.is_liked,
                    likeCount: data.like_count
                });
            }

        } catch (error) {
            console.error('Error toggling like:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="d-inline-flex align-items-center gap-1 text-muted"
            style={{ cursor: token ? 'pointer' : 'default' }}
            onClick={handleLikeToggle}
            title={!token ? 'Login to like recipes' : (isLiked ? 'Unlike recipe' : 'Like recipe')}
        >
            {isLoading ? (
                <div 
                    className="spinner-border" 
                    style={{ width: `${size}px`, height: `${size}px` }}
                    role="status"
                    aria-hidden="true"
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
            ) : (
                <Heart 
                    size={size} 
                    fill={isLiked ? '#dc3545' : 'none'} 
                    className={isLiked ? 'text-danger' : 'text-muted'}
                    style={{ 
                        transition: 'all 0.2s ease-in-out',
                        transform: isLoading ? 'scale(0.9)' : 'scale(1)'
                    }}
                />
            )}
            <small className={isLiked ? 'text-danger fw-semibold' : 'text-muted'}>
                {likeCount}
            </small>
        </div>
    );
};