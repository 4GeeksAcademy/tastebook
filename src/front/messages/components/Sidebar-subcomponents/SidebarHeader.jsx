import React from "react";

import { Search } from "lucide-react";

import WebSocketStatus from "../Websocket-Status/WebSocketStatus";


/**
 * Sidebar Header component with title, WebSocket status, and search functionality
 * @param {string}   searchTerm - Current search term
 * @param {function} onSearch   - Function to handle search input change
 */
const SidebarHeader = ({ 
    searchTerm, 
    onSearch 
}) => {
    return (
        <div className="p-3 border-bottom flex-shrink-0">

            <h2 className="mb-3"> Messages </h2>

            {/* WebSocket Status Connection - OPTION TO ONLY SHOW IN DEVELOPMENT */}
            <div className="mb-3">
                {/* {import.meta.env.MODE === 'development' && <WebSocketStatus />} */}
                <WebSocketStatus />
            </div>
            
            {/* Search */}
            <div className="position-relative">
                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={16} />
                <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </div>
    );
};

export default SidebarHeader;