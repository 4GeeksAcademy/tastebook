import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Github, Mail } from "lucide-react";

export const Footer = () => {

	const year = new Date().getFullYear();

	return (
		<footer className="bg-light border-top mt-auto" style={{paddingTop: "0.5rem", paddingBottom: "0.5rem"}}>
			<div className="container py-2">
				{/* Brand */}
				<div className="row gy-1 align-items-center">
					<div className="col-md-6 text-center text-md-start">
						<Link to="/" className="navbar-brand mb-0 h1 fw-bold" style={{fontSize: "1.1rem"}}>Tastebook</Link>
						<small className="text-muted d-block" style={{fontSize: "0.85rem"}}>Share the taste</small>
					</div>

					{/* Social */}
					<div className="col-md-6 text-center text-md-end">
						<a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted me-2">
							<Twitter size={16} strokeWidth={2} />
						</a>
						<a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted me-2">
							<Github size={16} strokeWidth={2} />
						</a>
						<a href="mailto:contact@yourapp.com" className="text-muted">
							<Mail size={16} strokeWidth={2} />
						</a>
					</div>
				</div>

				{/* <hr style={{margin: "0.5rem 0"}} /> */}

				{/* Legal */}
				{/* <div className="d-flex justify-content-between flex-column flex-sm-row" style={{gap: "0.5rem"}}>
					<small className="text-muted" style={{fontSize: "0.85rem"}}>© {year} Tastebook. All rights reserved.</small>
					<div>
						<Link to="/terms" className="text-muted me-2" style={{fontSize: "0.85rem"}}>Terms</Link>
						<Link to="/privacy" className="text-muted" style={{fontSize: "0.85rem"}}>Privacy</Link>
					</div>
				</div> */}

			</div>
		</footer>
	);
}
