import { Link } from 'react-router-dom';
import { useData } from '../store/DataContext.jsx';

export default function Footer() {
  const { data } = useData();
  const { club } = data;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <strong className="footer-title">{club.name}</strong>
          <p>{club.location}</p>
          <p>
            <a href={`mailto:${club.email}`}>{club.email}</a>
          </p>
        </div>
        <div>
          <strong className="footer-title">Le site</strong>
          <ul>
            <li><Link to="/#agenda">Agenda</Link></li>
            <li><Link to="/actualites">Actualités</Link></li>
            <li><Link to="/#adhesion">Adhésion</Link></li>
            <li><Link to="/mentions-legales">Mentions légales</Link></li>
          </ul>
        </div>
        <div>
          <strong className="footer-title">Partenaires</strong>
          <ul>
            <li><a href="https://federation.ffvl.fr/" target="_blank" rel="noreferrer">FFVL</a></li>
            <li><a href="https://www.alexis-nouailhat.com/" target="_blank" rel="noreferrer">Dessinateur Alexis</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {club.name} · Association loi 1901</span>
        <Link to="/admin" className="muted-link">Espace admin</Link>
      </div>
    </footer>
  );
}
