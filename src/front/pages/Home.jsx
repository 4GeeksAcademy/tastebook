import React, { useEffect } from "react"
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import food from "../shared/assets/img/table_food.jpg";

export const Home = () => {

	const { store, dispatch } = useGlobalReducer()

	const loadMessage = async () => {
		try {
			const backendUrl = import.meta.env.VITE_BACKEND_URL

			if (!backendUrl) throw new Error("VITE_BACKEND_URL is not defined in .env file")

			const response = await fetch(backendUrl + "/api/hello")
			const data = await response.json()

			if (response.ok) dispatch({ type: "set_hello", payload: data.message })

			return data

		} catch (error) {
			if (error.message) throw new Error(
				`Could not fetch the message from the backend.
				Please check if the backend is running and the backend port is public.`
			);
		}

	}

	useEffect(() => {
		loadMessage()
	}, [])


	return (
		<div className="container py-5">


						{/* Hero Section */}
						<div className="row align-items-center g-4 mb-5">

							<div className="col-lg-12 text-center">

								<h1 className="display-4 fw-bold mb-3">
									Welcome to <span className="text-primary">Tastebook</span>
								</h1>

								<p className="lead mb-4">
									Your place to discover and share delicious recipes
								</p>

								<div className="d-flex gap-3 justify-content-center">
									<Link to="/all-recipes" className="btn btn-primary btn-lg">
										<i className="fas fa-search me-2"></i>
										Browse All Recipes
									</Link>
								</div>

							</div>


							{/* Image - ELIMINATED */}
							{/* <div className="col-lg-6 text-center">
								<img
									src={food}
									alt="Food"
									className="img-fluid rounded shadow-sm border border-2 border-primary"
									style={{ maxWidth: 300 }}
								/>
							</div> */}
							
						</div>


						{/* Placeholder Cards for Features */}
						<div className="row row-cols-1 row-cols-md-3 g-4 mt-3">
							<div className="col">
								<Link to="/all-recipes" className="text-decoration-none">
									<div className="card h-100 shadow border-0 card-hover">
										<div className="card-body text-center">
											<div className="mb-3">
												<i className="bi bi-search display-5 text-primary"></i>
											</div>
											<h5 className="card-title">Explore recipes</h5>
											<p className="card-text">Search among hundreds of recipes and find your next favorite meal.</p>
										</div>
									</div>
								</Link>
							</div>
							<div className="col">

								<div className="card h-100 shadow border-0">
									<div className="card-body text-center">
										<div className="mb-3">
											<i className="bi bi-bookmark display-5 text-success"></i>
										</div>
										<h5 className="card-title">Save your favorite recipes</h5>
										<p className="card-text">Create your own personal recipe book and access it at any time.</p>
									</div>

								</div>
							</div>
							<div className="col">
								<div className="card h-100 shadow border-0">
									<div className="card-body text-center">
										<div className="mb-3">
											<i className="bi bi-share display-5 text-warning"></i>
										</div>
										<h5 className="card-title">Share with friends</h5>
										<p className="card-text">Share your favorite recipes with the community and your friends.</p>
									</div>
								</div>
							</div>
						</div>


			
		</div>
	);
};