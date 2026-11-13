import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData, todayISO, formatDate } from '../store/DataContext.jsx';
import { supabase, isRemote } from '../lib/supabase.js';
import CollectionEditor from '../components/CollectionEditor.jsx';
import Logo from '../components/Logo.jsx';
import AdminAuth from './AdminAuth.jsx';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '◎' },
  { id: 'events', label: 'Agenda', icon: '📅' },
  { id: 'news', label: 'Actualités', icon: '📰' },
  { id: 'volRando', label: 'Vol rando', icon: '🥾' },
  { id: 'club', label: 'Infos du club', icon: '🏔️' },
  { id: 'activities', label: 'Activités', icon: '🪂' },
  { id: 'structures', label: 'Structures', icon: '🧭' },
  { id: 'data', label: 'Sauvegarde', icon: '💾' },
];

export default function Admin() {
  // Sans Supabase : admin disponible seulement en développement local
  if (!isRemote) {
    if (import.meta.env.DEV) return <AdminShell email="mode local (développement)" signOut={null} />;
    return (
      <div className="login">
        <div className="login-card">
          <Logo size={56} />
          <h1>Admin indisponible</h1>
          <p className="login-text">L’espace admin n’est pas encore configuré (Supabase).</p>
          <Link to="/" className="text-link">← Retour au site</Link>
        </div>
      </div>
    );
  }
  return <AdminAuth>{({ email, signOut }) => <AdminShell email={email} signOut={signOut} />}</AdminAuth>;
}

function AdminShell({ email, signOut }) {
  const [tab, setTab] = useState('dashboard');
  const { status } = useData();

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="admin-brand"><Logo size={32} /> <span>Admin Ayasses</span></Link>
        <nav>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => setTab(t.id)}>
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
        <div className="admin-side-foot">
          <small className="admin-user" title={email}>🔒 {email}</small>
          <Link to="/" className="btn btn-small btn-ghost">Voir le site ↗</Link>
          {signOut && <button className="btn btn-small btn-ghost" onClick={signOut}>Déconnexion</button>}
        </div>
      </aside>

      <section className="admin-main">
        <div className="admin-topbar">
          <h1>{TABS.find((t) => t.id === tab).label}</h1>
          <span className="save-state" role="status">
            {status.saving ? 'Enregistrement…' : status.error ? '' : isRemote ? '✓ Publié en ligne' : 'Mode local'}
          </span>
        </div>
        {status.error && <p className="error banner" role="alert">{status.error}</p>}
        {tab === 'dashboard' && <Dashboard goTo={setTab} />}
        {tab === 'events' && <EventsTab />}
        {tab === 'news' && <NewsTab />}
        {tab === 'volRando' && <VolRandoTab />}
        {tab === 'club' && <ClubTab />}
        {tab === 'activities' && <ActivitiesTab />}
        {tab === 'structures' && <StructuresTab />}
        {tab === 'data' && <DataTab />}
      </section>
    </div>
  );
}

function Dashboard({ goTo }) {
  const { data } = useData();
  const today = todayISO();
  const upcoming = data.events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const lastNews = [...data.news].sort((a, b) => b.date.localeCompare(a.date))[0];
  const todo = [];
  if (!upcoming.length) todo.push({ text: 'Aucun événement à venir : le site paraît inactif.', tab: 'events' });
  if (/compléter/i.test(data.club.membershipPrice)) todo.push({ text: 'Indiquer le prix de la cotisation.', tab: 'club' });
  if (/compléter/i.test(data.club.president)) todo.push({ text: 'Indiquer le directeur ou la directrice de la publication (mentions légales).', tab: 'club' });
  const missingUrls = data.structures.filter((s) => !s.url).length;
  if (missingUrls) todo.push({ text: `${missingUrls} structure(s) sans lien web.`, tab: 'structures' });

  return (
    <div className="dash">
      <div className="stat-row">
        <button className="stat" onClick={() => goTo('events')}><span>{upcoming.length}</span>événement(s) à venir</button>
        <button className="stat" onClick={() => goTo('news')}><span>{data.news.length}</span>actualités</button>
        <button className="stat" onClick={() => goTo('volRando')}><span>{data.volRando.length}</span>décollages rando</button>
      </div>
      <div className="dash-grid">
        <div className="panel">
          <h2>À faire</h2>
          {todo.length ? (
            <ul className="todo">
              {todo.map((t, i) => <li key={i}><button onClick={() => goTo(t.tab)}>{t.text} →</button></li>)}
            </ul>
          ) : <p>Tout est à jour 🎉</p>}
        </div>
        <div className="panel">
          <h2>Prochain événement</h2>
          {upcoming[0] ? <p><strong>{upcoming[0].title}</strong><br />{formatDate(upcoming[0].date)}</p> : <p>Aucun.</p>}
          <h2>Dernière actu</h2>
          {lastNews && <p><strong>{lastNews.title}</strong><br />{formatDate(lastNews.date)}</p>}
        </div>
      </div>
    </div>
  );
}

