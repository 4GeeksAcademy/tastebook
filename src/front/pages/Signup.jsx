import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Signup = () => {

    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Form
    // const [firstName, setFirstName] = useState("");
    // const [lastName,  setLastName]  = useState("");
    const [fullName,  setFullName]  = useState("");
    const [username,  setUsername]  = useState("");
    const [email,     setEmail]     = useState("");
    const [password,  setPassword]  = useState("");

    // Other elements
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);


        if (!backendUrl) {
            setError("Configure VITE_BACKEND_URL in your .env");
            return;
        }


        setLoading(true);

        try {
            const res = await fetch(`${backendUrl}/api/signup`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                // credentials: "include", 
                body: JSON.stringify({
                            // first_name: firstName,
                            // last_name:  lastName,
                            full_name:  fullName,
                            username:   username,
                            email:      email,
                            password:   password,
                        })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Signup successful! You may now log in.");
                navigate("/login");
            } else {
                setError(data.msg || "Sign up failed.");
            }
        } catch (error) {
            console.error("Sign up error:", error);
            setError("A network error occurred.");
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

                        <h1 className="h3 mb-3 text-center">Create a new account</h1>

                        {error && <div className="alert alert-danger">{error}</div>}


                            {/* FORMULARIO */}
                            {/* <form onSubmit={handleSubmit}> */}
                            <form onSubmit={handleSubmit} noValidate>
                            {/* Nombre (first_name) */}
                            {/* <div className="mb-3">
                                <label htmlFor="firstName" className="form-label">Nombre</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    placeholder="tu nombre..."
                                    className="form-control"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div> */}


                            {/* Apellido (last_name) */}
                            {/* <div className="mb-3">
                                <label htmlFor="lastName" className="form-label">Apellido</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder="tu apellido..."
                                    className="form-control"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div> */}


                            {/* Full Name */}
                            <div className="mb-3">
                                <label htmlFor="fullName" className="form-label">Full name</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    placeholder="your full name..."
                                    className="form-control"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>


                            {/* Username */}
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="write your username..."
                                    className="form-control"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Correo electrónico */}
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="example@mail.com"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>


                            {/* Contraseña */}
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
                                    // autoComplete="current-password"
                                />
                            </div>

                            {/* Mostrar caracteres de contraseña */}
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
                                        Creating account...
                                    </>
                                ) : (
                                    "Create account"
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