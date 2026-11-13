import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Le type de lien qui a ouvert la page (invitation, mot de passe oublié…),
// lu AVANT que Supabase ne nettoie l'URL.
const hash = new URLSearchParams(window.location.hash.slice(1));
export const authLinkType = hash.get('type'); // 'invite' | 'recovery' | 'signup' | null

// La clé « anon » est publique par conception : ce sont les règles RLS de la base
// (voir supabase/schema.sql) qui protègent les données, pas le secret de cette clé.
export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const isRemote = Boolean(supabase);
