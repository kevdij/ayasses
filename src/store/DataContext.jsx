import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { defaultData } from '../data/defaultData.js';
import { supabase, isRemote } from '../lib/supabase.js';

// Mode « local » (sans Supabase) : uniquement pour développer sur son ordinateur.
const STORAGE_KEY = 'ayasses-data-v2';
const DataContext = createContext(null);
const KEYS = Object.keys(defaultData);

function loadLocal() {
  if (isRemote) return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    /* stockage indisponible */
  }
  return defaultData;
}

export function DataProvider({ children }) {
  const [data, setData] = useState(loadLocal);
  const [status, setStatus] = useState({ loading: isRemote, saving: false, error: '' });

  // Chargement du contenu publié (mode Supabase)
  const reload = useCallback(async () => {
    if (!isRemote) return;
    setStatus((s) => ({ ...s, loading: true }));
    const { data: rows, error } = await supabase.from('site_content').select('key, value');
    if (error) {
      setStatus((s) => ({ ...s, loading: false, error: 'Impossible de charger le contenu : ' + error.message }));
      return;
    }
    const remote = Object.fromEntries((rows || []).filter((r) => KEYS.includes(r.key)).map((r) => [r.key, r.value]));
    setData({ ...defaultData, ...remote });
    setStatus((s) => ({ ...s, loading: false, error: '' }));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Sauvegarde locale (mode développement)
  useEffect(() => {
    if (isRemote) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  /** Met à jour un bloc de contenu. En mode Supabase, l'écriture est refusée
   *  par le serveur si l'utilisateur n'est pas admin avec 2FA validée. */
  const update = useCallback(async (key, value) => {
    const previous = data[key];
    setData((d) => ({ ...d, [key]: value }));
    if (!isRemote) return { ok: true };

    setStatus((s) => ({ ...s, saving: true, error: '' }));
    const { error } = await supabase.from('site_content').upsert({ key, value });
    if (error) {
      setData((d) => ({ ...d, [key]: previous })); // on annule côté écran
      setStatus((s) => ({ ...s, saving: false, error: 'Enregistrement refusé : ' + error.message }));
      return { ok: false, error };
    }
    setStatus((s) => ({ ...s, saving: false, error: '' }));
    return { ok: true };
  }, [data]);

  const replaceAll = useCallback(async (next) => {
    const merged = { ...defaultData, ...next };
    if (!isRemote) { setData(merged); return { ok: true }; }
    setStatus((s) => ({ ...s, saving: true, error: '' }));
    const rows = KEYS.filter((k) => k in next).map((k) => ({ key: k, value: next[k] }));
    const { error } = await supabase.from('site_content').upsert(rows);
    if (error) {
      setStatus((s) => ({ ...s, saving: false, error: 'Import refusé : ' + error.message }));
      return { ok: false, error };
    }
    await reload();
    setStatus((s) => ({ ...s, saving: false }));
    return { ok: true };
  }, [reload]);

  const reset = useCallback(() => { if (!isRemote) setData(defaultData); }, []);

  return (
    <DataContext.Provider value={{ data, update, replaceAll, reset, reload, status, isRemote }}>
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

/** Transforme une valeur saisie (« SE, S » ou tableau) en liste propre. */
export const toList = (v, sep = /[\s,;]+/) =>
  (Array.isArray(v) ? v : String(v || '').split(sep)).map((s) => String(s).trim()).filter(Boolean);