function EventsTab() {
  const { data, update } = useData();
  const today = todayISO();
  return (
    <CollectionEditor
      items={data.events}
      onChange={(v) => update('events', v)}
      prefix="e"
      sort={(a, b) => b.date.localeCompare(a.date)}
      emptyItem={{ title: '', date: today, time: '', place: '', price: '', description: '' }}
      fields={[
        { key: 'title', label: 'Titre', required: true },
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'time', label: 'Heure', type: 'time' },
        { key: 'place', label: 'Lieu' },
        { key: 'price', label: 'Tarif', hint: 'Ex. « 40 € par pilote ». Laisser vide si gratuit.' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ]}
      renderSummary={(e) => (
        <>
          <strong>{e.title || '(sans titre)'}</strong>
          <small>{formatDate(e.date)} {e.date >= today ? <em className="badge">à venir</em> : <em className="badge badge-muted">passé</em>}</small>
        </>
      )}
    />
  );
}

function NewsTab() {
  const { data, update } = useData();
  return (
    <CollectionEditor
      items={data.news}
      onChange={(v) => update('news', v)}
      prefix="n"
      sort={(a, b) => b.date.localeCompare(a.date)}
      emptyItem={{ title: '', date: todayISO(), category: 'Vie du club', excerpt: '', body: '', images: '' }}
      fields={[
        { key: 'title', label: 'Titre', required: true },
        { key: 'date', label: 'Date de publication', type: 'date', required: true },
        { key: 'category', label: 'Catégorie', type: 'select', options: ['Vie du club', 'Événement', 'Formation', 'Sortie', 'Programme', 'Sécurité', 'Météo'] },
        { key: 'excerpt', label: 'Résumé', type: 'textarea', rows: 2, hint: 'Affiché sur les cartes.' },
        { key: 'body', label: 'Texte', type: 'textarea', rows: 12, hint: 'Paragraphes séparés par une ligne vide. Lien : [texte](https://…)' },
        { key: 'images', label: 'Images (une adresse par ligne)', type: 'textarea', rows: 3, hint: 'Ex. /images/actus/affiche.jpg ou https://…' },
      ]}
      renderSummary={(n) => <><strong>{n.title || '(sans titre)'}</strong><small>{n.category} · {formatDate(n.date)}</small></>}
    />
  );
}

function VolRandoTab() {
  const { data, update } = useData();
  return (
    <CollectionEditor
      items={data.volRando}
      onChange={(v) => update('volRando', v)}
      prefix="d"
      sort={(a, b) => String(a.sommet).localeCompare(String(b.sommet), 'fr')}
      emptyItem={{ dept: '05', massif: 'Champsaur', sommet: '', altitude: '', orientation: '', lat: '', lng: '', type: 'Mixte', niveau: 'Bleu', expo: 'E2', atterrissage: '', remarque: '' }}
      fields={[
        { key: 'sommet', label: 'Sommet / nom du déco', required: true },
        { key: 'altitude', label: 'Altitude (m)', type: 'number' },
        { key: 'orientation', label: 'Orientation(s)', hint: 'Ex. « SE, S, SO » (N, NE, E, SE, S, SO, O, NO)' },
        { key: 'lat', label: 'Latitude', type: 'number', required: true, hint: 'Ex. 44.73968' },
        { key: 'lng', label: 'Longitude', type: 'number', required: true, hint: 'Ex. 6.15588' },
        { key: 'type', label: 'Terrain', type: 'select', options: ['Herbe', 'Mixte', 'Cailloux', 'Glacier'] },
        { key: 'niveau', label: 'Niveau', type: 'select', options: ['Vert', 'Bleu', 'Marron'] },
        { key: 'expo', label: 'Exposition', type: 'select', options: ['E1', 'E2', 'E3'] },
        { key: 'atterrissage', label: 'Atterrissage', type: 'textarea', rows: 2 },
        { key: 'remarque', label: 'Remarque', type: 'textarea', rows: 2 },
        { key: 'massif', label: 'Massif' },
      ]}
      renderSummary={(p) => <><strong>{p.sommet || '(sans nom)'}</strong><small>{p.altitude ? `${p.altitude} m · ` : ''}{p.niveau} · {p.expo}</small></>}
    />
  );
}

function ActivitiesTab() {
  const { data, update } = useData();
  return (
    <CollectionEditor
      items={data.activities}
      onChange={(v) => update('activities', v)}
      prefix="a"
      emptyItem={{ icon: '🪂', title: '', text: '' }}
      fields={[
        { key: 'icon', label: 'Emoji' },
        { key: 'title', label: 'Titre', required: true },
        { key: 'text', label: 'Description', type: 'textarea', rows: 3 },
      ]}
      renderSummary={(a) => <><strong>{a.icon} {a.title}</strong><small>{a.text.slice(0, 50)}…</small></>}
    />
  );
}

