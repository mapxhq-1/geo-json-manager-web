import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { List } from "react-window";
import { useEmpires } from "../context/EmpireContext"; // Adjust import path as needed

// --- VIRTUALIZED ROW COMPONENT ---
// Uses Flexbox to mimic table columns since standard <tr> fails with absolute positioning
const VirtualizedRow = ({ index, style, list, onView, onEdit, onDelete }) => {
    const empire = list[index];

    return (
        <div style={style} className="flex border-b border-gray-200 hover:bg-gray-50 items-center px-2 text-sm">
            <div className="w-[25%] px-2 truncate" title={empire.empireName}>{empire.empireName}</div>
            <div className="w-[15%] px-2 truncate">
                {empire.startYear?.year} {empire.startYear?.era}
            </div>
            <div className="w-[15%] px-2 truncate">
                {empire.endYear?.year} {empire.endYear?.era}
            </div>
            <div className="w-[25%] px-2 font-mono text-xs truncate text-gray-500" title={empire.objectId}>
                {empire.objectId}
            </div>
            <div className="w-[20%] px-2 space-x-3">
                <button
                    onClick={() => onView(empire.objectId)}
                    className="text-blue-600 hover:underline font-medium"
                >
                    View
                </button>
                <Link to="/form" onClick={() => onEdit(empire.objectId)}>
                    <span className="text-green-600 hover:underline font-medium cursor-pointer">Edit</span>
                </Link>
                <button
                    onClick={() => onDelete(empire.objectId)}
                    className="text-red-600 hover:underline font-medium"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

const EmpireList = ({ onSelect }) => {
    // 1. Grab global data from Context! No local fetching required.
    const { empires, loading, refreshEmpires } = useEmpires();
    
    const [filters, setFilters] = useState({ name: "", year: "", era: "" });
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    const [selectedGeoJSON, setSelectedGeoJSON] = useState(null);

    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    // DEBOUNCE EFFECT: Prevents UI freeze by waiting 300ms after user stops typing to apply filter
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const fetchGeoJsonContent = async (id) => {
        try {
            const res = await fetch(`${baseUrl}/geo-json-service/get-empire-details-by-id/${id}`);
            const data = await res.json();
            setSelectedGeoJSON(data.content);
        } catch {
            alert("Failed to fetch GoJsonContent");
        }
    };

    const updatedFormData = async (id) => {
        try {
            const res = await fetch(`${baseUrl}/geo-json-service/get-empire-details-by-id/${id}`);
            const data = await res.json();
            onSelect(data);
        } catch {
            alert("Failed to update data");
        }
    };

    const handleDelete = async (objectId) => {
        const confirm = window.confirm("Are you sure you want to delete this empire?");
        if (!confirm) return;

        try {
            const res = await fetch(`${baseUrl}/geo-json-service/delete/${objectId}`, {
                method: "DELETE",
            });
            const result = await res.json();
            alert(result.status || "Empire deleted successfully!");
            
            // Tell the Context to refresh the global list
            refreshEmpires();
            
            if (selectedGeoJSON && selectedGeoJSON.includes(objectId)) {
                setSelectedGeoJSON(null);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Error deleting empire. Check console for details.");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // MEMOIZED FILTERING: Only recalculate when debounced string or global list changes
    const filteredEmpires = useMemo(() => {
        return empires.filter((empire) => {
            const nameMatch = (empire.empireName || "")
                .toLowerCase()
                .includes(debouncedFilters.name.toLowerCase().trim());

            const filterYear = debouncedFilters.year.trim();
            let yearMatch = true;
            if (filterYear !== "") {
                const startYearStr = empire.startYear?.year?.toString() ?? "";
                const endYearStr = empire.endYear?.year?.toString() ?? "";
                yearMatch = startYearStr.startsWith(filterYear) || endYearStr.startsWith(filterYear);
            }

            const filterEra = debouncedFilters.era.trim();
            let eraMatch = true;
            if (filterEra !== "") {
                const startEra = empire.startYear?.era ?? "";
                const endEra = empire.endYear?.era ?? "";
                eraMatch = startEra === filterEra || endEra === filterEra;
            }

            return nameMatch && yearMatch && eraMatch;
        });
    }, [empires, debouncedFilters]);

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
                    className="border p-2 flex-1 min-w-[150px] rounded"
                />
                <input
                    type="text"
                    name="year"
                    placeholder="Filter by year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="border p-2 flex-1 min-w-[150px] rounded"
                />
                <select
                    name="era"
                    value={filters.era}
                    onChange={handleFilterChange}
                    className="border p-2 min-w-[150px] rounded"
                >
                    <option value="">All Eras</option>
                    <option value="BCE">BCE</option>
                    <option value="CE">CE</option>
                </select>
            </div>

            {/* Layout: Viewer on Left, Table on Right */}
            <div className="flex gap-4 h-[600px]">
                
                {/* GeoJSON Viewer */}
                {selectedGeoJSON && (
                    <div className="w-1/2 p-2 border bg-gray-50 h-full overflow-auto flex flex-col rounded-lg">
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={() => setSelectedGeoJSON(null)}
                                className="text-red-500 hover:underline font-medium"
                            >
                                Close
                            </button>
                        </div>
                        <h3 className="font-semibold mb-2">GeoJSON Content:</h3>
                        <pre className="text-sm bg-white p-2 border rounded flex-1 overflow-auto">
                            {JSON.stringify(
                                typeof selectedGeoJSON === "string"
                                    ? JSON.parse(atob(selectedGeoJSON))
                                    : selectedGeoJSON,
                                null,
                                2
                            )}
                        </pre>
                    </div>
                )}

                {/* Virtualized "Table" */}
                <div className={`${selectedGeoJSON ? "w-1/2" : "w-full"} h-full border rounded-lg flex flex-col bg-white overflow-hidden`}>
                    {/* Fake Table Header */}
                    <div className="flex bg-gray-100 border-b font-semibold text-gray-700 py-2 px-2 shrink-0 text-sm shadow-sm z-10">
                        <div className="w-[25%] px-2">Empire Name</div>
                        <div className="w-[15%] px-2">Start Year</div>
                        <div className="w-[15%] px-2">End Year</div>
                        <div className="w-[25%] px-2">Object ID</div>
                        <div className="w-[20%] px-2">Actions</div>
                    </div>

                    {/* Virtualized Body */}
                    <div className="flex-1 overflow-hidden relative">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Loading Empires...</p>
                            </div>
                        ) : filteredEmpires.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>No matching empires found.</p>
                            </div>
                        ) : (
                            <List
                                rowCount={filteredEmpires.length}
                                rowHeight={48} // 48px tall rows
                                rowComponent={VirtualizedRow}
                                rowProps={{
                                    list: filteredEmpires,
                                    onView: fetchGeoJsonContent,
                                    onEdit: updatedFormData,
                                    onDelete: handleDelete
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmpireList;