import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const ResetPassword = () => {
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Password requirements (same as Signup)
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
    const isPasswordValid = passwordRequirements.every(r => r.test(newPassword));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!backendUrl) {
            setError("Configure VITE_BACKEND_URL in your .env");
            return;
        }
        // Strong password validation
        if (!isPasswordValid) {
            setError("Password does not meet all requirements.");
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
            setTimeout(() => navigate("/login"), 5000);
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

                                {/* Password input */}
                                <div className="mb-2">
                                    <label htmlFor="newPassword" className="form-label">New Password</label>
                                    <input
                                        id="newPassword"
                                        type={showPass ? "text" : "password"}
                                        className="form-control"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                </div>


                                {/* Show password toggle */}
                                <div className="form-check mb-3">
                                    <input
                                        id="showPass"
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={showPass}
                                        onChange={(e) => setShowPass(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="showPass">
                                        Show password
                                    </label>
                                </div>

                                {/* Password requirements box */}
                                <div className="mb-2" style={{fontSize: "0.97em"}}>
                                    <div className="p-2 rounded dark-mode:bg-secondary">
                                        <strong className="text-dark-emphasis">Password must contain:</strong>
                                        <ul className="mb-0" style={{listStyle: "none", paddingLeft: 0}}>
                                            {passwordRequirements.map((req, idx) => (
                                                <li key={idx} style={{color: req.test(newPassword) ? "#198754" : "var(--text-secondary)", display: "flex", alignItems: "center"}}>
                                                    <span style={{fontWeight: req.test(newPassword) ? "bold" : "normal", marginRight: "0.5em"}}>
                                                        {req.test(newPassword)
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
