import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  User, 
  Calendar, 
  ChefHat, 
  Users as UsersIcon, 
  Heart, 
  MapPin,
  Clock,
  Eye
} from "lucide-react";

export const UserProfile = () => {
  const { username } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const fetchUserProfile = async (offset = 0, isLoadMore = false) => {
    if (!backendUrl) {
      setError("Backend URL not configured.");
      return;
    }

    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);
    
    setError("");

    try {
      const params = new URLSearchParams({
        limit: '12',
        offset: offset.toString()
      });

      const response = await fetch(`${backendUrl}/api/user/${username}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user profile");
      }

      if (isLoadMore) {
        // Append new recipes to existing ones
        setUserProfile(prev => ({
          ...data.user,
          recipes: [...prev.recipes, ...data.user.recipes]
        }));
      } else {
        setUserProfile(data.user);
      }
    } catch (err) {
      setError(err.message || "Failed to load user profile");
      setUserProfile(null);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchUserProfile(0, false);
    }
  }, [username]);

  const loadMoreRecipes = () => {
    if (userProfile && userProfile.pagination.has_more) {
      const newOffset = userProfile.recipes.length;
      fetchUserProfile(newOffset, true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const formatRecipeDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <User size={64} className="text-muted mb-3" />
          <h4 className="text-muted">Profile Not Found</h4>
          <p className="text-muted">{error}</p>
          <Link to="/users" className="btn btn-primary">
            Browse All Users
          </Link>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="container py-5">
      {/* Profile Header */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <div className="row align-items-center">
                {/* Profile Image */}
                <div className="col-md-3 text-center mb-4 mb-md-0">
                  {userProfile.cloudinary_url ? (
                    <img
                      src={userProfile.cloudinary_url}
                      alt={userProfile.username}
                      className="rounded-circle border border-4 border-primary shadow"
                      style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto border border-4 border-primary shadow"
                      style={{ width: '150px', height: '150px', fontSize: '3rem', fontWeight: 'bold' }}
                    >
                      {userProfile.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="col-md-9">
                  <div className="row">
                    <div className="col-lg-8">
                      <h1 className="display-6 fw-bold mb-2">{userProfile.full_name}</h1>
                      <p className="text-muted mb-3 fs-5">@{userProfile.username}</p>
                      
                      {/* Member Since */}
                      <div className="d-flex align-items-center mb-3">
                        <Calendar size={18} className="text-muted me-2" />
                        <span className="text-muted">
                          Member since {formatDate(userProfile.created_at)}
                        </span>
                      </div>

                      {/* Future: Location, Bio, etc. */}
                      {/* 
                      <div className="d-flex align-items-center mb-3">
                        <MapPin size={18} className="text-muted me-2" />
                        <span className="text-muted">Location</span>
                      </div>
                      <p className="text-muted mb-3">Bio goes here...</p>
                      */}
                    </div>

                    {/* Stats */}
                    <div className="col-lg-4">
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-primary display-6 mb-0">
                              {userProfile.stats.recipes_count}
                            </span>
                            <small className="text-muted">
                              <ChefHat size={16} className="me-1" />
                              Recipes
                            </small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-secondary display-6 mb-0">
                              {userProfile.stats.followers_count}
                            </span>
                            <small className="text-muted">
                              <UsersIcon size={16} className="me-1" />
                              Followers
                            </small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-warning display-6 mb-0">
                              {userProfile.stats.total_likes}
                            </span>
                            <small className="text-muted">
                              <Heart size={16} className="me-1" />
                              Likes
                            </small>
                          </div>
                        </div>
                      </div>
                      
                      {/* Future: Follow/Unfollow Button */}
                      {/* 
                      <div className="mt-4">
                        <button className="btn btn-primary w-100">
                          Follow
                        </button>
                      </div>
                      */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipes Section */}
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center">
              <ChefHat size={28} className="text-primary me-3" />
              <h2 className="mb-0">Recipes by {userProfile.full_name}</h2>
            </div>
            <span className="text-muted">
              {userProfile.stats.recipes_count} recipe{userProfile.stats.recipes_count !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Recipes Grid */}
          {userProfile.recipes && userProfile.recipes.length > 0 ? (
            <>
              <div className="row g-4 mb-4">
                {userProfile.recipes.map((recipe) => (
                  <div key={recipe.recipe_id} className="col-sm-6 col-lg-4 col-xl-3">
                    <div className="card h-100 shadow-sm border-0 recipe-card">
                      {/* Recipe Image */}
                      <div className="position-relative">
                        {recipe.primary_image ? (
                          <img
                            src={recipe.primary_image.url}
                            alt={recipe.title}
                            className="card-img-top"
                            style={{ 
                              height: '200px', 
                              objectFit: 'cover',
                              backgroundColor: '#f8f9fa' 
                            }}
                          />
                        ) : (
                          <div 
                            className="card-img-top d-flex align-items-center justify-content-center bg-light"
                            style={{ height: '200px' }}
                          >
                            <ChefHat size={48} className="text-muted" />
                          </div>
                        )}
                        
                        {/* Recipe Date Badge */}
                        <div className="position-absolute top-0 end-0 m-2">
                          <span className="badge bg-dark bg-opacity-75">
                            <Clock size={12} className="me-1" />
                            {formatRecipeDate(recipe.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Recipe Info */}
                      <div className="card-body p-3">
                        <h5 className="card-title mb-2" style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {recipe.title}
                        </h5>
                        
                        {recipe.description && (
                          <p className="card-text text-muted small mb-3" style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {recipe.description}
                          </p>
                        )}

                        {/* Recipe Stats */}
                        <div className="d-flex justify-content-between align-items-center text-muted small">
                          <span>
                            <ChefHat size={14} className="me-1" />
                            {recipe.ingredients?.length || 0} ingredients
                          </span>
                          <span>
                            <Eye size={14} className="me-1" />
                            Steps: {recipe.instructions?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="card-footer bg-transparent border-0 pt-0 pb-3 px-3">
                        <Link 
                          to={`/recipe/${recipe.recipe_id}`} 
                          className="btn btn-outline-primary btn-sm w-100"
                        >
                          View Recipe
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {userProfile.pagination.has_more && (
                <div className="text-center mb-4">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={loadMoreRecipes}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Loading...
                      </>
                    ) : (
                      `Load More Recipes (${userProfile.pagination.total - userProfile.recipes.length} remaining)`
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* No Recipes State */
            <div className="text-center py-5">
              <ChefHat size={64} className="text-muted mb-3" />
              <h4 className="text-muted">No Recipes Yet</h4>
              <p className="text-muted">
                {userProfile.full_name} hasn't shared any recipes yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .recipe-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .recipe-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
};