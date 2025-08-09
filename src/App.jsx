import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import EmpireForm from "./components/EmpireForm";
import EmpireList from "./components/EmpireList";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

function App() {
	const baseUrl = import.meta.env.VITE_API_BASE_URL;
	const handleFormSubmit = async (data) => {
		console.log("Form submitted with:", data);
		try {
			const response = await fetch(`${baseUrl}/geo-json-service/upload`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();
			console.log("Server response:", result);
			alert(result.status);
		} catch (error) {
			console.error("Error uploading empire:", error);
		}
	};

	const [selectedEmpire, setSelectedEmpire] = useState(null);

	return (
		<>
			<Router>
				<div className="max-w-6xl mx-auto p-4">
					<nav className="flex gap-4 mb-6 border-b pb-2">
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
					</nav>

					<Routes>
						<Route
							path="/form"
							element={
								<EmpireForm
									onSubmit={handleFormSubmit}
									initialData={selectedEmpire}
									isEditing={Boolean(selectedEmpire)}
									onFinishEditing={() => setSelectedEmpire(null)}
								/>
							}
						/>
						<Route
							path="/list"
							element={<EmpireList onSelect={setSelectedEmpire} />}
						/>
						{/* <Route path="*" element={<p>404 Not Found</p>} /> */}
					</Routes>
				</div>
			</Router>
		</>
	);
}

export default App;
