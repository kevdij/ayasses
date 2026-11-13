import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { api, post } from '../lib/api.js';
import Logo from '../components/Logo.jsx';

const MIN_PASSWORD = 12;

/**
 * Parcours de connexion (vérifié par le serveur PHP) :
 *  0. première installation : code lu dans data/setup-code.php + création du compte
 *  1. e-mail + mot de passe
 *  2. code à 6 chiffres de l'application d'authentification (2FA)
 *     → à la première connexion, on enregistre l'application avec un QR code
 *  3. mot de passe provisoire → changement obligatoire
 */
export default function AdminAuth({ children }) {
  const [state, setState] = useState({ stage: 'loading' });

  const refresh = useCallback(async () => {
    try {
      setState(await api('auth.php?action=status'));
    } catch (e) {
      setState({ stage: 'error', error: e.message });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const signOut = useCallback(async (info = '') => {
    try { await post('auth.php?action=logout'); } catch { /* ignore */ }
    setState({ stage: 'signin', info });
  }, []);

  // Vérifie régulièrement la session (expiration après 30 min d'inactivité côté serveur)
  useEffect(() => {
    if (state.stage !== 'ok') return;
    const t = setInterval(async () => {
      try {
        const s = await api('auth.php?action=status');
        if (s.stage !== 'ok') setState({ ...s, info: 'Session expirée : reconnectez-vous.' });
      } catch { /* réseau : on réessaiera */ }
    }, 60 * 1000);
    return () => clearInterval(t);
  }, [state.stage]);

  if (state.stage === 'ok' && !state.mustChangePassword) {
    return children({ user: state.user, signOut: () => signOut(), onSessionLost: refresh });
  }

  return (
    <div className="login">
      <div className="login-card">
        <Logo size={56} />
        {state.stage === 'loading' && <p>Chargement…</p>}
        {state.stage === 'error' && (
          <>
            <h1>Admin indisponible</h1>
            <p className="error">{state.error}</p>
            <button className="btn" onClick={refresh}>Réessayer</button>
          </>
        )}
        {state.stage === 'setup' && <Setup onDone={setState} />}
        {state.stage === 'signin' && <SignIn info={state.info || (state.expired ? 'Session expirée : reconnectez-vous.' : '')} onDone={setState} />}
        {state.stage === 'totp' && <Challenge email={state.email} onDone={setState} onCancel={() => signOut()} />}
        {state.stage === 'enroll' && <Enroll email={state.email} onDone={setState} onCancel={() => signOut()} />}
        {state.stage === 'ok' && state.mustChangePassword && (
          <ChangePassword forced onDone={() => setState({ ...state, mustChangePassword: false })} onCancel={() => signOut()} />
        )}
        <Link to="/" className="text-link">← Retour au site</Link>
      </div>
    </div>
  );
}

function useForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return { error, busy, run, setError };
}

function Setup({ onDone }) {
  const [asked, setAsked] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const f = useForm();

  const ask = () => f.run(async () => { await post('auth.php?action=setup-code'); setAsked(true); });
  const submit = (e) => {
    e.preventDefault();
    if (pwd !== pwd2) return f.setError('Les deux mots de passe ne sont pas identiques.');
    f.run(async () => onDone(await post('auth.php?action=setup', { code, email, password: pwd })));
  };

  if (!asked) {
    return (
      <div className="login-form">
        <h1>Installation</h1>
        <p className="login-text">
          Aucun compte admin n’existe encore. Pour prouver que vous gérez le serveur, un code d’installation va être écrit
          dans le fichier <code>data/setup-code.php</code>, à ouvrir via FTP ou le gestionnaire de fichiers de l’hébergeur.
        </p>
        {f.error && <p className="error" role="alert">{f.error}</p>}
        <button className="btn" onClick={ask} disabled={f.busy}>Générer le code d’installation</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="login-form">
      <h1>Premier compte admin</h1>
      <p className="login-text">Ouvrez <code>data/setup-code.php</code> sur le serveur et recopiez le code indiqué.</p>
      <label className="field"><span>Code d’installation</span>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoFocus autoComplete="off" />
      </label>
      <label className="field"><span>Votre e-mail</span>
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="field"><span>Mot de passe ({MIN_PASSWORD} caractères minimum)</span>
        <input type="password" autoComplete="new-password" minLength={MIN_PASSWORD} value={pwd} onChange={(e) => setPwd(e.target.value)} required />
      </label>
      <label className="field"><span>Confirmer le mot de passe</span>
        <input type="password" autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} required />
      </label>
      {f.error && <p className="error" role="alert">{f.error}</p>}
      <button className="btn" type="submit" disabled={f.busy}>Créer le compte</button>
    </form>
  );
}

function SignIn({ info, onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const f = useForm();

  const submit = (e) => {
    e.preventDefault();
    f.run(async () => onDone(await post('auth.php?action=login', { email, password })));
  };

  return (
    <form onSubmit={submit} className="login-form">
      <h1>Espace admin</h1>
      <p className="login-text">Club des Ayasses</p>
      <label className="field"><span>E-mail</span>
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      </label>
      <label className="field"><span>Mot de passe</span>
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {info && !f.error && <p className="info" role="status">{info}</p>}
      {f.error && <p className="error" role="alert">{f.error}</p>}
      <button className="btn" type="submit" disabled={f.busy}>{f.busy ? '…' : 'Se connecter'}</button>
      <small className="login-text">Mot de passe oublié ? Demandez à un autre admin de vous recréer un accès.</small>
    </form>
  );
}

function CodeInput({ value, onChange }) {
  return (
    <label className="field">
      <span>Code à 6 chiffres</span>
      <input
        className="code-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
    </label>
  );
}

function Challenge({ email, onDone, onCancel }) {
  const [code, setCode] = useState('');
  const f = useForm();
  const submit = (e) => {
    e.preventDefault();
    f.run(async () => {
      try { onDone(await post('auth.php?action=totp', { code })); } catch (err) { setCode(''); throw err; }
    });
  };
  return (
    <form onSubmit={submit} className="login-form">
      <h1>Double authentification</h1>
      <p className="login-text">Saisissez le code affiché pour <strong>{email}</strong> dans votre application d’authentification.</p>
      <CodeInput value={code} onChange={setCode} />
      {f.error && <p className="error" role="alert">{f.error}</p>}
      <button className="btn" type="submit" disabled={f.busy || code.length !== 6}>Valider</button>
      <button type="button" className="link-button" onClick={onCancel}>Annuler</button>
    </form>
  );
}

function Enroll({ email, onDone, onCancel }) {
  const [secret, setSecret] = useState(null);
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const f = useForm();

  useEffect(() => {
    f.run(async () => {
      const r = await post('auth.php?action=enroll-start');
      setSecret(r.secret);
      setQr(await QRCode.toDataURL(r.uri, { width: 220, margin: 1 }));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault();
    f.run(async () => {
      try { onDone(await post('auth.php?action=enroll-confirm', { code })); } catch (err) { setCode(''); throw err; }
    });
  };

  return (
    <form onSubmit={submit} className="login-form">
      <h1>Activer la double authentification</h1>
      <p className="login-text">
        Obligatoire pour les admins. Scannez ce QR code avec une application comme Google Authenticator, Microsoft
        Authenticator, 2FAS ou Authy, puis saisissez le code affiché.
      </p>
      {qr && <img className="qr" src={qr} alt={`QR code de double authentification pour ${email}`} width="220" height="220" />}
      {secret && (
        <>
          <button type="button" className="link-button" onClick={() => setShowSecret(!showSecret)}>
            {showSecret ? 'Masquer la clé' : 'Impossible de scanner ? Afficher la clé'}
          </button>
          {showSecret && <code className="secret">{secret.replace(/(.{4})/g, '$1 ').trim()}</code>}
          <CodeInput value={code} onChange={setCode} />
          <button className="btn" type="submit" disabled={f.busy || code.length !== 6}>Activer</button>
        </>
      )}
      {f.error && <p className="error" role="alert">{f.error}</p>}
      <button type="button" className="link-button" onClick={onCancel}>Annuler</button>
    </form>
  );
}

export function ChangePassword({ forced = false, onDone, onCancel }) {
  const [current, setCurrent] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [done, setDone] = useState(false);
  const f = useForm();

  const submit = (e) => {
    e.preventDefault();
    if (pwd !== pwd2) return f.setError('Les deux mots de passe ne sont pas identiques.');
    f.run(async () => {
      await post('auth.php?action=change-password', { current, password: pwd });
      setDone(true); setCurrent(''); setPwd(''); setPwd2('');
      onDone?.();
    });
  };

  return (
    <form onSubmit={submit} className={forced ? 'login-form' : 'form-narrow'}>
      {forced ? <h1>Choisissez votre mot de passe</h1> : <h2>Changer mon mot de passe</h2>}
      {forced && <p className="login-text">Vous êtes connecté avec un mot de passe provisoire. Choisissez le vôtre ({MIN_PASSWORD} caractères minimum).</p>}
      <label className="field"><span>{forced ? 'Mot de passe provisoire' : 'Mot de passe actuel'}</span>
        <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </label>
      <label className="field"><span>Nouveau mot de passe</span>
        <input type="password" autoComplete="new-password" minLength={MIN_PASSWORD} value={pwd} onChange={(e) => setPwd(e.target.value)} required />
      </label>
      <label className="field"><span>Confirmer</span>
        <input type="password" autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} required />
      </label>
      {f.error && <p className="error" role="alert">{f.error}</p>}
      {done && !forced && <p className="saved" role="status">✓ Mot de passe modifié.</p>}
      <div className="form-actions">
        <button className="btn" type="submit" disabled={f.busy}>Enregistrer</button>
        {forced && <button type="button" className="link-button" onClick={onCancel}>Se déconnecter</button>}
      </div>
    </form>
  );
}
