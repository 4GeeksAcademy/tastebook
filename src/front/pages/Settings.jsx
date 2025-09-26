import React, { useEffect, useState } from "react";
import { User, KeyRound, Mail, BookOpenText, Image, Edit, X, Camera } from "lucide-react";
import ImageUpload from "../components/ImageUpload";

export const Settings = () => {
  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ current_password: "", password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState("");

  const token = localStorage.getItem("token");
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  // Password requirements (same as ResetPassword)
  const passwordRequirements = [
    {
      label: "At least 8 characters",
      test: (pw) => pw.length >= 8
    },
    {
      label: "At least 1 uppercase letter",
      test: (pw) => /[A-Z]/.test(pw)
    },
    {
      label: "At least 1 lowercase letter",
      test: (pw) => /[a-z]/.test(pw)
    },
    {
      label: "At least 1 number",
      test: (pw) => /[0-9]/.test(pw)
    },
    {
      label: "At least 1 special character",
      test: (pw) => /[^A-Za-z0-9]/.test(pw)
    }
  ];
  const isPasswordValid = passwordRequirements.every(r => r.test(passwordForm.password));

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!backendUrl) {
        setError("Backend URL not configured.");
        return;
      }
      setLoading(true);
      try {
        // const resp = await fetch(`${store.backendURL}/settings`, {
        const resp = await fetch(backendUrl + "/api/settings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.message || "Failed to load user info.");
        const user = data.current_user || {};
        setUserData(user);
        setForm({
          email: user.email || "",
          full_name: user.full_name || "",
          username: user.username || "",
          profile_url: user.profile_url || ""
        });
      } catch (err) {
        setError("Failed to load user info.");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchUserInfo();
  }, [token]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    const updatedForm = { ...passwordForm, [name]: value };
    setPasswordForm(updatedForm);
    
    // Check if passwords match when user types in confirm password field
    if (name === "confirm_password" || name === "password") {
      if (name === "confirm_password") {
        if (value !== updatedForm.password) {
          setPasswordMatchError("Passwords do not match");
        } else {
          setPasswordMatchError("");
        }
      } else if (name === "password") {
        if (updatedForm.confirm_password && value !== updatedForm.confirm_password) {
          setPasswordMatchError("Passwords do not match");
        } else {
          setPasswordMatchError("");
        }
      }
    }
  };

  const handleImageUpload = async (file) => {
    if (!backendUrl) {
      setError("Backend URL not configured.");
      return;
    }
    
    setImageLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const resp = await fetch(`${backendUrl}/api/user/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to upload image.");
      
      const updatedUserData = { ...userData, ...data.user };
      setUserData(updatedUserData);
      setSuccess("Profile image updated successfully!");
      
      // Auto-dismiss success message after 15 seconds
      setTimeout(() => setSuccess(""), 15000);
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: { userData: updatedUserData }
      }));
    } catch (err) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!backendUrl) {
      setError("Backend URL not configured.");
      return;
    }
    
    setImageLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const resp = await fetch(`${backendUrl}/api/user/delete-image`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to delete image.");
      
      const updatedUserData = { ...userData, ...data.user };
      setUserData(updatedUserData);
      setSuccess("Profile image deleted successfully!");
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccess(""), 15000);
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: { userData: updatedUserData }
      }));
    } catch (err) {
      setError(err.message || "Failed to delete image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!backendUrl) {
      setError("Backend URL not configured.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const resp = await fetch(`${backendUrl}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.msg || data?.message || "Failed to save changes.");
      setSuccess("Profile updated successfully!");
      setError("");
      setUserData(prevData => ({...prevData, ...form}));
      setIsEditing(false);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccess(""), 15000);
    } catch (err) {
      setError("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async e => {
    e.preventDefault();
    if (!backendUrl) {
      setError("Backend URL not configured.");
      return;
    }
    
    // Validate password requirements
    if (!isPasswordValid) {
      setError("Password does not meet all requirements.");
      return;
    }
    
    // Validate password matching
    if (passwordForm.password !== passwordForm.confirm_password) {
      setPasswordMatchError("Passwords do not match");
      setError("Please make sure both passwords match.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    setPasswordMatchError("");
    
    try {
      // Only send current_password and password to backend
      const { confirm_password, ...submitData } = passwordForm;
      const resp = await fetch(`${backendUrl}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.msg || data?.message || "Failed to change password.");
      setSuccess("Password changed successfully!");
      setError("");
      setPasswordForm({ current_password: "", password: "", confirm_password: "" });
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccess(""), 15000);
    } catch (err) {
      setError("Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (userData) {
      setForm({
        email: userData.email || "",
        full_name: userData.full_name || "",
        username: userData.username || "",
        profile_url: userData.profile_url || ""
      });
    }
  };

  return (
    <div className="container py-5">

      <div className="row">

        <h3 className="mb-4">Settings</h3>

        <div className="col-md-3 mb-4">

          <div className="list-group">
            <button className={`list-group-item list-group-item-action ${activePanel === "profile" ? "active" : ""}`} onClick={() => setActivePanel("profile")}> <User size={18} className="me-2" /> Profile Info </button>
            <button className={`list-group-item list-group-item-action ${activePanel === "image" ? "active" : ""}`} onClick={() => setActivePanel("image")}> <Camera size={18} className="me-2" /> Profile Image </button>
            <button className={`list-group-item list-group-item-action ${activePanel === "password" ? "active" : ""}`} onClick={() => setActivePanel("password")}> <KeyRound size={18} className="me-2" /> Change Password </button>
          </div>

        </div>

        <div className="col-md-9">

          <div className="card shadow-sm">

            <div className="card-body">

              {/* <h3 className="mb-4">Settings</h3> */}

              {loading && <div className="alert alert-info">Loading...</div>}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button 
                    type="button" 
                    className="btn-close" 
                    aria-label="Close"
                    onClick={() => setError("")}
                  ></button>
                </div>
              )}
              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  {success}
                  <button 
                    type="button" 
                    className="btn-close" 
                    aria-label="Close"
                    onClick={() => setSuccess("")}
                  ></button>
                </div>
              )}
              
              {activePanel === "profile" && (
                <div>
                  {!isEditing ? (
                    <div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold"><Mail size={18} className="me-1" /> Email</label>
                          <p className="text-muted">{userData?.email}</p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold"><User size={18} className="me-1" /> Username</label>
                          <p className="text-muted">{userData?.username}</p>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold"><User size={18} className="me-1" /> Full Name</label>
                          <p className="text-muted">{userData?.full_name}</p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold"><Image size={18} className="me-1" /> Profile URL</label>
                          <p className="text-muted">{userData?.profile_url ? <a href={userData.profile_url} target="_blank" rel="noopener noreferrer">{userData.profile_url}</a> : "Not set"}</p>
                        </div>
                      </div>
                      <button onClick={() => setIsEditing(true)} className="btn btn-primary"><Edit size={16} className="me-1" /> Edit Profile</button>
                      {userData && (
                        <div className="mt-4">
                          <div className="mb-2"><BookOpenText size={18} className="me-1" /> <strong>Recipes:</strong> {userData.recipes_count}</div>
                          <div className="mb-2"><strong>Account Active:</strong> {userData.is_active ? "Yes" : "No"}</div>
                          <div className="mb-2"><strong>Created:</strong> {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : "-"}</div>
                        </div>
                      )}
                    </div>

                  ) : (

                    <form onSubmit={handleSave} noValidate className="row g-3">

                      <div className="col-md-6">
                        <label className="form-label fw-semibold"><Mail size={16} className="me-1" /> Email</label>
                        <input type="email" name="email" className="form-control" value={form.email || ""} onChange={handleChange} required />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold"><User size={16} className="me-1" /> Username</label>
                        <input type="text" name="username" className="form-control" value={form.username || ""} onChange={handleChange} required />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold"><User size={16} className="me-1" /> Full Name</label>
                        <input type="text" name="full_name" className="form-control" value={form.full_name || ""} onChange={handleChange} required />
                      </div>

                      {/* <div className="col-md-6">
                        <label className="form-label fw-semibold"><Image size={16} className="me-1" /> Profile URL</label>
                        <input type="url" name="profile_url" className="form-control" value={form.profile_url || ""} onChange={handleChange} />
                      </div> */}

                      <div className="col-12 mt-3">
                        <button type="submit" className="btn btn-primary me-2" disabled={loading}>Save Changes</button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={loading}><X size={16} className="me-1" /> Cancel</button>
                      </div>

                    </form>
                  )}
                </div>
              )}


              {activePanel === "image" && (
                <div className="text-center">
                  <h5 className="mb-4">Manage Your Profile Image</h5>
                  <ImageUpload
                    currentImageUrl={userData?.cloudinary_url}
                    onImageUpload={handleImageUpload}
                    onImageDelete={handleImageDelete}
                    loading={imageLoading}
                    size="large"
                    className="mb-4"
                  />
                  <div className="mt-4">
                    <small className="text-muted">
                      Your profile image will be visible to other users and displayed in the navigation bar.
                    </small>
                  </div>
                </div>
              )}


              {activePanel === "password" && (
                <form onSubmit={handlePasswordSave} className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold"><KeyRound size={16} className="me-1" /> Current Password</label>
                    <input type="password" name="current_password" className="form-control" value={passwordForm.current_password} onChange={handlePasswordChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold"><KeyRound size={16} className="me-1" /> New Password</label>
                    <input type="password" name="password" className="form-control" value={passwordForm.password} onChange={handlePasswordChange} required minLength={8} />
                  </div>
                  
                  {/* Password requirements box */}
                  {passwordForm.password && (
                    <div className="col-12 mb-2" style={{fontSize: "0.97em"}}>
                      <div className="p-2 rounded" style={{backgroundColor: "#f8f9fa", border: "1px solid #dee2e6"}}>
                        <strong className="text-dark-emphasis">Password must contain:</strong>
                        <ul className="mb-0" style={{listStyle: "none", paddingLeft: 0}}>
                          {passwordRequirements.map((req, idx) => (
                            <li key={idx} style={{color: req.test(passwordForm.password) ? "#198754" : "#6c757d", display: "flex", alignItems: "center"}}>
                              <span style={{fontWeight: req.test(passwordForm.password) ? "bold" : "normal", marginRight: "0.5em"}}>
                                {req.test(passwordForm.password)
                                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#198754" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                                }
                              </span>
                              {req.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="col-12">
                    <label className="form-label fw-semibold"><KeyRound size={16} className="me-1" /> Confirm New Password</label>
                    <input type="password" name="confirm_password" className="form-control" value={passwordForm.confirm_password} onChange={handlePasswordChange} required />
                    {passwordMatchError && (
                      <div className="text-danger mt-1" style={{fontSize: "0.875em"}}>
                        {passwordMatchError}
                      </div>
                    )}
                  </div>
                  <div className="col-12 mt-3">
                    <button type="submit" className="btn btn-success" disabled={loading || !isPasswordValid || passwordMatchError || !passwordForm.password || !passwordForm.confirm_password}>Change Password</button>
                  </div>
                </form>
              )}



            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
