import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function LayersForm({
	onSubmit,
	isEditing = false,
	initialData,
	onFinishEditing,
}) {
	const [layerName, setLayerName] = useState("");
	const [layerType, setLayerType] = useState("");
	const [geoLayerFile, setGeoLayerFile] = useState(null);
	const [geoJsonContent, setGeoJsonContent] = useState("");
	const [geoLayerMetadata, setGeoLayerMetadata] = useState("");
	const [geoLayerMetadataFile, setGeoLayerMetadataFile] = useState(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const baseUrl = import.meta.env.VITE_API_BASE_URL;
	const clientName = "mapdesk";
	const geoLayerFileRef = useRef(null);
	const metadataFileRef = useRef(null);

	// Sanitize filenames to avoid filesystem issues on server (remove special chars, spaces)
	const sanitizeFileName = (name) => {
		if (!name) return "layer.geojson";
		return name.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_").slice(0, 200);
	};

	const sanitizeMetadataFileName = (name) => {
		if (!name) return "metadata.txt";
		const base = name.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_").slice(0, 200);
		return base.toLowerCase().endsWith(".txt") ? base : `${base}.txt`;
	};

	useEffect(() => {
		if (isEditing && initialData) {
			setLayerName(initialData.layerName || "");
			setLayerType(initialData.layerType || "");
			// Handle both geoFileContent and content fields from backend – prefill so user can view/edit
			const geoContent = initialData.geoFileContent || initialData.content;
			if (geoContent != null && (typeof geoContent !== "object" || Object.keys(geoContent).length > 0)) {
				setGeoJsonContent(typeof geoContent === "string" ? geoContent : JSON.stringify(geoContent, null, 2));
			} else {
				setGeoJsonContent("");
			}
			// Handle both metadataContent and metadata – prefill when available so user can view/edit
			const metaContent = initialData.metadataContent || initialData.metadata;
			if (metaContent != null && metaContent !== "") {
				const isObject = typeof metaContent === "object" && metaContent !== null;
				const isEmptyObj = isObject && Object.keys(metaContent).length === 0;
				if (!isEmptyObj) {
					setGeoLayerMetadata(typeof metaContent === "string" ? metaContent : JSON.stringify(metaContent, null, 2));
				} else {
					setGeoLayerMetadata("");
				}
			} else {
				setGeoLayerMetadata("");
			}
		}
	}, [initialData, isEditing]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;

		if (name === "layer_name") {
			setLayerName(value);
		} else if (name === "layer_type") {
			setLayerType(value);
		}
	};

	const handleGeoLayerFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setGeoLayerFile(file);
			// read file and populate textarea so user can also edit/paste
			const reader = new FileReader();
			reader.onload = (ev) => {
				setGeoJsonContent(ev.target.result);
			};
			reader.readAsText(file);
		}
	};

	const handleGeoJsonContentChange = (e) => {
		setGeoJsonContent(e.target.value);
	};

	const handleMetadataTextChange = (e) => {
		setGeoLayerMetadata(e.target.value);
		// User edited textarea → send from textarea on submit, not from uploaded file
		setGeoLayerMetadataFile(null);
	};

	const handleMetadataFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		// Accept .txt (and allow text/plain)
		const isTxt = file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";
		if (!isTxt) {
			setError("Please choose a .txt file for metadata.");
			if (metadataFileRef.current) metadataFileRef.current.value = "";
			return;
		}
		setError("");
		setGeoLayerMetadataFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result;
			if (typeof text === "string") setGeoLayerMetadata(text);
		};
		reader.onerror = () => setError("Could not read metadata file.");
		reader.readAsText(file, "UTF-8");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		// Validation
		if (!layerName || !layerType) {
			setError("Please fill in Layer Name and Layer Type");
			return;
		}

		if (!isEditing && !geoLayerFile && !geoJsonContent) {
			setError("Please provide GeoJSON content by pasting or uploading a file");
			return;
		}

		try {
			const formData = new FormData();
			formData.append("layerName", layerName);
			formData.append("layerType", layerType);

			// If user uploaded a file, prefer that. Otherwise create a Blob from pasted JSON.
			if (geoLayerFile) {
				const safeName = sanitizeFileName(geoLayerFile.name || "layer.geojson");
				let fileToSend;
				try {
					fileToSend = new File([geoLayerFile], safeName, { type: geoLayerFile.type || "application/json" });
				} catch (e) {
					// In some environments File constructor may not be available; fallback to original file
					fileToSend = geoLayerFile;
				}
				formData.append("geoLayerFile", fileToSend, safeName);
			} else if (geoJsonContent) {
				const blob = new Blob([geoJsonContent], { type: "application/json" });
				formData.append("geoLayerFile", blob, "layer.geojson");
			}

			// Metadata: send as .txt file (uploaded file or textarea content as Blob) so backend receives MultipartFile
			if (geoLayerMetadataFile) {
				const safeName = sanitizeMetadataFileName(geoLayerMetadataFile.name);
				formData.append("geoLayerMetadata", geoLayerMetadataFile, safeName);
			} else if (geoLayerMetadata && geoLayerMetadata.trim() !== "") {
				const metaBlob = new Blob([geoLayerMetadata], { type: "text/plain" });
				formData.append("geoLayerMetadata", metaBlob, "metadata.txt");
			}

			// Debug: log FormData keys and sample values to console to help backend debugging
			try {
				console.groupCollapsed("LayersForm - FormData preview");
				for (const pair of formData.entries()) {
					const [k, v] = pair;
					if (v instanceof File || (v && v.name)) {
						console.log(k, "=> File:", v.name, "size:", v.size, "type:", v.type);
					} else if (v instanceof Blob) {
						console.log(k, "=> Blob:", v.type, "(size:", v.size, ")");
					} else {
						console.log(k, "=>", v);
					}
				}
				console.groupEnd();
			} catch (logErr) {
				console.warn("Could not enumerate FormData for debug:", logErr);
			}

			let url, method;

			if (isEditing && initialData?.id) {
				// Update existing layer
				url = `${baseUrl}/geo-json-service/update_geo_layer/${initialData.id}`;
				method = "PATCH";
			} else {
				// Create new layer
				url = `${baseUrl}/geo-json-service/create_geo_layer`;
				method = "POST";
			}

			const response = await fetch(url, {
				method: method,
				headers: {
					"client_name": clientName,
				},
				body: formData,
			});

			// Better error handling: if response not ok, try to read text to show backend message
			if (!response.ok) {
				let text;
				try {
					text = await response.text();
				} catch (tErr) {
					text = `HTTP ${response.status} ${response.statusText}`;
				}
				console.error("LayersForm upload failed:", response.status, response.statusText, text);
				setError(text || "Failed to process request");
				return;
			}

			let result;
			try {
				result = await response.json();
			} catch (parseErr) {
				const text = await response.text();
				console.error("Create/update returned non-JSON:", text, parseErr);
				setError(text || "Server returned unexpected response");
				return;
			}

			if (result.status === "failure") {
				setError(result.message || "Failed to process request");
				return;
			}

			setSuccess(result.message || `Layer ${isEditing ? "updated" : "created"} successfully!`);
			alert(result.message || `Layer ${isEditing ? "updated" : "created"} successfully!`);

			// Reset form
			setLayerName("");
			setLayerType("");
			setGeoLayerFile(null);
			setGeoJsonContent("");
			setGeoLayerMetadata("");
			setGeoLayerMetadataFile(null);

			if (geoLayerFileRef.current) geoLayerFileRef.current.value = "";
			if (metadataFileRef.current) metadataFileRef.current.value = "";

			if (onFinishEditing) {
				onFinishEditing();
			}
		} catch (err) {
			console.error("Submission error:", err);
			setError("Error submitting form. Please check console.");
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-white rounded-lg shadow p-6 space-y-4 max-w-xl mx-auto"
		>
			<h2 className="text-xl font-semibold">
				{isEditing ? "Update Layer" : "Upload New Layer"}
			</h2>

			{error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
			{success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

			<div>
				<label className="block text-sm font-medium">Layer Name</label>
				<input
					type="text"
					name="layer_name"
					value={layerName}
					onChange={handleInputChange}
					placeholder="e.g., Yamuna River"
					className="w-full mt-1 border border-gray-300 rounded p-2"
					required
				/>
			</div>

			<div>
				<label className="block text-sm font-medium">Layer Type</label>
				<input
					type="text"
					name="layer_type"
					value={layerType}
					onChange={handleInputChange}
					placeholder="e.g., River, Mountain, City"
					className="w-full mt-1 border border-gray-300 rounded p-2"
					required
				/>
			</div>

			<div>
				<label className="block text-sm font-medium">GeoJSON Content</label>
				<textarea
					name="geojson_content"
					value={geoJsonContent}
					onChange={handleGeoJsonContentChange}
					rows="6"
					placeholder="Paste raw GeoJSON content here or choose a file to populate this box"
					className="w-full mt-1 border border-gray-300 rounded p-2 font-mono text-sm"
				/>

				<div className="mt-2">
					<label className="inline-block bg-blue-200 text-blue-700 px-4 py-2 rounded cursor-pointer hover:bg-blue-300">
						Choose GeoJSON File {!isEditing && <span className="text-red-600">*</span>}
						<input
							type="file"
							accept=".json,.geojson"
							onChange={handleGeoLayerFileChange}
							ref={geoLayerFileRef}
							className="hidden"
						/>
					</label>
					{geoLayerFile && (
						<p className="text-sm text-gray-600 mt-2">
							Selected: <strong>{geoLayerFile.name}</strong>
						</p>
					)}
				</div>
			</div>

			<div>
				<label className="block text-sm font-medium">Metadata (Optional)</label>
				<textarea
					name="metadata"
					value={geoLayerMetadata}
					onChange={handleMetadataTextChange}
					rows="4"
					placeholder="Paste metadata (JSON or plain text) here, or choose a .txt file to populate this box"
					className="w-full mt-1 border border-gray-300 rounded p-2 text-sm font-mono"
				/>
				<div className="mt-2">
					<label className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded cursor-pointer hover:bg-gray-300">
						Choose .txt file
						<input
							type="file"
							accept=".txt,text/plain"
							onChange={handleMetadataFileChange}
							ref={metadataFileRef}
							className="hidden"
						/>
					</label>
					{geoLayerMetadataFile && (
						<span className="text-sm text-gray-600 ml-2">
							Selected: <strong>{geoLayerMetadataFile.name}</strong>
						</span>
					)}
				</div>
			</div>

			<div className="flex gap-4">
				<button
					type="submit"
					className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
				>
					{isEditing ? "Update Layer" : "Upload Layer"}
				</button>
				{isEditing && (
					<Link to="/layers">
						<button
							type="button"
							className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
						>
							Cancel
						</button>
					</Link>
				)}
			</div>
		</form>
	);
}

export default LayersForm;
