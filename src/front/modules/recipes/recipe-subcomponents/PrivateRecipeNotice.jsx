import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, LockKeyhole, ArrowLeft, Eye, AlertCircle } from 'lucide-react';

const PrivateRecipeNotice = ({ isUncertain = false }) => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
        
          <div className="text-center">

            {/* Lock Icon */}
            <div className="mb-4">
              <div 
                className="rounded-circle border bg-opacity-80 d-inline-flex align-items-center justify-content-center"
                style={{ width: '120px', height: '120px' }}
              >
                {isUncertain ? (
                  <AlertCircle size={60} className="text-warning" style={{ position: 'relative', zIndex: 2 }} />
                  // <AlertCircle size={60} className="text-warning" style={{ position: 'relative', zIndex: 2 }} />
                ) : (
                  <LockKeyhole size={60} className="text-warning" style={{ position: 'relative', zIndex: 2 }} />
                  // <LockKeyhole size={60} className="text-warning" style={{ position: 'relative', zIndex: 2 }} />
                )}
              </div>
            </div>

            {/* Main Message */}
            <h2 className="h3 mb-3 text-dark">
              {isUncertain 
                ? "Recipe Not Available" 
                : "This Recipe is Private"
              }
            </h2>
            <p className="lead text-muted mb-4">
              {isUncertain 
                ? "This recipe may be private or does not exist. If you have permission to view it, try logging in."
                : "This recipe is set to private by its author and can only be viewed by them."
              }
            </p>
            
            {/* Additional Info */}
            <div className="alert alert-light border-0 mb-4">
              <div className="d-flex align-items-center justify-content-center">
                {isUncertain ? (
                  <AlertCircle size={16} className="me-2 text-warning" style={{ position: 'relative', zIndex: 2 }} />
                ) : (
                  <Lock size={16} className="me-2 text-warning" style={{ position: 'relative', zIndex: 2 }} />
                )}
                <small className="text-muted mb-0">
                  {isUncertain 
                    ? "If you're the recipe owner, make sure you're logged in"
                    : "Only the recipe owner can view and modify this content"
                  }
                </small>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
              <Link 
                to="/all-recipes" 
                className="btn btn-primary px-4"
              >
                <Eye size={16} className="me-2" />
                Browse Public Recipes
              </Link>
              <Link 
                to="/" 
                className="btn btn-outline-secondary px-4"
              >
                <ArrowLeft size={16} className="me-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateRecipeNotice;