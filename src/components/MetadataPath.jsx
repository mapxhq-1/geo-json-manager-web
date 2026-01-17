import { useEffect, useState } from "react";
import axios from 'axios';

function MetadataPath() {
  const [empires, setEmpires] = useState([]);
  const [detailsFile, setDetailsFile] = useState(null); 
  const [imageList, setImageList] = useState([]); 
  const [imagePreview, setImagePreview] = useState([]); 
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const [search, setSearch] = useState("");
  const [selectedEmpire, setSelectedEmpire] = useState([]);
  
  // Feedback State
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); 

  const [list, setList] = useState([]); 
  const [add, setAdd] = useState("add"); 
  
  // View/Modal State
  const [viewData, setViewData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImages, setModalImages] = useState([]); 
  
  // UPDATE STATE
  const [currentMetaId, setCurrentMetaId] = useState(null);
  const [updateFile, setUpdateFile] = useState(null);
  
  // --- CHANGES FOR NEW IMAGE PREVIEWS ---
  const [updateImages, setUpdateImages] = useState([]); // Stores actual Files
  const [newPreviews, setNewPreviews] = useState([]);   // Stores preview URLs
  const [imagesToRemove, setImagesToRemove] = useState([]); 

  // --- HELPER: FETCH IMAGE BLOB ---
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

  // --- CREATE LOGIC ---
  async function createMetadata() {
    setError("");
    setSuccessMsg("");

    if (selectedEmpire.length === 0) {
      setError("No empires selected!!");
      return;
    }
    if (!detailsFile) {
      setError("You have to select the metedata file");
      return;
    }

    try {
      for (const ele of selectedEmpire) {
        const formData = new FormData();
        formData.append("objectId", ele);
        imageList.forEach((image) => formData.append("images", image))
        formData.append("detailsFile", detailsFile)
        await axios.post(`${baseUrl}/geo-json-service/create`, formData, { headers: { client_name: "mapdesk" } })
      }
      
      setSuccessMsg("Metadata created successfully.");
      
      setDetailsFile(null);
      setImageList([]);
      setImagePreview([]);
      setSelectedEmpire([]); 
      
      fetchEmpires();
      getMetadata();
      
      setTimeout(() => setSuccessMsg(""), 3000);

    } catch (err) {
      console.error(err)
      setError("Failed to create the metadata");
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
    if (updateFile) formData.append("detailsFile", updateFile);
    
    // Append newly added images
    if (updateImages.length > 0) {
      updateImages.forEach((file) => formData.append("newImages", file));
    }
    
    // Append IDs to remove
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

  // --- NEW: HANDLE SELECTING NEW IMAGES IN MODAL ---
  function handleNewImageSelect(e) {
    const files = Array.from(e.target.files);
    if(files.length === 0) return;

    // 1. Add actual files to updateImages state
    setUpdateImages(prev => [...prev, ...files]);

    // 2. Generate previews for UI
    const newPreviewUrls = files.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
    }));
    setNewPreviews(prev => [...prev, ...newPreviewUrls]);
  }

  // --- NEW: REMOVE A NEWLY ADDED IMAGE (BEFORE UPLOAD) ---
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

      // Reset all modal states
      setModalImages([]);
      setViewData(null);
      setUpdateFile(null);
      setUpdateImages([]);
      setNewPreviews([]); // Reset new previews
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

  function closeModal() {
    setShowModal(false);
    setViewData(null);
    setModalImages([]);
    setNewPreviews([]);
    setUpdateImages([]);
  }

  const renderTable = (data) => {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      return (
        <div className="overflow-x-auto border rounded-lg max-h-60">
          <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {headers.map((header) => (
                    <td key={`${idx}-${header}`} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">{JSON.stringify(data, null, 2)}</pre>;
  };

  return (
    <div className="space-y-4 p-4 relative font-sans">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search Empires"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* --- CREATE SECTION --- */}
      {add === "add" && (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase">Create New Metadata</h4>
          <div className="space-y-3">
              <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content File (JSON/CSV)</label>
                  <input
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={(e) => setDetailsFile(e.target.files[0])}
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
              </div>
              <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Images</label>
                  <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleChange}
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
              </div>
              {imagePreview.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                  {imagePreview.map((ele, key) => (
                      <img key={key} src={ele} alt="Preview" className="h-10 w-10 object-cover rounded border" />
                  ))}
                  </div>
              )}
              <button className="w-full bg-blue-600 text-white py-1.5 rounded text-sm hover:bg-blue-700 transition" onClick={createMetadata}>Create for Selected</button>
          </div>
        </div>
      )}
      
      {/* --- MODE SWITCH --- */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">{add === "add" ? "Unassigned Empires" : "Manage the Metadata"}</h3>
        <button 
            onClick={() => {
              setAdd(add === "add" ? "update" : "add");
              setError("");
              setSuccessMsg("");
            }}
            className="text-xs font-medium text-blue-600 hover:underline"
        >
            Switch to {add === "add" ? "Manage the data" : "Create the data"}
        </button>
      </div>

      {/* --- STATUS MESSAGES --- */}
      {error && <p className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded border border-red-200">{error}</p>}
      {successMsg && <p className="text-green-600 text-sm font-medium bg-green-50 p-2 rounded border border-green-200">{successMsg}</p>}
      
      {/* --- LIST VIEW --- */}
      <div className="space-y-2">
        {add === "add" ? (
          // CREATE MODE
          filteredEmpires.map((e) => (
            <label key={e.objectId} className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50 transition">
              <input 
                  type="checkbox" 
                  value={e.objectId} 
                  onChange={handleCheckbox} 
                  className="h-4 w-4 accent-blue-600" 
              />
              <span className="text-sm text-gray-800">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">{e.empireName}</span>
                  <span className="text-xs font-mono text-gray-500 select-all">{e.objectId}</span>
                </div>
              </span>
            </label>
          ))
        ) : (
          // UPDATE MODE
          addedEmpires.map((e) => (
            <div key={e.objectId} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2 bg-white hover:bg-gray-50 transition">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">{e.empireName}</span>
                <span className="text-xs font-mono text-gray-500 select-all">{e.objectId}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs hover:bg-blue-100 font-medium border border-blue-200 transition" 
                  onClick={() => viewMetadata(e.objectId)}
                >
                  View / Edit
                </button>
                <button 
                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-100 font-medium border border-red-200 transition" 
                  onClick={() => deleteMetadata(e.objectId)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {(add === "add" ? filteredEmpires : addedEmpires).length === 0 && (
            <p className="text-gray-400 text-sm italic text-center py-4">No empires found.</p>
        )}
      </div>

      {/* --- MODAL POPUP --- */}
      {showModal && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
              <div>
                  <h3 className="text-lg font-bold text-gray-800">Edit the data</h3>
                  <p className="text-xs text-gray-500">ID: {currentMetaId}</p>
              </div>
              <button onClick={closeModal} className="rounded-full bg-white p-2 hover:bg-gray-200 shadow-sm border">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* IMAGES SECTION */}
              <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-700 border-l-4 border-green-500 pl-2">Images</h4>
                    {/* <span className="text-xs text-gray-400">Green border = New | Faded = To Delete</span> */}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* 1. Existing Server Images */}
                    {modalImages.map((imgObj, idx) => {
                      const isRemoved = imagesToRemove.includes(imgObj.fileName);
                      return (
                        <div key={`server-${idx}`} className={`relative group aspect-square rounded-lg border overflow-hidden transition-all ${isRemoved ? 'opacity-40 ring-2 ring-red-500 grayscale' : 'bg-gray-100 shadow-sm'}`}>
                          <img src={imgObj.url} alt={`Server ${idx}`} className="h-full w-full object-cover" />
                          <button 
                            onClick={() => toggleImageRemoval(imgObj.fileName)}
                            className={`absolute top-1 right-1 p-1.5 rounded-full shadow-md transition-colors ${isRemoved ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:text-red-600'}`}
                            title={isRemoved ? "Undo Delete" : "Mark for Deletion"}
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
                           {/* Remove Button for New Images */}
                           <button 
                             onClick={() => removeNewImage(idx)}
                             className="absolute top-1 right-1 p-1.5 rounded-full shadow-md bg-white text-gray-600 hover:text-red-600 hover:bg-gray-100"
                             title="Remove newly added"
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

              {/* DATA SECTION */}
              <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-700 border-l-4 border-blue-500 pl-2">Data Content</h4>
                    <label className="text-xs text-blue-600 hover:underline cursor-pointer">
                        Replace File
                        <input type="file" accept=".csv,.json" className="hidden" onChange={(e) => setUpdateFile(e.target.files[0])} />
                    </label>
                  </div>
                  
                  {updateFile ? (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800 flex items-center gap-2">
                          <span>New file selected: <span className="font-semibold">{updateFile.name}</span></span>
                      </div>
                  ) : (
                      viewData.jsonMetadata ? renderTable(viewData.jsonMetadata) : (
                          <div className="bg-gray-50 p-4 rounded text-sm border whitespace-pre-wrap font-mono text-gray-700">
                            {viewData.textMetadata || "No text content available."}
                          </div>
                      )
                  )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm font-medium transition">Cancel</button>
              <button 
                onClick={handleUpdate}
                className="px-5 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 text-sm font-medium transition flex items-center gap-2"
              >
                <span>Save Changes</span>
                {(imagesToRemove.length > 0 || updateFile || updateImages.length > 0) && (
                    <span className="bg-blue-800 text-xs py-0.5 px-1.5 rounded-full text-blue-100">
                        {imagesToRemove.length + (updateFile ? 1 : 0) + (updateImages.length)}
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