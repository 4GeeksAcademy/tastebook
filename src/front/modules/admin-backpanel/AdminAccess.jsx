import React, { useState, useEffect } from 'react';

export const AdminAccess = () => {
    const [adminStatus, setAdminStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const backendUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const adminUrl = backendUrl ? `${backendUrl.replace(/\/$/, "")}/admin` : "/admin";

    const checkAdmin = async () => {
        setLoading(true);
        setMessage("");
        try {
            const response = await fetch(`${backendUrl}/api/check-admin`);
            const data = await response.json();
            setAdminStatus(data);
            setMessage(data.msg);
        } catch (error) {
            setMessage("Error checking admin status: " + error.message);
        }
        setLoading(false);
    };

    const createAdmin = async () => {
        setLoading(true);
        setMessage("");
        try {
            const response = await fetch(`${backendUrl}/api/create-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setAdminStatus(data);
            setMessage(data.msg);
            if (response.ok && data.admin) {
                setMessage(`${data.msg}. Admin created: ${data.admin.username} (${data.admin.email})`);
            }
        } catch (error) {
            setMessage("Error creating admin: " + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <h1 className="text-center mb-4">Admin Backpanel Access</h1>

                    <div className="card shadow">
                        <div className="card-body">
                            <h5 className="card-title">How to Access the Admin Backpanel</h5>
                            <p className="card-text">
                                The admin backpanel allows you to manage users, recipes, and other data in the Tastebook application.
                                It is powered by Flask-Admin and provides a web interface for administrative tasks.
                            </p>
                            <ol>
                                <li>Ensure an admin user exists in the system.</li>
                                <li>Access the admin panel at: <br /> <a href={adminUrl} target="_blank" rel="noopener noreferrer">{adminUrl}</a></li>
                                <li>Log in using admin credentials.</li>
                            </ol>

                            <hr className="my-3" />

                            <div className="mt-4">
                                <button
                                    className="btn btn-primary me-2"
                                    onClick={checkAdmin}
                                    disabled={loading}
                                >
                                    {loading ? "Checking..." : "Check Admin Status"}
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={createAdmin}
                                    disabled={loading}
                                >
                                    {loading ? "Creating..." : "Create Admin User"}
                                </button>
                            </div>

                            {message && (
                                <div className={`alert mt-3 ${adminStatus && adminStatus.admins ? "alert-success" : "alert-warning"}`}>
                                    {message}
                                </div>
                            )}

                            <hr className="my-3" />

                            {adminStatus && adminStatus.admins && (
                                
                                
                                <div className="mt-3">
                                    
                                    <h5>Existing Admin Users:</h5>
                                    <ul>
                                        {adminStatus.admins.map(admin => (

                                            <div key={admin.id}>


                                                <div className="my-3">
                                                    <ul className="list-unstyled">
                                                        <li> <strong>ID:</strong>       {admin.id}       </li>
                                                        <li> <strong>Email:</strong>    {admin.email}    </li>
                                                        <li> <strong>Username:</strong> {admin.username} </li>
                                                    </ul>
                                                </div>


                                            </div>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-4">
                                <a href={adminUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                                    Open Admin Backpanel
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};