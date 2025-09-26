import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Login = () => {
    const navigate = useNavigate();

    // Form
    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");

    // Other elements
    const [showPass, setShowPass] = useState(false);
    const [loading,  setLoading] = useState(false);
    const [error,    setError] = useState("");

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) {
            setError("Configure VITE_BACKEND_URL in your .env");
            return;
        }

        setLoading(true);
        try {
            const resp = await fetch(`${backendUrl}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                                        email: email, 
                                        password: password 
                                    })
            });

            console.log(resp);

            const data = await resp.json().catch(() => ({}));

            console.log(data);

            if (!resp.ok) {
                throw new Error(data?.msg || "Invalid credentials");
            }

            // Save the token if your backend returns it
            const token = data.access_token || data.token;
            if (token) localStorage.setItem("token", token);

            navigate("/"); // redirect to Home
        } catch (err) {
            setError(err.message || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    
                    <div className="card shadow border-1 rounded-4">
                        <div className="card-body p-4">
                            <h1 className="h3 mb-3 text-center">Log in</h1>

                            {error && <div className="alert alert-danger">{error}</div>}

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

                                <div className="mb-2">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        id="password"
                                        type={showPass ? "text" : "password"}
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="current-password"
                                    />
                                </div>

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

                                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                            Logging in...
                                        </>
                                    ) : (
                                        "Log in"
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-3">
                                <Link to="/recovery-validation" className="text-decoration-none">
                                    <small>Forgot your password?</small>
                                </Link>
                            </div>

                            <hr/>

                            <div className="text-center">
                                <small className="text-muted">Don't have an account? <Link to="/signup" className="text-decoration-none">Signup</Link></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};