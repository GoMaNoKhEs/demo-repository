# 🔐 Configuration GCP & Firebase - Guide Complet SimplifIA

## ⚠️ IMPORTANT : Lien entre Code et Projet GCP

**Non, l'installation des outils ne suffit PAS !** Vous devez :
1. Créer un projet Firebase/GCP
2. Obtenir les credentials
3. Les configurer dans votre code
4. Initialiser Firebase CLI avec votre projet

---

## 📋 Étape par Étape : Configuration Complète

### 🔥 PHASE 1 : Création du Projet Firebase (Console Web)

#### 1.1 Créer un Projet Firebase

1. **Aller sur** : https://console.firebase.google.com/
2. **Cliquer** : "Ajouter un projet" (Add project)
3. **Nom du projet** : `simplifia-hackathon` (ou autre)
4. **Google Analytics** : Activer (recommandé)
5. **Compte Analytics** : Sélectionner ou créer
6. **Créer le projet** ✅

#### 1.2 Configurer l'Application Web

1. Dans votre projet Firebase, cliquer sur l'icône **Web** `</>`
2. **Nom de l'app** : `SimplifIA Frontend`
3. **Cocher** : "Also set up Firebase Hosting"
4. **Enregistrer l'app**

#### 1.3 Récupérer les Configuration Keys 🔑

Vous verrez un code comme celui-ci :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "simplifia-hackathon.firebaseapp.com",
  projectId: "simplifia-hackathon",
  storageBucket: "simplifia-hackathon.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

**⚠️ COPIER CES VALEURS IMMÉDIATEMENT !** Vous en aurez besoin à l'étape suivante.

---

### 📝 PHASE 2 : Configuration dans le Code

#### 2.1 Créer le fichier `.env.local`

**Dans** : `/Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend/`

```bash
# Dans le terminal, depuis le dossier frontend
touch .env.local
```

#### 2.2 Remplir `.env.local` avec VOS credentials

**Fichier** : `frontend/.env.local`

```env
# 🔥 Firebase Configuration
# REMPLACER avec les valeurs de VOTRE projet Firebase

VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=simplifia-hackathon.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=simplifia-hackathon
VITE_FIREBASE_STORAGE_BUCKET=simplifia-hackathon.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# 🌍 Environment
VITE_ENV=development
```

#### 2.3 Ajouter `.env.local` au `.gitignore`

**CRUCIAL pour la sécurité !**

**Fichier** : `frontend/.gitignore`

```gitignore
# dependencies
/node_modules

# production
/dist

# 🔐 SECRETS - NE JAMAIS COMMIT !
.env.local
.env.development.local
.env.test.local
.env.production.local

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# misc
.DS_Store
```

---

### 🛠️ PHASE 3 : Activation des Services Firebase

#### 3.1 Activer Authentication

1. **Console Firebase** → Votre projet → **Authentication**
2. Cliquer : "Get started"
3. **Sign-in method** → Activer **Google**
4. Configurer :
   - Email de support : votre email
   - Autoriser le domaine : `localhost` (déjà autorisé)

#### 3.2 Activer Firestore Database

1. **Console Firebase** → **Firestore Database**
2. Cliquer : "Create database"
3. **Mode** : Choisir **"Start in test mode"** (pour le développement)
4. **Location** : Choisir **`europe-west9 (Paris)`** ✅ (Souveraineté des données !)
5. Créer

**⚠️ Règles de sécurité (test mode)** :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 11, 1);
    }
  }
}
```
*Note : À sécuriser avant la production !*

#### 3.3 Activer Firebase Hosting

1. **Console Firebase** → **Hosting**
2. Cliquer : "Get started"
3. Suivre les instructions (on fera l'init CLI après)

#### 3.4 Activer Google Analytics (optionnel mais recommandé)

Déjà activé si vous avez coché lors de la création du projet ✅

---

### 🔧 PHASE 4 : Configuration Firebase CLI

#### 4.1 Installer Firebase CLI (si pas déjà fait)

```bash
npm install -g firebase-tools
```

#### 4.2 Se connecter à Firebase

```bash
firebase login
```
- Une fenêtre de navigateur s'ouvrira
- Connectez-vous avec votre compte Google
- Autorisez Firebase CLI

#### 4.3 Initialiser Firebase dans le projet

**Depuis le dossier** : `/frontend/`

```bash
cd /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend

