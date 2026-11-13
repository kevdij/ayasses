import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useData, toList } from '../store/DataContext.jsx';

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const NIVEAUX = {
  Vert: { color: '#2f9e44', text: 'Ça passe face ou dos voile, et il y a de la place.' },
  Bleu: { color: '#1d6fb8', text: 'Maîtrise du face et du dos voile obligatoire, déco plus exigu et parfois plus raide.' },
  Marron: { color: '#8a5a33', text: 'Déco très petit et/ou très raide : maîtrise sans faille de sa voile.' },
};
const EXPOS = {
  E1: 'Pas de risque particulier par rapport à un déco école.',
  E2: 'Risque de blessure en cas de raté (pente, obstacles).',
  E3: 'Risque de blessure grave, voire de chute mortelle en cas d’échec.',
};
const PAGE = 12;

const norm = (p) => ({
  ...p,
  orientation: toList(p.orientation).map((d) => d.toUpperCase().replace('W', 'O')),
  altitude: p.altitude === '' || p.altitude == null ? null : Number(p.altitude),
  lat: Number(p.lat),
  lng: Number(p.lng),
});

function FlyTo({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], 13, { duration: 0.8 });
  }, [point, map]);
  return null;
}

function FitBounds({ points }) {
  const map = useMap();
  const sig = points.map((p) => p.id).join();
  useEffect(() => {
    if (points.length) map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [30, 30], maxZoom: 12 });
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function VolRando() {
  const { data } = useData();
  const all = useMemo(() => data.volRando.map(norm).filter((p) => !isNaN(p.lat) && !isNaN(p.lng)), [data.volRando]);

  const [dirs, setDirs] = useState([]);
  const [niveau, setNiveau] = useState('');
  const [type, setType] = useState('');
  const [expo, setExpo] = useState('');
  const [alt, setAlt] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const markerRefs = useRef({});

  const types = [...new Set(all.map((p) => p.type).filter(Boolean))].sort();

  const list = all
    .filter((p) =>
      (!dirs.length || p.orientation.some((d) => dirs.includes(d))) &&
      (!niveau || p.niveau === niveau) &&
      (!type || p.type === type) &&
      (!expo || p.expo === expo) &&
      (!alt || (alt === 'haut' ? p.altitude >= 2000 : p.altitude != null && p.altitude < 2000)) &&
      (!q || `${p.sommet} ${p.atterrissage} ${p.remarque}`.toLowerCase().includes(q.toLowerCase()))
    )
    .sort((a, b) => a.sommet.localeCompare(b.sommet, 'fr'));

  useEffect(() => setPage(1), [dirs, niveau, type, expo, alt, q]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const toggleDir = (d) => setDirs((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  const resetAll = () => { setDirs([]); setNiveau(''); setType(''); setExpo(''); setAlt(''); setQ(''); };

  const select = (p) => {
    setSelected(p);
    setTimeout(() => markerRefs.current[p.id]?.openPopup(), 850);
    document.getElementById('vr-map')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <section className="section page-top">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Vol rando</p>
          <h1 className="page-title">Les décollages rando du Champsaur</h1>
          <p>
            Un descriptif, non exhaustif, de décollages rando dans nos Alpes du Sud. On les atteint uniquement à la force des
            mollets. Pas d’itinéraire de montée : à chacun de faire sa trace. Fly safe !
          </p>
        </header>

        <div className="vr-warning" role="note">
          <strong>À lire avant de partir.</strong> Aucun de ces décollages n’est officiel ou conventionné, et la plupart des
          atterrissages non plus. Vous les pratiquez sous votre entière responsabilité, sans accord du propriétaire ni de la
          mairie : nous ne sommes jamais « chez nous ». Posez-vous avec bon sens (champ fauché, pas de troupeau ni d’activité
          agricole), et restez discret et poli si on vous fait une remarque.
        </div>

        <details className="vr-legend">
          <summary>Comprendre les niveaux et l’exposition</summary>
          <div className="vr-legend-grid">
            <div>
              <h3>Niveau de pilotage (FFVL)</h3>
              <ul>
                {Object.entries(NIVEAUX).map(([k, v]) => (
                  <li key={k}><span className="dot-lg" style={{ background: v.color }} /> <strong>{k}</strong> : {v.text}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Exposition</h3>
              <ul>
                {Object.entries(EXPOS).map(([k, v]) => (
                  <li key={k}><span className={`expo expo-${k}`}>{k}</span> {v}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>

        {/* Filtres */}
        <div className="vr-filters">
          <fieldset className="vr-rose">
            <legend>Orientation</legend>
            <div className="rose-grid">
              {['NO', 'N', 'NE', 'O', '', 'E', 'SO', 'S', 'SE'].map((d, i) =>
                d ? (
                  <button key={d} type="button" className={dirs.includes(d) ? 'is-on' : ''} aria-pressed={dirs.includes(d)} onClick={() => toggleDir(d)}>
                    {d}
                  </button>
                ) : (
                  <span key={i} className="rose-center" aria-hidden="true">🧭</span>
                )
              )}
            </div>
          </fieldset>

          <div className="vr-selects">
            <label className="field"><span>Recherche</span>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sommet, atterrissage…" />
            </label>
            <label className="field"><span>Niveau</span>
              <select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                <option value="">Tous</option>
                {Object.keys(NIVEAUX).map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            <label className="field"><span>Terrain</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Tous</option>
                {types.map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            <label className="field"><span>Exposition</span>
              <select value={expo} onChange={(e) => setExpo(e.target.value)}>
                <option value="">Toutes</option>
                {Object.keys(EXPOS).map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            <label className="field"><span>Altitude</span>
              <select value={alt} onChange={(e) => setAlt(e.target.value)}>
                <option value="">Toutes</option>
                <option value="haut">2 000 m et plus</option>
                <option value="bas">Moins de 2 000 m</option>
              </select>
            </label>
            <button type="button" className="btn btn-ghost-dark btn-small" onClick={resetAll}>Réinitialiser</button>
          </div>
        </div>

        <p className="vr-count" role="status">
          {list.length} décollage{list.length > 1 ? 's' : ''} sur {all.length}
        </p>

        <div className="vr-layout">
          <div className="vr-list">
            {shown.map((p) => (
              <button key={p.id} type="button" className={`vr-card ${selected?.id === p.id ? 'is-active' : ''}`} onClick={() => select(p)}>
                <span className="vr-card-head">
                  <span className="dot-lg" style={{ background: NIVEAUX[p.niveau]?.color || '#999' }} title={`Niveau ${p.niveau}`} />
                  <strong>{p.sommet}</strong>
                  <span className="vr-alt">{p.altitude ? `${p.altitude.toLocaleString('fr-FR')} m` : '—'}</span>
                </span>
                <span className="vr-tags">
                  <span className="tag-soft">{p.orientation.join(' · ') || '?'}</span>
                  {p.type && <span className="tag-soft">{p.type}</span>}
                  <span className="tag-soft">{p.niveau}</span>
                  <span className={`expo expo-${p.expo}`}>{p.expo}</span>
                </span>
                {p.atterrissage && <span className="vr-attero">Atterro : {p.atterrissage}</span>}
                {p.remarque && <span className="vr-attero">{p.remarque}</span>}
              </button>
            ))}
            {!list.length && <p className="empty">Aucun décollage ne correspond à ces filtres.</p>}
            {pages > 1 && (
              <nav className="pager" aria-label="Pagination">
                <button className="btn btn-ghost-dark btn-small" disabled={page === 1} onClick={() => setPage(page - 1)}>←</button>
                <span>Page {page} / {pages}</span>
                <button className="btn btn-ghost-dark btn-small" disabled={page === pages} onClick={() => setPage(page + 1)}>→</button>
              </nav>
            )}
          </div>

          <div className="vr-map" id="vr-map">
            <MapContainer center={[44.68, 6.2]} zoom={10} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://opentopomap.org">OpenTopoMap</a>'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                maxZoom={17}
              />
              <FitBounds points={list} />
              <FlyTo point={selected} />
              {list.map((p) => (
                <CircleMarker
                  key={p.id}
                  ref={(r) => { if (r) markerRefs.current[p.id] = r; }}
                  center={[p.lat, p.lng]}
                  radius={selected?.id === p.id ? 10 : 7}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: NIVEAUX[p.niveau]?.color || '#999', fillOpacity: 0.95 }}
                  eventHandlers={{ click: () => setSelected(p) }}
                >
                  <Popup>
                    <strong>{p.sommet}</strong> ({p.altitude ? `${p.altitude} m` : '?'})<br />
                    {p.orientation.join(', ')} · {p.type} · {p.niveau} · {p.expo}<br />
                    {p.atterrissage && <>Atterro : {p.atterrissage}<br /></>}
                    <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">Ouvrir dans Google Maps</a>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <p className="vr-credit">Recensement des décollages : Guillaume Dufour, pour le club.</p>
      </div>
    </section>
  );
}
