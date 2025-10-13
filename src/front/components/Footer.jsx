import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Github, Mail, Palette, Settings, ShieldCheck } from "lucide-react";
import MiniThemeSelector from "./MiniThemeSelector";
import ThemeToggle from "./ThemeToggle";

export const Footer = () => {

	const year = new Date().getFullYear();
	const backendUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== "undefined" ? window.location.origin : "");
	const adminUrl = backendUrl ? `${backendUrl.replace(/\/$/, "")}/admin` : "/admin";

	return (
		<footer className="border-top my-auto">

			<div className="container py-2">

				
				<div className="d-flex justify-content-between align-items-center">

                    {/* Brand */}
					<div className="text-center text-md-start">
						<Link to="/" className="navbar-brand mb-0 h1 fw-bold" style={{fontSize: "1.1rem"}}>Tastebook</Link>
						<small className="text-muted d-block" style={{fontSize: "0.85rem"}}>Share the taste</small>
					</div>


					{/* Footer Links */}
					<div className="text-center text-md-end">


						{/* Theme Dropdown */}
						<div className="dropdown d-inline-block">

							<button 
								className="btn btn-link text-muted border-0" 
								type="button" 
								id="themeDropdown" 
								data-bs-toggle="dropdown" 
								aria-expanded="false"
								title="Theme settings"
								style={{ background: 'none' }}
							>
								<Palette size={16} strokeWidth={2} />

							</button>

							<div className="dropdown-menu dropdown-menu-end p-3" aria-labelledby="themeDropdown">
								
                                {/* <MiniThemeSelector /> -- DEPRECATED */}
                        
								{/* <hr className="my-2" /> */}

								<div className="text-center">
									<Link 
										to="/theme" 
										className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1"
										style={{ fontSize: '0.75rem' }}
									>
										<Settings size={16} strokeWidth={2} />
										Theme Settings
									</Link>
								</div>
							</div>
						</div>

						{/* Direct Link to Theme Settings -COMMENTED OUT */}
						{/* <Link to="/theme" className="text-muted" title="Theme settings">
							<Settings size={16} strokeWidth={2} />
						</Link> */}


						{/* Admin Panel - Dropdown */}
						<div className="dropdown d-inline-block m-2">
							<button 
								className="btn btn-link text-muted p-0 border-0" 
								type="button" 
								id="themeDropdown" 
								data-bs-toggle="dropdown" 
								aria-expanded="false"
								title="Admin panel"
								style={{ background: 'none' }}
							>
                                <ShieldCheck size={16} strokeWidth={2.4} />
							</button>

							<div className="dropdown-menu dropdown-menu-end p-3" aria-labelledby="themeDropdown">
								<div className="text-center">
									<Link 
										to="/admin-access"
										className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1"
										style={{ fontSize: '0.75rem' }}
									>
										<Settings size={14} strokeWidth={2} />
										Admin access
									</Link>
								</div>
							</div>
						</div>

                        {/* Admin Panel - Dropdown */}
						{/* <a href={adminUrl} className="text-muted me-2" title="Admin panel">
							<ShieldCheck size={16} strokeWidth={2.4} />
						</a> */}




                        {/* SOCIAL LINKS: */}

                        {/* Twitter */}
						<a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted ms-4 me-2">
							<Twitter size={16} strokeWidth={2} />
						</a>

                        {/* Github */}
						<a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted me-2">
							<Github size={16} strokeWidth={2} />
						</a>

                        {/* Email */}
						<a href="mailto:contact@yourapp.com" className="text-muted">
							<Mail size={16} strokeWidth={2} />
						</a>

					</div>
				</div>


				{/* <hr style={{margin: "0.5rem 0"}} /> */}

				{/* Legal - REMOVED TO MAKE FOOTER SMALLER*/}
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
