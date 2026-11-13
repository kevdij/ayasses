import { createContext, useContext, useEffect, useState } from 'react';
import { defaultData } from '../data/defaultData.js';

const STORAGE_KEY = 'ayasses-data-v1';
const DataContext = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    /* stockage indisponible : on garde les données par défaut */
  }
  return defaultData;
}

export function DataProvider({ children }) {
  const [data, setData] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const update = (key, value) => setData((d) => ({ ...d, [key]: value }));
  const reset = () => setData(defaultData);
  const replaceAll = (next) => setData({ ...defaultData, ...next });

  return (
    <DataContext.Provider value={{ data, update, reset, replaceAll }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);

// Utilitaires de dates
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function formatDate(iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('fr-FR', opts);
}

export const newId = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
