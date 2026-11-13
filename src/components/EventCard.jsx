import { formatDate } from '../store/DataContext.jsx';

export default function EventCard({ event, past = false }) {
  const d = new Date(event.date + 'T12:00:00');
  return (
    <article className={`event-card ${past ? 'is-past' : ''}`}>
      <div className="event-date" aria-hidden="true">
        <span className="event-day">{d.getDate()}</span>
        <span className="event-month">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
        <span className="event-year">{d.getFullYear()}</span>
      </div>
      <div className="event-body">
        <h3>{event.title}</h3>
        <p className="event-meta">
          <time dateTime={event.date}>{formatDate(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time>
          {event.time && <> · {event.time.replace(':', 'h')}</>}
          {event.place && <> · {event.place}</>}
        </p>
        {event.description && <p>{event.description}</p>}
        {event.price && <span className="tag">{event.price}</span>}
      </div>
    </article>
  );
}
