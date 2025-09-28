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
  Eye,
  Edit,
  Globe,
  UserPlus,
  UserMinus
} from "lucide-react";
import { EditDescriptionModal } from "../components/EditDescriptionModal";
import { COUNTRIES, CountryFlag } from "../assets/data/countriesData.jsx";

export const UserProfile = () => {
  const { username } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followMessage, setFollowMessage] = useState("");
  const [showFollowMessage, setShowFollowMessage] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

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

  // Fetch current user info to check if they're the profile owner
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token || !backendUrl) {
        setCurrentUser(null);
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/settings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.current_user);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, [token, backendUrl]);

  // Check follow status when profile and current user are loaded
  useEffect(() => {
    if (userProfile && currentUser) {
      checkFollowStatus();
    }
  }, [userProfile, currentUser]);

  const loadMoreRecipes = () => {
    if (userProfile && userProfile.pagination.has_more) {
      const newOffset = userProfile.recipes.length;
      fetchUserProfile(newOffset, true);
    }
  };

  const handleDescriptionUpdate = async (newDescription) => {
    if (!token || !backendUrl) {
      return;
    }

    setUpdateLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/user/description`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ description: newDescription })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user profile with the new description
        setUserProfile(prev => ({
          ...prev,
          description: newDescription
        }));
        setIsEditModalOpen(false);
      } else {
        throw new Error(data.error || "Failed to update description");
      }
    } catch (error) {
      console.error("Error updating description:", error);
      // You could add error handling here if needed
    } finally {
      setUpdateLoading(false);
    }
  };

  // Check follow status when profile loads
  const checkFollowStatus = async () => {
    if (!token || !userProfile || !currentUser || currentUser.username === userProfile.username) {
      console.log("Skipping follow status check:", { 
        hasToken: !!token, 
        hasUserProfile: !!userProfile, 
        hasCurrentUser: !!currentUser,
        isSameUser: currentUser?.username === userProfile?.username 
      });
      return;
    }

    console.log("Checking follow status for user_id:", userProfile.user_id);

    try {
      const response = await fetch(`${backendUrl}/api/follow/status/${userProfile.user_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Follow status response:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Follow status data:", data);
        setIsFollowing(data.is_following);
        setFollowersCount(data.followers_count);
      } else {
        const errorData = await response.json();
        console.error("Error checking follow status:", response.status, response.statusText, errorData);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!token || !userProfile || followLoading) {
      console.log("Cannot toggle follow:", { hasToken: !!token, hasUserProfile: !!userProfile, followLoading });
      return;
    }

    console.log(`${isFollowing ? 'Unfollowing' : 'Following'} user:`, userProfile.user_id);
    setFollowLoading(true);

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`${backendUrl}/api/follow/${userProfile.user_id}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Follow toggle response:", response.status);
      const data = await response.json();
      console.log("Follow toggle data:", data);

      if (response.ok) {
        setIsFollowing(data.is_following);
        setFollowersCount(data.followers_count);
        
        // Update userProfile stats
        setUserProfile(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers_count: data.followers_count
          }
        }));

        // Show success message
        const message = data.is_following 
          ? `You are now following ${userProfile.username}` 
          : `You have unfollowed ${userProfile.username}`;
        setFollowMessage(message);
        setShowFollowMessage(true);
        
        // Hide message after 3 seconds
        setTimeout(() => {
          setShowFollowMessage(false);
        }, 1500);
      } else {
        console.error("Follow/unfollow error:", data.error);
        
        // Show error message
        setFollowMessage(data.error || "Failed to update follow status");
        setShowFollowMessage(true);
        setTimeout(() => {
          setShowFollowMessage(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
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
                      <div className="d-flex align-items-center mb-2">
                        <Calendar size={18} className="text-muted me-2" />
                        <span className="text-muted">
                          Member since {formatDate(userProfile.created_at)}
                        </span>
                      </div>

                      {/* Country */}
                      {userProfile.country && (
                        <div className="d-flex align-items-center mb-3">
                          <Globe size={18} className="text-muted me-2" />
                          <span className="text-muted d-flex align-items-center">
                            {COUNTRIES.find(c => c.code === userProfile.country)?.name || userProfile.country}
                            <CountryFlag countryCode={userProfile.country} size={18} className="ms-2" />
                          </span>
                        </div>
                      )}

                      {/* User Description */}
                      <div className="mb-3">
                        {userProfile.description ? (
                          <div className="d-flex align-items-start">
                            {currentUser && currentUser.username === userProfile.username && (
                              <button
                                className="btn btn-link text-muted p-1 me-2"
                                onClick={() => setIsEditModalOpen(true)}
                                title="Edit description"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            <p className="text-muted mb-0 flex-grow-1" style={{ whiteSpace: 'pre-wrap' }}>
                              {userProfile.description}
                            </p>
                          </div>
                        ) : (
                          <>
                            {currentUser && currentUser.username === userProfile.username ? (
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setIsEditModalOpen(true)}
                              >
                                <Edit size={16} className="me-1" />
                                Add a description
                              </button>
                            ) : (
                              <p className="text-muted fst-italic">
                                This user hasn't added a description yet.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="col-lg-4">
                      <div className="row text-center">

                        {/* Recipes Count */}
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-primary display-6 mb-0">
                              {userProfile.stats.recipes_count}
                            </span>
                            <small className="text-muted">
                              <ChefHat size={14} className="me-1" />
                              Recipes
                            </small>
                          </div>
                        </div>

                        {/* Followers Count */}
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-secondary display-6 mb-0">
                              {userProfile.stats.followers_count}
                            </span>
                            <small className="text-muted">
                              <UsersIcon size={14} className="me-1" />
                              Followers
                            </small>
                          </div>
                        </div>

                        {/* Likes Count */}
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-warning display-6 mb-0">
                              {userProfile.stats.total_likes}
                            </span>
                            <small className="text-muted">
                              <Heart size={14} className="me-1" />
                              Likes
                            </small>
                          </div>
                        </div>

                    </div>
                      
                      {/* Follow/Unfollow Button */}
                      {currentUser && currentUser.username !== userProfile.username && (
                        <div className="mt-4">
                          <button 
                            className={`btn w-100 ${isFollowing ? 'btn-outline-danger' : 'btn-primary'}`}
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                          >
                            {followLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                {isFollowing ? 'Unfollowing...' : 'Following...'}
                              </>
                            ) : (
                              <>
                                {isFollowing ? (
                                  <>
                                    <UserMinus size={16} className="me-1" />
                                    Unfollow
                                  </>
                                ) : (
                                  <>
                                    <UserPlus size={16} className="me-1" />
                                    Follow
                                  </>
                                )}
                              </>
                            )}
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Follow Success/Error Message */}
      {showFollowMessage && (
        <div className="row mb-3">
          <div className="col-12">
            <div className={`alert ${followMessage.includes('unfollowed') || followMessage.includes('following') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
              <strong>{followMessage}</strong>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowFollowMessage(false)}
              ></button>
            </div>
          </div>
        </div>
      )}

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

      {/* Edit Description Modal */}
      <EditDescriptionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentDescription={userProfile?.description || ""}
        onSave={handleDescriptionUpdate}
        loading={updateLoading}
      />

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