firebase init
```

**Configuration interactive** :

```
? Which Firebase features do you want to set up for this directory?
❯◉ Firestore: Configure security rules and indexes files for Firestore
 ◉ Hosting: Configure files for Firebase Hosting
 ◯ Functions: Configure Cloud Functions
 ◯ Storage: Configure security rules for Cloud Storage

? Please select an option:
❯ Use an existing project

? Select a default Firebase project for this directory:
❯ simplifia-hackathon (SimplifIA Hackathon)

? What file should be used for Firestore Rules?
❯ firestore.rules

? What file should be used for Firestore indexes?
❯ firestore.indexes.json

? What do you want to use as your public directory?
❯ dist

? Configure as a single-page app (rewrite all urls to /index.html)?
❯ Yes

? Set up automatic builds and deploys with GitHub?
❯ No (on fera manuellement)
```

#### 4.4 Vérifier les fichiers créés

Après `firebase init`, vous devriez avoir :

```
frontend/
├── .firebaserc         # Config du projet
├── firebase.json       # Config hosting
├── firestore.rules     # Règles Firestore
├── firestore.indexes.json
└── .env.local          # Vos credentials
```

---

### 🎯 PHASE 5 : Configuration GCP (pour Vertex AI et Cloud Functions)

**Important** : Firebase est construit sur GCP, mais pour Vertex AI et Cloud Functions, vous aurez besoin de configuration GCP supplémentaire.

#### 5.1 Activer l'API Vertex AI

1. **Console GCP** : https://console.cloud.google.com/
2. Sélectionner votre projet : `simplifia-hackathon`
3. **Navigation** → **APIs & Services** → **Library**
4. Chercher : "Vertex AI API"
5. Cliquer : **Enable**

#### 5.2 Activer Cloud Functions API

1. Dans la même bibliothèque d'APIs
2. Chercher : "Cloud Functions API"
3. Cliquer : **Enable**

#### 5.3 Activer Secret Manager API

1. Chercher : "Secret Manager API"
2. Cliquer : **Enable**

#### 5.4 Configurer la facturation

**⚠️ REQUIS** : GCP nécessite un compte de facturation même pour le tier gratuit

1. **Navigation** → **Billing**
2. **Link a billing account** (si pas déjà fait)
3. Suivre les instructions (CB requise mais pas de débit immédiat)

**💡 Tier gratuit Firebase/GCP inclut** :
- Firestore : 50K lectures/jour
- Hosting : 10 GB/mois
- Cloud Functions : 2M invocations/mois
- Vertex AI : Quelques appels gratuits

---

### 🔐 PHASE 6 : Service Account (Pour Backend & Cloud Functions)

**Important pour que le backend puisse accéder à Firebase/GCP**

#### 6.1 Créer un Service Account

1. **Console GCP** → **IAM & Admin** → **Service Accounts**
2. Cliquer : **Create Service Account**
3. **Nom** : `simplifia-backend-service`
4. **Description** : "Service account pour le backend SimplifIA"
5. Cliquer : **Create and Continue**

#### 6.2 Assigner les rôles

Ajouter ces rôles :
- ✅ **Cloud Datastore User** (pour Firestore)
- ✅ **Secret Manager Secret Accessor** (pour les secrets)
- ✅ **Vertex AI User** (pour l'agent IA)
- ✅ **Cloud Functions Invoker** (pour les fonctions)

#### 6.3 Créer une clé JSON

1. Cliquer sur le service account créé
2. Onglet **Keys**
3. **Add Key** → **Create new key**
4. Type : **JSON**
5. Télécharger le fichier JSON

**⚠️ IMPORTANT** :
```bash
# Mettre la clé dans un dossier sécurisé
mv ~/Downloads/simplifia-hackathon-xxxxx.json \
   /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/backend/credentials/

# NE JAMAIS COMMIT CE FICHIER !
```

#### 6.4 Ajouter au `.gitignore` (backend)

**Fichier** : `backend/.gitignore`

```gitignore
# 🔐 Credentials - NE JAMAIS COMMIT !
credentials/
*.json
.env
.env.local
```

---

### 📦 PHASE 7 : Vérification de l'Installation

#### 7.1 Tester Firebase dans le code

**Fichier de test** : `frontend/src/config/firebase.test.ts`

```typescript
import { app, db, auth } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

// Test de connexion
console.log('🔥 Firebase App:', app.name);
console.log('📊 Firestore:', db.type);
console.log('🔐 Auth:', auth.app.name);

