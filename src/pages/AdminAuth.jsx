import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, authLinkType } from '../lib/supabase.js';
import Logo from '../components/Logo.jsx';

const MIN_PASSWORD = 12;
const IDLE_MINUTES = 30;

/**
 * Parcours de connexion :
 *  1. e-mail + mot de passe
 *  2. code à 6 chiffres de l'application d'authentification (2FA TOTP)
 *     → à la première connexion, on enregistre l'application avec un QR code
 *  3. vérification que le compte figure dans la liste des admins
 * Les droits d'écriture sont de toute façon vérifiés par la base (RLS + aal2).
 */
export default function AdminAuth({ children }) {
  const [stage, setStage] = useState({ name: 'loading' });
  const [mustSetPassword, setMustSetPassword] = useState(authLinkType === 'invite' || authLinkType === 'recovery');

  const compute = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setStage({ name: 'signin' });

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = (factors?.totp || []).filter((f) => f.status === 'verified');

    if (verified.length && aal?.currentLevel !== 'aal2') return setStage({ name: 'challenge', factorId: verified[0].id });
    if (mustSetPassword) return setStage({ name: 'set-password' });
    if (!verified.length) return setStage({ name: 'enroll' });

    const { data: row, error } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
    if (error || !row) return setStage({ name: 'not-admin', email: session.user.email });
    setStage({ name: 'ok', email: session.user.email });
  }, [mustSetPassword]);

  useEffect(() => {
    compute();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMustSetPassword(true);
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'MFA_CHALLENGE_VERIFIED') compute();
    });
    return () => sub.subscription.unsubscribe();
  }, [compute]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStage({ name: 'signin', info: '' });
  }, []);

  // Déconnexion automatique après inactivité
  useEffect(() => {
    if (stage.name !== 'ok') return;
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      if (Date.now() - last > IDLE_MINUTES * 60 * 1000) {
        supabase.auth.signOut().then(() => setStage({ name: 'signin', info: 'Déconnecté après 30 minutes d’inactivité.' }));
      }
    }, 30 * 1000);
    return () => { clearInterval(timer); events.forEach((e) => window.removeEventListener(e, bump)); };
  }, [stage.name]);

  if (stage.name === 'ok') return children({ email: stage.email, signOut });

  return (
    <div className="login">
      <div className="login-card">
        <Logo size={56} />
        {stage.name === 'loading' && <p>Chargement…</p>}
        {stage.name === 'signin' && <SignIn info={stage.info} onDone={compute} />}
        {stage.name === 'challenge' && <Challenge factorId={stage.factorId} onDone={compute} onCancel={signOut} />}
        {stage.name === 'set-password' && <SetPassword onDone={() => { setMustSetPassword(false); }} onCancel={signOut} />}
        {stage.name === 'enroll' && <Enroll onDone={compute} onCancel={signOut} />}
        {stage.name === 'not-admin' && (
          <>
            <h1>Accès refusé</h1>
            <p className="login-text">Le compte <strong>{stage.email}</strong> n’est pas administrateur du site. Demandez au bureau de vous ajouter.</p>
            <button className="btn" onClick={signOut}>Se déconnecter</button>
          </>
        )}
        <Link to="/" className="text-link">← Retour au site</Link>
      </div>
    </div>
  );
}

function SignIn({ info, onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(info || '');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    if (forgot) {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin` });
      // Message identique que le compte existe ou non (ne révèle pas les comptes)
      setMessage('Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.');
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(err.status === 429 ? 'Trop de tentatives. Réessayez dans quelques minutes.' : 'E-mail ou mot de passe incorrect.');
      return;
    }
    onDone();
  };

  return (
    <form onSubmit={submit} className="login-form">
      <h1>Espace admin</h1>
      <p className="login-text">{forgot ? 'Recevoir un lien pour choisir un nouveau mot de passe.' : 'Club des Ayasses'}</p>
      <label className="field">
        <span>E-mail</span>
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      </label>
      {!forgot && (
        <label className="field">
          <span>Mot de passe</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="info" role="status">{message}</p>}
      <button className="btn" type="submit" disabled={busy}>{busy ? '…' : forgot ? 'Envoyer le lien' : 'Se connecter'}</button>
      <button type="button" className="link-button" onClick={() => { setForgot(!forgot); setError(''); setMessage(''); }}>
        {forgot ? '← Retour à la connexion' : 'Mot de passe oublié ?'}
      </button>
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

function Challenge({ factorId, onDone, onCancel }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (err) { setError('Code invalide ou expiré.'); setCode(''); return; }
    onDone();
  };

  return (
    <form onSubmit={submit} className="login-form">
      <h1>Double authentification</h1>
      <p className="login-text">Saisissez le code affiché dans votre application d’authentification.</p>
      <CodeInput value={code} onChange={setCode} />
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={busy || code.length !== 6}>Valider</button>
      <button type="button" className="link-button" onClick={onCancel}>Annuler et se déconnecter</button>
    </form>
  );
}

function Enroll({ onDone, onCancel }) {
  const [factor, setFactor] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Nettoie les enregistrements commencés mais jamais validés
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of (list?.all || []).filter((f) => f.status !== 'verified')) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Ayasses ${new Date().toISOString().slice(0, 10)}` });
      if (cancelled) return;
      if (err) setError('Impossible de démarrer la double authentification : ' + err.message);
      else setFactor(data);
    })();
    return () => { cancelled = true; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (err) { setError('Code invalide. Vérifiez l’heure de votre téléphone et réessayez.'); setCode(''); return; }
    onDone();
  };

  return (
    <form onSubmit={submit} className="login-form">
      <h1>Activer la double authentification</h1>
      <p className="login-text">
        Obligatoire pour les admins. Scannez ce QR code avec une application comme Google Authenticator, Microsoft
        Authenticator, Authy ou 2FAS, puis saisissez le code affiché.
      </p>
      {factor ? (
        <>
          <img className="qr" src={factor.totp.qr_code} alt="QR code à scanner avec l’application d’authentification" width="200" height="200" />
          <button type="button" className="link-button" onClick={() => setShowSecret(!showSecret)}>
            {showSecret ? 'Masquer la clé' : 'Impossible de scanner ? Afficher la clé'}
          </button>
          {showSecret && <code className="secret">{factor.totp.secret}</code>}
          <CodeInput value={code} onChange={setCode} />
          <button className="btn" type="submit" disabled={code.length !== 6}>Activer</button>
        </>
      ) : !error && <p>Préparation…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="link-button" onClick={onCancel}>Annuler et se déconnecter</button>
    </form>
  );
}

function SetPassword({ onDone, onCancel }) {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pwd.length < MIN_PASSWORD) return setError(`Au moins ${MIN_PASSWORD} caractères.`);
    if (pwd !== pwd2) return setError('Les deux mots de passe ne sont pas identiques.');
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (err) return setError('Impossible d’enregistrer le mot de passe : ' + err.message);
    onDone();
  };

  return (
    <form onSubmit={submit} className="login-form">
      <h1>Choisir un mot de passe</h1>
      <p className="login-text">Au moins {MIN_PASSWORD} caractères. Une phrase de passe facile à retenir est idéale.</p>
      <label className="field">
        <span>Nouveau mot de passe</span>
        <input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span>Confirmer</span>
        <input type="password" autoComplete="new-password" required value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={busy}>Enregistrer</button>
      <button type="button" className="link-button" onClick={onCancel}>Annuler</button>
    </form>
  );
}
