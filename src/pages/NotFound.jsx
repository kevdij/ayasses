import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section page-top">
      <div className="container narrow">
        <h1 className="page-title">Page introuvable</h1>
        <p>Cette page s’est envolée. 🪂</p>
        <Link to="/" className="btn">Retour à l’accueil</Link>
      </div>
    </section>
  );
}
