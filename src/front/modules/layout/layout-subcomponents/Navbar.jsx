import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ChefHat, Cog, DoorOpen, FilePlus, Heart, Bookmark, MessageCircle, Menu, User } from "lucide-react";

import UserAvatar from "../../../shared/shared-components/UserAvatar";
import socketService from "../../../shared/utils/socketService";

import ThemeToggle from "../../theme-settings/components/ThemeToggle"; //Imported for final CSS styling implementation

const UNREAD_COUNT_CACHE_MS = 5000;


// DROPDOWN styling Constants
// -- Centralized icon size for Lucide icons in the user dropdown
const DROPDOWN_ICON_SIZE = 22;
// -- Centralized font sizes in the user dropdown
const DROPDOWN_FONT_SIZE = 18;
// -- Centralized font sizes in the user dropdown
const DROPDOWN_STROKE_WIDTH = 2.2;

// Helper function to only log in development environment
const debugLog = (...args) => {
	if (import.meta.env.MODE === 'development') {
		console.log(...args);
	}
};

// Module-level throttle cache to avoid using window globals
const navbarThrottleCache = new Map();

export const Navbar = () => {
	const navigate = useNavigate();
	const token = localStorage.getItem("token");
	const [userData, setUserData] = useState(null);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isSocketConnected, setIsSocketConnected] = useState(false);
	const currentUserRef = useRef(null);
	const lastFetchTime = useRef(0);
	const navbarHandlersRegisteredRef = useRef(false); // Track navbar handler registration

	// Helper function to update user data consistently
	const updateUserData = useCallback((newUserData) => {
		setUserData(newUserData);
		currentUserRef.current = newUserData;
	}, []);

	// WebSocket connection status tracking and auto-connection
	useEffect(() => {
		const handleConnectionChange = (data) => {
			setIsSocketConnected(data.connected);
			debugLog('[NAVBAR] Socket connection status:', data.connected);
		};

		// Set initial connection status
		setIsSocketConnected(socketService.getConnectionStatus());

		// Listen for connection changes
		socketService.on('connection_status_changed', handleConnectionChange);

		// Auto-connect if not already connected and user is logged in
		const initializeConnection = async () => {
			if (!socketService.getConnectionStatus() && token) {
				debugLog('[NAVBAR] Auto-connecting to WebSocket for real-time updates...');
				try {
					await socketService.connect();
					debugLog('[NAVBAR] ✅ WebSocket connected successfully');
				} catch (error) {
					console.warn('[NAVBAR] ⚠️ Failed to connect to WebSocket:', error.message || error);
					// Non-critical error - app can work without real-time features
				}
			}
		};

		// Small delay to let global initialization complete first
		const connectionTimer = setTimeout(initializeConnection, 500);

		return () => {
			clearTimeout(connectionTimer);
			socketService.off('connection_status_changed', handleConnectionChange);
		};
	}, [token]);

	// Optimized unread count fetcher with caching
	const fetchUnreadCount = useCallback(async (force = false) => {
		if (!token) {
			setUnreadCount(0);
			return;
		}
		
		// Prevent too frequent API calls (cache for 5 seconds unless forced)
		const now = Date.now();
		if (!force && (now - lastFetchTime.current) < UNREAD_COUNT_CACHE_MS) {
			return;
		}
		lastFetchTime.current = now;
		
		const backendUrl = import.meta.env.VITE_BACKEND_URL;
		if (!backendUrl) return;
		
		try {
			const resp = await fetch(`${backendUrl}/api/messages/unread-count`, {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			
			if (resp.ok) {
				const data = await resp.json();
				setUnreadCount(data.unread_count);
			} else {
				setUnreadCount(0);
			}
		} catch (error) {
			console.error("Error fetching unread count:", error);
			setUnreadCount(0);
		}
	}, [token]);

	// Real-time WebSocket handlers for instant updates (using useCallback for stability)
	const handleNewMessage = useCallback((data) => {
		debugLog('[NAVBAR] 📨 GLOBAL MESSAGE HANDLER TRIGGERED:', data);
		const { chat_id, message } = data;
		
		// PERFORMANCE: Throttle rapid successive global messages
		const messageKey = `global_${message.id || message.message_id}_${chat_id}`;
		const now = Date.now();
		
		const lastProcessed = navbarThrottleCache.get(messageKey);
		if (lastProcessed && (now - lastProcessed) < 100) { // 100ms throttle
			debugLog('[NAVBAR] ⚡ Throttling duplicate global message:', messageKey);
			return;
		}
		navbarThrottleCache.set(messageKey, now);
		
		// Clean up old entries
		if (navbarThrottleCache.size > 30) {
			const entries = Array.from(navbarThrottleCache.entries());
			entries.slice(0, 15).forEach(([key]) => navbarThrottleCache.delete(key));
		}
		
		const isCurrentUserMessage = message.sender_id === currentUserRef.current?.user_id;
		
		debugLog('[NAVBAR] Current user ID:', currentUserRef.current?.user_id);
		debugLog('[NAVBAR] Message sender ID:', message.sender_id);
		debugLog('[NAVBAR] Is current user message:', isCurrentUserMessage);
		
		// Only increment if message is NOT from current user
		if (!isCurrentUserMessage) {
			setUnreadCount(prev => {
				const newCount = prev + 1;
				debugLog('[NAVBAR] 📨 Incrementing unread count from', prev, 'to', newCount);
				return newCount;
			});
		} else {
			debugLog('[NAVBAR] 📨 Skipping count increment - message is from current user');
		}
	}, []);

	const handleMessagesRead = useCallback((data) => {
		const { user_id } = data;
		
		// Only decrement if current user marked messages as read
		if (user_id === currentUserRef.current?.user_id) {
			// Refresh count from server to get accurate number
			fetchUnreadCount(true);
			debugLog('[NAVBAR] 👀 Messages marked read - refreshing count');
		}
	}, [fetchUnreadCount]);

	const handleChatDeleted = useCallback(() => {
		// Refresh count when chat is deleted using stable reference
		const fetchCount = async () => {
			if (!token) {
				setUnreadCount(0);
				return;
			}
			
			const backendUrl = import.meta.env.VITE_BACKEND_URL;
			if (!backendUrl) return;
			
			try {
				const resp = await fetch(`${backendUrl}/api/messages/unread-count`, {
					method: "GET",
					headers: {
						"Authorization": `Bearer ${token}`
					}
				});
				
				if (resp.ok) {
					const data = await resp.json();
					setUnreadCount(data.unread_count);
				}
			} catch (error) {
				console.error("Error fetching unread count:", error);
			}
		};
		
		fetchCount();
		debugLog('[NAVBAR] 🗑️ Chat deleted - refreshing count');
	}, [token]); // Only depend on token

	useEffect(() => {
		// Fetch user data if logged in
		const fetchUserData = async () => {
			if (!token) {
				updateUserData(null);
				setUnreadCount(0);
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
					updateUserData(data.current_user);
					
					// Fetch unread count immediately after user data is loaded
					await fetchUnreadCount(true);
					debugLog('[NAVBAR] ✅ User data and unread count loaded');
				} else {
					console.error("Failed to fetch user data");
					updateUserData(null);
				}
			} catch (error) {
				console.error("Failed to fetch user data:", error);
				updateUserData(null);
			}
		};

		fetchUserData();

		// Listen for manual refresh events (e.g., from Messages page)
		const handleMessageUpdate = () => {
			fetchUnreadCount(true);
		};

		// Listen for user data updates from Settings page
		const handleUserUpdate = (event) => {
			if (event.detail && event.detail.userData) {
				updateUserData(event.detail.userData);
			}
		};

		window.addEventListener('userDataUpdated', handleUserUpdate);
		window.addEventListener('messageUpdate', handleMessageUpdate);

		// Fallback polling every 2 minutes (much less frequent than before)
		const interval = setInterval(() => fetchUnreadCount(), 120000);

		return () => {
			// Clean up event listeners
			window.removeEventListener('userDataUpdated', handleUserUpdate);
			window.removeEventListener('messageUpdate', handleMessageUpdate);
			clearInterval(interval);
		};
	}, [token, fetchUnreadCount, updateUserData]);

	// Setup WebSocket event handlers when connected and user is available - PREVENT DUPLICATES
	useEffect(() => {
		if (!isSocketConnected || !userData?.user_id) {
			// Clean up if disconnected or no user
			if (navbarHandlersRegisteredRef.current) {
				debugLog('[NAVBAR] Cleaning up handlers due to disconnect/logout');
				socketService.off('global_message_received', handleNewMessage);
				socketService.off('global_messages_read', handleMessagesRead);
				socketService.off('global_chat_deleted', handleChatDeleted);
				navbarHandlersRegisteredRef.current = false;
			}
			return;
		}

		// Only register if not already registered
		if (!navbarHandlersRegisteredRef.current) {
			debugLog('[NAVBAR] Setting up WebSocket event handlers for user:', userData.user_id);
			debugLog('[NAVBAR] Current listeners before adding:', socketService.listeners.get('global_message_received')?.length || 0);

			// Set up WebSocket listeners for real-time updates (using GLOBAL events for Navbar)
			socketService.on('global_message_received', handleNewMessage);
			socketService.on('global_messages_read', handleMessagesRead);
			socketService.on('global_chat_deleted', handleChatDeleted);
			navbarHandlersRegisteredRef.current = true;

			debugLog('[NAVBAR] Current listeners after adding:', socketService.listeners.get('global_message_received')?.length || 0);
		} else {
			debugLog('[NAVBAR] Navbar handlers already registered, skipping setup');
		}

		return () => {
			// Only clean up on component unmount
			debugLog('[NAVBAR] Effect cleanup - keeping navbar handlers registered for now');
		};
	}, [isSocketConnected, userData?.user_id]);
	
	// Clean up handlers only on component unmount
	useEffect(() => {
		return () => {
			if (navbarHandlersRegisteredRef.current) {
				debugLog('[NAVBAR] Component unmounting - cleaning up all navbar handlers');
				socketService.off('global_message_received', handleNewMessage);
				socketService.off('global_messages_read', handleMessagesRead);
				socketService.off('global_chat_deleted', handleChatDeleted);
				navbarHandlersRegisteredRef.current = false;
			}
		};
	}, []); // Empty dependency array = only on unmount

	const handleLogout = () => {
		if (localStorage.getItem("token")) {
			localStorage.removeItem("token");
			updateUserData(null);
			setUnreadCount(0);
			alert("You have successfully logged out ✅");
		}
		navigate("/");
	};


	const profilePath = userData?.username ? `/user/${userData.username}` : "/users";

	// Helper to navigate using react-router and reliably close the Bootstrap offcanvas
	const handleOffcanvasLinkClick = useCallback((e, path) => {
		if (e && e.preventDefault) e.preventDefault();
		// Programmatic navigation ensures SPA routing works even if Bootstrap intercepts click
		navigate(path);

		// Try to close the offcanvas via Bootstrap's JS API if available
		const el = document.getElementById('navigationSidebar');
		if (!el) return;

		const bs = window.bootstrap;
		if (bs && bs.Offcanvas) {
			const inst = bs.Offcanvas.getInstance(el) || new bs.Offcanvas(el);
			try { inst.hide(); } catch (err) { /* Non-critical */ }
		} else {
			el.classList.remove('show');
			document.body.classList.remove('offcanvas-open');
			const backdrop = document.querySelector('.offcanvas-backdrop');
			if (backdrop && backdrop.parentNode) {
				backdrop.parentNode.removeChild(backdrop);
			}
		}
	}, [navigate]);

	return (
		<>

			{/* Sidebar Offcanvas - ONLY visible on smaller screens */}
			<div className="offcanvas offcanvas-start" tabIndex="-1" id="navigationSidebar" aria-labelledby="navigationSidebarLabel">
				
				{/* Offcanvas Header */}
				<div className="offcanvas-header">

                    {/* This has the id "navigationSidebarLabel" but idk what it does, so it is d-none */}
					<h5 className="offcanvas-title d-none" id="navigationSidebarLabel">
						<ChefHat size={24} className="text-primary me-2" />
						Navigation
					</h5>

					{!token && (
						<Link 
							to="/signup" 
							className="btn btn-primary btn-lg fs-4 fw-semibold my-2 ms-2"
							// *Use onClick with handleOffcanvasLinkClick to ensure both navigation (SPA) and offcanvas closing work reliably.
			                // data-bs-dismiss does not work as expected with React Router's <Link> because it does not trigger a native page reload.
							onClick={e => handleOffcanvasLinkClick(e, '/signup')}
						>
							Join the Comunity
						</Link>
					)}

					<button type="button" className="btn btn-lg btn-close me-2" data-bs-dismiss="offcanvas" aria-label="Close"></button>
		
		        </div>


		        {/* Offcanvas Body */}
				<div className="offcanvas-body">
					<div className="d-flex flex-column gap-3">

						<Link 
							to="/all-recipes" 
							className="nav-link text-decoration-none fs-1 fw-semibold text-secondary p-2 rounded"
		                    // data-bs-dismiss="offcanvas"
							onClick={(e) => handleOffcanvasLinkClick(e, '/all-recipes')}
						>
							All Recipes
						</Link>

						<Link 
							to="/collections" 
							className="nav-link text-decoration-none fs-1 fw-semibold text-secondary p-2 rounded"
		                    // data-bs-dismiss="offcanvas"
							onClick={(e) => handleOffcanvasLinkClick(e, '/collections')}
						>
							Collections
						</Link>

						<Link 
							to="/users" 
							className="nav-link text-decoration-none fs-1 fw-semibold text-secondary p-2 rounded"
		                    // data-bs-dismiss="offcanvas"
							onClick={(e) => handleOffcanvasLinkClick(e, '/users')}
						>
							Users
						</Link>

					</div>

				</div>
			</div>




			{/* MAIN Navbar */}
			<nav className="navbar navbar-expand-lg shadow-sm">
				<div className="container">


					{/* Hamburger Menu Button - Only visible on smaller screens */}
					<button
						className="btn btn-link text-secondary p-1 me-1 d-lg-none" 
						type="button" 
						data-bs-toggle="offcanvas" 
						data-bs-target="#navigationSidebar" 
						aria-controls="navigationSidebar"
						title="Open Navigation Menu"
					>
						<Menu size={26} />
					</button>


					{/* Logo and Name */}
					<Link to="/" className="navbar-brand mb-0 h1 d-flex align-items-start gap-1">
						<ChefHat size={26} strokeWidth={2.7} className="text-primary" />
						<span className="fw-bold">Tastebook</span>
					</Link>


					{/* Navigation Links - Only visible on larger screens */}
					<div className="d-none d-lg-flex gap-3 ms-4">

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


                    <div className="d-flex ms-auto align-items-end me-2">

                            {/* Theme Toggle Button */}
							<ThemeToggle />

                            {/* Messages with Unread Count Badge */}
                            {token && (
                                <Link to="/messages" className="btn btn-link text-info text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto position-relative" title="Messages">
                                    
                                    <MessageCircle size={26} strokeWidth={2.7}/>
                                    
                                    { unreadCount > 0 && (
                                        <span 
                                            key={unreadCount} // Force re-render with animation when count changes
                                            className="position-absolute top-0 start-100 badge rounded-pill bg-danger"
                                            style={{ fontSize: "0.65rem",  transform: 'translate(-100%, 5%)' }}
                                        >
                                            { unreadCount > 99 ? "99+" : unreadCount }
                                        </span>
                                    )}
                                </Link>
                            )}
					</div>



					<div className="d-flex align-items-center gap-2">
						

						{!token ? (

                            // AUTH LINKS - Different styles for small vs large screens
							<>
                                {/* Large screens - Log in */}
								<Link to="/login"  className="btn btn-primary        d-none d-lg-inline-flex align-items-center">
									Log in
								</Link>

                                {/* Large screens - Sign up */}
								<Link to="/signup" className="btn btn-outline-primary d-none d-lg-inline-flex align-items-center">
									Sign up
								</Link>

                                {/* Small screens  - Log in */}
								<Link to="/login"  className="btn btn-primary d-inline-flex d-lg-none align-items-center">
									Log in
								</Link>
							</>

						) : (


                            // USER AVATAR DROPDOWN
							<div className="dropdown">

								<button
									type="button"
									className="btn p-0 border-0 d-flex align-items-center"
									data-bs-toggle="dropdown"
									aria-expanded="false"
								>
									<UserAvatar
										imageUrl={userData?.cloudinary_url}
										username={userData?.username}
										fullName={userData?.full_name}
										size="medium"
										className="me-1"
									/>
								</button>

                                {/* Dropdown Menu */}
								<ul className="dropdown-menu dropdown-menu-end shadow">


                                    {/* Profile */}
									<li>
										<Link to={profilePath} className="dropdown-item d-flex align-items-center gap-2">
											<User size={DROPDOWN_ICON_SIZE} strokeWidth={2.5} />
											<span className="m-1" style={{ fontSize: `${DROPDOWN_FONT_SIZE}px` }}>Profile</span>
										</Link>
									</li>


								<li><hr className="dropdown-divider" /></li>


                                    {/* New Recipe */}
									<li>
										<Link to="/new-recipe" className="dropdown-item d-flex align-items-center gap-2">
											<FilePlus size={DROPDOWN_ICON_SIZE} className="text-success" strokeWidth={DROPDOWN_STROKE_WIDTH} />
											<span className="m-1" style={{ fontSize: `${DROPDOWN_FONT_SIZE}px` }}>New Recipe</span>
										</Link>
									</li>

                                    {/* My Collections */}
									<li>
										<Link to="/my-collections" className="dropdown-item d-flex align-items-center gap-2">
											<Bookmark size={DROPDOWN_ICON_SIZE} className="text-secondary" strokeWidth={DROPDOWN_STROKE_WIDTH}  />
											<span className="m-1" style={{ fontSize: `${DROPDOWN_FONT_SIZE}px` }}>My Collections</span>
										</Link>
									</li>

                                    {/* Messages with unread count */}
									<li>
										<Link to="/messages" className="dropdown-item d-flex align-items-center gap-2">
											<MessageCircle size={DROPDOWN_ICON_SIZE} className="text-info" strokeWidth={DROPDOWN_STROKE_WIDTH} />
											<span className="m-1" style={{ fontSize: `${DROPDOWN_FONT_SIZE}px` }}>Messages</span>
											{unreadCount > 0 && (
												<span className="badge bg-danger ms-auto">
													{ unreadCount > 99 ? "99+" : unreadCount }
												</span>
											)}
										</Link>
									</li>


                                    {/* Liked Recipes */}
									<li>
										<Link to="/liked-recipes" className="dropdown-item d-flex align-items-center gap-2">
											<Heart size={DROPDOWN_ICON_SIZE} className="text-danger" strokeWidth={DROPDOWN_STROKE_WIDTH}  />
											<span className="m-1" style={{ fontSize: `${DROPDOWN_FONT_SIZE}px` }}>Liked Recipes</span>
										</Link>
									</li>


                                <li><hr className="dropdown-divider" /></li>


                                    {/* Settings */}
									<li>
										<Link to="/settings" className="dropdown-item d-flex align-items-center gap-2">
											<Cog size={DROPDOWN_ICON_SIZE} strokeWidth={DROPDOWN_STROKE_WIDTH} />
											<span className="m-1" style={{ fontSize: `${DROPDOWN_FONT_SIZE}px` }}>Settings</span>
										</Link>
									</li>


                                <li><hr className="dropdown-divider" /></li>


                                    {/* Log out */}
                                    <li>
										<button type="button" className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={handleLogout}>
											<DoorOpen size={DROPDOWN_ICON_SIZE} strokeWidth={DROPDOWN_STROKE_WIDTH} />
											<span className="m-1" style={{ fontSize: `${DROPDOWN_FONT_SIZE}px` }}>Log out</span>
										</button>
                                    </li>
								
                                </ul>

							</div>
						)}
					</div>

				</div>

			</nav>

		</>
	);
};