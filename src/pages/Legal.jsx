import { useData } from '../store/DataContext.jsx';

export default function Legal() {
  const { club } = useData().data;
  return (
    <section className="section page-top">
      <div className="container narrow prose">
        <h1 className="page-title">Mentions légales</h1>
        <h2>Éditeur du site</h2>
        <p>{club.name}, association loi 1901.<br />{club.location}<br />Contact : <a href={`mailto:${club.email}`}>{club.email}</a></p>
        <h2>Directeur de la publication</h2>
        <p>{club.president}</p>
        <h2>Hébergeur</h2>
        <p>{club.host}</p>
        <h2>Données personnelles</h2>
        <p>
          Ce site ne collecte aucune donnée personnelle à l’insu des visiteurs et n’utilise pas de cookies de suivi.
          Les informations envoyées par e-mail au club servent uniquement à vous répondre. Vous pouvez demander leur
          suppression à tout moment en écrivant à {club.email}.
        </p>
        <p>
          Le contenu du site et les comptes des administrateurs sont hébergés par Supabase. Les administrateurs se
          connectent avec un mot de passe et une double authentification.
        </p>
        <h2>Fonds de carte</h2>
        <p>© les contributeurs OpenStreetMap, OpenTopoMap (CC-BY-SA).</p>
      </div>
    </section>
  );
}
