// Appels au backend PHP (dossier api/ du serveur).
const BASE = '/api';

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json', 'X-Ayasses': '1' } : { 'X-Ayasses': '1' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Serveur injoignable.'), { status: 0 });
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // Pas de JSON : PHP absent ou erreur serveur
  }
  if (!res.ok || !data || data.ok === false) {
    const msg = data?.error || (res.status === 404 ? 'API introuvable (PHP est-il actif sur le serveur ?).' : `Erreur serveur (${res.status}).`);
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data;
}

export const post = (path, body = {}) => api(path, { method: 'POST', body });
