import { useEffect, useState } from "react";
import axios from 'axios';
//Redeploy
// --- CONSTANTS: YOUR DEFAULT FIELDS ---
const DEFAULT_KEYS = [
  "empireName",
  "Founder",
  "Overall Period",
  "Capital",
  "Famous Kings/Rulers",
  "Architecture",
  "Administration",
  "Art & Culture",
  "Admin Language",
  "Unique Feature",
  "Economy & Trade",
  "Important Battles",
  "Religion"
];

// Helper to get fresh initial state
const getInitialRows = () => DEFAULT_KEYS.map(key => ({ key, value: "" }));

// --- COMPONENT: KeyValueEditor (Defined Outside) ---
function KeyValueEditor({ pairs, onAdd, onRemove, onChange }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700">Key-value pairs</span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add row
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {pairs.map((pair, index) => {
          const isStandard = DEFAULT_KEYS.includes(pair.key);
          return (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Key"
                value={pair.key}
                onChange={(e) => onChange(index, "key", e.target.value)}
                className={`flex-1 min-w-0 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isStandard ? "bg-gray-50 border-gray-200 text-gray-700 font-medium" : "bg-white border-gray-300"}`}
              />
              <span className="text-gray-400 shrink-0">→</span>
              <input
                type="text"
                placeholder="Value"
                value={pair.value}
                onChange={(e) => onChange(index, "value", e.target.value)}
                className="flex-1 min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                title="Remove row"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      {pairs.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-md">No rows yet. Click &quot;Add row&quot; to start.</p>
      )}
    </div>
  );
}

function MetadataPath() {
  const [empires, setEmpires] = useState([]);
  const [imageList, setImageList] = useState([]); 
  const [imagePreview, setImagePreview] = useState([]); 
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const [search, setSearch] = useState("");
  const [selectedEmpire, setSelectedEmpire] = useState([]);
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); 

  const [list, setList] = useState([]); 
  const [add, setAdd] = useState("add"); 
  
  // View/Modal State
  const [viewData, setViewData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImages, setModalImages] = useState([]); 
  
  const [currentMetaId, setCurrentMetaId] = useState(null);
  
  // --- KEY-VALUE EDITOR STATE (Initialized with Default Rows) ---
  const [keyValuePairs, setKeyValuePairs] = useState(getInitialRows());

  const [updateImages, setUpdateImages] = useState([]); 
  const [newPreviews, setNewPreviews] = useState([]);   
  const [imagesToRemove, setImagesToRemove] = useState([]);

  // JSON file path (textarea + file picker, like LayersForm)
  const [jsonMetadataContent, setJsonMetadataContent] = useState("");
  const [jsonMetadataFile, setJsonMetadataFile] = useState(null); 

  // --- HELPER: KEY-VALUE LOGIC ---
  const handleAddPair = () => {
    setKeyValuePairs([...keyValuePairs, { key: "", value: "" }]);
  };

  const handleRemovePair = (index) => {
    const list = [...keyValuePairs];
    list.splice(index, 1);
    setKeyValuePairs(list);
  };

  const handlePairChange = (index, field, val) => {
    const list = [...keyValuePairs];
    list[index][field] = val;
    setKeyValuePairs(list);
  };

  const generateJSONFile = () => {
    const dataObj = keyValuePairs.reduce((acc, curr) => {
        if (curr.key.trim() !== "") {
            acc[curr.key] = curr.value;
        }
        return acc;
    }, {});
    
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: "application/json" });
    return new File([blob], "metadata.json", { type: "application/json" });
  };

  /** For Edit modal: only filled rows; parse JSON strings back to object/array for backend. */
  function buildUpdateDetailsFile() {
    const dataObj = {};
    keyValuePairs.forEach((p) => {
      const k = (p.key && p.key.trim()) || "";
      const v = (p.value && p.value.trim()) || "";
      if (k === "" || v === "") return;
      let val = v;
      const trimmed = v.trim();
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
          val = JSON.parse(v);
        } catch (_) {
          // keep as string
        }
      }
      dataObj[k] = val;
    });
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: "application/json" });
    return new File([blob], "metadata.json", { type: "application/json" });
  }

  async function fetchBackendImage(fileName) {
    try {
      const response = await axios.get(
        `${baseUrl}/geo-json-service/fetch-image/${fileName}`, 
        {
          headers: { client_name: "MapDesk" },
          responseType: 'blob' 
        }
      );
      return {
        url: URL.createObjectURL(response.data),
        fileName: fileName
      };
    } catch (err) {
      console.error(`Failed to fetch image: ${fileName}`, err);
      return null;
    }
  }

  // --- CREATE TABLE ONLY: uses only table (keyValuePairs) + images. No JSON panel data. ---
  async function createMetadataFromTable() {
    setError("");
    setSuccessMsg("");

    if (selectedEmpire.length === 0) {
      setError("No empires selected.");
      return;
    }

    const tableRows = keyValuePairs;
    const hasTableData = tableRows.some(p => (p.value && p.value.trim()) !== "");
    if (!hasTableData) {
      setError("Please fill in at least one value in the table.");
      return;
    }

    const tableOnlyPayload = tableRows.reduce((acc, curr) => {
      const k = (curr.key && curr.key.trim()) || "";
      const v = (curr.value && curr.value.trim()) || "";
      if (k !== "" && v !== "") acc[k] = v;
      return acc;
    }, {});

    const tablePayloadString = JSON.stringify(tableOnlyPayload, null, 2);

    try {
      for (const ele of selectedEmpire) {
        const tableDetailsFile = new File(
          [new Blob([tablePayloadString], { type: "application/json" })],
          "metadata.json",
          { type: "application/json" }
        );
        const formData = new FormData();
        formData.append("objectId", ele);
        formData.append("detailsFile", tableDetailsFile);
        imageList.forEach((image) => formData.append("images", image));
        await axios.post(`${baseUrl}/geo-json-service/create`, formData, { headers: { client_name: "mapdesk" } });
      }

      setSuccessMsg("Metadata created successfully.");
      setKeyValuePairs(getInitialRows());
      setImageList([]);
      setImagePreview([]);
      setSelectedEmpire([]);
      fetchEmpires();
      getMetadata();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to create the metadata");
    }
  }

  // --- UPLOAD JSON ONLY: uses only JSON panel (file or textarea). No table data. ---
  async function uploadJsonMetadata() {
    setError("");
    setSuccessMsg("");

    if (selectedEmpire.length === 0) {
      setError("No empires selected.");
      return;
    }

    let jsonOnlyContent = "";
    if (jsonMetadataFile && jsonMetadataContent.trim()) {
      jsonOnlyContent = jsonMetadataContent;
    } else if (jsonMetadataContent.trim()) {
      jsonOnlyContent = jsonMetadataContent;
    } else {
      setError("Please paste JSON in the text area or choose a file with Browse.");
      return;
    }

    try {
      JSON.parse(jsonOnlyContent);
    } catch (_) {
      setError("Invalid JSON. Please paste valid JSON or select a valid JSON file.");
      return;
    }

    try {
      for (const ele of selectedEmpire) {
        const formData = new FormData();
        formData.append("objectId", ele);
        const jsonOnlyFile = new File(
          [new Blob([jsonOnlyContent], { type: "application/json" })],
          "metadata.json",
          { type: "application/json" }
        );
        formData.append("detailsFile", jsonOnlyFile);
        await axios.post(`${baseUrl}/geo-json-service/create`, formData, { headers: { client_name: "mapdesk" } });
      }

      setSuccessMsg("JSON metadata uploaded successfully.");
      setJsonMetadataContent("");
      setJsonMetadataFile(null);
      setSelectedEmpire([]);
      fetchEmpires();
      getMetadata();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to upload JSON metadata");
    }
  }

  // --- UPDATE LOGIC (PATCH) ---
  async function handleUpdate() {
    setError("");
    setSuccessMsg("");

    if (!currentMetaId) {
      setError("Cannot update: Missing Metadata ID");
      return;
    }

    const formData = new FormData();
    const updateFile = buildUpdateDetailsFile();
    formData.append("detailsFile", updateFile);
    
    if (updateImages.length > 0) {
      updateImages.forEach((file) => formData.append("newImages", file));
    }
    
    if (imagesToRemove.length > 0) {
      imagesToRemove.forEach(id => formData.append("removeImageIds", id));
    }

    try {
      await axios.patch(
        `${baseUrl}/geo-json-service/update_empire_metadata?id=${currentMetaId}`,
        formData,
        {
          headers: { 
            client_name: "MapDesk",
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      setSuccessMsg("Updated successfully.");
      closeModal();
      getMetadata(); 
      fetchEmpires();
      setTimeout(() => setSuccessMsg(""), 3000);

    } catch (err) {
      console.error("Update failed", err);
      setError("Failed to update metadata.");
    }
  }

  function handleNewImageSelect(e) {
    const files = Array.from(e.target.files);
    if(files.length === 0) return;
    setUpdateImages(prev => [...prev, ...files]);
    const newPreviewUrls = files.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
    }));
    setNewPreviews(prev => [...prev, ...newPreviewUrls]);
  }

  function removeNewImage(index) {
    setUpdateImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function fetchEmpires() {
    try {
      const res = await fetch(`${baseUrl}/geo-json-service/get-all-empires`);
      const data = await res.json();
      setEmpires(data);
    } catch (err) {
      console.log("Server error caused!!", err);
    }
  }

  async function getMetadata() {
    try {
      const res = await fetch(`${baseUrl}/geo-json-service/get-all-empire-metadata-object-ids`, { headers: { client_name: "MapDesk" } });
      const data = await res.json();
      setList(data.response); 
    } catch (err) {
      setError("Failed to fetch data!!");
    }
  }

  // --- VIEW/OPEN MODAL ---
  async function viewMetadata(empireObjectId) {
    try {
      const metadataId = list[empireObjectId];
      if(!metadataId) {
        setError("Metadata mapping not found.");
        return;
      }

      setModalImages([]);
      setViewData(null);
      setUpdateImages([]);
      setNewPreviews([]); 
      setImagesToRemove([]);
      setError("");
      setSuccessMsg("");
      
      const res = await axios.get(
        `${baseUrl}/geo-json-service/get_empire_metadata_by_id/${metadataId}`, 
        { headers: { client_name: "MapDesk" } }
      );
      
      const data = res.data.response;
      setViewData(data);
      setCurrentMetaId(data.id); 

      // --- LOAD ONLY WHAT'S STORED (no table defaults) so JSON-uploaded metadata stays JSON-only ---
      let loadedData = {};
      if (data.jsonMetadata) {
        let sourceObj = data.jsonMetadata;
        if (Array.isArray(sourceObj) && sourceObj.length > 0) sourceObj = sourceObj[0];
        if (typeof sourceObj === "object" && sourceObj !== null) loadedData = sourceObj;
      }

      const editRows = Object.entries(loadedData).map(([k, v]) => {
        const value =
          typeof v === "object" && v !== null ? JSON.stringify(v, null, 2) : String(v ?? "");
        return { key: k, value };
      });
      setKeyValuePairs(editRows.length > 0 ? editRows : [{ key: "", value: "" }]);

      if (data.imageFileIds && Array.isArray(data.imageFileIds)) {
        const imagePromises = data.imageFileIds.map(fileName => fetchBackendImage(fileName));
        const results = await Promise.all(imagePromises);
        setModalImages(results.filter(r => r !== null)); 
      }

      setShowModal(true);
    } catch (err) {
      console.error(err);
      setError("Failed to view");
    }
  }

  async function deleteMetadata(id) {
    const metaId = list[id];
    setError("");
    setSuccessMsg("");
    try{
      await axios.delete(`${baseUrl}/geo-json-service/delete_empire_metadata/${metaId}`,{headers:{client_name:"mapdesk"}})
      getMetadata(); 
      fetchEmpires();
      setSuccessMsg("Successfully deleted")
      setTimeout(() => setSuccessMsg(""), 3000);

    }catch(err){
      console.error(err);
      setError("Failed to delete the metadata!!")
    }
  }

  function toggleImageRemoval(fileName) {
    setImagesToRemove(prev => 
      prev.includes(fileName) ? prev.filter(f => f !== fileName) : [...prev, fileName]
    );
  }

  const filteredEmpires = empires.filter((e) =>
    e.empireName.toLowerCase().includes(search.toLowerCase()) && !Object.keys(list).includes(e.objectId)
  );

  const addedEmpires = empires.filter((e) =>
    e.empireName.toLowerCase().includes(search.toLowerCase()) && Object.keys(list).includes(e.objectId)
  );

  useEffect(() => {
    fetchEmpires();
    getMetadata();
  }, []);

  function handleCheckbox(e) {
    const { value, checked } = e.target;
    setSelectedEmpire((prev) => checked ? [...prev, value] : prev.filter(id => id != value));
  }

  function handleChange(e) {
    const files = Array.from(e.target.files);
    setImageList(files);
    setImagePreview(files.map((ele) => URL.createObjectURL(ele)));
  }

  function handleJsonMetadataFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonMetadataFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setJsonMetadataContent(typeof ev.target?.result === "string" ? ev.target.result : "");
      } catch (_) {
        setJsonMetadataContent("");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function closeModal() {
    setShowModal(false);
    setViewData(null);
    setModalImages([]);
    setNewPreviews([]);
    setUpdateImages([]);
    // Reset to default blank rows
    setKeyValuePairs(getInitialRows()); 
  }

  return (
    <div className="min-h-screen bg-gray-50/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Metadata Manager</h1>
        </header>

        {/* --- TOP SECTION: Empires list --- */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-800">
              {add === "add" ? "Unassigned empires" : "Managed empires"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setAdd(add === "add" ? "update" : "add");
                setError("");
                setSuccessMsg("");
                setKeyValuePairs(getInitialRows());
                setJsonMetadataContent("");
                setJsonMetadataFile(null);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              {add === "add" ? "Switch to Manage data" : "Switch to Create data"}
            </button>
          </div>
          <div className="p-4">
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by empire name..."
                className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {add === "add" && selectedEmpire.length > 0 && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium text-blue-600">{selectedEmpire.length}</span> selected — choose &quot;Create Table&quot; or &quot;Upload JSON&quot; below.
              </p>
            )}
            <div className="flex gap-3">
              <div className="flex-1 h-[19.5rem] overflow-y-auto overflow-x-hidden rounded-lg border border-gray-200 bg-gray-50/30 py-2 px-2 scroll-smooth space-y-2" style={{ scrollbarGutter: "stable" }}>
                {add === "add" ? (
                  filteredEmpires.map((e) => (
                    <label
                      key={e.objectId}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                        selectedEmpire.includes(e.objectId)
                          ? "border-blue-300 bg-blue-50/80"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={e.objectId}
                        onChange={handleCheckbox}
                        checked={selectedEmpire.includes(e.objectId)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate">{e.empireName}</span>
                        <span className="text-xs font-mono text-gray-500 truncate select-all">{e.objectId}</span>
                      </div>
                    </label>
                  ))
                ) : (
                  addedEmpires.map((e) => (
                    <div
                      key={e.objectId}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:border-gray-300"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate">{e.empireName}</span>
                        <span className="text-xs font-mono text-gray-500 truncate select-all">{e.objectId}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="rounded-lg bg-blue-50 text-blue-700 px-3 py-1.5 text-sm font-medium hover:bg-blue-100 border border-blue-100 transition"
                          onClick={() => viewMetadata(e.objectId)}
                        >
                          View / Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-red-50 text-red-700 px-3 py-1.5 text-sm font-medium hover:bg-red-100 border border-red-100 transition"
                          onClick={() => deleteMetadata(e.objectId)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {(add === "add" ? filteredEmpires : addedEmpires).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">No empires found</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center justify-center text-gray-400 py-4 shrink-0" title="List is scrollable">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="text-xs mt-1">Scroll</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- STATUS MESSAGES --- */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-800">{successMsg}</p>
          </div>
        )}

        {/* --- BOTTOM SECTION: Create Table + Upload JSON (two alternatives) --- */}
        {add === "add" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-800">Create new metadata (table)</h3>
                <p className="text-sm text-gray-500 mt-0.5">Add key-value pairs and optional images, then create for selected empires.</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                  <KeyValueEditor
                    pairs={keyValuePairs}
                    onAdd={handleAddPair}
                    onRemove={handleRemovePair}
                    onChange={handlePairChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images (optional)</label>
                  <label className="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 py-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">Click to add images</span>
                    <input type="file" accept="image/*" multiple onChange={handleChange} className="hidden" />
                  </label>
                  {imagePreview.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {imagePreview.map((ele, key) => (
                        <img key={key} src={ele} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="w-full rounded-lg bg-blue-600 text-white py-3 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                  onClick={createMetadataFromTable}
                >
                  Create table for selected
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-800">Upload JSON file</h3>
                <p className="text-sm text-gray-500 mt-0.5">Paste JSON or choose a file — same result as the table, different input.</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">JSON content</label>
                  <textarea
                    value={jsonMetadataContent}
                    onChange={(e) => setJsonMetadataContent(e.target.value)}
                    placeholder='{"ruler": "...", "capital": "..."}'
                    rows={8}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose file
                    <input type="file" accept=".json,application/json" onChange={handleJsonMetadataFileChange} className="hidden" />
                  </label>
                  {jsonMetadataFile && (
                    <span className="text-sm text-gray-600">Selected: <strong>{jsonMetadataFile.name}</strong></span>
                  )}
                </div>
                <button
                  type="button"
                  className="w-full rounded-lg bg-blue-600 text-white py-3 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                  onClick={uploadJsonMetadata}
                >
                  Upload JSON for selected
                </button>
              </div>
            </section>
          </div>
        )}

      </div>

      {/* --- EDIT MODAL --- */}
      {showModal && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/80 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Edit metadata</h3>
                <p className="text-xs text-gray-500 mt-0.5">ID: {currentMetaId}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-green-500" />
                  Images
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* 1. Existing Server Images */}
                    {modalImages.map((imgObj, idx) => {
                      const isRemoved = imagesToRemove.includes(imgObj.fileName);
                      return (
                        <div key={`server-${idx}`} className={`relative group aspect-square rounded-lg border overflow-hidden transition-all ${isRemoved ? 'opacity-40 ring-2 ring-red-500 grayscale' : 'bg-gray-100 shadow-sm'}`}>
                          <img src={imgObj.url} alt={`Server ${idx}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => toggleImageRemoval(imgObj.fileName)}
                            className={`absolute top-1 right-1 p-1.5 rounded-full shadow-md transition-colors ${isRemoved ? "bg-red-600 text-white" : "bg-white text-gray-600 hover:text-red-600"}`}
                            title={isRemoved ? "Undo delete" : "Mark for deletion"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}

                    {/* 2. New Local Preview Images */}
                    {newPreviews.map((imgObj, idx) => (
                          <div key={`new-${idx}`} className="relative group aspect-square rounded-lg border-2 border-green-500 overflow-hidden bg-gray-50 shadow-sm">
                           <img src={imgObj.url} alt={`New ${idx}`} className="h-full w-full object-cover" />
                           <button
                             type="button"
                             onClick={() => removeNewImage(idx)}
                             className="absolute top-1 right-1 p-1.5 rounded-full shadow-md bg-white text-gray-600 hover:text-red-600 hover:bg-gray-100"
                             title="Remove"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                           </button>
                           <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-[10px] text-center py-0.5">NEW</div>
                         </div>
                    ))}

                    {/* 3. Add Button */}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition aspect-square">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-gray-500 font-medium mt-1">Add New</span>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleNewImageSelect} 
                        />
                    </label>
                  </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-blue-500" />
                  Data content
                </h4>
                <KeyValueEditor
                  pairs={keyValuePairs}
                  onAdd={handleAddPair}
                  onRemove={handleRemovePair}
                  onChange={handlePairChange}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/80 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition inline-flex items-center gap-2"
              >
                Save changes
                {(imagesToRemove.length > 0 || updateImages.length > 0) && (
                  <span className="bg-blue-800/80 text-xs py-0.5 px-2 rounded-full">
                    {imagesToRemove.length + updateImages.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetadataPath;
