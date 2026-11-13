// Lecteur / générateur XLSX minimal (dans le navigateur).
// Portage en JavaScript de VR_XLSX, du plugin WordPress « Vol Rando ».
// Lit les fichiers Excel/LibreOffice (sharedStrings + worksheets) et écrit
// des classeurs valides (chaînes « inlineStr » et nombres).
import JSZip from 'jszip';

const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/* ------------------------------------------------------------------ */
/* Lecture                                                             */
/* ------------------------------------------------------------------ */

const parseXml = (text) => {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  return doc.getElementsByTagName('parsererror').length ? null : doc;
};

// Enfants directs portant un nom local donné (ignore les espaces de noms)
const kids = (node, name) => [...(node?.children || [])].filter((n) => n.localName === name);
const textOf = (node) => (node ? node.textContent : '');

/**
 * Ouvre un classeur. Retourne { sheets: string[], has(name), sheet(name) }.
 * sheet(name) → lignes non vides, chaque ligne = { A: 'valeur', B: … }.
 */
export async function readXlsx(fileOrBuffer) {
  let zip;
  try {
    zip = await JSZip.loadAsync(fileOrBuffer);
  } catch {
    throw new Error('Impossible d’ouvrir le fichier : ce n’est pas un classeur .xlsx valide.');
  }
  const part = async (path) => {
    const f = zip.file(path);
    return f ? parseXml(await f.async('string')) : null;
  };

  const wb = await part('xl/workbook.xml');
  if (!wb) throw new Error('workbook.xml introuvable dans le fichier.');

  const rid2target = {};
  const rels = await part('xl/_rels/workbook.xml.rels');
  if (rels) {
    for (const rel of rels.getElementsByTagName('Relationship')) {
      rid2target[rel.getAttribute('Id')] = rel.getAttribute('Target');
    }
  }

  const targets = {};
  for (const s of wb.getElementsByTagNameNS(NS_MAIN, 'sheet')) {
    const rid = s.getAttributeNS(NS_REL, 'id') || s.getAttribute('r:id');
    let tgt = rid2target[rid] || '';
    tgt = tgt.replace(/^\/?xl\//, '').replace(/^\//, '');
    if (tgt && !tgt.startsWith('worksheets/')) tgt = 'worksheets/' + tgt;
    if (tgt) targets[s.getAttribute('name')] = 'xl/' + tgt;
  }

  const shared = [];
  const sst = await part('xl/sharedStrings.xml');
  if (sst) {
    for (const si of kids(sst.documentElement, 'si')) {
      let s = kids(si, 't').map(textOf).join('');
      for (const r of kids(si, 'r')) s += kids(r, 't').map(textOf).join('');
      shared.push(s);
    }
  }

  const cellValue = (c) => {
    const t = c.getAttribute('t');
    const vNode = kids(c, 'v')[0];
    const v = vNode ? vNode.textContent.trim() : null;
    if (t === 'inlineStr') {
      const is = kids(c, 'is')[0];
      if (!is) return '';
      let s = kids(is, 't').map(textOf).join('');
      for (const r of kids(is, 'r')) s += kids(r, 't').map(textOf).join('');
      return s;
    }
    if (t === 's') return (shared[Number(v)] ?? '').trim();
    return v;
  };

  const cache = {};
  return {
    sheets: Object.keys(targets),
    has: (name) => name in targets,
    async sheet(name) {
      if (!(name in targets)) return [];
      if (cache[name]) return cache[name];
      const xml = await part(targets[name]);
      if (!xml) return [];
      const sheetData = xml.getElementsByTagNameNS(NS_MAIN, 'sheetData')[0];
      const rows = [];
      for (const row of kids(sheetData, 'row')) {
        const one = {};
        for (const c of kids(row, 'c')) {
          const col = (c.getAttribute('r') || '').replace(/[0-9]/g, '');
          const val = cellValue(c);
          if (val !== null) one[col] = val;
        }
        if (Object.keys(one).length) rows.push(one);
      }
      cache[name] = rows;
      return rows;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Écriture                                                            */
/* ------------------------------------------------------------------ */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function colLetter(n) {
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function worksheetXml(rows) {
  let out = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS_MAIN}"><sheetData>`;
  rows.forEach((row, i) => {
    const r = i + 1;
    out += `<row r="${r}">`;
    row.forEach((value, j) => {
      const ref = colLetter(j + 1) + r;
      if (value === null || value === undefined || value === '') out += `<c r="${ref}"/>`;
      // Uniquement les vrais nombres : "05" (département) reste une chaîne
      else if (typeof value === 'number' && isFinite(value)) out += `<c r="${ref}"><v>${value}</v></c>`;
      else out += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
    });
    out += '</row>';
  });
  return out + '</sheetData></worksheet>';
}

/**
 * Génère un classeur .xlsx (Blob).
 * @param {{name: string, rows: any[][]}[]} sheets
 */
export async function writeXlsx(sheets) {
  const zip = new JSZip();
  let overrides = '';
  let rels = '';
  let entries = '';
  let rid = 2;

  sheets.forEach((sheet, idx) => {
    const num = idx + 1;
    const ridCur = 'rId' + rid++;
    zip.file(`xl/worksheets/sheet${num}.xml`, worksheetXml(sheet.rows));
    overrides += `<Override PartName="/xl/worksheets/sheet${num}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
    rels += `<Relationship Id="${ridCur}" Type="${NS_REL}/worksheet" Target="worksheets/sheet${num}.xml"/>`;
    entries += `<sheet name="${esc(sheet.name)}" sheetId="${num}" r:id="${ridCur}"/>`;
  });

  const ridStyles = 'rId' + rid++;
  zip.file('xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${NS_MAIN}">` +
    '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>' +
    '</styleSheet>');
  overrides += '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
  rels += `<Relationship Id="${ridStyles}" Type="${NS_REL}/styles" Target="styles.xml"/>`;

  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    overrides + '</Types>');
  zip.file('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}"><sheets>${entries}</sheets></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels',
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
