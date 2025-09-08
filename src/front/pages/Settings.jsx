import React, { useEffect, useState } from "react";
import { User, KeyRound, Mail, BookOpenText, Image, Edit, X } from "lucide-react";

export const Settings = () => {
  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ current_password: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem("token");
  const backendUrl = import.meta.env.VITE_BACKEND_URL

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
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
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
        body: JSON.stringify(passwordForm)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.msg || data?.message || "Failed to change password.");
      setSuccess("Password changed successfully!");
      setError("");
      setPasswordForm({ current_password: "", password: "" });
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
        <div className="col-md-3 mb-4">
          <div className="list-group">
            <button className={`list-group-item list-group-item-action ${activePanel === "profile" ? "active" : ""}`} onClick={() => setActivePanel("profile")}> <User size={18} className="me-2" /> Profile Info </button>
            <button className={`list-group-item list-group-item-action ${activePanel === "password" ? "active" : ""}`} onClick={() => setActivePanel("password")}> <KeyRound size={18} className="me-2" /> Change Password </button>
          </div>
        </div>
        <div className="col-md-9">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="mb-4">Settings</h3>
              {loading && <div className="alert alert-info">Loading...</div>}
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
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
                      <div className="col-md-6">
                        <label className="form-label fw-semibold"><Image size={16} className="me-1" /> Profile URL</label>
                        <input type="url" name="profile_url" className="form-control" value={form.profile_url || ""} onChange={handleChange} />
                      </div>
                      <div className="col-12 mt-3">
                        <button type="submit" className="btn btn-primary me-2" disabled={loading}>Save Changes</button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={loading}><X size={16} className="me-1" /> Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              {activePanel === "password" && (
                <form onSubmit={handlePasswordSave} className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold"><KeyRound size={16} className="me-1" /> Current Password</label>
                    <input type="password" name="current_password" className="form-control" value={passwordForm.current_password} onChange={handlePasswordChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold"><KeyRound size={16} className="me-1" /> New Password</label>
                    <input type="password" name="password" className="form-control" value={passwordForm.password} onChange={handlePasswordChange} required />
                  </div>
                  <div className="col-12 mt-3">
                    <button type="submit" className="btn btn-success" disabled={loading}>Change Password</button>
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
