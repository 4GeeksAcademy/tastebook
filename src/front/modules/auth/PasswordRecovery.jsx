import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const PasswordRecovery = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [recoveryLink, setRecoveryLink] = useState("");
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setRecoveryLink("");
        if (!backendUrl) {
            setError("Configure VITE_BACKEND_URL in your .env");
            return;
        }
        setLoading(true);
        try {
            const resp = await fetch(`${backendUrl}/api/recovery-validation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data?.error || "Email not found");
            }
            // Show the recovery link in the toast message
            const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
            const link = `${frontendUrl}/reset-password/${data.token}`;
            setRecoveryLink(link);
            setSuccess("Recovery email sent! You can reset your password now.");
        } catch (err) {
            setError(err.message || "Error sending recovery email.");
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
                            <h1 className="h3 mb-3 text-center">Password Recovery</h1>
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && (
                                <div className="alert alert-success">
                                    {success}
                                    {recoveryLink && (
                                        <div className="mt-2">
                                            <a href={recoveryLink} className="btn btn-link" onClick={e => {e.preventDefault(); navigate(`/reset-password/${recoveryLink.split('/').pop()}`);}}>
                                                Click here to reset your password
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send recovery email"
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
