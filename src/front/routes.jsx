// Import necessary components and functions from react-router-dom.

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";


// Layout
import { Layout } from "./modules/layout/Layout.jsx";
import { Home }   from "./modules/layout/Home.jsx";

// Authentucation
import { Login }  from "./modules/auth/Login.jsx";
import { Signup } from "./modules/auth/Signup.jsx";

import { ResetPassword }    from "./modules/auth/ResetPassword.jsx";
import { PasswordRecovery } from "./modules/auth/PasswordRecovery.jsx";

// Admin Access
import { AdminAccess }  from "./modules/admin-backpanel/AdminAccess.jsx";

// Settings module
import { Settings }     from "./pages/Settings";

// User profile
import { AllUsers }     from "./pages/AllUsers.jsx";
import { UserProfile }  from "./pages/UserProfile";

// Recipes
import { AllRecipes }   from "./pages/AllRecipes.jsx";
import { Recipe }       from "./pages/Recipe";
import { CreateRecipe } from "./pages/CreateRecipe";
import { ModifyRecipe } from "./pages/ModifyRecipe";
import { LikedRecipes } from "./pages/LikedRecipes.jsx";

// Collections
import { CollectionView }    from "./pages/CollectionView";
import { MyCollections }     from "./pages/MyCollections";
import { PublicCollections } from "./pages/PublicCollections";

// Messages
import { Messages }     from "./modules/messages/pages/Messages.jsx";

// Theme settings
import { ThemeTesting } from "./modules/theme-settings/ThemeTesting.jsx";

// Miscellaneous
import { Single } from "./modules/miscellaneous/4geeks-defatult-files/Single.jsx";
import { Demo }   from "./modules/miscellaneous/4geeks-defatult-files/Demo.jsx";



export const router = createBrowserRouter(
    createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

      // Root Route: All navigation will start from here.
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >


        {/* NESTES ROUTES: Defines sub-routes within the Layout component. */}


        {/* Home */}
        <Route path= "/" element={<Home />} />
        
        {/* Auth */}
        <Route path= "/signup" element={<Signup />} />
        <Route path= "/login"  element={<Login />} />

        {/* Password Recovery */}
        <Route path= "/recovery-validation"    element={<PasswordRecovery />} />
        <Route path= "/reset-password/:token"  element={<ResetPassword />} />

        {/* User Private Settings */}
        <Route path= "/settings" element={<Settings />} />

        {/* Admin Access */}
        <Route path= "/admin-access" element={<AdminAccess />} />

        {/* Users and User Public Profile */}
        <Route path= "/users"           element={<AllUsers />} />
        <Route path= "/user/:username"  element={<UserProfile />} />

        {/* User Specific Pages  */}
        <Route path= "/liked-recipes"   element={<LikedRecipes />} />
        <Route path= "/my-collections"  element={<MyCollections />} />

        {/* Recipes */}
        <Route path= "/all-recipes"        element={<AllRecipes />} />
        <Route path= "/new-recipe"         element={<CreateRecipe />} />
        <Route path= "/recipe/:id"         element={<Recipe />} />
        <Route path= "/recipe/:id/modify"  element={<ModifyRecipe />} />

        {/* Collections */}
        <Route path= "/collections"     element={<PublicCollections />} />
        <Route path= "/collection/:id"  element={<CollectionView />} />

        {/* Messages */}
        <Route path= "/messages"          element={<Messages />} />
        <Route path= "/messages/:chatId"  element={<Messages />} />

        {/* Theme */}
        <Route path= "/theme" element={<ThemeTesting />} />


        {/* Miscellaneous, Testing and Extras*/}
        <Route path= "/demo" element={<Demo />} />
        <Route path= "/single/:theId" element={ <Single />} />  {/* Dynamic route for single items */}

      </Route>
    )
);