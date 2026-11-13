import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData, todayISO, formatDate } from '../store/DataContext.jsx';
import EventCard from '../components/EventCard.jsx';

export default function Home() {
  const { data } = useData();
  const { club, activities, events, news, structures } = data;
  const [showPast, setShowPast] = useState(false);

  const today = todayISO();
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const latest = [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const next = upcoming[0];

  const kinds = [...new Set(structures.map((s) => s.kind))];

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <img
          className="hero-bg"
          src="/images/decollage.jpg"
          alt=""
          width="1600"
          height="900"
          fetchpriority="high"
        />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="container hero-content">
          <p className="eyebrow">Parapente · Champsaur · Hautes-Alpes</p>
          <h1>
            {club.name}
            <span>{club.tagline}</span>
          </h1>
          <p className="hero-lead">{club.intro}</p>
          <div className="hero-actions">
            <a href="#adhesion" className="btn">Rejoindre le club</a>
            <a href="#agenda" className="btn btn-ghost">Voir l’agenda</a>
          </div>
          {next && (
            <a href="#agenda" className="next-pill">
              <span className="dot" /> Prochain rendez-vous : <strong>{next.title}</strong> · {formatDate(next.date, { day: 'numeric', month: 'long' })}
            </a>
          )}
        </div>
      </section>

      {/* LE CLUB */}
      <section id="club" className="section">
        <div className="container">
          <header className="section-head">
            <p className="eyebrow">Le club</p>
            <h2>Voler ensemble, toute l’année</h2>
            <p>Une association de pilotes passionnés, du débutant breveté au pilote de cross, qui fait vivre le vol libre dans la vallée.</p>
          </header>
          <div className="activity-grid">
            {activities.map((a) => (
              <article key={a.id} className="activity-card">
                <span className="activity-icon" aria-hidden="true">{a.icon}</span>
                <h3>{a.title}</h3>
                <p>{a.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* AGENDA */}
      <section id="agenda" className="section section-alt">
        <div className="container">
          <header className="section-head">
            <p className="eyebrow">Agenda</p>
            <h2>Les prochains rendez-vous</h2>
          </header>
          {upcoming.length ? (
            <div className="event-list">
              {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          ) : (
            <p className="empty">Pas d’événement prévu pour le moment. Suivez le groupe WhatsApp du club pour être prévenu !</p>
          )}
          {past.length > 0 && (
            <div className="past-block">
              <button className="btn btn-ghost-dark" onClick={() => setShowPast((s) => !s)} aria-expanded={showPast}>
                {showPast ? 'Masquer' : 'Voir'} les événements passés ({past.length})
              </button>
              {showPast && (
                <div className="event-list">
                  {past.map((e) => <EventCard key={e.id} event={e} past />)}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ACTUALITÉS */}
      <section className="section">
        <div className="container">
          <header className="section-head section-head-row">
            <div>
              <p className="eyebrow">Actualités</p>
              <h2>La vie du club</h2>
            </div>
            <Link to="/actualites" className="text-link">Toutes les actualités →</Link>
          </header>
          <div className="news-grid">
            {latest.map((n) => (
              <Link key={n.id} to={`/actualites/${n.id}`} className="news-card">
                <span className="tag">{n.category}</span>
                <h3>{n.title}</h3>
                <p>{n.excerpt}</p>
                <time dateTime={n.date}>{formatDate(n.date)}</time>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ADHÉSION */}
      <section id="adhesion" className="section section-night">
        <div className="container adhesion">
          <div>
            <p className="eyebrow">Adhésion</p>
            <h2>Envie de voler avec nous ?</h2>
            <p>{club.membershipDetails}</p>
            <ol className="steps">
              <li>Prenez votre licence en ligne sur le site de la FFVL, en choisissant le club « Les Ayasses ».</li>
              <li>Rejoignez la communauté WhatsApp du club pour suivre les sorties.</li>
              <li>Venez voler avec nous !</li>
            </ol>
          </div>
          <aside className="price-card">
            <span className="price-label">Cotisation club</span>
            <span className="price">{club.membershipPrice}</span>
            <a href={club.licenceUrl} target="_blank" rel="noreferrer" className="btn">Adhérer en ligne (FFVL) ↗</a>
            {club.whatsappUrl && (
              <a href={club.whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">Rejoindre WhatsApp</a>
            )}
            <small>Une question ? <a href={`mailto:${club.email}?subject=Adhésion au club`}>{club.email}</a></small>
          </aside>
        </div>
      </section>

      {/* STRUCTURES */}
      <section id="structures" className="section">
        <div className="container">
          <header className="section-head">
            <p className="eyebrow">Autour de nous</p>
            <h2>Les structures du coin</h2>
            <p>Les clubs et les écoles de parapente du Champsaur et des environs.</p>
          </header>
          <div className="structure-cols">
            {kinds.map((k) => (
              <div key={k}>
                <h3>{k === 'Biplace' ? 'Vols biplaces' : k === 'École' ? 'Écoles' : 'Clubs'}</h3>
                <ul className="structure-list">
                  {structures.filter((s) => s.kind === k).map((s) => (
                    <li key={s.id}>
                      {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.name}</a> : <span>{s.name}</span>}
                      {s.place && <small>{s.place}</small>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section section-alt">
        <div className="container contact">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Une question ?</h2>
            <p>Que vous soyez pilote de passage, futur adhérent ou curieux, écrivez-nous.</p>
          </div>
          <div className="contact-card">
            <p><strong>E-mail</strong><a href={`mailto:${club.email}`}>{club.email}</a></p>
            <p><strong>Où</strong>{club.location}</p>
          </div>
        </div>
      </section>
    </>
  );
}
