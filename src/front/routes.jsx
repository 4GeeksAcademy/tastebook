// Import necessary components and functions from react-router-dom.


import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";


import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { AllRecipes } from "./pages/AllRecipes.jsx";
import { LikedRecipes } from "./pages/LikedRecipes.jsx";


import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { PasswordRecovery } from "./pages/PasswordRecovery";
import { ResetPassword } from "./pages/ResetPassword";


import { Settings } from "./pages/Settings";
import { CreateRecipe } from "./pages/CreateRecipe";
import { ModifyRecipe } from "./pages/ModifyRecipe";
import { Recipe } from "./pages/Recipe";
import { Users } from "./pages/Users";
import { UserProfile } from "./pages/UserProfile";
import { Theme } from "./pages/Theme";
import { MyCollections } from "./pages/MyCollections";
import { CollectionView } from "./pages/CollectionView";
import { PublicCollections } from "./pages/PublicCollections";



export const router = createBrowserRouter(
    createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

      // Root Route: All navigation will start from here.
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

        {/* Nested Routes: Defines sub-routes within the BaseHome component. */}

        <Route path= "/" element={<Home />} />
        
        <Route path= "/signup" element={<Signup />} />
        <Route path= "/login"  element={<Login />} />
        <Route path= "/recovery-validation" element={<PasswordRecovery />} />
        <Route path= "/reset-password/:token" element={<ResetPassword />} />

        <Route path= "/settings" element={<Settings />} />
  
        <Route path= "/new-recipe" element={<CreateRecipe />} />
        <Route path= "/recipe/:id" element={<Recipe />} />
        <Route path= "/recipe/:id/modify" element={<ModifyRecipe />} />
        <Route path= "/users" element={<Users />} />
        <Route path= "/user/:username" element={<UserProfile />} />

        <Route path= "/my-collections" element={<MyCollections />} />
        <Route path= "/collections" element={<PublicCollections />} />
        <Route path= "/collection/:id" element={<CollectionView />} />


        <Route path= "/theme" element={<Theme />} />
 
        <Route path= "/demo" element={<Demo />} />
        <Route path= "/single/:theId" element={ <Single />} />  {/* Dynamic route for single items */}
        <Route path= "/all-recipes" element={<AllRecipes />} />
        <Route path= "/liked-recipes" element={<LikedRecipes />} />

      </Route>
    )
);