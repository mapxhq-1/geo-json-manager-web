import { useState } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Link,
	useLocation,
} from "react-router-dom";
import "./App.css";
import EmpireForm from "./components/EmpireForm";
import EmpireList from "./components/EmpireList";
import LayersForm from "./components/LayersForm";
import LayersList from "./components/LayersList";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { logout } from "./utils/auth";
import MetadataPath from "./components/MetadataPath";

function App() {
	const baseUrl = import.meta.env.VITE_API_BASE_URL;
	const [selectedEmpire, setSelectedEmpire] = useState(null);
	const [selectedLayer, setSelectedLayer] = useState(null);

	const handleFormSubmit = async (data) => {
		// console.log("Form submitted with:", data);
		try {
			const creds = JSON.parse(localStorage.getItem("geojson_creds"));
			const response = await fetch(`${baseUrl}/geo-json-service/upload`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			alert(result.status);
		} catch (error) {
			console.error("Error uploading empire:", error);
		}
	};

	return (
		<Router>
			<AppLayout>
				<Routes>
					<Route
						path="/form"
						element={
							<ProtectedRoute>
								<EmpireForm
									onSubmit={handleFormSubmit}
									initialData={selectedEmpire}
									isEditing={Boolean(selectedEmpire)}
									onFinishEditing={() => setSelectedEmpire(null)}
								/>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/list"
						element={
							<ProtectedRoute>
								<EmpireList onSelect={setSelectedEmpire} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/layers_form"
						element={
							<ProtectedRoute>
								<LayersForm
									onSubmit={() => {}}
									initialData={selectedLayer}
									isEditing={Boolean(selectedLayer)}
									onFinishEditing={() => setSelectedLayer(null)}
								/>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/layers"
						element={
							<ProtectedRoute>
								<LayersList onSelect={setSelectedLayer} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/metadata_path"
						element={
							<ProtectedRoute>
								<MetadataPath />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Login />} />
				</Routes>
			</AppLayout>
		</Router>
	);
}

function AppLayout({ children }) {
	const location = useLocation();
	const hideNav =
		location.pathname === "/form" || 
		location.pathname === "/list" || 
		location.pathname === "/layers_form" || 
		location.pathname === "/layers" || 
		location.pathname === "/metadata_path" || 
		location.pathname === "/metadata_list";

	return (
		<div className="max-w-6xl mx-auto p-4">
			{hideNav && (
				<nav className="flex gap-4 mb-6 border-b pb-2 flex-wrap">
					<Link
						to="/form"
						className="text-blue-600 hover:underline font-semibold"
					>
						Empire Form
					</Link>
					<Link
						to="/list"
						className="text-blue-600 hover:underline font-semibold"
					>
						Empire List
					</Link>
					<Link
						to="/metadata_path"
						className="text-blue-600 hover:underline font-semibold"
					>
						Metadata Form
					</Link>
					<Link
						to="/layers_form"
						className="text-blue-600 hover:underline font-semibold"
					>
						Layers Form
					</Link>
					<Link
						to="/layers"
						className="text-blue-600 hover:underline font-semibold"
					>
						Layers List
					</Link>
		
					<div className="ml-auto pr-5">
						<Link to="/login">
							<button
								onClick={() => logout()}
								className="text-red-600 hover:text-red-800 font-semibold underline-offset-4 hover:underline transition-colors"
							>
								Logout
							</button>
						</Link>
					</div>
				</nav>
			)}
			{children}
		</div>
	);
}

export default App;
