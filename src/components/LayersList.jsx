import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LayersList = ({ onSelect }) => {
	const navigate = useNavigate();
	const [layers, setLayers] = useState([]);
	const [filters, setFilters] = useState({ layerName: "", layerType: "" });
	const [appliedFilters, setAppliedFilters] = useState({ layerName: "", layerType: "" });
	const [loading, setLoading] = useState(false);
	const [viewerLayer, setViewerLayer] = useState(null);
	const [viewLoading, setViewLoading] = useState(false);

	const baseUrl = import.meta.env.VITE_API_BASE_URL;
	const clientName = "mapdesk";

	const fetchAllGeoLayers = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`${baseUrl}/geo-json-service/get_all_geo_layers`,
				{
					headers: {
						"client_name": clientName,
					},
				}
			);
			const data = await res.json();
			if (data.status === "success" && Array.isArray(data.response)) {
				setLayers(data.response);
			} else {
				setLayers([]);
				if (data.status === "failure") {
					alert(data.message || "Failed to fetch geo layers");
				}
			}
		} catch (err) {
			console.error(err);
			alert("Failed to fetch geo layers");
			setLayers([]);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchAllGeoLayers();
	}, []);

	const handleFilterChange = (e) => {
		const { name, value } = e.target;
		setFilters((prev) => ({ ...prev, [name]: value }));
	};

	const handleSearch = () => {
		setAppliedFilters({ ...filters });
	};

	const handleReset = () => {
		setFilters({ layerName: "", layerType: "" });
		setAppliedFilters({ layerName: "", layerType: "" });
	};

	const filteredLayers = layers.filter((layer) => {
		const nameMatch = (layer.layerName || "")
			.toLowerCase()
			.includes((appliedFilters.layerName || "").toLowerCase().trim());
		const typeMatch = (layer.layerType || "")
			.toLowerCase()
			.includes((appliedFilters.layerType || "").toLowerCase().trim());
		return nameMatch && typeMatch;
	});

	const handleViewGeoJSON = async (layer) => {
		setViewLoading(true);
		setViewerLayer(null);
		try {
			const params = new URLSearchParams();
			if (layer.layerName) params.set("layerName", layer.layerName);
			if (layer.layerType) params.set("layerType", layer.layerType);
			const res = await fetch(
				`${baseUrl}/geo-json-service/search_geo_layers?${params.toString()}`,
				{
					headers: { "client_name": clientName },
				}
			);
			const contentType = res.headers.get("content-type") || "";
			if (!contentType.includes("application/json")) {
				alert(res.ok ? "Server did not return JSON." : `Error ${res.status}: Server may be down or URL is wrong.`);
				return;
			}
			let data;
			try {
				data = await res.json();
			} catch (parseErr) {
				// Backend often returns invalid JSON when metadataContent is plain text (e.g. .txt) and not sent as a quoted string
				alert(
					"Server returned invalid JSON. If layer metadata is plain text (.txt), the backend must send it as a quoted JSON string (e.g. metadataContent: \"your text here\")."
				);
				return;
			}
			if (data.status === "success" && Array.isArray(data.response) && data.response.length > 0) {
				const match = data.response.find((l) => l.id === layer.id) ?? data.response[0];
				setViewerLayer(match);
			} else {
				alert(data.message || "No layer details found.");
			}
		} catch (err) {
			console.error(err);
			alert("Failed to load layer details.");
		}
		setViewLoading(false);
	};

	const handleEdit = async (layer) => {
		try {
			const params = new URLSearchParams();
			if (layer.layerName) params.set("layerName", layer.layerName);
			if (layer.layerType) params.set("layerType", layer.layerType);
			const res = await fetch(
				`${baseUrl}/geo-json-service/search_geo_layers?${params.toString()}`,
				{ headers: { "client_name": clientName } }
			);
			const contentType = res.headers.get("content-type") || "";
			if (!contentType.includes("application/json")) {
				alert(res.ok ? "Server did not return JSON." : `Error ${res.status}: Server may be down or URL is wrong.`);
				return;
			}
			let data;
			try {
				data = await res.json();
			} catch (parseErr) {
				alert(
					"Server returned invalid JSON. If layer metadata is plain text (.txt), the backend must send it as a quoted JSON string."
				);
				return;
			}
			if (data.status === "success" && Array.isArray(data.response) && data.response.length > 0) {
				const fullLayer = data.response.find((l) => l.id === layer.id) ?? data.response[0];
				onSelect({
					id: fullLayer.id,
					layerName: fullLayer.layerName,
					layerType: fullLayer.layerType,
					geoFileContent: fullLayer.geoFileContent,
					metadataContent: fullLayer.metadataContent,
					createdAt: fullLayer.createdAt,
					updatedAt: fullLayer.updatedAt,
				});
				navigate("/layers_form");
			} else {
				alert(data.message || "Could not load layer details for editing.");
			}
		} catch (err) {
			console.error(err);
			alert("Failed to load layer details for editing.");
		}
	};

	const handleDelete = async (layerId) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this geo layer?"
		);
		if (!confirmed) return;

		try {
			const res = await fetch(
				`${baseUrl}/geo-json-service/delete_geo_layer/${layerId}`,
				{
					method: "DELETE",
					headers: {
						"client_name": clientName,
					},
				}
			);
			const result = await res.json();
			alert(result.message || result.status || "Layer deleted.");
			fetchAllGeoLayers();
		} catch (err) {
			console.error("Delete error:", err);
			alert("Error deleting geo layer.");
		}
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return "—";
		try {
			const d = new Date(dateStr);
			return d.toLocaleString();
		} catch {
			return dateStr;
		}
	};

	return (
		<div>
			<h2 className="text-xl font-semibold mb-4">Geo Layers</h2>

			{/* Search: Layer Name, Layer Type */}
			<div className="flex gap-4 mb-4 flex-wrap items-center">
				<input
					type="text"
					name="layerName"
					placeholder="Filter by layer name"
					value={filters.layerName}
					onChange={handleFilterChange}
					className="border p-2 flex-1 min-w-[150px]"
				/>
				<input
					type="text"
					name="layerType"
					placeholder="Filter by layer type"
					value={filters.layerType}
					onChange={handleFilterChange}
					className="border p-2 flex-1 min-w-[150px]"
				/>
				<div className="flex gap-2 flex-shrink-0">
					<button
						type="button"
						onClick={handleSearch}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Search
					</button>
					<button
						type="button"
						onClick={handleReset}
						className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
					>
						Reset
					</button>
					<Link to="/layers_form">
						<button
							type="button"
							onClick={() => onSelect(null)}
							className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
						>
							New Layer
						</button>
					</Link>
				</div>
			</div>

			<div className="flex gap-4">
				{/* Layer details viewer (GeoJSON + Metadata from search_geo_layers) */}
				{(viewerLayer != null || viewLoading) && (
					<div className="w-1/2 p-2 border bg-gray-50 max-h-[600px] overflow-auto flex flex-col">
						<div className="flex justify-end mb-2">
							<button
								onClick={() => setViewerLayer(null)}
								className="text-red-500 hover:underline"
								disabled={viewLoading}
							>
								Close
							</button>
						</div>
						{viewLoading ? (
							<p className="p-2">Loading layer details...</p>
						) : viewerLayer ? (
							<>
								<h3 className="font-semibold mb-2">
									{viewerLayer.layerName} ({viewerLayer.layerType})
								</h3>
								<div className="space-y-3 flex-1 min-h-0 overflow-hidden flex flex-col">
									<div className="flex flex-col min-h-0 flex-1">
										<h4 className="font-medium text-sm mb-1">Metadata</h4>
										<pre className="text-sm bg-white p-2 border rounded overflow-auto flex-1 min-h-[200px] max-h-[280px] whitespace-pre-wrap">
											{(() => {
												const raw = viewerLayer.metadataContent;
												if (raw == null || raw === "") return "No metadata available.";
												if (typeof raw === "string") {
													try {
														const parsed = JSON.parse(raw);
														if (typeof parsed === "object" && parsed !== null && Object.keys(parsed).length > 0) {
															return JSON.stringify(parsed, null, 2);
														}
													} catch {
														// Plain text: show as-is so newlines display naturally (like Edit view)
													}
													return raw;
												}
												if (typeof raw === "object" && raw !== null && Object.keys(raw).length === 0) {
													return "No metadata available.";
												}
												return JSON.stringify(raw, null, 2);
											})()}
										</pre>
									</div>
									<div className="flex flex-col min-h-0 flex-1">
										<h4 className="font-medium text-sm mb-1">GeoJSON Content</h4>
										<pre className="text-sm bg-white p-2 border rounded overflow-auto flex-1 min-h-[200px] max-h-[280px]">
											{JSON.stringify(
												typeof viewerLayer.geoFileContent === "string"
													? (() => {
															try {
																return JSON.parse(viewerLayer.geoFileContent);
															} catch {
																return viewerLayer.geoFileContent;
															}
													  })()
													: viewerLayer.geoFileContent ?? {},
												null,
												2
											)}
										</pre>
									</div>
								</div>
							</>
						) : null}
					</div>
				)}

				{/* Layers Table */}
				<div className={viewerLayer != null || viewLoading ? "w-1/2 overflow-auto" : "w-full"}>
					{loading ? (
						<p>Loading...</p>
					) : (
						<table className="w-full text-left border">
							<thead className="bg-gray-100">
								<tr>
									<th className="border px-2 py-1">Layer Name</th>
									<th className="border px-2 py-1">Layer Type</th>
									<th className="border px-2 py-1">ID</th>
									<th className="border px-2 py-1">Updated</th>
									<th className="border px-2 py-1">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredLayers.map((layer) => (
									<tr key={layer.id} className="hover:bg-gray-50">
										<td className="border px-2 py-1">{layer.layerName ?? "—"}</td>
										<td className="border px-2 py-1">{layer.layerType ?? "—"}</td>
										<td className="border px-2 py-1 text-xs break-all">{layer.id}</td>
										<td className="border px-2 py-1 text-sm">
											{formatDate(layer.updatedAt)}
										</td>
										<td className="border px-2 py-1 space-x-2">
											<button
												onClick={() => handleViewGeoJSON(layer)}
												className="text-blue-600 hover:underline"
											>
												View
											</button>
											<button
												onClick={() => handleEdit(layer)}
												className="text-green-600 hover:underline"
											>
												Edit
											</button>
											<button
												onClick={() => handleDelete(layer.id)}
												className="text-red-600 hover:underline"
											>
												Delete
											</button>
										</td>
									</tr>
								))}
								{filteredLayers.length === 0 && (
									<tr>
										<td colSpan="5" className="text-center p-2">
											No matching geo layers found.
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

export default LayersList;
