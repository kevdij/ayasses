# Club des Ayasses : site web

Site React (Vite) du Club des Ayasses, hébergé sur Vercel. Le contenu et les comptes admin sont gérés par Supabase.

- **Pages publiques** : accueil, agenda, actualités (articles repris de l'ancien site), vol rando (104 décollages avec carte et filtres), mentions légales.
- **Admin** (`/admin`) : connexion par e-mail et mot de passe, puis **double authentification obligatoire** (application TOTP). Seuls les comptes déclarés administrateurs peuvent modifier le contenu.

## Développer en local

```bash
npm install
npm run dev
```

Sans variables Supabase, le site tourne en **mode local** : l'admin s'ouvre sans connexion, mais **uniquement en développement**. En production, l'admin reste fermé tant que Supabase n'est pas configuré.

Pour tester avec la vraie base, copiez `.env.example` en `.env.local` et remplissez-le.

## Mise en place de la sécurité (à faire une fois)

### 1. Créer le projet Supabase
1. Créez un compte sur https://supabase.com, puis un projet. Choisissez la région **Europe (Paris ou Francfort)**.
2. Ouvrez **SQL Editor → New query**, collez le contenu de [`supabase/schema.sql`](supabase/schema.sql) et cliquez sur **Run**.

### 2. Régler l'authentification (Authentication → …)
- **Sign In / Providers → Email** : désactivez **« Allow new users to sign up »**. Personne ne peut alors créer de compte lui-même.
- **Multi-Factor** : vérifiez que **TOTP** est activé (c'est le cas par défaut).
- **URL Configuration** :
  - Site URL : `https://ayasses.vercel.app` (ou votre domaine)
  - Redirect URLs : ajoutez `https://ayasses.vercel.app/admin`
- **Policies / Passwords** (selon l'interface) : longueur minimale de 12 caractères.

### 3. Brancher Vercel
Dans Vercel → **Settings → Environment Variables**, ajoutez les deux valeurs trouvées dans Supabase → **Project Settings → API** :

| Nom | Valeur |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | clé `anon` `public` |

Puis **Redeploy**. La clé `anon` est faite pour être publique : ce sont les règles de la base qui protègent les données. **N'utilisez jamais la clé `service_role` dans le site.**

Vous pouvez supprimer l'ancienne variable `VITE_ADMIN_PASSWORD`, qui ne sert plus.

### 4. Ajouter un administrateur
1. Supabase → **Authentication → Users → Invite user** : saisissez son e-mail.
2. Dans **SQL Editor**, exécutez :
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'prenom@exemple.fr';
   ```
3. La personne clique sur le lien reçu par e-mail, choisit son mot de passe, puis scanne le QR code avec une application d'authentification (Google Authenticator, Microsoft Authenticator, 2FAS, Authy…).

Pour retirer un admin : `delete from public.admins where email = '…';`, puis supprimez le compte dans Authentication → Users.

## Ce que garantit la sécurité

- **Écriture réservée** : la base refuse toute modification qui ne vient pas d'un compte listé dans `admins` **et** connecté avec la 2FA (niveau `aal2`). Ce contrôle a lieu côté serveur : il ne dépend pas du code du navigateur.
- **Pas d'inscription libre** : les comptes sont créés uniquement sur invitation.
- **Journal** : chaque modification est enregistrée (date, auteur, bloc modifié). Les 20 dernières sont visibles dans Admin → Sauvegarde.
- **Déconnexion automatique** après 30 minutes d'inactivité.
- **En-têtes de sécurité** : CSP, HSTS, anti-iframe… (voir `vercel.json`). La page admin n'est pas indexée par les moteurs de recherche.

## Contenu importé de l'ancien site
- `src/data/news.json` : les 16 articles de la catégorie « Non classé », avec l'orthographe corrigée. Les listes nominatives de l'AG, une adresse personnelle et un e-mail personnel ont été retirés.
- `src/data/volRando.json` : les 104 décollages de la page Vol Rando.
- `public/images/` : photo du déco, logo, affiches. Les métadonnées GPS des photos ont été supprimées.

Ces fichiers servent de contenu par défaut. Dès qu'un admin enregistre une modification, la version stockée dans Supabase prend le relais.
