import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData, todayISO, formatDate } from '../store/DataContext.jsx';
import { api, post } from '../lib/api.js';
import { importVolRandoXlsx, exportVolRandoXlsx } from '../lib/volRandoXlsx.js';
import CollectionEditor from '../components/CollectionEditor.jsx';
import Logo from '../components/Logo.jsx';
import AdminAuth, { ChangePassword } from './AdminAuth.jsx';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '◎' },
  { id: 'events', label: 'Agenda', icon: '📅' },
  { id: 'news', label: 'Actualités', icon: '📰' },
  { id: 'volRando', label: 'Vol rando', icon: '🥾' },
  { id: 'club', label: 'Infos du club', icon: '🏔️' },
  { id: 'activities', label: 'Activités', icon: '🪂' },
  { id: 'structures', label: 'Structures', icon: '🧭' },
  { id: 'accounts', label: 'Comptes admin', icon: '🔐' },
  { id: 'data', label: 'Sauvegarde', icon: '💾' },
];

export default function Admin() {
  return <AdminAuth>{({ user, signOut }) => <AdminShell user={user} signOut={signOut} />}</AdminAuth>;
}

function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function AdminShell({ user, signOut }) {
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
          <small className="admin-user" title={user.email}>🔒 {user.email}</small>
          <Link to="/" className="btn btn-small btn-ghost">Voir le site ↗</Link>
          <button className="btn btn-small btn-ghost" onClick={signOut}>Déconnexion</button>
        </div>
      </aside>

      <section className="admin-main">
        <div className="admin-topbar">
          <h1>{TABS.find((t) => t.id === tab).label}</h1>
          <span className="save-state" role="status">
            {status.saving ? 'Enregistrement…' : status.error ? '' : status.updated ? `✓ Enregistré · ${new Date(status.updated).toLocaleString('fr-FR')}` : ''}
          </span>
        </div>
        {status.offline && <p className="error banner" role="alert">Le serveur ne répond pas : les modifications ne pourront pas être enregistrées.</p>}
        {status.error && <p className="error banner" role="alert">{status.error}</p>}
        {tab === 'dashboard' && <Dashboard goTo={setTab} />}
        {tab === 'events' && <EventsTab />}
        {tab === 'news' && <NewsTab />}
        {tab === 'volRando' && <VolRandoTab />}
        {tab === 'club' && <ClubTab />}
        {tab === 'activities' && <ActivitiesTab />}
        {tab === 'structures' && <StructuresTab />}
        {tab === 'accounts' && <AccountsTab me={user} />}
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
  if (/compléter/i.test(data.club.president + data.club.host)) todo.push({ text: 'Compléter les mentions légales (directeur de publication, hébergeur).', tab: 'club' });
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

/* ------------------------------------------------------------------ */
/* Vol rando : import / export xlsx (repris du plugin WordPress)       */
/* ------------------------------------------------------------------ */

function VolRandoTab() {
  const { data, update, saveMany } = useData();
  const points = data.volRando;
  const info = data.volRandoInfo || {};
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState(null); // { type: 'success'|'warning'|'error', text, details? }
  const [busy, setBusy] = useState(false);

  const massifs = [...new Set(points.map((p) => p.massif).filter(Boolean))];

  const doImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await importVolRandoXlsx(file);
      if (!window.confirm(`Remplacer les ${points.length} décollages actuels par les ${res.points.length} du fichier ?`)) {
        setBusy(false);
        return;
      }
      const saved = await saveMany({
        volRando: res.points,
        volRandoInfo: { intro: res.intro || info.intro || '', updated: new Date().toISOString(), file: file.name },
      });
      if (!saved.ok) throw saved.error;
      const n = res.points.length;
      setNotice({
        type: res.warnings.length ? 'warning' : 'success',
        text: `${n} décollage${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''}.`,
        details: res.warnings,
      });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Import impossible.' });
    }
    setBusy(false);
  };

  const doExport = async () => {
    const blob = await exportVolRandoXlsx(points, info.intro || '');
    download(blob, 'decos-rando-alpes-du-sud.xlsx');
  };

  return (
    <div className="dash">
      {notice && (
        <div className={`notice notice-${notice.type}`} role="status">
          <p>{notice.text}</p>
          {notice.details?.length > 0 && (
            <ul>{notice.details.map((w, i) => <li key={i}>{w}</li>)}</ul>
          )}
        </div>
      )}

      <div className="vr-admin-grid">
        <div className="panel">
          <h2>Importer un fichier .xlsx</h2>
          <p>Remplace l’intégralité du catalogue : les points existants sont mis à jour ou créés, et ceux absents du fichier sont supprimés.</p>
          <p className="muted">
            Le classeur doit contenir une feuille « Décollages » (au format du fichier d’origine) et peut contenir une feuille
            « Informations et réserves » pour le texte d’introduction.
          </p>
          <form onSubmit={doImport} className="vr-import">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <button type="submit" className="btn" disabled={!file || busy}>{busy ? 'Import…' : 'Importer le fichier'}</button>
          </form>
        </div>

        <div className="panel">
          <h2>Exporter</h2>
          <p>Génère un classeur au même format que le fichier fourni (feuille « Informations et réserves » + feuille « Décollages »).</p>
          <p><strong>Ordre d’export :</strong> massif alphabétique puis sommet.</p>
          <button className="btn btn-ghost-dark" onClick={doExport}>Télécharger l’export (XLSX)</button>
        </div>
      </div>

      <div className="panel">
        <h2>État actuel</h2>
        <p className="muted">
          <strong>{points.length}</strong> décollage(s) · dernier import :{' '}
          {info.updated ? new Date(info.updated).toLocaleString('fr-FR') : '— (jeu de données par défaut)'}
          {info.file && <> · fichier « {info.file} »</>}
          <br />Massifs : {massifs.length ? massifs.join(', ') : '—'}
        </p>
        <p><a href="/vol-rando" target="_blank" rel="noreferrer" className="text-link">Voir la page Vol rando ↗</a></p>
      </div>

      <div>
        <h2 className="h3">Modifier un décollage</h2>
        <CollectionEditor
          items={points}
          onChange={(v) => update('volRando', v)}
          prefix="d"
          sort={(a, b) => String(a.sommet).localeCompare(String(b.sommet), 'fr')}
          emptyItem={{ dept: '05', massif: 'Champsaur', sommet: '', altitude: '', orientation: '', lat: '', lng: '', type: 'Mixte', niveau: 'Bleu', expo: 'E2', atterrissage: '', remarque: '' }}
          fields={[
            { key: 'sommet', label: 'Sommet / nom du déco', required: true },
            { key: 'massif', label: 'Massif', required: true },
            { key: 'dept', label: 'Département' },
            { key: 'altitude', label: 'Altitude (m)', type: 'number' },
            { key: 'orientation', label: 'Orientation(s)', hint: 'Ex. « SE, S, SO » (N, NE, E, SE, S, SO, O, NO)' },
            { key: 'lat', label: 'Latitude', type: 'number', required: true, hint: 'Ex. 44.73968' },
            { key: 'lng', label: 'Longitude', type: 'number', required: true, hint: 'Ex. 6.15588' },
            { key: 'type', label: 'Terrain', type: 'select', options: ['Herbe', 'Mixte', 'Cailloux', 'Glacier'] },
            { key: 'niveau', label: 'Niveau', type: 'select', options: ['Vert', 'Bleu', 'Marron'] },
            { key: 'expo', label: 'Exposition', type: 'select', options: ['E1', 'E2', 'E3'] },
            { key: 'atterrissage', label: 'Atterrissage', type: 'textarea', rows: 2 },
            { key: 'remarque', label: 'Remarque', type: 'textarea', rows: 2 },
          ]}
          renderSummary={(p) => <><strong>{p.sommet || '(sans nom)'}</strong><small>{p.altitude ? `${p.altitude} m · ` : ''}{p.niveau} · {p.expo}</small></>}
        />
      </div>
    </div>
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
        {field('host', 'Hébergeur (nom, adresse, téléphone)')}
      </div>
      <div className="form-actions">
        <button className="btn" type="submit">Enregistrer</button>
        {saved && <span className="saved" role="status">✓ Enregistré</span>}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Comptes admin                                                       */
/* ------------------------------------------------------------------ */

function AccountsTab({ me }) {
  const [users, setUsers] = useState(null);
  const [email, setEmail] = useState('');
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setUsers((await post('auth.php?action=users')).users); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setError(''); setCreated(null);
    try {
      const r = await post('auth.php?action=user-add', { email });
      setCreated({ email: r.user.email, password: r.tempPassword });
      setEmail('');
      load();
    } catch (err) { setError(err.message); }
  };

  const act = async (action, u, question) => {
    if (!window.confirm(question)) return;
    setError('');
    try { await post(`auth.php?action=${action}`, { id: u.id }); load(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="dash">
      {error && <p className="error banner" role="alert">{error}</p>}
      <div className="panel">
        <h2>Administrateurs</h2>
        {!users ? <p>Chargement…</p> : (
          <ul className="user-list">
            {users.map((u) => (
              <li key={u.id}>
                <div>
                  <strong>{u.email}</strong> {u.id === me.id && <em className="badge">vous</em>}
                  <small>
                    {u.twoFactor ? '2FA active' : '2FA à configurer à la prochaine connexion'}
                    {u.lastLogin && ` · dernière connexion ${new Date(u.lastLogin).toLocaleString('fr-FR')}`}
                  </small>
                </div>
                {u.id !== me.id && (
                  <div className="user-actions">
                    {u.twoFactor && (
                      <button className="btn btn-small btn-ghost-dark" onClick={() => act('user-reset-2fa', u, `Réinitialiser la double authentification de ${u.email} ? (téléphone perdu) Il devra rescanner un QR code.`)}>
                        Réinitialiser 2FA
                      </button>
                    )}
                    <button className="btn btn-small btn-danger" onClick={() => act('user-delete', u, `Supprimer le compte admin ${u.email} ?`)}>Supprimer</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <h2>Ajouter un administrateur</h2>
        <form onSubmit={add} className="inline-form">
          <label className="field"><span>E-mail</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button className="btn" type="submit">Créer le compte</button>
        </form>
        {created && (
          <div className="notice notice-warning">
            <p>
              Compte créé pour <strong>{created.email}</strong>. Transmettez-lui ce <strong>mot de passe provisoire</strong> (il ne
              sera plus affiché) : <code className="secret">{created.password}</code>
            </p>
            <p>À sa première connexion, il configurera la double authentification puis choisira son propre mot de passe.</p>
          </div>
        )}
      </div>

      <div className="panel">
        <ChangePassword />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sauvegarde                                                          */
/* ------------------------------------------------------------------ */

function DataTab() {
  const { data, replaceAll } = useData();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState(null);

  useEffect(() => {
    api('content.php?audit=1').then((r) => setLog(r.log)).catch(() => setLog([]));
  }, []);

  const exportJson = () => {
    download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `ayasses-sauvegarde-${todayISO()}.json`);
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
          Le contenu est enregistré sur le serveur, dans le dossier <code>data/</code>. Exportez régulièrement une sauvegarde
          (ou copiez ce dossier).
        </p>
        <div className="form-actions">
          <button className="btn" onClick={exportJson}>Exporter (JSON)</button>
          <button className="btn btn-ghost-dark" onClick={() => fileRef.current.click()}>Restaurer une sauvegarde…</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
        </div>
        {msg && <p className="saved" role="status">{msg}</p>}
      </div>
      <div className="panel">
        <h2>Journal</h2>
        {log === null ? <p>Chargement…</p> : log.length === 0 ? <p>Rien pour l’instant.</p> : (
          <ul className="audit">
            {log.map((l, i) => (
              <li key={i}><time>{new Date(l.at).toLocaleString('fr-FR')}</time> <strong>{l.action}</strong> {l.detail} <small>· {l.user || '?'}</small></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
