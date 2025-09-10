import React, { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Signup = () => {

    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Form
    const [fullName,  setFullName]  = useState("");
    const [username,  setUsername]  = useState("");
    const [email,     setEmail]     = useState("");
    const [password,  setPassword]  = useState("");

 
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [emailError, setEmailError] = useState(null);
    const [usernameError, setUsernameError] = useState(null);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [checkingUsername, setCheckingUsername] = useState(false);

    // Password requirements
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
    const isPasswordValid = passwordRequirements.every(r => r.test(password));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setEmailError(null);

        // Simple email regex VALIDATION
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address like "example@domain.com"');
            return;
        }

        // Strong password validation
        if (!isPasswordValid) {
            setError("Password does not meet all requirements.");
            return;
        }

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

    // Check if username exists
    const checkUsernameExists = async () => {
        setUsernameError(null);
        setUsernameAvailable(null);
        if (!username) return;
        if (!backendUrl) return;
        setCheckingUsername(true);
        try {
            const res = await fetch(`${backendUrl}/api/check-username`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (res.ok && data.exists) {
                setUsernameError("Username is already taken.");
                setUsernameAvailable(null);
            } else if (res.ok && username.length > 0) {
                setUsernameError(null);
                setUsernameAvailable("Username is available.");
            } else {
                setUsernameError(null);
                setUsernameAvailable(null);
            }
        } catch (err) {
            setUsernameError("Could not check username.");
            setUsernameAvailable(null);
        } finally {
            setCheckingUsername(false);
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


                        {/* Signup Form */}

                        <form onSubmit={handleSubmit} noValidate>

                            {/* Full Name */}
                            <div className="mb-3">
                                <label htmlFor="fullName" className="form-label">Full Name</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    placeholder=""
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
                                    placeholder=""
                                    className="form-control"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={checkUsernameExists}
                                    required
                                />
                                {checkingUsername && (
                                    <div className="text-secondary mt-1" style={{fontSize: "0.95em"}}>Checking username...</div>
                                )}
                                {usernameError && (
                                    <div className="text-danger mt-1" style={{fontSize: "0.95em"}}>{usernameError}</div>
                                )}
                                {usernameAvailable && !usernameError && (
                                    <div className="text-success mt-1" style={{fontSize: "0.95em"}}>{usernameAvailable}</div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder=""
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                                {emailError && (
                                    <div className="text-danger mt-1" style={{fontSize: "0.95em"}}>{emailError}</div>
                                )}
                            </div>


                            {/* Password */}
                            <div className="mb-2">
                                <label htmlFor="password" className="form-label">Password</label>
                                <input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                            
                            {/* Password requirements box */}
                            <div className="mb-2 " style={{fontSize: "0.97em"}}>
                                <div className="p-2 rounded dark-mode:bg-secondary">
                                    <strong className="text-dark-emphasis">Password must contain:</strong>
                                    <ul className="mb-0" style={{listStyle: "none", paddingLeft: 0}}>
                                        {passwordRequirements.map((req, idx) => (
                                            <li key={idx} style={{color: req.test(password) ? "#198754" : "var(--text-secondary)", display: "flex", alignItems: "center"}}>
                                                <span style={{fontWeight: req.test(password) ? "bold" : "normal", marginRight: "0.5em"}}>
                                                    {req.test(password)
                                                        ? <CheckCircle2 size={18} color="#198754" style={{verticalAlign: "middle"}} />
                                                        : <Circle size={18} color="#6c757d" style={{verticalAlign: "middle"}} />
                                                    }
                                                </span>
                                                {req.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Show characters in password */}
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