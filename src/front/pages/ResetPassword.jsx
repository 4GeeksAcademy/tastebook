import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const ResetPassword = () => {
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!backendUrl) {
            setError("Configure VITE_BACKEND_URL in your .env");
            return;
        }
        setLoading(true);
        try {
            const resp = await fetch(`${backendUrl}/api/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_password: newPassword })
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data?.error || "Could not reset password");
            }
            setSuccess("Password updated successfully! You may now log in.");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(err.message || "Error resetting password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-4">
                            <h1 className="h3 mb-3 text-center">Reset Password</h1>
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label">New Password</label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        className="form-control"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </div>
                                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset password"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
