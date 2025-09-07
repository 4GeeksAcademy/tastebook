
import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Github, Mail } from "lucide-react";

export const Footer = () => {

	// Year
	const year = new Date().getFullYear();


		return (
			<footer className="bg-light border-top mt-auto">
				<div className="container py-4">
					
					{/* Brand */}
					<div className="row gy-3 align-items-center">
						<div className="col-md-6 text-center text-md-start">
							<Link to="/" className="navbar-brand mb-0 h1 fw-bold">Tastebook</Link>
							<small className="text-muted d-block">Share the taste</small>
						</div>

						{/* Social */}
						<div className="col-md-6 text-center text-md-end">
							<a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted me-3">
								<Twitter size={22} strokeWidth={2} />
							</a>
							<a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted me-3">
								<Github size={22} strokeWidth={2} />
							</a>
							<a href="mailto:contact@yourapp.com" className="text-muted">
								<Mail size={22} strokeWidth={2} />
							</a>
						</div>

					</div>


					<hr />

					{/* Legal */}
					<div className="d-flex justify-content-between flex-column flex-sm-row">
						<small className="text-muted">© {year} Tastebook. All rights reserved.</small>
						<div>
							<Link to="/terms" className="text-muted me-3">Terms</Link>
							<Link to="/privacy" className="text-muted">Privacy</Link>
						</div>
					</div>
				</div>
			</footer>
		);
	}
