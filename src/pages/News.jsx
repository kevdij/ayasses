import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData, formatDate } from '../store/DataContext.jsx';

export default function News() {
  const { data } = useData();
  const [cat, setCat] = useState('Toutes');
  const sorted = [...data.news].sort((a, b) => b.date.localeCompare(a.date));
  const cats = ['Toutes', ...new Set(sorted.map((n) => n.category))];
  const list = cat === 'Toutes' ? sorted : sorted.filter((n) => n.category === cat);

  return (
    <section className="section page-top">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Actualités</p>
          <h1 className="page-title">La vie du club</h1>
        </header>
        <div className="chips" role="group" aria-label="Filtrer par catégorie">
          {cats.map((c) => (
            <button key={c} className={`chip ${c === cat ? 'is-active' : ''}`} onClick={() => setCat(c)} aria-pressed={c === cat}>
              {c}
            </button>
          ))}
        </div>
        <div className="news-grid">
          {list.map((n) => (
            <Link key={n.id} to={`/actualites/${n.id}`} className="news-card">
              <span className="tag">{n.category}</span>
              <h2 className="h3">{n.title}</h2>
              <p>{n.excerpt}</p>
              <time dateTime={n.date}>{formatDate(n.date)}</time>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
