// Import / export du classeur « Décos rando Alpes du sud ».
// Portage en JavaScript de VR_Data (plugin WordPress « Vol Rando »).
import { readXlsx, writeXlsx } from './xlsx.js';

export const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const SHEET_POINTS = 'Décollages';
const SHEET_INFO = 'Informations et réserves';

/** Retire de l'intro le paragraphe « carte en lien » (la page a sa propre carte). */
export function cleanIntro(intro = '') {
  if (!intro.includes('regroupé les décollages')) return intro;
  return intro.replace(
    /\s*J['’]ai regroupé les décollages sur la carte en lien[\s\S]*?https?:\/\/www\.google\.com\/maps\/d\/view\?mid=[A-Za-z0-9_\-&;=.]+\s*/u,
    '\n\n'
  );
}

/** "44.73968, 6.15588" → [44.73968, 6.15588] */
export function parseLoc(raw = '') {
  const m = String(raw).match(/-?\d+(?:\.\d+)?/g) || [];
  return m.length >= 2 ? [parseFloat(m[0]), parseFloat(m[1])] : [null, null];
}

const ucfirstLower = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');
// Texte sur une ligne : retours à la ligne et espaces multiples d'Excel remplacés par un espace
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

/**
 * Lit un fichier .xlsx et renvoie { intro, points, warnings }.
 * Lève une erreur si le fichier est inexploitable.
 */
export async function importVolRandoXlsx(file) {
  if (!/\.xlsx$/i.test(file.name || '')) throw new Error('Le fichier doit être au format .xlsx.');
  const x = await readXlsx(file);
  if (!x.has(SHEET_POINTS)) throw new Error(`La feuille « ${SHEET_POINTS} » est introuvable dans le fichier.`);

  // Texte d'intro : feuille 1, première cellule
  let intro = '';
  if (x.has(SHEET_INFO)) {
    const rows = await x.sheet(SHEET_INFO);
    const first = rows[0] && Object.values(rows[0])[0];
    if (typeof first === 'string') intro = cleanIntro(first).trim();
  }

  let orientCols = {}; // lettre de colonne → direction
  const points = [];
  const seen = new Set();
  const warnings = [];

  for (const row of await x.sheet(SHEET_POINTS)) {
    // Ligne de sous-titres d'orientation : 8 cellules exactement égales aux directions
    const values = Object.values(row).map((v) => String(v).trim());
    if (values.length === 8 && values.every((v, i) => v === DIRS[i])) {
      orientCols = {};
      for (const [col, val] of Object.entries(row)) orientCols[col] = String(val).trim();
      continue;
    }

    const dept = clean(row.A);
    if (!dept || isNaN(Number(dept))) continue; // en-tête ou ligne vide
    const massif = clean(row.B);
    const sommet = clean(row.C);
    if (!massif || !sommet) continue;

    const altRaw = String(row.D ?? '').trim();
    const altitude = altRaw !== '' && !isNaN(Number(altRaw)) ? Math.round(Number(altRaw)) : null;

    const orientation = Object.entries(orientCols)
      .filter(([col]) => row[col] !== undefined && String(row[col]).trim() !== '')
      .map(([, dir]) => dir);

    const [lat, lng] = parseLoc(row.M ?? '');
    const point = {
      dept,
      massif,
      sommet,
      altitude,
      orientation,
      lat,
      lng,
      type: ucfirstLower(clean(row.N)),
      niveau: clean(row.O),
      expo: clean(row.P),
      atterrissage: clean(row.Q),
      remarque: clean(row.R),
    };

    if (lat === null || lng === null) warnings.push(`Coordonnées manquantes : ${massif} — ${sommet}`);
    const key = `${massif}|${sommet}`;
    if (seen.has(key)) {
      warnings.push(`Doublon ignoré : ${massif} — ${sommet}`);
      continue;
    }
    seen.add(key);
    points.push(point);
  }

  if (!points.length) throw new Error(`Aucun point exploitable trouvé dans la feuille « ${SHEET_POINTS} ».`);

  points.sort((a, b) => (a.massif + a.sommet).localeCompare(b.massif + b.sommet, 'fr'));
  points.forEach((p, i) => { p.id = `d${i + 1}`; });

  return { intro, points, warnings };
}

const coordStr = (f) => String(Number(Number(f).toFixed(5)));

/** Génère le classeur d'export, au même format que le fichier d'origine. */
export function exportVolRandoXlsx(points, intro = '') {
  const header = ['Dépt', 'Massif', 'Sommet', 'Altitude', 'Orientation', '', '', '', '', '', '', '', 'Localisation', 'Type', 'Niveau', 'Expo', 'Atterrissage habituel', 'Remarque'];
  const sub = ['', '', '', '', ...DIRS, '', '', '', '', '', ''];
  const rows = [header, sub];

  const sorted = [...points].sort((a, b) =>
    String(a.massif).localeCompare(String(b.massif), 'fr') || String(a.sommet).localeCompare(String(b.sommet), 'fr'));

  for (const p of sorted) {
    const dirs = Array.isArray(p.orientation) ? p.orientation : String(p.orientation || '').split(/[\s,;]+/);
    const loc = p.lat !== null && p.lat !== '' && p.lng !== null && p.lng !== '' && p.lat !== undefined
      ? `${coordStr(p.lat)}, ${coordStr(p.lng)}` : '';
    const alt = p.altitude === '' || p.altitude === null || p.altitude === undefined ? null : Number(p.altitude);
    rows.push([
      p.dept ?? '', p.massif ?? '', p.sommet ?? '', isNaN(alt) ? null : alt,
      ...DIRS.map((d) => (dirs.includes(d) ? 'X' : '')),
      loc, p.type ?? '', p.niveau ?? '', p.expo ?? '', p.atterrissage ?? '', p.remarque ?? '',
    ]);
  }

  return writeXlsx([
    { name: SHEET_INFO, rows: [[intro]] },
    { name: SHEET_POINTS, rows },
  ]);
}
