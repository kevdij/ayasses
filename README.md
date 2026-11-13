# Club des Ayasses : maquette du site

Maquette React (Vite) du nouveau site de [lesayasses.fr](https://www.lesayasses.fr/).

## Lancer

```bash
npm install
npm run dev
```

- Site public : http://localhost:5173/
- Admin : http://localhost:5173/admin

### Mot de passe admin

Il est défini par la variable d'environnement `VITE_ADMIN_PASSWORD` :

- **En local** : créez un fichier `.env.local` (il n'est pas envoyé sur GitHub) contenant `VITE_ADMIN_PASSWORD=votre-mot-de-passe`. Sans ce fichier, le mot de passe de développement est `ayasses`.
- **Sur Vercel** : Settings → Environment Variables, ajoutez `VITE_ADMIN_PASSWORD`, puis relancez un déploiement. Sans cette variable, l'admin en ligne est inaccessible.

## Ce qu'il y a dedans

- **Accueil** : présentation, activités, agenda (événements à venir et passés), dernières actus, adhésion, structures du coin, contact.
- **Actualités** : liste filtrable par catégorie et pages d'article.
- **Mentions légales**.
- **Admin** : tableau de bord avec une liste « à faire », et l'édition de l'agenda, des actus, des infos du club, des activités et des structures. On peut aussi exporter et importer une sauvegarde JSON.

## Limites de la maquette

- Les données sont dans `src/data/defaultData.js`. Les modifications faites dans l'admin restent **dans le navigateur** (localStorage).
- Le mot de passe admin est écrit dans le code : **ce n'est pas une vraie sécurité**.
  Pour la production, il faut un backend (par exemple WordPress en mode headless, Supabase, Decap CMS ou un petit serveur Node) avec une vraie authentification.
- Les champs « À compléter » (cotisation, président·e, hébergeur, lien WhatsApp, liens des structures) sont à remplir.