// Test Firestore (optionnel)
async function testFirestore() {
  try {
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('✅ Firestore connecté ! Documents:', snapshot.size);
  } catch (error) {
    console.error('❌ Erreur Firestore:', error);
  }
}

testFirestore();
```

#### 7.2 Lancer le dev server

```bash
cd frontend
npm run dev
```

**Ouvrir la console du navigateur** (F12) :
- Pas d'erreurs Firebase ? ✅
- Vous voyez les logs de connexion ? ✅

#### 7.3 Tester le déploiement Firebase Hosting

```bash
# Build de production
npm run build

# Déploiement
firebase deploy --only hosting
```

**Résultat attendu** :
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/simplifia-hackathon
Hosting URL: https://simplifia-hackathon.web.app
```

---

## 🚨 Checklist Finale Avant de Coder

### Frontend
- [ ] Projet Firebase créé
- [ ] `.env.local` créé avec les bonnes credentials
- [ ] `.env.local` dans `.gitignore`
- [ ] Firebase CLI installé et connecté
- [ ] `firebase init` exécuté
- [ ] Authentication activée (Google)
- [ ] Firestore créé (mode test, région Paris)
- [ ] Hosting activé
- [ ] `npm run dev` fonctionne sans erreur

### Backend (pour plus tard)
- [ ] APIs GCP activées (Vertex AI, Functions, Secret Manager)
- [ ] Compte de facturation lié
- [ ] Service Account créé
- [ ] Clé JSON téléchargée et sécurisée
- [ ] Credentials dans `.gitignore`

---

## 💡 Variables d'Environnement par Environnement

### Développement Local (`.env.local`)
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=simplifia-hackathon.firebaseapp.com
# ... autres configs
VITE_ENV=development
VITE_API_URL=http://localhost:8080
```

### Production (Firebase Hosting)
Les variables seront injectées via :
```bash
firebase functions:config:set api.url="https://europe-west9-simplifia-hackathon.cloudfunctions.net"
```

---

## 🆘 Problèmes Courants & Solutions

### ❌ "Firebase: Error (auth/invalid-api-key)"
**Cause** : API Key incorrecte dans `.env.local`
**Solution** : Vérifier et re-copier depuis la console Firebase

### ❌ "Firebase: Error (auth/unauthorized-domain)"
**Cause** : Domaine non autorisé
**Solution** : Console Firebase → Authentication → Settings → Authorized domains → Ajouter `localhost`

### ❌ "Missing or insufficient permissions"
**Cause** : Règles Firestore trop restrictives
**Solution** : Mettre en mode test (voir Phase 3.2)

### ❌ "firebase: command not found"
**Cause** : Firebase CLI pas installé globalement
**Solution** : 
```bash
npm install -g firebase-tools
# Puis relancer le terminal
```

### ❌ "Billing account required"
**Cause** : Certaines APIs GCP nécessitent facturation
**Solution** : Lier un compte de facturation (CB requise, pas de débit immédiat)

---

## 📚 Ressources Officielles

- [Firebase Console](https://console.firebase.google.com/)
- [GCP Console](https://console.cloud.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## 🔒 Sécurité : Checklist

- [ ] ✅ `.env.local` dans `.gitignore`
- [ ] ✅ Service Account JSON dans `.gitignore`
- [ ] ✅ Règles Firestore en mode test (dev uniquement)
- [ ] ❌ NE JAMAIS commit les credentials sur Git
- [ ] ❌ NE JAMAIS partager les clés API publiquement
- [ ] ✅ Utiliser les variables d'environnement
- [ ] ✅ Région Europe (Paris) pour RGPD

---

## 🎯 Résumé : Ce qui est REQUIS pour que ça marche

### Pour le Frontend fonctionnel :
1. ✅ Créer projet Firebase
2. ✅ Copier credentials dans `.env.local`
3. ✅ Activer Authentication + Firestore
4. ✅ `firebase init` dans le dossier frontend

### Pour le Backend/IA (plus tard) :
1. ✅ Activer APIs GCP (Vertex AI, Functions, Secret Manager)
2. ✅ Créer Service Account
3. ✅ Télécharger clé JSON
4. ✅ Configurer dans le code backend

---

**Sans ces étapes, le code ne pourra PAS se connecter à GCP/Firebase ! 🚨**

**Questions ? Besoin d'aide pour une étape spécifique ? Demandez ! 💬**
