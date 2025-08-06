import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const EmpireList = ({ onSelect }) => {
	const [empires, setEmpires] = useState([]);
	const [filters, setFilters] = useState({ name: "", year: "", era: "" });
	const [loading, setLoading] = useState(false);
	const [selectedGeoJSON, setSelectedGeoJSON] = useState(null);

	const baseUrl = import.meta.env.VITE_API_BASE_URL;

	const fetchEmpires = async () => {
		setLoading(true);
		try {
			const res = await fetch(`${baseUrl}/geo-json-service/get-all-empires`);
			const data = await res.json();
			setEmpires(data);
		} catch (err) {
			alert("Failed to fetch empires");
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchEmpires();
	}, []);

	const handleFilterChange = (e) => {
		const { name, value } = e.target;
		setFilters((prev) => ({ ...prev, [name]: value }));
	};

	const filteredEmpires = empires.filter((empire) => {
		const nameMatch = (empire.empire_name || "")
			.toLowerCase()
			.includes(filters.name.toLowerCase());

		const filterYear = filters.year.trim();
		let yearMatch = true;
		if (filterYear !== "") {
			const startYearNum = empire.start_year?.year ?? null;
			const endYearNum = empire.end_year?.year ?? null;
			yearMatch = startYearNum == filterYear || endYearNum == filterYear;
		}

		const filterEra = filters.era.trim();
		let eraMatch = true;
		if (filterEra !== "") {
			const startEra = empire.start_year?.era ?? "";
			const endEra = empire.end_year?.era ?? "";
			eraMatch = startEra === filterEra || endEra === filterEra;
		}

		return nameMatch && yearMatch && eraMatch;
	});

	const handleDelete = async (objectId) => {
		const confirm = window.confirm(
			"Are you sure you want to delete this empire?"
		);
		if (!confirm) return;

		try {
			const res = await fetch(
				`${baseUrl}/geo-json-service/delete/${objectId}`,
				{
					method: "DELETE",
				}
			);
			const result = await res.json();
			alert(result.status || "Empire deleted successfully!");
			fetchEmpires();
		} catch (err) {
			console.error("Delete error:", err);
			alert("Error deleting empire. Check console for details.");
		}
	};

	return (
		<div>
			<h2 className="text-xl font-semibold mb-4">Empire Records</h2>

			{/* Filters */}
			<div className="flex gap-4 mb-4 flex-wrap">
				<input
					type="text"
					name="name"
					placeholder="Filter by name"
					value={filters.name}
					onChange={handleFilterChange}
					className="border p-2 flex-1 min-w-[150px]"
				/>
				<input
					type="text"
					name="year"
					placeholder="Filter by year"
					value={filters.year}
					onChange={handleFilterChange}
					className="border p-2 flex-1 min-w-[150px]"
				/>
				<select
					name="era"
					value={filters.era}
					onChange={handleFilterChange}
					className="border p-2 min-w-[150px]"
				>
					<option value="">All Eras</option>
					<option value="BCE">BCE</option>
					<option value="CE">CE</option>
				</select>
			</div>

			{/* Layout: Viewer on Left, Table on Right */}
			<div className="flex gap-4">
				{/* GeoJSON Viewer */}
				{selectedGeoJSON && (
					<div className="w-1/2 p-2 border bg-gray-50 max-h-[600px] overflow-auto flex flex-col">
						<div className="flex justify-end mb-2">
							<button
								onClick={() => setSelectedGeoJSON(null)}
								className="text-red-500 hover:underline"
							>
								Close
							</button>
						</div>
						<h3 className="font-semibold mb-2">GeoJSON Content:</h3>
						<pre className="text-sm bg-white p-2 border rounded flex-1 overflow-auto">
							{JSON.stringify(
								typeof selectedGeoJSON === "string"
									? JSON.parse(selectedGeoJSON)
									: selectedGeoJSON,
								null,
								2
							)}
						</pre>
					</div>
				)}

				{/* Empire Table */}
				<div className={selectedGeoJSON ? "w-1/2 overflow-auto" : "w-full"}>
					{loading ? (
						<p>Loading...</p>
					) : (
						<table className="w-full text-left border">
							<thead className="bg-gray-100">
								<tr>
									<th className="border px-2 py-1">Empire Name</th>
									<th className="border px-2 py-1">Start Year</th>
									<th className="border px-2 py-1">End Year</th>
									<th className="border px-2 py-1">ID</th>
									<th className="border px-2 py-1">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredEmpires.map((empire) => (
									<tr key={empire.id} className="hover:bg-gray-50">
										<td className="border px-2 py-1">{empire.empire_name}</td>
										<td className="border px-2 py-1">
											{empire.start_year?.year} {empire.start_year?.era}
										</td>
										<td className="border px-2 py-1">
											{empire.end_year?.year} {empire.end_year?.era}
										</td>
										<td className="border px-2 py-1">{empire.object_id}</td>
										<td className="border px-2 py-1 space-x-2">
											<button
												onClick={() => setSelectedGeoJSON(empire.content)}
												className="text-blue-600 hover:underline"
											>
												View
											</button>
											<Link to="/form">
												<button
													onClick={() => onSelect(empire)}
													className="text-green-600 hover:underline"
												>
													Edit
												</button>
											</Link>
											<button
												onClick={() => handleDelete(empire.object_id)}
												className="text-red-600 hover:underline"
											>
												Delete
											</button>
										</td>
									</tr>
								))}
								{filteredEmpires.length === 0 && (
									<tr>
										<td colSpan="5" className="text-center p-2">
											No matching empires found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
};

export default EmpireList;
