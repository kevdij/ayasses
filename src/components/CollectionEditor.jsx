import { useState } from 'react';
import { newId } from '../store/DataContext.jsx';

/**
 * Éditeur générique de liste (événements, actualités, structures…).
 * fields: [{ key, label, type: 'text'|'date'|'time'|'textarea'|'select'|'url', options?, required?, hint? }]
 */
export default function CollectionEditor({ items, onChange, fields, prefix, emptyItem, renderSummary, sort }) {
  const [editing, setEditing] = useState(null); // objet en cours d'édition
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState('');

  const list = (sort ? [...items].sort(sort) : items).filter((it) =>
    JSON.stringify(it).toLowerCase().includes(query.toLowerCase())
  );

  const startNew = () => {
    setEditing({ ...emptyItem, id: newId(prefix) });
    setIsNew(true);
  };

  const save = (e) => {
    e.preventDefault();
    onChange(isNew ? [editing, ...items] : items.map((it) => (it.id === editing.id ? editing : it)));
    setEditing(null);
  };

  const remove = (id) => {
    if (window.confirm('Supprimer cet élément ?')) {
      onChange(items.filter((it) => it.id !== id));
      setEditing(null);
    }
  };

  return (
    <div className="editor">
      <div className="editor-list">
        <div className="editor-toolbar">
          <input
            type="search"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher"
          />
          <button className="btn btn-small" onClick={startNew}>+ Ajouter</button>
        </div>
        <ul>
          {list.map((it) => (
            <li key={it.id}>
              <button
                className={`editor-item ${editing?.id === it.id ? 'is-active' : ''}`}
                onClick={() => { setEditing({ ...it }); setIsNew(false); }}
              >
                {renderSummary(it)}
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="empty">Aucun élément.</li>}
        </ul>
      </div>

      <div className="editor-form">
        {editing ? (
          <form onSubmit={save}>
            <h3>{isNew ? 'Nouvel élément' : 'Modifier'}</h3>
            {fields.map((f) => (
              <label key={f.key} className="field">
                <span>{f.label}{f.required && ' *'}</span>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={f.rows || 5}
                    value={editing[f.key] || ''}
                    required={f.required}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                  />
                ) : f.type === 'select' ? (
                  <select value={editing[f.key] || ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}>
                    {f.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={editing[f.key] || ''}
                    required={f.required}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                  />
                )}
                {f.hint && <small>{f.hint}</small>}
              </label>
            ))}
            <div className="form-actions">
              <button type="submit" className="btn">Enregistrer</button>
              <button type="button" className="btn btn-ghost-dark" onClick={() => setEditing(null)}>Annuler</button>
              {!isNew && (
                <button type="button" className="btn btn-danger" onClick={() => remove(editing.id)}>Supprimer</button>
              )}
            </div>
          </form>
        ) : (
          <div className="editor-placeholder">
            <p>Sélectionnez un élément à modifier, ou cliquez sur <strong>+ Ajouter</strong>.</p>
          </div>
        )}
      </div>
    </div>
  );
}