function StructuresTab() {
  const { data, update } = useData();
  return (
    <CollectionEditor
      items={data.structures}
      onChange={(v) => update('structures', v)}
      prefix="s"
      emptyItem={{ kind: 'Club', name: '', place: '', url: '' }}
      fields={[
        { key: 'kind', label: 'Type', type: 'select', options: ['Club', 'École', 'Biplace'] },
        { key: 'name', label: 'Nom', required: true },
        { key: 'place', label: 'Lieu / précision' },
        { key: 'url', label: 'Site web', type: 'url', hint: 'https://…' },
      ]}
      renderSummary={(s) => <><strong>{s.name}</strong><small>{s.kind}{s.url ? '' : ' · sans lien'}</small></>}
    />
  );
}

function ClubTab() {
  const { data, update } = useData();
  const [club, setClub] = useState(data.club);
  const [saved, setSaved] = useState(false);
  useEffect(() => setClub(data.club), [data.club]);
  const set = (k) => (e) => { setClub({ ...club, [k]: e.target.value }); setSaved(false); };
  const save = async (e) => { e.preventDefault(); const r = await update('club', club); setSaved(r.ok); };

  const field = (k, label, opts = {}) => (
    <label className="field">
      <span>{label}</span>
      {opts.textarea
        ? <textarea rows={opts.rows || 3} value={club[k] || ''} onChange={set(k)} />
        : <input type={opts.type || 'text'} value={club[k] || ''} onChange={set(k)} />}
      {opts.hint && <small>{opts.hint}</small>}
    </label>
  );

  return (
    <form className="panel form-panel" onSubmit={save}>
      <h2>Identité</h2>
      <div className="form-grid">
        {field('name', 'Nom du club')}
        {field('tagline', 'Slogan')}
      </div>
      {field('intro', 'Présentation (accueil)', { textarea: true })}
      <h2>Contact</h2>
      <div className="form-grid">
        {field('email', 'E-mail', { type: 'email' })}
        {field('location', 'Localisation')}
      </div>
      {field('whatsappUrl', 'Lien d’invitation WhatsApp', { type: 'url', hint: 'Laisser vide pour ne pas l’afficher.' })}
      <h2>Adhésion</h2>
      {field('licenceUrl', 'Lien de prise de licence / adhésion', { type: 'url' })}
      {field('membershipPrice', 'Prix de la cotisation club', { hint: 'Ex. « 25 € / an »' })}
      {field('membershipDetails', 'Ce que comprend l’adhésion', { textarea: true, rows: 4 })}
      <h2>Mentions légales</h2>
      <div className="form-grid">
        {field('president', 'Directeur·rice de la publication')}
        {field('host', 'Hébergeur (nom, adresse)')}
      </div>
      <div className="form-actions">
        <button className="btn" type="submit">Enregistrer</button>
        {saved && <span className="saved" role="status">✓ Enregistré</span>}
      </div>
    </form>
  );
}

function DataTab() {
  const { data, reset, replaceAll } = useData();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState(null);

  useEffect(() => {
    if (!isRemote) return;
    supabase.from('audit_log').select('at, key, action').order('at', { ascending: false }).limit(20)
      .then(({ data: rows }) => setLog(rows || []));
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ayasses-sauvegarde-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let parsed;
    try { parsed = JSON.parse(await file.text()); } catch { setMsg('Fichier invalide.'); return; }
    if (!window.confirm('Remplacer le contenu du site par celui de ce fichier ?')) return;
    const r = await replaceAll(parsed);
    setMsg(r.ok ? '✓ Données importées.' : 'Import refusé.');
  };

  return (
    <div className="dash">
      <div className="panel">
        <p>
          {isRemote
            ? 'Les modifications sont publiées en ligne dès que vous enregistrez. Exportez régulièrement une sauvegarde.'
            : 'Mode local : les modifications restent dans ce navigateur.'}
        </p>
        <div className="form-actions">
          <button className="btn" onClick={exportJson}>Exporter (JSON)</button>
          <button className="btn btn-ghost-dark" onClick={() => fileRef.current.click()}>Importer…</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
          {!isRemote && (
            <button className="btn btn-danger" onClick={() => { if (window.confirm('Revenir au contenu d’origine ?')) { reset(); setMsg('✓ Contenu réinitialisé.'); } }}>
              Réinitialiser
            </button>
          )}
        </div>
        {msg && <p className="saved" role="status">{msg}</p>}
      </div>
      {isRemote && (
        <div className="panel">
          <h2>Dernières modifications</h2>
          {log === null ? <p>Chargement…</p> : log.length === 0 ? <p>Aucune modification pour l’instant.</p> : (
            <ul className="audit">
              {log.map((l, i) => (
                <li key={i}><time>{new Date(l.at).toLocaleString('fr-FR')}</time> {l.action} <strong>{l.key}</strong></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
