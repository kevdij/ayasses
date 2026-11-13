import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData, todayISO, formatDate } from '../store/DataContext.jsx';
import CollectionEditor from '../components/CollectionEditor.jsx';
import Logo from '../components/Logo.jsx';

// Mot de passe défini par la variable d'environnement VITE_ADMIN_PASSWORD
// (fichier .env.local en local, réglages du projet sur Vercel).
// En développement, si elle n'est pas définie, on utilise « ayasses ».
// ⚠️ Il finit dans le JavaScript envoyé au navigateur : ce n'est PAS une vraie sécurité.
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || (import.meta.env.DEV ? 'ayasses' : '');
const SESSION_KEY = 'ayasses-admin';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '◎' },
  { id: 'events', label: 'Agenda', icon: '📅' },
  { id: 'news', label: 'Actualités', icon: '📰' },
  { id: 'club', label: 'Infos du club', icon: '🏔️' },
  { id: 'activities', label: 'Activités', icon: '🪂' },
  { id: 'structures', label: 'Structures', icon: '🧭' },
  { id: 'data', label: 'Sauvegarde', icon: '💾' },
];

function readSession() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}

export default function Admin() {
  const [authed, setAuthed] = useState(readSession);
  const [tab, setTab] = useState('dashboard');

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const logout = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setAuthed(false);
  };

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
          <Link to="/" className="btn btn-small btn-ghost">Voir le site ↗</Link>
          <button className="btn btn-small btn-ghost" onClick={logout}>Déconnexion</button>
        </div>
      </aside>

      <section className="admin-main">
        <h1>{TABS.find((t) => t.id === tab).label}</h1>
        {tab === 'dashboard' && <Dashboard goTo={setTab} />}
        {tab === 'events' && <EventsTab />}
        {tab === 'news' && <NewsTab />}
        {tab === 'club' && <ClubTab />}
        {tab === 'activities' && <ActivitiesTab />}
        {tab === 'structures' && <StructuresTab />}
        {tab === 'data' && <DataTab />}
      </section>
    </div>
  );
}

function Login({ onLogin }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (ADMIN_PASSWORD && pwd === ADMIN_PASSWORD) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
      onLogin();
    } else setError(true);
  };
  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <Logo size={56} />
        <h1>Espace admin</h1>
        <p>Club des Ayasses</p>
        <label className="field">
          <span>Mot de passe</span>
          <input type="password" value={pwd} autoFocus onChange={(e) => { setPwd(e.target.value); setError(false); }} />
        </label>
        {error && <p className="error" role="alert">Mot de passe incorrect.</p>}
        <button className="btn" type="submit">Se connecter</button>
        <Link to="/" className="text-link">← Retour au site</Link>
      </form>
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
  if (!data.club.whatsappUrl) todo.push({ text: 'Ajouter le lien d’invitation WhatsApp.', tab: 'club' });
  if (/compléter/i.test(data.club.president + data.club.host)) todo.push({ text: 'Compléter les mentions légales (président, hébergeur).', tab: 'club' });
  const missingUrls = data.structures.filter((s) => !s.url).length;
  if (missingUrls) todo.push({ text: `${missingUrls} structure(s) sans lien web.`, tab: 'structures' });

  return (
    <div className="dash">
      <div className="stat-row">
        <button className="stat" onClick={() => goTo('events')}><span>{upcoming.length}</span>événement(s) à venir</button>
        <button className="stat" onClick={() => goTo('news')}><span>{data.news.length}</span>actualités</button>
        <button className="stat" onClick={() => goTo('structures')}><span>{data.structures.length}</span>structures</button>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <h2>À faire</h2>
          {todo.length ? (
            <ul className="todo">
              {todo.map((t, i) => (
                <li key={i}><button onClick={() => goTo(t.tab)}>{t.text} →</button></li>
              ))}
            </ul>
          ) : <p>Tout est à jour 🎉</p>}
        </div>
        <div className="panel">
          <h2>Prochain événement</h2>
          {upcoming[0] ? (
            <p><strong>{upcoming[0].title}</strong><br />{formatDate(upcoming[0].date)}</p>
          ) : <p>Aucun.</p>}
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
      emptyItem={{ title: '', date: todayISO(), category: 'Vie du club', excerpt: '', body: '' }}
      fields={[
        { key: 'title', label: 'Titre', required: true },
        { key: 'date', label: 'Date de publication', type: 'date', required: true },
        { key: 'category', label: 'Catégorie', type: 'select', options: ['Vie du club', 'Événement', 'Formation', 'Sécurité', 'Météo'] },
        { key: 'excerpt', label: 'Résumé', type: 'textarea', rows: 2, hint: 'Affiché sur les cartes.' },
        { key: 'body', label: 'Texte', type: 'textarea', rows: 10, hint: 'Séparez les paragraphes par une ligne vide.' },
      ]}
      renderSummary={(n) => (
        <>
          <strong>{n.title || '(sans titre)'}</strong>
          <small>{n.category} · {formatDate(n.date)}</small>
        </>
      )}
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
  const set = (k) => (e) => { setClub({ ...club, [k]: e.target.value }); setSaved(false); };
  const save = (e) => { e.preventDefault(); update('club', club); setSaved(true); };

  const field = (k, label, opts = {}) => (
    <label className="field">
      <span>{label}</span>
      {opts.textarea
        ? <textarea rows={opts.rows || 3} value={club[k]} onChange={set(k)} />
        : <input type={opts.type || 'text'} value={club[k]} onChange={set(k)} />}
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
      {field('whatsappUrl', 'Lien d’invitation WhatsApp', { type: 'url', hint: 'Laisser vide pour ne pas l’afficher publiquement.' })}
      <h2>Adhésion</h2>
      {field('membershipPrice', 'Prix de la cotisation', { hint: 'Ex. « 25 € / an »' })}
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
    if (!file) return;
    try {
      replaceAll(JSON.parse(await file.text()));
      setMsg('✓ Données importées.');
    } catch {
      setMsg('Fichier invalide.');
    }
    e.target.value = '';
  };

  return (
    <div className="panel">
      <p>
        Dans cette maquette, les modifications sont enregistrées <strong>dans votre navigateur uniquement</strong>.
        Exportez une sauvegarde pour les transférer ou les conserver.
      </p>
      <div className="form-actions">
        <button className="btn" onClick={exportJson}>Exporter (JSON)</button>
        <button className="btn btn-ghost-dark" onClick={() => fileRef.current.click()}>Importer…</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
        <button
          className="btn btn-danger"
          onClick={() => { if (window.confirm('Revenir au contenu d’origine ? Vos modifications seront perdues.')) { reset(); setMsg('✓ Contenu réinitialisé.'); } }}
        >
          Réinitialiser
        </button>
      </div>
      {msg && <p className="saved" role="status">{msg}</p>}
    </div>
  );
}
