# Build GoMark - Guide de compilation

Ce guide explique comment compiler GoMark pour différentes plateformes.

## 📱 Build Android (APK)

### Méthode 1: Avec Capacitor (recommandé)

#### Prérequis
- Node.js 18+ 
- npm ou yarn
- Java JDK 17+
- Android Studio (pour le SDK et les outils de build)
- Android SDK 34+ (API level 34)

#### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/GregZero/GoMark.git
cd GoMark

# 2. Installer les dépendances
npm install

# 3. Initialiser Capacitor (si ce n'est pas déjà fait)
npx cap init

# 4. Ajouter la plateforme Android
npm run capacitor:add:android
# ou
npx cap add android

# 5. Synchroniser les fichiers web avec Android
npm run capacitor:sync
# ou
npx cap sync android

# 6. Builder l'APK Debug
npm run android:build
# ou
cd android && ./gradlew assembleDebug

# 7. Récupérer l'APK
# L'APK sera généré dans : android/app/build/outputs/apk/debug/app-debug.apk
```

#### Builder une version Release (signée)

```bash
# 1. Créer un keystore (si vous n'en avez pas)
keytool -genkey -v -keystore my-release-key.keystore \
    -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 2. Placer le keystore dans android/app/
cp my-release-key.keystore android/app/

# 3. Configurer le fichier android/app/build.gradle
# Ajoutez cette section dans android/app/build.gradle :
"""
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'yourpassword'
            keyAlias 'my-key-alias'
            keyPassword 'yourpassword'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
"""

# 4. Builder l'APK Release
cd android && ./gradlew assembleRelease

# L'APK sera dans : android/app/build/outputs/apk/release/app-release.apk
```

### Méthode 2: Avec GitHub Actions (CI/CD automatique)

Le projet est configuré avec un workflow GitHub Actions qui build automatiquement l'APK à chaque push sur la branche `main`.

#### Comment ça marche :
1. Le workflow est déclenché sur chaque push/PR
2. Il installe Node.js, Java, Android SDK
3. Il ajoute la plateforme Android via Capacitor
4. Il build l'APK Debug
5. Il publie l'APK comme artefact

#### Pour récupérer l'APK :
1. Allez dans l'onglet **Actions** de votre dépôt GitHub
2. Sélectionnez le workflow **Build Android APK**
3. Cliquez sur la dernière exécution
4. Dans la section **Artifacts**, téléchargez **GoMark-android-apk**

#### Pour créer une Release automatique :
Le workflow crée automatiquement une release quand vous poussez un tag :
```bash
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

## 🌐 Build Web (PWA)

### Prérequis
- Node.js 18+
- npm ou yarn

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/GregZero/GoMark.git
cd GoMark

# 2. Lancer un serveur web local
npm run serve
# ou
cd www && python -m http.server 8000

# 3. Ouvrir dans le navigateur
# http://localhost:8000
```

### Installer comme PWA
1. Ouvrez l'application dans Chrome
2. Cliquez sur l'icône **⋮** (menu) > **Installer**
3. L'application s'installera comme une PWA (Progressive Web App)

## 📁 Structure du projet

```
GoMark/
├── .github/
│   └── workflows/
│       └── android-build.yml    # Workflow GitHub Actions
│
├── www/                          # Fichiers web
│   ├── index.html               # Interface principale
│   ├── app.js                   # Logique applicative
│   ├── barcode-scanner.js       # Scanner de codes-barres
│   ├── loyalty-cards.js         # Gestion des cartes
│   ├── shopping-lists.js        # Gestion des listes
│   ├── storage.js               # Stockage
│   └── manifest.json            # Configuration PWA
│
├── android/                     # (Généré par Capacitor)
│   └── ...                      # Projet Android
│
├── capacitor.config.ts          # Configuration Capacitor
├── package.json                 # Dépendances Node.js
├── build.gradle.kts             # Configuration Gradle (racine)
├── settings.gradle.kts          # Configuration Gradle (racine)
├── gradle.properties            # Propriétés Gradle
├── README.md                    # Documentation
├── BUILD.md                     # Ce guide
└── .gitignore                   # Fichiers à ignorer
```

## 🔧 Configuration Capacitor

Le fichier `capacitor.config.ts` contient la configuration de base :

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gregzero.gomark',
  appName: 'GoMark',
  webDir: 'www',
  bundledWebRuntime: false,
};

export default config;
```

### Personnalisation

Vous pouvez modifier :
- `appId` : L'identifiant unique de l'application (ex: `com.votrenom.gomark`)
- `appName` : Le nom de l'application
- `webDir` : Le dossier contenant les fichiers web
- `bundledWebRuntime` : Si `true`, inclut le runtime web dans l'APK (augmente la taille)

## 🐛 Résolution des problèmes

### Problème: "Capacitor CLI not found"
**Solution** : Installez Capacitor globalement :
```bash
npm install -g @capacitor/cli @capacitor/core
```

### Problème: "Android SDK not found"
**Solution** : Installez Android Studio et le SDK :
- Téléchargez Android Studio : [https://developer.android.com/studio](https://developer.android.com/studio)
- Lancez Android Studio et installez le SDK via SDK Manager
- Ou installez via la ligne de commande :
  ```bash
  sdkmanager "platforms;android-34" "build-tools;34.0.0"
  ```

### Problème: "Java not found"
**Solution** : Installez Java JDK 17+ :
- Sur Ubuntu/Debian : `sudo apt install openjdk-17-jdk`
- Sur macOS : `brew install openjdk@17`
- Sur Windows : Téléchargez depuis [Adoptium](https://adoptium.net/)

### Problème: "Gradle build failed"
**Solution** : 
- Vérifiez que vous avez assez de mémoire (4 Go minimum recommandé)
- Essayez avec plus de mémoire :
  ```bash
  export GRADLE_OPTS="-Xmx4g"
  ./gradlew assembleDebug
  ```
- Nettoyez le cache Gradle :
  ```bash
  cd android && ./gradlew clean
  ```

### Problème: "Keystore file not found"
**Solution** : Créez un keystore comme expliqué dans la section "Builder une version Release"

## 📊 Comparaison avec PIMSync

| Aspect | PIMSync | GoMark |
|--------|---------|--------|
| **Type** | Application Android native (Kotlin) | Application hybride (HTML/JS + Capacitor) |
| **Build** | Gradle natif | Capacitor + Gradle |
| **Plateformes** | Android uniquement | Web + Android (et potentiellement iOS) |
| **Développement** | Kotlin/Java | JavaScript/TypeScript |
| **UI** | Native Android | Web (HTML/CSS) |
| **Scanner** | Native Android | ZXing (JS) + Capacitor |
| **Stockage** | Fichiers locaux | Fichiers locaux (compatible Syncthing) |

## 🎯 Recommandations

- **Pour le développement rapide** : Utilisez la version web avec `npm run serve`
- **Pour tester sur Android** : Utilisez `npm run capacitor:add:android` puis ouvrez dans Android Studio
- **Pour la CI/CD** : Utilisez GitHub Actions (déjà configuré)
- **Pour la production** : Builder une APK Release signée

## 📚 Ressources utiles

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Gradle Documentation](https://docs.gradle.org/)

---

**Besoin d'aide ?** Ouvrez une issue sur le dépôt GitHub ou contactez-moi !
