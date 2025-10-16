import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users as UsersIcon, CircleUserRound, ChefHat, Calendar, Filter, ArrowUpDown, ArrowUp, ArrowDown, Globe } from "lucide-react";
import { REGIONS, COUNTRIES, CountryFlag } from "../../../shared/utils/country-flag-name-display/countriesData.jsx";

export const AllUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [regionFilter, setRegionFilter] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 20,
        offset: 0,
        has_more: false
    });

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const fetchUsers = async (search = "", sort_by = "created_at", sort_order = "desc", offset = 0, region = "") => {
        if (!backendUrl) {
            setError("Backend URL not configured.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                limit: pagination.limit.toString(),
                offset: offset.toString(),
                sort_by,
                sort_order
            });

            if (search.trim()) {
                params.append('search', search.trim());
            }

            if (region) {
                params.append('region', region);
            }

            const response = await fetch(`${backendUrl}/api/users?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch users");
            }

            setUsers(data.users || []);
            setPagination(data.pagination || {});
        } catch (err) {
            setError(err.message || "Failed to load users");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(searchTerm, sortBy, sortOrder, 0, regionFilter);
    }, [sortBy, sortOrder, regionFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, offset: 0 }));
        fetchUsers(searchTerm, sortBy, sortOrder, 0, regionFilter);
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
        // Trigger search automatically if search term is cleared
        if (e.target.value === "") {
            setPagination(prev => ({ ...prev, offset: 0 }));
            fetchUsers("", sortBy, sortOrder, 0, regionFilter);
        }
    };

    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    const loadMore = () => {
        const newOffset = pagination.offset + pagination.limit;
        fetchUsers(searchTerm, sortBy, sortOrder, newOffset, regionFilter);
        setPagination(prev => ({ ...prev, offset: newOffset }));
    };

    const getSortOrderIcon = () => (
        sortOrder === "asc" ?
            <ArrowUp size={18} strokeWidth={3} className="" /> :
            <ArrowDown size={18} strokeWidth={3} className="" />
    );

    const getSortIcon = (key) => {
        switch (key) {
            case "created_at":
                return <Calendar size={16} />;
            case "recipes_count":
                return <ChefHat size={16} />;
            case "username":
                return <CircleUserRound size={16} />;
            case "followers_count":
                return <UsersIcon size={16} />;
            default:
                return <ArrowUpDown size={16} />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Unknown";
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="container py-5">


            <div className="row">

                <div className="col-12">

                    {/* Header */}
                    <div className="d-flex align-items-center mb-4">
                        <UsersIcon size={32} className="text-primary me-3" />
                        <div>
                            <h2 className="mb-0">Community Members</h2>
                            <p className="text-muted mb-0">Discover talented home chefs and their recipes</p>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <form onSubmit={handleSearch} className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        <Search size={16} className="me-1" />
                                        Search by username
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter username..."
                                            value={searchTerm}
                                            onChange={handleSearchInputChange}
                                        />
                                        <button className="btn btn-primary" type="submit" disabled={loading}>
                                            <Search size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        <Globe size={16} className="me-1" />
                                        Filter by region
                                    </label>
                                    <select
                                        className="form-select"
                                        value={regionFilter}
                                        onChange={(e) => setRegionFilter(e.target.value)}
                                    >
                                        <option value="">All regions</option>
                                        {Object.entries(REGIONS).map(([key, region]) => (
                                            <option key={key} value={key}>
                                                {region.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>


                                <div className="col-md-4">

                                    <label className="form-label fw-semibold">
                                        <ArrowUpDown size={16} className="me-1" />
                                        Sort by
                                    </label>

                                    <div className="input-group">

                                        <span className="input-group-text border-end-0 d-flex align-items-center justify-content-center">
                                            {getSortIcon(sortBy)}
                                        </span>

                                        <select
                                            className="form-select"
                                            value={sortBy}
                                            onChange={(e) => handleSortChange(e.target.value)}
                                            style={{ borderLeft: '0' }}
                                        >
                                            <option value="created_at"      >Date</option>
                                            <option value="recipes_count"   >Recipes</option>
                                            <option value="username"        >Username</option>
                                            <option value="followers_count" >Followers</option>
                                        </select>

                                        <button
                                            type="button"
                                            className="btn border d-flex align-items-center"
                                            onClick={toggleSortOrder}
                                            aria-label={sortOrder === "asc" ? "Sort descending" : "Sort ascending"}
                                            title={sortOrder === "asc" ? "Sort descending" : "Sort ascending"}
                                        >
                                            {getSortOrderIcon()}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            {error}
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setError("")}
                            ></button>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && pagination.offset === 0 && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading users...</p>
                        </div>
                    )}

                    {/* Users Grid */}
                    {!loading && users.length > 0 && (
                        <>
                            <div className="row g-4 mb-4">
                                {users.map((user) => (
                                    <div key={user.id} className="col-sm-6 col-lg-4 col-xl-3">
                                        <div className="card h-100 shadow user-card">
                                            <div className="card-body text-center p-4">
                                                {/* Profile Image */}
                                                <div className="mb-3">
                                                    {user.cloudinary_url ? (
                                                        <img
                                                            src={user.cloudinary_url}
                                                            alt={user.username}
                                                            className="rounded-circle border border-3 border-primary"
                                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto border border-3 border-primary"
                                                            style={{ width: '80px', height: '80px', fontSize: '1.5rem', fontWeight: 'bold' }}
                                                        >
                                                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* User Info */}
                                                <h5 className="card-title mb-1">{user.full_name}</h5>
                                                <p className="text-muted mb-1">@{user.username}</p>

                                                {/* Country Info */}
                                                <div className="text-muted mb-2 d-flex align-items-center justify-content-center">
                                                    <Globe size={14} className="me-1" />
                                                    <small className="d-flex align-items-center">
                                                        {user.country && user.country.code ? (
                                                            <>
                                                                {COUNTRIES.find(c => c.code === user.country.code)?.name || user.country.name || user.country.code}
                                                                <CountryFlag countryCode={user.country.code} size={18} className="ms-2" />
                                                            </>
                                                        ) : '-'}
                                                    </small>
                                                </div>

                                                {/* Stats */}
                                                <div className="row text-center mb-3">
                                                    <div className="col-6">
                                                        <div className="d-flex flex-column">
                                                            <span className="fw-bold text-primary h5 mb-0">{user.recipes_count}</span>
                                                            <small className="text-muted">
                                                                <ChefHat size={14} className="me-1" />
                                                                Recipe{user.recipes_count !== 1 ? 's' : ''}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="d-flex flex-column">
                                                            <span className="fw-bold text-secondary h5 mb-0">{user.followers_count || 0}</span>
                                                            <small className="text-muted">
                                                                <UsersIcon size={14} className="me-1" />
                                                                Followers
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Member Since */}
                                                <small className="text-muted">
                                                    <Calendar size={14} className="me-1" />
                                                    Member since {formatDate(user.created_at)}
                                                </small>
                                            </div>

                                            {/* Card Footer - View Profile Button */}
                                            <div className="card-footer bg-transparent border-0 pt-0">
                                                <Link to={`/user/${user.username}`} className="btn btn-outline-primary btn-sm w-100">
                                                    View Profile
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {pagination.has_more && (
                                <div className="text-center">
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={loadMore}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Loading...
                                            </>
                                        ) : (
                                            `Load More Users (${pagination.total - users.length} remaining)`
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Results Summary */}
                            <div className="text-center mt-4">
                                <small className="text-muted">
                                    Showing {users.length} of {pagination.total} users
                                </small>
                            </div>
                        </>
                    )}

                    {/* No Users Found */}
                    {!loading && users.length === 0 && (
                        <div className="text-center py-5">
                            <UsersIcon size={64} className="mb-3" />
                            <h4 className="text-muted">No users found</h4>
                            <p className="text-muted">
                                {searchTerm ?
                                    `No users found matching "${searchTerm}"` :
                                    "No users are currently available."
                                }
                            </p>
                            {searchTerm && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setSearchTerm("");
                                        fetchUsers("", sortBy, sortOrder, 0);
                                    }}
                                >
                                    Show All Users
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
        .user-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .user-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
        </div>
    );
};