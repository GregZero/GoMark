# GoMark 🛒

**Gestionnaire de cartes de fidélité et listes de courses avec synchronisation Syncthing**

GoMark est une application multiplateforme (HTML/PWA + APK Android) qui vous permet de gérer vos cartes de fidélité et vos listes de courses, avec synchronisation entre plusieurs appareils via **Syncthing**.

## 🎯 Fonctionnalités

### ✅ Cartes de fidélité (comme Loyalty Card Locker)
- **Scanner de codes-barres** - Supporte tous les formats (CODE_128, EAN_13, QR_CODE, etc.)
- **Affichage des barcodes** - Visualisez vos cartes avec leur code-barres
- **Gestion complète** - Ajout, modification, suppression de cartes
- **Recherche** - Trouvez facilement vos cartes
- **Export/Import** - Sauvegardez et restaurez vos données

### ✅ Listes de courses
- **Création de listes** - Organisez vos achats par liste
- **Ajout de produits** - Avec nom et quantité
- **Cocher/Décocher** - Suivez ce que vous avez déjà acheté
- **Historique** - Mémorise vos achats pour des suggestions intelligentes
- **Suggestions** - Basées sur vos achats fréquents

### ✅ Stockage et synchronisation
- **Stockage dans des fichiers** - Format JSON dans un dossier de votre choix
- **Compatible Syncthing** - Synchronisez automatiquement entre vos appareils
- **Multi-appareils** - Utilisez la même base de données sur PC, smartphone, tablette
- **Mode hors ligne** - Fonctionne sans connexion internet

### ✅ Multiplateforme
- **HTML/PWA** - Fonctionne dans n'importe quel navigateur moderne
- **APK Android** - Application native pour Android via Capacitor
- **100% local** - Aucune donnée n'est envoyée sur internet

## 🚀 Installation

### Pour PC (Windows/macOS/Linux)

#### Méthode 1: Avec un serveur web local (recommandé)

```bash
# Installer Python (si ce n'est pas déjà fait)
# Puis lancer un serveur web local
cd GoMark/www
python -m http.server 8000
```

Ouvrez votre navigateur et allez sur [http://localhost:8000](http://localhost:8000)

#### Méthode 2: Avec Node.js

```bash
npm install -g http-server
cd GoMark/www
http-server -p 8000
```

#### Méthode 3: Directement depuis le fichier (limité)

Ouvrez simplement `www/index.html` dans votre navigateur.

⚠️ **Note**: Pour accéder à la caméra, vous devez utiliser un serveur local (méthodes 1 ou 2) ou installer l'application comme PWA.

### Pour Android (APK)

```bash
# Installer les dépendances
npm install

# Ajouter Android
npx cap add android

# Copier les fichiers
npx cap copy android

# Ouvrir dans Android Studio
npx cap open android
```

Dans Android Studio:
1. Attendez que Gradle synchronise
2. Connectez un appareil Android ou utilisez l'émulateur
3. Cliquez sur **Run** (▶️)

## 📁 Structure du projet

```
GoMark/
├── www/                          # Fichiers web
│   ├── index.html                # Interface principale
│   ├── app.js                    # Logique applicative
│   ├── storage.js                # Gestion du stockage
│   ├── barcode-scanner.js        # Scanner de codes-barres
│   ├── loyalty-cards.js          # Gestion des cartes de fidélité
│   ├── shopping-lists.js         # Gestion des listes de courses
│   ├── manifest.json             # Configuration PWA
│   └── icons/                    # Icônes pour PWA/APK
│
├── capacitor.config.ts           # Configuration Capacitor
├── package.json                 # Dépendances Node.js
├── README.md                    # Documentation
└── LICENSE                      # Licence GPL-3.0
```

## 📂 Dossier de données

Les données sont stockées dans des fichiers JSON dans un dossier de votre choix :

```
Votre-Dossier-Data/
├── loyalty-cards.json           # Cartes de fidélité
├── shopping-lists.json          # Listes de courses
├── history.json                 # Historique des achats
└── photos/                      # Photos des produits (optionnel)
```

### Configuration avec Syncthing

1. **Sur PC** :
   - Installez [Syncthing](https://syncthing.net/)
   - Ajoutez le dossier de données comme dossier partagé
   - Partagez-le avec vos autres appareils

2. **Sur Android** :
   - Installez Syncthing depuis le Play Store
   - Ajoutez le même dossier partagé
   - Pointez vers `/Android/data/com.gregzero.gomark/files/data/` (pour l'APK)

3. **Dans GoMark** :
   - Cliquez sur "Choisir dossier" et sélectionnez votre dossier de données
   - Toutes vos données seront automatiquement synchronisées

## 🎨 Capture d'écran

L'application propose une interface intuitive avec :
- Onglet **Cartes de fidélité** pour gérer vos cartes
- Onglet **Listes de courses** pour vos achats
- Onglet **Historique** pour voir vos achats fréquents
- Onglet **Statistiques** pour un résumé

## 🔧 Développement

### Prérequis
- Node.js 16+
- npm ou yarn
- Git

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/GregZero/GoMark.git
cd GoMark

# Installer les dépendances
npm install
```

### Lancer en mode développement

```bash
# Pour le web
npm run serve

# Pour Android
npx cap add android
npx cap copy android
npx cap open android
```

### Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run serve` | Lancer un serveur web local |
| `npm run capacitor:add:android` | Ajouter la plateforme Android |
| `npm run capacitor:sync` | Synchroniser les fichiers |
| `npm run capacitor:open:android` | Ouvrir dans Android Studio |

## 📄 Formats de codes-barres supportés

- AZTEC
- CODABAR
- CODE_39
- CODE_128
- DATA_MATRIX
- EAN_8
- EAN_13
- ITF
- PDF_417
- QR_CODE
- UPC_A

## 🔒 Vie privée et sécurité

✅ **Aucun cloud** - Toutes vos données restent localement sur vos appareils
✅ **Chiffrement** - Syncthing chiffrera les données en transit (optionnel)
✅ **Contrôle total** - Vous choisissez quel dossier synchroniser
✅ **Pas de tracking** - Aucune donnée n'est envoyée à des serveurs externes

## 📜 Licence

GoMark est distribué sous la licence **GPL-3.0**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue pour signaler un bug ou proposer une fonctionnalité
- Faire une pull request pour contribuer au code

## 🙏 Remerciements

- Inspiré de [Loyalty Card Locker](https://github.com/brarcher/loyalty-card-locker) pour la gestion des cartes de fidélité
- Utilise [ZXing](https://github.com/zxing/zxing) pour le scanning de codes-barres
- Utilise [Capacitor](https://capacitorjs.com/) pour la version Android

---

**GoMark - Votre gestionnaire de cartes et courses, simple et efficace !** 🎉
