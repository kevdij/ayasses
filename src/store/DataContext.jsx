import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { defaultData } from '../data/defaultData.js';
import { api, post } from '../lib/api.js';

const DataContext = createContext(null);
const KEYS = Object.keys(defaultData);

export function DataProvider({ children }) {
  const [data, setData] = useState(defaultData);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', updated: null, offline: false });
  const dataRef = useRef(data);
  dataRef.current = data;

  // Contenu publié sur le serveur (ce qui n'y est pas encore = contenu par défaut)
  const reload = useCallback(async () => {
    try {
      const res = await api('content.php');
      const remote = Object.fromEntries(Object.entries(res.content || {}).filter(([k]) => KEYS.includes(k)));
      setData({ ...defaultData, ...remote });
      setStatus((s) => ({ ...s, loading: false, offline: false, updated: res.updated }));
    } catch {
      // Pas de serveur PHP (ex. aperçu local) : on affiche le contenu par défaut
      setStatus((s) => ({ ...s, loading: false, offline: true }));
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  /** Enregistre un ou plusieurs blocs sur le serveur (admin connecté requis). */
  const saveMany = useCallback(async (values) => {
    const previous = dataRef.current;
    setData((d) => ({ ...d, ...values }));
    setStatus((s) => ({ ...s, saving: true, error: '' }));
    try {
      await post('content.php', { values });
      setStatus((s) => ({ ...s, saving: false, error: '', updated: new Date().toISOString() }));
      return { ok: true };
    } catch (e) {
      setData(previous); // on annule à l'écran
      setStatus((s) => ({ ...s, saving: false, error: 'Enregistrement refusé : ' + e.message }));
      return { ok: false, error: e };
    }
  }, []);

  const update = useCallback((key, value) => saveMany({ [key]: value }), [saveMany]);

  const replaceAll = useCallback(async (next) => {
    const values = Object.fromEntries(Object.entries(next).filter(([k]) => KEYS.includes(k)));
    return saveMany(values);
  }, [saveMany]);

  return (
    <DataContext.Provider value={{ data, update, saveMany, replaceAll, reload, status }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);

// Utilitaires de dates
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function formatDate(iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '';
  const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso);
  return isNaN(d) ? iso : d.toLocaleDateString('fr-FR', opts);
}

export const newId = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Transforme une valeur saisie (« SE, S » ou tableau) en liste propre. */
export const toList = (v, sep = /[\s,;]+/) =>
  (Array.isArray(v) ? v : String(v || '').split(sep)).map((s) => String(s).trim()).filter(Boolean);
