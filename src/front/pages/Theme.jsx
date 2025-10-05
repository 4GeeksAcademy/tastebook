import React, { useState } from "react";
import ThemeSelector from "../components/ThemeSelector";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { 
    ChefHat, User, Mail, Settings, Search, Plus, Heart, 
    Star, Clock, Camera, Edit, Trash2, Eye, Download,
    CheckCircle, AlertTriangle, Info, X
} from "lucide-react";

export const Theme = () => {
    const [activeTab, setActiveTab] = useState("buttons");
    const [showAlert, setShowAlert] = useState(true);
    const [progress] = useState(75);
    const { theme, setTheme, currentTheme } = useTheme();

    return (
        <div className="container py-4">
            {/* Header Section */}
            <div className="row">
                <div className="col-12">
                    <h2>Bootstrap themes & UI Components Showcase</h2>
                    <p className="text-muted">Toggle between light and dark themes and preview how all Bootstrap components will look.</p>
                </div>
            </div>

            {/* Theme Selector */}
            <div className="row mt-3 mb-5">
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <Settings size={20} className="me-2" />
                                Theme Selection
                            </h5>
                        </div>
                        <div className="card-body">

                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                    <h6 className="mb-1">Current Theme</h6>
                                    <p className="text-muted mb-0">
                                        {theme === 'auto' ? `Auto (currently ${currentTheme})` : theme.charAt(0).toUpperCase() + theme.slice(1)}
                                    </p>
                                </div>
                                <ThemeToggle />
                            </div>
                            <div className="d-flex gap-2">
                                <button 
                                    className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setTheme('light')}
                                >
                                    Light
                                </button>
                                <button 
                                    className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    Dark
                                </button>
                                <button 
                                    className={`btn btn-sm ${theme === 'auto' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setTheme('auto')}
                                >
                                    Auto
                                </button>
                            </div>
                            <small className="text-muted d-block mt-2">
                                Auto mode follows your system preference and updates automatically.
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="row">
                <div className="col-12">
                    <ul className="nav nav-tabs" role="tablist">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === "buttons" ? "active" : ""}`}
                                onClick={() => setActiveTab("buttons")}
                            >
                                Buttons & Actions
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === "forms" ? "active" : ""}`}
                                onClick={() => setActiveTab("forms")}
                            >
                                Forms & Inputs
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === "cards" ? "active" : ""}`}
                                onClick={() => setActiveTab("cards")}
                            >
                                Cards & Layout
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === "alerts" ? "active" : ""}`}
                                onClick={() => setActiveTab("alerts")}
                            >
                                Alerts & Feedback
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Tab Content */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="tab-content">
                        
                        {/* Buttons Tab */}
                        {activeTab === "buttons" && (
                            <div className="tab-pane fade show active">
                                <div className="row g-4">
                                    
                                    {/* Primary Buttons */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Primary Buttons</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    <button className="btn btn-primary">
                                                        <ChefHat size={16} className="me-1" />
                                                        Primary
                                                    </button>
                                                    <button className="btn btn-primary btn-sm">Small</button>
                                                    <button className="btn btn-primary btn-lg">Large</button>
                                                    <button className="btn btn-primary" disabled>Disabled</button>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    <button className="btn btn-outline-primary">Outline</button>
                                                    <button className="btn btn-link">Link</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Action Buttons</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    <button className="btn btn-success">
                                                        <CheckCircle size={16} className="me-1" />
                                                        Success
                                                    </button>
                                                    <button className="btn btn-warning">Warning</button>
                                                    <button className="btn btn-danger">
                                                        <Trash2 size={16} className="me-1" />
                                                        Danger
                                                    </button>
                                                    <button className="btn btn-info">Info</button>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    <button className="btn btn-secondary">Secondary</button>
                                                    <button className="btn btn-dark">Dark</button>
                                                    <button className="btn btn-light border">Light</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Button Groups */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Button Groups & Dropdowns</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="btn-group mb-3" role="group">
                                                    <button className="btn btn-outline-primary active">Left</button>
                                                    <button className="btn btn-outline-primary">Middle</button>
                                                    <button className="btn btn-outline-primary">Right</button>
                                                </div>
                                                <br />
                                                <div className="dropdown">
                                                    <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                        Dropdown
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        <li><a className="dropdown-item" href="#">Action</a></li>
                                                        <li><a className="dropdown-item" href="#">Another action</a></li>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li><a className="dropdown-item" href="#">Something else</a></li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Loading States */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Loading States</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    <button className="btn btn-primary" disabled>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        Loading...
                                                    </button>
                                                    <button className="btn btn-outline-secondary" disabled>
                                                        <span className="spinner-grow spinner-grow-sm me-2" role="status"></span>
                                                        Processing
                                                    </button>
                                                </div>
                                                <div className="text-center">
                                                    <div className="spinner-border text-primary me-3" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <div className="spinner-grow text-success" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Forms Tab */}
                        {activeTab === "forms" && (
                            <div className="tab-pane fade show active">
                                <div className="row g-4">
                                    
                                    {/* Basic Form Elements */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Form Controls</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <label className="form-label">Email address</label>
                                                    <input type="email" className="form-control" placeholder="name@example.com" />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Password</label>
                                                    <input type="password" className="form-control" />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Select option</label>
                                                    <select className="form-select">
                                                        <option>Choose...</option>
                                                        <option>Option 1</option>
                                                        <option>Option 2</option>
                                                    </select>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Message</label>
                                                    <textarea className="form-control" rows="3"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Groups */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Input Groups</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <label className="form-label">Search with icon</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">
                                                            <Search size={16} />
                                                        </span>
                                                        <input type="text" className="form-control" placeholder="Search recipes..." />
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">With button</label>
                                                    <div className="input-group">
                                                        <input type="text" className="form-control" placeholder="Recipe name" />
                                                        <button className="btn btn-outline-secondary">
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">With dropdown</label>
                                                    <div className="input-group">
                                                        <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            Category
                                                        </button>
                                                        <ul className="dropdown-menu">
                                                            <li><a className="dropdown-item" href="#">Breakfast</a></li>
                                                            <li><a className="dropdown-item" href="#">Lunch</a></li>
                                                            <li><a className="dropdown-item" href="#">Dinner</a></li>
                                                        </ul>
                                                        <input type="text" className="form-control" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Validation */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Form Validation</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <label className="form-label">Valid input</label>
                                                    <input type="text" className="form-control is-valid" value="Looks good!" readOnly />
                                                    <div className="valid-feedback">Great! This looks good.</div>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Invalid input</label>
                                                    <input type="text" className="form-control is-invalid" value="Invalid input" readOnly />
                                                    <div className="invalid-feedback">Please provide a valid input.</div>
                                                </div>
                                                <div className="form-check">
                                                    <input className="form-check-input" type="checkbox" id="flexCheckDefault" />
                                                    <label className="form-check-label" htmlFor="flexCheckDefault">
                                                        I agree to the terms
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Switches and Radios */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Switches & Radio Buttons</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="form-check form-switch mb-3">
                                                    <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault" />
                                                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                                                        Enable notifications
                                                    </label>
                                                </div>
                                                <div className="form-check form-switch mb-3">
                                                    <input className="form-check-input" type="checkbox" id="flexSwitchCheckChecked" defaultChecked />
                                                    <label className="form-check-label" htmlFor="flexSwitchCheckChecked">
                                                        Dark mode
                                                    </label>
                                                </div>
                                                <div className="mb-3">
                                                    <div className="form-check">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" />
                                                        <label className="form-check-label" htmlFor="flexRadioDefault1">
                                                            Public recipe
                                                        </label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" defaultChecked />
                                                        <label className="form-check-label" htmlFor="flexRadioDefault2">
                                                            Private recipe
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cards Tab */}
                        {activeTab === "cards" && (
                            <div className="tab-pane fade show active">
                                <div className="row g-4">
                                    
                                    {/* Basic Cards */}
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0">Recipe Card</h6>
                                                <Heart size={16} className="text-danger" />
                                            </div>
                                            <div className="card-body">
                                                <h5 className="card-title">Delicious Pasta</h5>
                                                <p className="card-text text-muted">A wonderful Italian dish perfect for dinner.</p>
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <div className="d-flex align-items-center">
                                                        <Clock size={14} className="me-1 text-muted" />
                                                        <small className="text-muted">30 min</small>
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        <Star size={14} className="me-1 text-warning" />
                                                        <small>4.5</small>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-primary btn-sm">
                                                        <Eye size={14} className="me-1" />
                                                        View
                                                    </button>
                                                    <button className="btn btn-outline-secondary btn-sm">
                                                        <Edit size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card with Image */}
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{height: '200px'}}>
                                                <Camera size={48} className="text-muted" />
                                            </div>
                                            <div className="card-body">
                                                <h5 className="card-title">Image Card</h5>
                                                <p className="card-text">Card with image placeholder and content below.</p>
                                                <span className="badge bg-primary me-2">Italian</span>
                                                <span className="badge bg-success">Vegetarian</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* List Group Card */}
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Recipe Steps</h6>
                                            </div>
                                            <ul className="list-group list-group-flush">
                                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                                    Prepare ingredients
                                                    <span className="badge bg-primary rounded-pill">1</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                                    Heat the pan
                                                    <span className="badge bg-primary rounded-pill">2</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                                    Cook and serve
                                                    <span className="badge bg-primary rounded-pill">3</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* User Profile Card */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-body text-center">
                                                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '64px', height: '64px'}}>
                                                    <User size={32} className="text-white" />
                                                </div>
                                                <h5 className="card-title">John Doe</h5>
                                                <p className="card-text text-muted">Food enthusiast and recipe creator</p>
                                                <div className="row text-center">
                                                    <div className="col">
                                                        <div className="fw-bold">24</div>
                                                        <small className="text-muted">Recipes</small>
                                                    </div>
                                                    <div className="col">
                                                        <div className="fw-bold">156</div>
                                                        <small className="text-muted">Followers</small>
                                                    </div>
                                                    <div className="col">
                                                        <div className="fw-bold">89</div>
                                                        <small className="text-muted">Following</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Card */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Progress & Badges</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Recipe completion</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className="progress">
                                                        <div className="progress-bar" style={{width: `${progress}%`}}></div>
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <div className="progress">
                                                        <div className="progress-bar bg-success" style={{width: '25%'}}></div>
                                                        <div className="progress-bar bg-warning" style={{width: '35%'}}></div>
                                                        <div className="progress-bar bg-danger" style={{width: '20%'}}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="badge bg-primary me-1">New</span>
                                                    <span className="badge bg-secondary me-1">Popular</span>
                                                    <span className="badge bg-success me-1">Verified</span>
                                                    <span className="badge bg-danger me-1">Hot</span>
                                                    <span className="badge bg-warning text-dark me-1">Featured</span>
                                                    <span className="badge bg-info me-1">Trending</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alerts Tab */}
                        {activeTab === "alerts" && (
                            <div className="tab-pane fade show active">
                                <div className="row g-4">
                                    
                                    {/* Basic Alerts */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Alert Messages</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="alert alert-success" role="alert">
                                                    <CheckCircle size={16} className="me-2" />
                                                    Recipe saved successfully!
                                                </div>
                                                <div className="alert alert-warning" role="alert">
                                                    <AlertTriangle size={16} className="me-2" />
                                                    Please fill in all required fields.
                                                </div>
                                                <div className="alert alert-danger" role="alert">
                                                    <X size={16} className="me-2" />
                                                    Failed to upload image. Please try again.
                                                </div>
                                                <div className="alert alert-info" role="alert">
                                                    <Info size={16} className="me-2" />
                                                    Your recipe is being reviewed.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dismissible Alerts */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Dismissible Alerts</h6>
                                            </div>
                                            <div className="card-body">
                                                {showAlert && (
                                                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                                                        <strong>Well done!</strong> You successfully created a new recipe.
                                                        <button 
                                                            type="button" 
                                                            className="btn-close" 
                                                            onClick={() => setShowAlert(false)}
                                                        ></button>
                                                    </div>
                                                )}
                                                {!showAlert && (
                                                    <button 
                                                        className="btn btn-outline-success btn-sm"
                                                        onClick={() => setShowAlert(true)}
                                                    >
                                                        Show Alert Again
                                                    </button>
                                                )}
                                                <div className="alert alert-primary alert-dismissible fade show" role="alert">
                                                    <strong>Heads up!</strong> This alert needs your attention.
                                                    <button type="button" className="btn-close"></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Toast Messages */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Toast Notifications</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="toast show" role="alert">
                                                    <div className="toast-header">
                                                        <CheckCircle size={16} className="text-success me-2" />
                                                        <strong className="me-auto">Tastebook</strong>
                                                        <small>2 mins ago</small>
                                                        <button type="button" className="btn-close ms-2"></button>
                                                    </div>
                                                    <div className="toast-body">
                                                        Your recipe has been published!
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modals Preview */}
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Modal & Overlays</h6>
                                            </div>
                                            <div className="card-body">
                                                <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                                    Launch Demo Modal
                                                </button>
                                                <button type="button" className="btn btn-outline-secondary" title="This is a tooltip" data-bs-toggle="tooltip">
                                                    Tooltip Example
                                                </button>
                                                
                                                {/* Modal */}
                                                <div className="modal fade" id="exampleModal" tabIndex="-1">
                                                    <div className="modal-dialog">
                                                        <div className="modal-content">
                                                            <div className="modal-header">
                                                                <h5 className="modal-title">Recipe Details</h5>
                                                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                                            </div>
                                                            <div className="modal-body">
                                                                <p>This is a sample modal showing how dialogs will look with your chosen theme.</p>
                                                                <div className="form-floating">
                                                                    <input type="text" className="form-control" id="floatingInput" placeholder="Recipe name" />
                                                                    <label htmlFor="floatingInput">Recipe name</label>
                                                                </div>
                                                            </div>
                                                            <div className="modal-footer">
                                                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                                                <button type="button" className="btn btn-primary">Save Recipe</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Theme;
