import React, { useEffect } from "react"
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import food from "../assets/img/table_food.jpg";

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


			{/* Hero */}
			<div className="row align-items-center g-4">

				<div className="col-lg-6 text-center text-lg-start">

					<h1 className="display-4 fw-bold mb-3">Welcome!</h1>

					<p className="lead mb-4">
						Esta es la página de inicio. Usa los botones para entrar o crear tu cuenta.
					</p>


					<div className="d-flex flex-column flex-sm-row gap-3">
						<Link to="/login" className="btn btn-primary btn-lg">
							Log in
						</Link>

						<Link to="/signup" className="btn btn-outline-secondary btn-lg">
							Sign up
						</Link>
					</div>

				</div>

				<div className="col-lg-6 text-center">
					<img
						src={food}
						alt="Food"
						className="img-fluid rounded-circle shadow-sm"
						style={{ maxWidth: 260 }}
					/>
				</div>
			</div>

			{/* Accesos rápidos (opcional) */}

			{/* <div className="row row-cols-1 row-cols-md-3 g-3 mt-5">
				<div className="col">
					<div className="card h-100 shadow-sm border-0">
						<div className="card-body">
							<h5 className="card-title">Login</h5>
							<p className="card-text">Ingresa a tu cuenta para continuar.</p>
							<Link to="/login" className="btn btn-primary">Entrar</Link>
						</div>
					</div>
				</div>

				<div className="col">
					<div className="card h-100 shadow-sm border-0">
						<div className="card-body">
							<h5 className="card-title">Registro</h5>
							<p className="card-text">Crea una cuenta nueva en segundos.</p>
							<Link to="/register" className="btn btn-outline-secondary">Crear cuenta</Link>
						</div>
					</div>
				</div>

				<div className="col">
					<div className="card h-100 shadow-sm border-0">
						<div className="card-body">
							<h5 className="card-title">Demo / Acerca</h5>
							<p className="card-text">Conoce más sobre la app.</p>
							<div className="d-flex gap-2">
								<Link to="/demo" className="btn btn-light border">Demo</Link>
								<Link to="/about" className="btn btn-success">Acerca</Link>
							</div>
						</div>
					</div>
				</div>

			</div> */}


			
		</div>
	);
};