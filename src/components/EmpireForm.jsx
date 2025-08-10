import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function EmpireForm({
	onSubmit,
	isEditing = false,
	initialData,
	onFinishEditing,
}) {
	// console.log(initialData);
	// console.log(isEditing);
	const [empireName, setEmpireName] = useState("");
	const [startYear, setStartYear] = useState({ year: "", era: "BCE" });
	const [endYear, setEndYear] = useState({ year: "", era: "BCE" });
	const [content, setContent] = useState("");
	const [error, setError] = useState("");

	const baseUrl = import.meta.env.VITE_API_BASE_URL;
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (isEditing && initialData) {
			setEmpireName(initialData.empireName || "");
			setStartYear({
				year: initialData.startYear?.year || "",
				era: initialData.startYear?.era || "BCE",
			});
			setEndYear({
				year: initialData.endYear?.year || "",
				era: initialData.endYear?.era || "BCE",
			});
			setContent(
				initialData.content ? JSON.stringify(initialData.content, null, 2) : ""
			);
		}
	}, [initialData, isEditing]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;

		if (name === "empire_name") {
			setEmpireName(value);
		} else if (name === "start_year") {
			setStartYear((prev) => ({ ...prev, year: value }));
		} else if (name === "start_era") {
			setStartYear((prev) => ({ ...prev, era: value }));
		} else if (name === "end_year") {
			setEndYear((prev) => ({ ...prev, year: value }));
		} else if (name === "end_era") {
			setEndYear((prev) => ({ ...prev, era: value }));
		} else if (name === "content") {
			setContent(value);
		}
	};

	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = function (event) {
			setContent(event.target.result);
		};
		reader.readAsText(file);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (
			!empireName ||
			!startYear.year ||
			!endYear.year ||
			!startYear.era ||
			!endYear.era ||
			!content
		) {
			setError("Please fill in all fields");
			return;
		}

		setError("");

		let parsedContent;
		try {
			parsedContent = JSON.parse(content);
		} catch (err) {
			setError("Invalid GeoJSON content. Please ensure it's valid JSON.");
			return;
		}

		const formData = {
			empireName: empireName,
			startYear: { year: parseInt(startYear.year), era: startYear.era },
			endYear: { year: parseInt(endYear.year), era: endYear.era },
			content: parsedContent,
		};

		try {
			console.log("update api active ");
			console.log(formData);
			if (isEditing && initialData?.objectId) {
				console.log(isEditing);
				console.log(initialData?.objectId);
				const res = await fetch(`${baseUrl}/geo-json-service/update`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...formData,
						objectId: initialData.objectId,
					}),
				});
				const result = await res.json();
				alert(result.status || "Empire updated successfully!");
				if (onFinishEditing) {
					onFinishEditing();
				}
			} else {
				console.log("update api inactive ");
				onSubmit(formData);
			}

			setEmpireName("");
			setStartYear({ year: "", era: "BCE" });
			setEndYear({ year: "", era: "BCE" });
			setContent("");

			if (fileInputRef.current) {
				fileInputRef.current.value = "";
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
				{isEditing ? "Update Empire" : "Upload New Empire"}
			</h2>

			{error && <p className="text-red-600 text-sm">{error}</p>}

			<div>
				<label className="block text-sm font-medium">Empire Name</label>
				<input
					type="text"
					name="empire_name"
					value={empireName}
					onChange={handleInputChange}
					className="w-full mt-1 border border-gray-300 rounded p-2"
					required
				/>
			</div>

			<div className="flex gap-4">
				<div className="w-1/2">
					<label className="block text-sm font-medium">Start Year</label>
					<div className="flex gap-2">
						<input
							type="number"
							name="start_year"
							value={startYear.year}
							onChange={handleInputChange}
							className="w-2/3 mt-1 border border-gray-300 rounded p-2"
							required
						/>
						<select
							name="start_era"
							value={startYear.era}
							onChange={handleInputChange}
							className="w-1/3 mt-1 border border-gray-300 rounded p-2"
						>
							<option value="BCE">BCE</option>
							<option value="CE">CE</option>
						</select>
					</div>
				</div>
				<div className="w-1/2">
					<label className="block text-sm font-medium">End Year</label>
					<div className="flex gap-2">
						<input
							type="number"
							name="end_year"
							value={endYear.year}
							onChange={handleInputChange}
							className="w-2/3 mt-1 border border-gray-300 rounded p-2"
							required
						/>
						<select
							name="end_era"
							value={endYear.era}
							onChange={handleInputChange}
							className="w-1/3 mt-1 border border-gray-300 rounded p-2"
						>
							<option value="BCE">BCE</option>
							<option value="CE">CE</option>
						</select>
					</div>
				</div>
			</div>

			<div>
				<label className="block text-sm font-medium">GeoJSON Content</label>
				<textarea
					name="content"
					value={content}
					onChange={handleInputChange}
					rows="5"
					placeholder="Paste raw GeoJSON content here..."
					className="w-full mt-1 border border-gray-300 rounded p-2 font-mono text-sm"
				/>

				<div className="mt-2">
					<label className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded cursor-pointer hover:bg-gray-300">
						Choose File
						<input
							type="file"
							accept=".json,.geojson"
							onChange={handleFileUpload}
							ref={fileInputRef}
							className="hidden"
						/>
					</label>
				</div>
			</div>

			<button
				type="submit"
				className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
			>
				{isEditing ? "Update" : "Upload"}
			</button>
		</form>
	);
}

export default EmpireForm;
