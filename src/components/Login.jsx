// src/components/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mapDeskLogo from "../assets/map-desk-logo.jpg";

function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const baseUrl = import.meta.env.VITE_API_BASE_URL;

	// If already logged in, redirect to /form
	useEffect(() => {
		const creds = JSON.parse(localStorage.getItem("geojson_creds"));
		if (creds?.username && creds?.password) {
			navigate("/form");
		}
	}, [navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!username || !password) {
			setError("Please enter both username and password.");
			return;
		}

		try {
			const res = await fetch(`${baseUrl}/geo-json-service/validate-creds`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			const data = await res.json();

			if (res.ok && data.status === "success") {
				localStorage.setItem(
					"geojson_creds",
					JSON.stringify({ username, password })
				);
				navigate("/form");
			} else {
				setError(data.message || "Invalid credentials");
			}
		} catch {
			setError("Error connecting to server. Please try again.");
		}
	};

	return (
		<div>
		<h1 style={{ fontSize: "2em", fontWeight: "bold", textDecoration: "underline" }}> Mapdesk </h1>
		<span>Created by Mapx</span>		
  		<div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
			<div className="flex items-center justify-center mb-6 text-blue-600">
				<img
					src={mapDeskLogo}
					alt="Map Desk Logo"
					className="w-12 h-12 mr-2 rounded-full object-cover"
				/>
				<h1 className="text-3xl font-bold">Mapdesk Login</h1>
			</div>
			{/* <h2 className="text-2xl font-bold mb-4">Login</h2> */}
			{error && <p className="text-red-500 text-sm mb-2">{error}</p>}
			<form onSubmit={handleSubmit} className="space-y-4">
				<input
					type="text"
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="w-full p-2 border rounded"
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full p-2 border rounded"
				/>
				<button
					type="submit"
					className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
				>
					Login
				</button>
			</form>
		</div>
			&nbsp;&nbsp;
			<div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9em", color: "#666" }}>
				<b><i>&copy; {new Date().getFullYear()} Mapx. All rights reserved.</i></b>
			</div>
		</div>
	);
}

export default Login;
