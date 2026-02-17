import React, { useState } from 'react';

function SearchBar({ onSearch, loading }) {
  const [empireName, setEmpireName] = useState('');
  const [shouldVerify, setShouldVerify] = useState(true);
  const [maxFields, setMaxFields] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (empireName.trim()) {
      onSearch(empireName.trim(), shouldVerify, maxFields);
    }
  };

  return (
    <div className="p-6 mb-8 bg-white shadow-md md:p-8 rounded-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Search Input & Button Wrapper */}
        <div className="flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            value={empireName}
            onChange={(e) => setEmpireName(e.target.value)}
            placeholder="Enter empire or dynasty name (e.g., Roman Empire, Mughal Empire)"
            className="flex-1 px-5 py-3.5 text-base transition-colors duration-300 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={loading}
          />
          <button
            type="submit"
            className="px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 bg-blue-600 rounded-xl whitespace-nowrap enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || !empireName.trim()}
          >
            {loading ? 'Scraping...' : 'Scrape & Analyze'}
          </button>
        </div>

        {/* Search Options (Checkboxes & Selects) */}
        <div className="flex flex-col items-start gap-4 pt-3 border-t border-gray-200 md:flex-row md:items-center md:gap-8">
          
          <label className="flex items-center gap-2.5 text-sm font-medium text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={shouldVerify}
              onChange={(e) => setShouldVerify(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 cursor-pointer accent-blue-600"
            />
            <span>Verify with AI (recommended)</span>
          </label>

          {shouldVerify && (
            <div className="flex items-center gap-2.5 text-sm">
              <label className="font-medium text-gray-800">Fields to verify:</label>
              <select
                value={maxFields}
                onChange={(e) => setMaxFields(Number(e.target.value))}
                disabled={loading}
                className="px-4 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:border-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value={3}>3 (fast)</option>
                <option value={5}>5 (balanced)</option>
                <option value={10}>10 (thorough)</option>
                <option value={14}>All 14 (complete)</option>
              </select>
            </div>
          )}
          
        </div>
      </form>
    </div>
  );
}

export default SearchBar;