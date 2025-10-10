import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, Cog, DoorOpen, FilePlus, Heart, Bookmark, MessageCircle } from "lucide-react";
import UserAvatar from "./UserAvatar";
import socketService from "../utils/socketService";

import ThemeToggle from "./ThemeToggle"; //Imported for final CSS styling implementation

const UNREAD_COUNT_CACHE_MS = 5000;

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
			console.log('[NAVBAR] Socket connection status:', data.connected);
		};

		// Set initial connection status
		setIsSocketConnected(socketService.getConnectionStatus());

		// Listen for connection changes
		socketService.on('connection_status_changed', handleConnectionChange);

		// Auto-connect if not already connected and user is logged in
		const initializeConnection = async () => {
			if (!socketService.getConnectionStatus() && token) {
				console.log('[NAVBAR] Auto-connecting to WebSocket for real-time updates...');
				try {
					await socketService.connect();
					console.log('[NAVBAR] ✅ WebSocket connected successfully');
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
		console.log('[NAVBAR] 📨 GLOBAL MESSAGE HANDLER TRIGGERED:', data);
		const { chat_id, message } = data;
		
		// PERFORMANCE: Throttle rapid successive global messages
		const messageKey = `global_${message.id || message.message_id}_${chat_id}`;
		const now = Date.now();
		
		const lastProcessed = navbarThrottleCache.get(messageKey);
		if (lastProcessed && (now - lastProcessed) < 100) { // 100ms throttle
			console.log('[NAVBAR] ⚡ Throttling duplicate global message:', messageKey);
			return;
		}
		navbarThrottleCache.set(messageKey, now);
		
		// Clean up old entries
		if (navbarThrottleCache.size > 30) {
			const entries = Array.from(navbarThrottleCache.entries());
			entries.slice(0, 15).forEach(([key]) => navbarThrottleCache.delete(key));
		}
		
		const isCurrentUserMessage = message.sender_id === currentUserRef.current?.user_id;
		
		console.log('[NAVBAR] Current user ID:', currentUserRef.current?.user_id);
		console.log('[NAVBAR] Message sender ID:', message.sender_id);
		console.log('[NAVBAR] Is current user message:', isCurrentUserMessage);
		
		// Only increment if message is NOT from current user
		if (!isCurrentUserMessage) {
			setUnreadCount(prev => {
				const newCount = prev + 1;
				console.log('[NAVBAR] 📨 Incrementing unread count from', prev, 'to', newCount);
				return newCount;
			});
		} else {
			console.log('[NAVBAR] 📨 Skipping count increment - message is from current user');
		}
	}, []);

	const handleMessagesRead = useCallback((data) => {
		const { user_id } = data;
		
		// Only decrement if current user marked messages as read
		if (user_id === currentUserRef.current?.user_id) {
			// Refresh count from server to get accurate number
			fetchUnreadCount(true);
			console.log('[NAVBAR] 👀 Messages marked read - refreshing count');
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
		console.log('[NAVBAR] 🗑️ Chat deleted - refreshing count');
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
					console.log('[NAVBAR] ✅ User data and unread count loaded');
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
				console.log('[NAVBAR] Cleaning up handlers due to disconnect/logout');
				socketService.off('global_message_received', handleNewMessage);
				socketService.off('global_messages_read', handleMessagesRead);
				socketService.off('global_chat_deleted', handleChatDeleted);
				navbarHandlersRegisteredRef.current = false;
			}
			return;
		}

		// Only register if not already registered
		if (!navbarHandlersRegisteredRef.current) {
			console.log('[NAVBAR] Setting up WebSocket event handlers for user:', userData.user_id);
			console.log('[NAVBAR] Current listeners before adding:', socketService.listeners.get('global_message_received')?.length || 0);

			// Set up WebSocket listeners for real-time updates (using GLOBAL events for Navbar)
			socketService.on('global_message_received', handleNewMessage);
			socketService.on('global_messages_read', handleMessagesRead);
			socketService.on('global_chat_deleted', handleChatDeleted);
			navbarHandlersRegisteredRef.current = true;

			console.log('[NAVBAR] Current listeners after adding:', socketService.listeners.get('global_message_received')?.length || 0);
		} else {
			console.log('[NAVBAR] Navbar handlers already registered, skipping setup');
		}

		return () => {
			// Only clean up on component unmount
			console.log('[NAVBAR] Effect cleanup - keeping navbar handlers registered for now');
		};
	}, [isSocketConnected, userData?.user_id]);
	
	// Clean up handlers only on component unmount
	useEffect(() => {
		return () => {
			if (navbarHandlersRegisteredRef.current) {
				console.log('[NAVBAR] Component unmounting - cleaning up all navbar handlers');
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


	const handleAvatarClick = () => {
		if (userData?.username) {
			navigate(`/user/${userData.username}`);
		} else {
			navigate("/users");
		}
	};

	
	return (
		<nav className="navbar navbar-expand-lg shadow-sm">
			<div className="container">

				{/* Logo and Name */}
				<Link to="/" className="navbar-brand mb-0 h1 d-flex align-items-center gap-2">
					<ChefHat size={32} strokeWidth={2.7} className="text-primary" />
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

				{/* Collapsible content */}
				<div className="collapse navbar-collapse" id="navbarContent">
					<div className="ms-auto d-flex gap-2 align-items-center flex-lg-row flex-column text-center">
						
						{/* Bootstrap Dark Mode Toggle */}
						<ThemeToggle />

						{!token ? (

							<>
								{/* Auth Links */}
								<ul className="navbar-nav ms-auto align-items-lg-center gap-2">

									{/* Log In */}
									<li className="nav-item">
										<Link to="/login" className="btn btn-primary ms-lg-2">
											Log in
										</Link>
									</li>

									{/* Sign Up */}
									<li className="nav-item">
										<Link to="/signup" className="btn btn-outline-primary">
											Sign up
										</Link>
									</li>

								</ul>
							</>
	
						) : (

							<>
								{/* New Recipe */}
								<Link to="/new-recipe" className="btn btn-link text-success text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto" title="New Recipe">
									<FilePlus size={22} />
								</Link>


								{/* My Collections */}
								<Link to="/my-collections" className="btn btn-link text-secondary text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto" title="My Collections">
									<Bookmark size={22} />
								</Link>


								{/* Messages with Unread Count Badge */}
								<Link to="/messages" className="btn btn-link text-info text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto position-relative" title="Messages">
									
									<MessageCircle size={22} />
									
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
								

								{/* Liked Recipes */}
								<Link to="/liked-recipes" className="btn btn-link text-danger text-decoration-none p-2 d-flex align-items-center justify-content-center mx-lg-0 mx-auto" title="Liked Recipes">
									<Heart size={22} />
								</Link>


								{/* Settings */}
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


								{/* Logout */}
								<button onClick={handleLogout} className="btn btn-light border-0 text-danger"><DoorOpen size={22} /></button>
							
							</>
						)}
					</div>			

				</div>

			</div>
		</nav>
	);
};