import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useData } from '../store/DataContext.jsx';
import ShareButton from '../components/ShareButton.jsx';
import NotFound from './NotFound.jsx';
import { NIVEAUX, EXPOS, DIRS, norm, withSlugs, fmtAlt, thingsToKnow, shareText, pointPath } from '../lib/volRando.js';

function Rose({ active }) {
  // Rose des vents : secteurs orientés en surbrillance
  return (
    <svg viewBox="-50 -50 100 100" className="vr-rose-svg" role="img" aria-label={`Orientation : ${active.join(', ')}`}>
      {DIRS.map((d, i) => {
        const a1 = ((i * 45 - 22.5 - 90) * Math.PI) / 180;
        const a2 = ((i * 45 + 22.5 - 90) * Math.PI) / 180;
        const r = 40;
        const on = active.includes(d);
        return (
          <path key={d} d={`M0 0 L${r * Math.cos(a1)} ${r * Math.sin(a1)} A${r} ${r} 0 0 1 ${r * Math.cos(a2)} ${r * Math.sin(a2)} Z`}
            className={on ? 'is-on' : ''} />
        );
      })}
      {DIRS.map((d, i) => {
        const a = ((i * 45 - 90) * Math.PI) / 180;
        return <text key={d} x={47 * Math.cos(a)} y={47 * Math.sin(a) + 3} textAnchor="middle">{d}</text>;
      })}
    </svg>
  );
}

export default function VolRandoPoint() {
  const { slug } = useParams();
  const { data, status } = useData();
  const points = useMemo(() => withSlugs(data.volRando.map(norm)), [data.volRando]);
  const p = points.find((x) => x.slug === slug);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (p) document.title = `${p.sommet} · Vol rando · Club des Ayasses`;
    return () => { document.title = 'Club des Ayasses'; };
  }, [p]);

  if (!p) return status.loading ? <p className="container page-top">Chargement…</p> : <NotFound />;

  const hasLoc = !isNaN(p.lat) && !isNaN(p.lng);
  const niv = NIVEAUX[p.niveau];
  const exp = EXPOS[p.expo];
  const url = `${window.location.origin}${pointPath(p)}`;
  const text = shareText(p, url);

  const copy = async (what, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(''), 2500);
    } catch { /* presse-papiers indisponible */ }
  };

  return (
    <section className="section page-top">
      <div className="container">
        <p><Link to="/vol-rando">← Tous les décollages</Link></p>

        <header className="vr-point-head">
          <div>
            <p className="eyebrow">Vol rando · {p.massif}</p>
            <h1 className="page-title">{p.sommet}</h1>
            <p className="vr-point-sub">
              {fmtAlt(p.altitude)} · orienté {p.orientation.join(', ') || '?'}
              {p.type && <> · {p.type.toLowerCase()}</>}
            </p>
          </div>
          <div className="vr-point-share">
            <ShareButton point={p} />
            <a className="btn btn-small btn-ghost-dark" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <button type="button" className="btn btn-small btn-ghost-dark" onClick={() => copy('lien', url)}>
              {copied === 'lien' ? 'Lien copié ✓' : 'Copier le lien'}
            </button>
          </div>
        </header>

        <div className="vr-point-grid">
          <div className="vr-point-main">
            <div className="vr-badges">
              <article className="vr-badge" style={{ '--c': niv?.color || '#999' }}>
                <h2>Niveau {p.niveau || '?'}</h2>
                <p>{niv?.long || 'Niveau non renseigné.'}</p>
              </article>
              <article className={`vr-badge expo-border-${p.expo}`}>
                <h2>Engagement {p.expo || '?'}</h2>
                <p>{exp?.long || 'Exposition non renseignée.'}</p>
              </article>
            </div>

            {p.remarque && (
              <div className="vr-warning" role="note"><strong>Remarque :</strong> {p.remarque}</div>
            )}

            <h2 className="vr-h2">À savoir avant de monter</h2>
            <ul className="vr-tips">
              {thingsToKnow(p).map((t) => (
                <li key={t.title}>
                  <span className="vr-tip-icon" aria-hidden="true">{t.icon}</span>
                  <div><strong>{t.title}</strong><p>{t.text}</p></div>
                </li>
              ))}
            </ul>
            <p className="vr-credit">
              Repères généraux tirés de la fiche du décollage : ils ne remplacent ni la météo du jour, ni votre propre analyse
              sur place.
            </p>
          </div>

          <aside className="vr-point-side">
            {hasLoc && (
              <div className="vr-point-map">
                <MapContainer center={[p.lat, p.lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://opentopomap.org">OpenTopoMap</a>'
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    maxZoom={17}
                  />
                  <CircleMarker center={[p.lat, p.lng]} radius={10}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: niv?.color || '#999', fillOpacity: 0.95 }} />
                </MapContainer>
              </div>
            )}
            <dl className="vr-facts">
              <div><dt>Orientation</dt><dd><Rose active={p.orientation} /></dd></div>
              <div><dt>Altitude</dt><dd>{fmtAlt(p.altitude)}</dd></div>
              {p.atterrissage && <div><dt>Atterrissage</dt><dd>{p.atterrissage}</dd></div>}
              {hasLoc && (
                <div>
                  <dt>Coordonnées</dt>
                  <dd>
                    <button type="button" className="linklike" onClick={() => copy('gps', `${p.lat}, ${p.lng}`)}>
                      {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    </button>
                    {copied === 'gps' && <small> copiées ✓</small>}
                  </dd>
                </div>
              )}
            </dl>
            {hasLoc && (
              <div className="vr-point-links">
                <a className="btn btn-small btn-ghost-dark" href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">Google Maps</a>
                <a className="btn btn-small btn-ghost-dark" href={`https://www.geoportail.gouv.fr/carte?c=${p.lng},${p.lat}&z=15&l0=GEOGRAPHICALGRIDSYSTEMS.MAPS::GEOPORTAIL:OGC:WMTS(1)&permalink=yes`} target="_blank" rel="noreferrer">Carte IGN</a>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
