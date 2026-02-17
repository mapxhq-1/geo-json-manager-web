import { useState } from 'react';
import SearchBar from './SearchBar';
import FieldsColumn from './FieldsColumn';
import ImagesColumn from './ImagesColumn';
import VerificationColumn from './VerificationColumn';

function Scrapper() {
  const [scrapedData, setScrapedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const [imageStates, setImageStates] = useState({});
  const BASE_URL = import.meta.env.VITE_SCRAPPER_BASE_URL;
  const AUTH_TOKEN = import.meta.env.VITE_SCRAPPER_AUTH_TOKEN;
  const API_KEY = import.meta.env.VITE_SCRAPPER_API_KEY;

  const handleSearch = async (empireName, shouldVerify, maxFields) => {
    setLoading(true);
    setError(null);
    setScrapedData(null);
    setEditedFields({});
    setImageStates({});

    try {
      const response = await fetch(`${BASE_URL}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          empire_name: empireName,
          verify: shouldVerify,
          max_fields_to_verify: maxFields,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setScrapedData(data);

      // Initialize image states
      const initialImageStates = {};
      data.images?.forEach((img) => {
        initialImageStates[img.image_number] = {
          status: "kept",
          caption: img.caption,
        };
      });

      setImageStates(initialImageStates);

    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldEdit = (fieldName, newValue) => {
    setEditedFields((prev) => ({
      ...prev,
      [fieldName]: newValue,
    }));
  };

  const handleImageAction = (imageNumber, action, newCaption = null) => {
    setImageStates((prev) => ({
      ...prev,
      [imageNumber]: {
        status: action,
        caption: newCaption !== null ? newCaption : prev[imageNumber].caption,
      },
    }));
  };

  const handleExport = async () => {
    if (!scrapedData) return;

    // Prepare final data with edits (only 14 fields and images, no verification)
    const finalData = {
      search_term: scrapedData.search_term,
      page_title: scrapedData.page_title,
      page_url: scrapedData.page_url,
      summary: scrapedData.summary,
      infobox_data: {
        ...scrapedData.infobox_data,
        ...editedFields,
      },
      images: scrapedData.images
        .filter((img) => imageStates[img.image_number]?.status === 'kept')
        .map((img) => ({
          image_number: img.image_number,
          caption: imageStates[img.image_number]?.caption || img.caption,
          url: img.url,
          extension: img.extension,
        })),
      total_images: 0,
    };

    finalData.total_images = finalData.images.length;

    // Download as JSON
    const blob = new Blob([JSON.stringify(finalData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scrapedData.search_term.replace(/\s+/g, '_').toLowerCase()}_final.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1800px] mx-auto p-5 h-screen bg-gray-50/50">
      
      {/* Header */}
      <header className="p-8 mb-8 text-center bg-white shadow-md rounded-2xl">
        <h1 className="mb-2.5 text-4xl font-bold text-blue-600">📚 Wikipedia Empire Scraper</h1>
        <p className="text-lg text-gray-500">Extract, Verify, and Edit Empire Information</p>
      </header>

      {/* Search Component */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Loading State */}
      {loading && (
        <div className="p-16 text-center bg-white shadow-md rounded-2xl">
          <div className="w-12 h-12 mx-auto mb-5 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Scraping and verifying data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8 text-center bg-red-50 border-2 border-red-500 rounded-2xl">
          <h3 className="mb-2.5 text-lg font-bold text-red-500">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Main Content Area */}
      {scrapedData && !loading && (
        <>
          {/* Top Info Bar */}
          <div className="px-8 py-5 mb-5 bg-white shadow-md rounded-2xl">
            <h2 className="mb-2.5 text-2xl font-bold text-gray-800">{scrapedData.page_title}</h2>
            <a 
              href={scrapedData.page_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-blue-600 no-underline hover:underline"
            >
              View on Wikipedia →
            </a>
          </div>

          {/* Three Column Grid (Collapses to 1 column on screens smaller than 1400px) */}
          <div className="grid grid-cols-1 gap-5 mb-8 2xl:grid-cols-3">
            <FieldsColumn
              fields={scrapedData.infobox_data}
              editedFields={editedFields}
              onFieldEdit={handleFieldEdit}
            />

            <ImagesColumn
              images={scrapedData.images}
              imageStates={imageStates}
              onImageAction={handleImageAction}
            />

            <VerificationColumn verification={scrapedData.verification} />
          </div>

          {/* Export Action */}
          <div className="flex justify-center gap-5 pb-8">
            <button 
              className="px-10 py-4 text-lg font-bold text-white transition-all duration-300 bg-green-500 shadow-md border-none rounded-xl cursor-pointer hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0" 
              onClick={handleExport}
            >
              Export Final Data
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Scrapper;