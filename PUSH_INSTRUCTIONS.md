# Instructions pour pousser vers GitHub

Le dépôt **GoMark** a été créé et tous les fichiers sont prêts. Cependant, il semble que le token GitHub actuel n'a pas les permissions nécessaires pour pousser directement.

## 📝 Étapes pour pousser manuellement

### Méthode 1: Utiliser GitHub CLI (recommandé)

```bash
# Allez dans le dossier du projet
cd GoMark

# Configurez GitHub CLI pour utiliser votre compte
gh auth login

# Poussez les modifications
git push origin main
```

### Méthode 2: Utiliser Git avec authentification

```bash
# Allez dans le dossier du projet
cd GoMark

# Configurez votre nom d'utilisateur et email Git
git config --global user.name "VotreNom"
git config --global user.email "votre@email.com"

# Poussez avec authentification
# Vous serez invité à entrer vos identifiants GitHub
git push origin main
```

### Méthode 3: Utiliser un token personnel

1. **Créez un token personnel** sur GitHub:
   - Allez sur [https://github.com/settings/tokens](https://github.com/settings/tokens)
   - Cliquez sur "Generate new token (classic)"
   - Donnez-lui un nom (ex: "GoMark Push")
   - Sélectionnez les scopes: **repo** (accès complet aux dépôts)
   - Cliquez sur "Generate token"
   - **Copiez le token** (il ne sera plus affiché)

2. **Utilisez le token pour pousser** :

```bash
cd GoMark

# Configurez l'URL du dépôt avec le token
git remote set-url origin https://VOTRE_NOM_UTILISATEUR:VOTRE_TOKEN@github.com/VOTRE_NOM_UTILISATEUR/GoMark.git

# Poussez
git push origin main
```

### Méthode 4: Utiliser SSH

1. **Générez une clé SSH** (si vous n'en avez pas) :

```bash
ssh-keygen -t ed25519 -C "votre@email.com"
```

2. **Ajoutez la clé à votre compte GitHub** :
   - Copiez la clé publique : `cat ~/.ssh/id_ed25519.pub`
   - Allez sur [https://github.com/settings/keys](https://github.com/settings/keys)
   - Cliquez sur "New SSH key"
   - Collez votre clé et donnez-lui un nom

3. **Changez l'URL du dépôt pour utiliser SSH** :

```bash
cd GoMark
git remote set-url origin git@github.com:VOTRE_NOM_UTILISATEUR/GoMark.git
git push origin main
```

## 📋 Vérification

Après avoir poussé, vérifiez que tout est en place :

```bash
# Vérifiez que le dépôt contient bien les fichiers
gh repo view GregZero/GoMark --web

# Ou visitez directement:
# https://github.com/GregZero/GoMark
```

## 📁 Contenu du dépôt

Le dépôt contient :
- `www/` - Fichiers web de l'application
- `capacitor.config.ts` - Configuration pour Capacitor (Android)
- `package.json` - Dépendances Node.js
- `README.md` - Documentation complète
- `.gitignore` - Fichiers à ignorer

## ❓ Problèmes courants

### Erreur: "Permission denied"
- **Solution** : Vérifiez que vous avez les droits d'écriture sur le dépôt
- Vérifiez que votre token a le scope **repo**

### Erreur: "Authentication failed"
- **Solution** : Reconfigurez votre authentification GitHub
- Utilisez `gh auth login` pour vous reconnecter

### Erreur: "Repository not found"
- **Solution** : Vérifiez que le dépôt existe bien
- Vérifiez le nom du dépôt : `GregZero/GoMark`

## 🎉 Une fois poussé

Une fois les fichiers poussés vers GitHub, vous pourrez :
1. **Cloner le dépôt** sur d'autres appareils
2. **Installer les dépendances** avec `npm install`
3. **Lancer l'application** avec `npm run serve`
4. **Créer l'APK Android** avec les commandes Capacitor

## 💡 Conseils

- **Pour le développement** : Utilisez `npm run serve` pour lancer un serveur local
- **Pour Android** : Utilisez `npx cap add android` puis `npx cap open android`
- **Pour la synchronisation** : Configurez Syncthing pour synchroniser le dossier `data/`

Si vous avez des problèmes, n'hésitez pas à me le faire savoir !
