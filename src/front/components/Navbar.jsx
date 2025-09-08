import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, Moon, Sun } from "lucide-react";


export const Navbar = () => {
	const navigate = useNavigate();
	const token = localStorage.getItem("token");
	const [darkMode, setDarkMode] = useState(false);

	useEffect(() => {
		// Check if user has a dark mode preference saved
		const isDark = localStorage.getItem("darkMode") === "true";
		setDarkMode(isDark);
		if (isDark) {
			document.documentElement.classList.add("dark-mode");
		}
	}, []);

	const toggleDarkMode = () => {
		const newDarkMode = !darkMode;
		setDarkMode(newDarkMode);
		localStorage.setItem("darkMode", newDarkMode);
		document.documentElement.classList.toggle("dark-mode");
	};

	const handleLogout = () => {
		if (localStorage.getItem("token")) {
			localStorage.removeItem("token");
			alert("You have successfully logged out ✅");
		}
		navigate("/");
	};


	
	return (
		<nav className="navbar navbar-expand-lg navbar-light bg-light">
			<div className="container">

				{/* Logo and Name */}
				<Link to="/" className="navbar-brand mb-0 h1 d-flex align-items-center gap-2">
					<ChefHat size={32} strokeWidth={2.2} className="text-primary" />
					<span className="fw-bold">Tastebook</span>
				</Link>

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

				{/* Links */}
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
							<button onClick={handleLogout} className="btn btn-danger w-100">Log out</button>
						)}
					</div>			

				</div>

			</div>
		</nav>
	);
};
