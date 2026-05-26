import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 1. Create the Context
const EmpireContext = createContext();

// 2. Create the Provider
export function EmpireProvider({ children }) {
    const [empires, setEmpires] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    // We wrap this in useCallback so components can trigger a re-fetch (e.g., after deleting)
    const fetchEmpires = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/geo-json-service/get-all-empires`);
            if (!res.ok) throw new Error("Failed to fetch");
            
            const data = await res.json();
            // Ensure we always store an array to prevent .map() crashes
            setEmpires(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Global fetch error:", err);
            setEmpires([]); 
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    // Fetch ONLY ONCE when the app loads
    useEffect(() => {
        fetchEmpires();
    }, [fetchEmpires]);

    return (
        <EmpireContext.Provider value={{ empires, loading, refreshEmpires: fetchEmpires }}>
            {children}
        </EmpireContext.Provider>
    );
}

// 3. Custom hook for easy importing
export const useEmpires = () => useContext(EmpireContext);