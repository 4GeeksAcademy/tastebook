import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, Moon, Sun, Cog, DoorOpen, FilePlus, Heart, Bookmark } from "lucide-react";
import UserAvatar from "./UserAvatar";


export const Navbar = () => {
	const navigate = useNavigate();
	const token = localStorage.getItem("token");
	const [darkMode, setDarkMode] = useState(false);
	const [userData, setUserData] = useState(null);

	useEffect(() => {
		// Check if user has a dark mode preference saved
		const isDark = localStorage.getItem("darkMode") === "true";
		setDarkMode(isDark);
		if (isDark) {
			document.documentElement.classList.add("dark-mode");
		}
	}, []);

	useEffect(() => {
		// Fetch user data if logged in
		const fetchUserData = async () => {
			if (!token) {
				setUserData(null);
				return;
			}
			
			const backendUrl = import.meta.env.VITE_BACKEND_URL;
			if (!backendUrl) return;
			
			try {
				const resp = await fetch(`${backendUrl}/api/settings`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`
					}
				});
				
				if (resp.ok) {
					const data = await resp.json();
					setUserData(data.current_user);
				} else {
					console.error("Failed to fetch user data");
					setUserData(null);
				}
			} catch (error) {
				console.error("Failed to fetch user data:", error);
				setUserData(null);
			}
		};

		fetchUserData();

		// Listen for user data updates from Settings page
		const handleUserUpdate = (event) => {
			if (event.detail && event.detail.userData) {
				setUserData(event.detail.userData);
			}
		};

		window.addEventListener('userDataUpdated', handleUserUpdate);

		return () => {
			window.removeEventListener('userDataUpdated', handleUserUpdate);
		};
	}, [token]);

	const toggleDarkMode = () => {
		const newDarkMode = !darkMode;
		setDarkMode(newDarkMode);
		localStorage.setItem("darkMode", newDarkMode);
		document.documentElement.classList.toggle("dark-mode");
	};

	const handleLogout = () => {
		if (localStorage.getItem("token")) {
			localStorage.removeItem("token");
			setUserData(null);
			alert("You have successfully logged out ✅");
		}
		navigate("/");
	};


	const handleAvatarClick = () => {
		if (userData?.username) {
			navigate(`/user/${userData.username}`);
		} else {
			navigate("/users");
		}
	};

	
	return (
		<nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
			<div className="container">

				{/* Logo and Name */}
				<Link to="/" className="navbar-brand mb-0 h1 d-flex align-items-center gap-2">
					<ChefHat size={32} strokeWidth={2.2} className="text-primary" />
					<span className="fw-bold">Tastebook</span>
				</Link>

				{/* Navigation Links */}
				<div className="d-flex gap-3 ms-4">
					<Link to="/all-recipes" className="nav-link text-decoration-none fw-semibold text-secondary">
						All Recipes
					</Link>
					<Link to="/collections" className="nav-link text-decoration-none fw-semibold text-secondary">
						Collections
					</Link>
					<Link to="/users" className="nav-link text-decoration-none fw-semibold text-secondary">
						Users
					</Link>
				</div>

				{/* Toggler (mobile) */}
				<button
					className="navbar-toggler"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#navbarContent"
					aria-controls="navbarContent"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon"></span>
				</button>


				<div className="collapse navbar-collapse" id="navbarContent">
					<div className="ms-auto d-flex gap-2 align-items-center flex-lg-row flex-column text-center">
						<button
							onClick={toggleDarkMode}
							className="btn btn-link text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto"
							aria-label="Toggle dark mode"
						>
							{darkMode ? (
								<Sun size={20} className="text-warning" />
							) : (
								<Moon size={20} className="text-primary" />
							)}
						</button>

						{!token ? (

							<>
								<ul className="navbar-nav ms-auto align-items-lg-center gap-2">



									<li className="nav-item">
										<Link to="/login" className="btn btn-primary ms-lg-2">
											Log in
										</Link>
									</li>


									<li className="nav-item">
										<Link to="/signup" className="btn btn-outline-primary">
											Sign up
										</Link>
									</li>

								</ul>
							</>

							// <ul className="navbar-nav ms-auto align-items-lg-center gap-2 flex-lg-row flex-column w-100">

							// 	<li className="nav-item">

							// 		<Link to="/login" className="btn btn-primary ms-lg-2 w-100 mb-lg-0 mb-2">
							// 			Log in
							// 		</Link>
							// 	</li>


							// 	<li className="nav-item">

							// 		<Link to="/signup" className="btn btn-outline-primary w-100">
							// 			Sign up
							// 		</Link>

							// 	</li>
							// </ul>
							
						) : (
							<>
								<Link to="/new-recipe" className="btn btn-link text-success text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto" title="New Recipe">
									<FilePlus size={22} />
								</Link>

								<Link to="/my-collections" className="btn btn-link text-secondary text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto" title="My Collections">
									<Bookmark size={22} />
								</Link>
								<Link to="/liked-recipes" className="btn btn-link text-danger text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto" title="Liked Recipes">
									<Heart size={22} />
								</Link>

								<Link to="/settings" className="btn btn-link text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto" title="Settings">
									<Cog size={22} />
								</Link>

								{/* User Avatar */}
								<UserAvatar
									imageUrl={userData?.cloudinary_url}
									username={userData?.username}
									fullName={userData?.full_name}
									size="medium"
									onClick={handleAvatarClick}
									className="me-2"
								/>

								<button onClick={handleLogout} className="btn btn-light border-0 text-danger"><DoorOpen size={22} /></button>
							</>
						)}
					</div>			

				</div>

			</div>
		</nav>
	);
};
