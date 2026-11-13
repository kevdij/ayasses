import { useState } from 'react';
import { sharePoint } from '../lib/volRando.js';

/** Bouton « Partager » : partage natif sur téléphone, sinon copie du texte. */
export default function ShareButton({ point, className = 'btn btn-small', label = 'Partager' }) {
  const [msg, setMsg] = useState('');

  const onClick = async (e) => {
    e.stopPropagation();
    try {
      const r = await sharePoint(point);
      if (r === 'copied') setMsg('Copié ! Collez-le dans WhatsApp, un SMS…');
    } catch {
      setMsg('Impossible de partager depuis ce navigateur.');
    }
    setTimeout(() => setMsg(''), 3500);
  };

  return (
    <span className="share-wrap">
      <button type="button" className={className} onClick={onClick}>
        <span aria-hidden="true">📤</span> {label}
      </button>
      <span className="share-msg" role="status">{msg}</span>
    </span>
  );
}
