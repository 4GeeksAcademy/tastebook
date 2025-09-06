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
            setError("Configura VITE_BACKEND_URL en tu .env");
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

            const data = await resp.json().catch(() => ({}));

            if (!resp.ok) {
                throw new Error(data?.msg || "Credenciales inválidas");
            }

            // Guarda el token si tu backend lo devuelve
            const token = data.access_token || data.token;
            if (token) localStorage.setItem("token", token);

            navigate("/"); // redirige al Home
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
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-4">
                            <h1 className="h3 mb-3 text-center">Log in</h1>

                            {error && <div className="alert alert-danger">{error}</div>}

                            <form onSubmit={handleSubmit} noValidate>  {/* Por qué noValidate? */}
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
                                    <label htmlFor="password" className="form-label">Contraseña</label>
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
                                        Mostrar contraseña
                                    </label>
                                </div>

                                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                            Entrando…
                                        </>
                                    ) : (
                                        "Entrar"
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-3">
                                <small className="text-muted">¿Olvidaste tu contraseña?</small>{" "}
                                <Link to="/recover">Recuperar</Link>
                            </div>

                            <hr className="my-4" />

                            <div className="text-center">
                                <small className="text-muted">¿No tienes cuenta?</small>{" "}
                                <Link to="/register">Regístrate</Link>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-muted small mt-3 mb-0">
                        Usa <code>VITE_BACKEND_URL</code> (ej. <code>http://localhost:3001</code>)
                    </p>
                </div>
            </div>
        </div>


    );
};