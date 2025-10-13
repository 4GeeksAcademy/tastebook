import { Outlet }  from "react-router-dom"
import ScrollToTop from "./layout-subcomponents/ScrollToTop"
import { Navbar }  from "./layout-subcomponents/Navbar"
import { Footer }  from "./layout-subcomponents/Footer"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    return (
        <div className="d-flex flex-column min-vh-100">

            <ScrollToTop>

                <Navbar />
                
                    <main className="flex-grow-1">
                        <Outlet />
                    </main>

                <Footer />

            </ScrollToTop>
            
        </div>

    );
};