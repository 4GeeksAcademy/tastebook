import React from 'react'
import ReactDOM from 'react-dom/client'

// ----------------------------------------------------------------------
// CUSTOM CSS AND SCSS

// SCSS imports
import '../shared/styles/scss-bootstrap-custom-theme.scss'; // COMPLETE Custom Bootstrap theme with SCSS variables
// import '../shared/styles/simple-custom.scss';            // SIMPLE   Custom Bootstrap theme with SCSS variables

// CSS custom theme 
// import '../shared/styles/custom-theme.css'
// ----------------------------------------------------------------------


// JS Bootstrap module (or it can be in `index.html`)
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';  // Bootstrap JS components

import { RouterProvider } from "react-router-dom";  // Import RouterProvider to use the router
import { router } from "./routes";  // Import the router configuration
import { StoreProvider } from './hooks/useGlobalReducer';  // Import the StoreProvider for global state management
import { BackendURL } from './components/BackendURL';

const Main = () => {
    
    // Temporarily log the environment variable for debugging
    console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
    
    if(! import.meta.env.VITE_BACKEND_URL ||  import.meta.env.VITE_BACKEND_URL == "") return (
        <React.StrictMode>
              <BackendURL/ >
        </React.StrictMode>
        );
    return (
        <React.StrictMode>  
            {/* Provide global state to all components */}
            <StoreProvider> 
                {/* Set up routing for the application */} 
                <RouterProvider router={router}>
                </RouterProvider>
            </StoreProvider>
        </React.StrictMode>
    );
}

// Render the Main component into the root DOM element.
ReactDOM.createRoot(document.getElementById('root')).render(<Main />)
