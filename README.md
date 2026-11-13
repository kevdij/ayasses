# Club des Ayasses : site web

Site du Club des Ayasses : React côté visiteurs, plus un petit backend PHP pour l'espace admin.
**Aucune base de données, aucun service externe.**

## 🚀 Mettre le site en ligne

**Copiez le contenu du dossier [`www/`](www) à la racine du site** sur le serveur (FTP, gestionnaire de fichiers…). C'est tout.

Il faut seulement **PHP 7.4 ou plus récent**, ce qui est le cas de tous les hébergements qui font tourner WordPress. Aucune extension particulière n'est nécessaire.

Ensuite, ouvrez **`https://votre-site/admin`** pour la première installation :
1. Cliquez sur **« Générer le code d'installation »**.
2. Ouvrez via FTP le fichier **`data/setup-code.php`** : il contient une ligne `CODE D'INSTALLATION : XXXXXXXXXX`.
3. Recopiez ce code, puis choisissez votre e-mail et votre mot de passe (12 caractères minimum).
4. Scannez le QR code avec une application d'authentification (Google Authenticator, Microsoft Authenticator, 2FAS, Authy…) et saisissez le code à 6 chiffres.

C'est prêt. Les autres admins s'ajoutent depuis **Admin → Comptes admin**.

### Mettre à jour le site plus tard
Recopiez le nouveau dossier `www/` par-dessus l'ancien. **Ne supprimez pas `data/`** : il contient les comptes et tout le contenu modifié depuis l'admin. Le dossier `data/` fourni ne contient que des fichiers de protection, il n'écrase donc rien.

### Si le serveur est en nginx (et pas Apache)
Apache utilise automatiquement le fichier `.htaccess` fourni. Sous nginx, ajoutez ceci dans le bloc `server` (souvent déjà présent si WordPress tournait sur ce serveur) :

```nginx
location ^~ /data/ { deny all; }
location / { try_files $uri $uri/ /index.php?$args; }
```

Même sans la règle `/data/`, les fichiers de données ne fuient pas : ce sont des fichiers `.php` qui s'arrêtent immédiatement quand on les appelle.

### Sauvegarde
- Admin → Sauvegarde → **Exporter (JSON)** pour le contenu.
- Ou copiez le dossier `data/` du serveur, qui contient aussi les comptes.

## 🔐 Sécurité de l'admin

| Protection | Détail |
| --- | --- |
| Double authentification | Code TOTP obligatoire pour chaque admin ; un code ne peut pas servir deux fois |
| Mots de passe | 12 caractères minimum, chiffrés (bcrypt) |
| Anti-force brute | 5 erreurs → blocage de 15 min (par IP et par compte) |
| Sessions | Cookie `HttpOnly` `SameSite=Strict` (`Secure` en HTTPS), déconnexion après 30 min d'inactivité, 8 h au maximum |
| Anti-CSRF | En-tête obligatoire + contrôle de l'origine |
| Installation | Code lisible uniquement via FTP (prouve qu'on gère le serveur) |
| Données | Dossier `data/` interdit au web ; fichiers `.php` qui ne renvoient rien s'ils sont appelés |
| Journal | Connexions, échecs et modifications, visibles dans Admin → Sauvegarde |
| En-têtes | CSP, X-Frame-Options, nosniff ; l'admin n'est pas indexé par les moteurs de recherche |

**Utilisez le site en HTTPS** (certificat Let's Encrypt, gratuit chez la plupart des hébergeurs).

Admin qui a perdu son téléphone : un autre admin clique sur **« Réinitialiser 2FA »** dans Comptes admin. Mot de passe oublié : un autre admin supprime le compte puis le recrée, ce qui donne un nouveau mot de passe provisoire.

## 🥾 Vol rando

Admin → **Vol rando** reprend l'interface du plugin WordPress « Vol Rando » :
- **Importer** un fichier `.xlsx` au format « Décos rando Alpes du sud » (feuilles « Décollages » et « Informations et réserves »). Le catalogue est entièrement remplacé, et le texte d'introduction est repris de la première feuille.
- **Exporter** le catalogue au même format, trié par massif puis par sommet.
- **Modifier** un décollage à la main.

Le fichier est lu directement dans le navigateur (`src/lib/xlsx.js`, portage en JavaScript du lecteur PHP du plugin).

## 🛠️ Modifier le code (développeurs)

Il faut Node.js, plus PHP pour tester l'admin.

```bash
npm install
npm run php     # terminal 1 : API PHP locale (données de test dans .dev-data/)
npm run dev     # terminal 2 : site sur http://localhost:5173
npm run build   # régénère le dossier www/ à copier sur le serveur
```

| Dossier | Contenu |
| --- | --- |
| `src/` | Code React |
| `src/data/` | Contenu par défaut (articles repris de l'ancien site, 104 décollages) |
| `public/api/` | Backend PHP : `auth.php` (connexion, 2FA, comptes), `content.php` (contenu), `_lib.php` |
| `public/` | Fichiers copiés tels quels dans `www/` (images, `.htaccess`, `index.php`) |
| `www/` | **Résultat compilé, à copier sur le serveur** |
