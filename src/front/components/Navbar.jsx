
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat } from "lucide-react";


export const Navbar = () => {

	const navigate = useNavigate();

	const token = localStorage.getItem("token");

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
					
					<div className="ms-auto d-flex gap-2">
						{!token ? (
							<>
								<ul className="navbar-nav ms-auto align-items-lg-center gap-2">

									{/* <li className="nav-item">
										<Link to="/about" className="nav-link">
											About
										</Link>
									</li> */}


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
						) : (
							<>
								<button onClick={handleLogout} className="btn btn-danger">Log out</button>
							</>
						)}
					</div>			

				</div>

			</div>
		</nav>
	);
};
