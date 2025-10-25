# 🎯 Configuration Firebase/GCP - Guide Détaillé Visuel SimplifIA

**Pour projet GCP déjà existant avec configurations**

---

## � IMPORTANT : Quel Firebase Utiliser ?

### ✅ Firebase Classic (console.firebase.google.com)

**SimplifIA utilise React + Vite** → Vous avez besoin de **Firebase Classic**, PAS Firebase App Hosting.

| Type Firebase | URL | Pour SimplifIA |
|---------------|-----|----------------|
| **Firebase Classic** ✅ | https://console.firebase.google.com/ | **OUI** - Authentication + Firestore + Hosting |
| Firebase App Hosting ❌ | firebase.google.com/products/app-hosting | **NON** - Next.js/Angular avec SSR uniquement |

**Services Firebase Classic que vous utiliserez** :
- ✅ **Authentication** (Google Sign-In)
- ✅ **Firestore Database** (base de données temps réel)
- ✅ **Hosting** (hébergement de votre app React)
- ⏭️ Cloud Functions (plus tard, pour le backend)

---

## �📋 Table des Matières

1. [Vérifier votre projet GCP existant](#1-vérifier-votre-projet-gcp-existant)
2. [Ajouter Firebase à votre projet GCP](#2-ajouter-firebase-à-votre-projet-gcp)
3. [Configurer l'application Web Firebase](#3-configurer-lapplication-web-firebase)
4. [Récupérer et configurer les credentials](#4-récupérer-et-configurer-les-credentials)
5. [Activer les services nécessaires](#5-activer-les-services-nécessaires)
6. [Configuration locale](#6-configuration-locale)
7. [Tests et vérification](#7-tests-et-vérification)

---

## 1. Vérifier votre Projet GCP Existant

### 📍 Étape 1.1 : Identifier votre projet

1. **Allez sur** : https://console.cloud.google.com/
2. **En haut à gauche**, cliquez sur le sélecteur de projet (à côté de "Google Cloud")
3. **Notez** :
   - Le **nom** de votre projet (ex: "SimplifIA Project")
   - L'**ID du projet** (ex: "simplifia-project-123456")
   - Le **numéro du projet** (ex: "123456789012")

```
┌─────────────────────────────────────┐
│ Google Cloud                        │
│ ▼ simplifia-project-123456         │ ← ID du projet (important!)
│                                     │
│ Nom: SimplifIA Project              │
│ ID: simplifia-project-123456        │
│ Numéro: 123456789012                │
└─────────────────────────────────────┘
```

**✍️ NOTEZ CES INFOS** :
```
Nom du projet: _______________________
ID du projet: ________________________
Numéro: ______________________________
```

### 📍 Étape 1.2 : Vérifier la facturation

1. Dans la console GCP, menu hamburger (☰)
2. **Facturation** (Billing)
3. Vérifiez qu'un compte de facturation est lié

```
Si "Aucun compte de facturation" :
   → Cliquez "Lier un compte de facturation"
   → Suivez les étapes (CB requise, pas de débit pour tier gratuit)
```

**✅ Facturation active** = Vous pouvez continuer

---

## 2. Ajouter Firebase à votre Projet GCP

### 📍 Étape 2.1 : Accéder à Firebase Console

**Option A : Depuis GCP Console**
1. Dans la console GCP, menu hamburger (☰)
2. Cherchez "Firebase" dans la barre de recherche
3. Cliquez sur "Firebase Console"

**Option B : Directement**
1. **Allez sur** : https://console.firebase.google.com/
2. Vous verrez la liste de vos projets

### 📍 Étape 2.2 : Ajouter Firebase à votre projet GCP existant

**Si Firebase n'est PAS encore ajouté** :

1. Sur https://console.firebase.google.com/
2. Cliquez **"Ajouter un projet"** (Add project)
3. **IMPORTANT** : Sélectionnez **"Sélectionner un projet Google Cloud existant"**

```
┌──────────────────────────────────────────┐
│ Créer un projet                           │
│                                           │
│ ○ Créer un nouveau projet                │
│ ● Sélectionner un projet GCP existant    │ ← Choisissez cette option !
│                                           │
│ Sélectionnez votre projet:                │
│ ▼ simplifia-project-123456               │
│                                           │
│ [Continuer]                               │
└──────────────────────────────────────────┘
```

4. **Sélectionnez votre projet GCP** dans la liste déroulante
5. Cliquez **"Continuer"**
6. **Confirmez le plan Firebase** : Spark (gratuit) suffit pour commencer
7. **Google Analytics** :
   - ✅ Recommandé : Activer
   - Créez ou sélectionnez un compte Analytics
8. Cliquez **"Ajouter Firebase"**

⏱️ **Temps d'attente** : 30 secondes à 2 minutes

**✅ Résultat** : Vous êtes redirigé vers le dashboard Firebase de votre projet

---

## 3. Configurer l'Application Web Firebase

### 📍 Étape 3.1 : Ajouter une application Web

Vous êtes maintenant dans la console Firebase de votre projet.

1. Sur la page d'accueil (Overview), vous voyez :

```
┌──────────────────────────────────────────┐
│ Commencez en ajoutant Firebase à votre   │
│ application                               │
│                                           │
│  [iOS]  [Android]  [Web]  [Unity]       │
│          ↑ Cliquez ici                   │
└──────────────────────────────────────────┘
```

2. **Cliquez sur l'icône Web** `</>`
3. **Configuration** :

```
┌──────────────────────────────────────────┐
│ Enregistrer l'application                 │
│                                           │
│ Pseudo de l'application *                │
│ ┌────────────────────────────────────┐  │
│ │ SimplifIA Frontend                  │  │ ← Nom de votre choix
│ └────────────────────────────────────┘  │
│                                           │
│ ☑ Configurer aussi Firebase Hosting     │ ← COCHEZ cette case
│   pour cette application                 │
│                                           │
│ [Enregistrer l'application]              │
└──────────────────────────────────────────┘
```

4. Cliquez **"Enregistrer l'application"**

### 📍 Étape 3.2 : RÉCUPÉRER LES CREDENTIALS (CRUCIAL !)

**ATTENTION** : Cette étape est la plus importante ! 

Après l'enregistrement, vous verrez un écran avec le **SDK Firebase** :

```javascript
// Votre configuration Firebase unique
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "simplifia-project-123456.firebaseapp.com",
  projectId: "simplifia-project-123456",
  storageBucket: "simplifia-project-123456.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789",
  measurementId: "G-XXXXXXXXXX"
};
```

**🚨 ACTION IMMÉDIATE** :

1. **COPIEZ TOUT CE BLOC** dans un fichier texte temporaire
2. **NE FERMEZ PAS cette page** avant d'avoir copié !
3. Si vous fermez par accident :
   - Allez dans **Paramètres du projet** (⚙️ en haut à gauche)
   - Onglet **Général**
   - Scrollez vers **"Vos applications"**
   - Vous retrouverez le code

---

## 4. Récupérer et Configurer les Credentials

### 📍 Étape 4.1 : Si vous avez déjà fermé la page

1. Dans Firebase Console, cliquez sur **⚙️ (Paramètres)** en haut à gauche
2. **Paramètres du projet**
3. Onglet **Général**
4. Scrollez jusqu'à **"Vos applications"**
5. Vous verrez votre app **SimplifIA Frontend**
6. Cliquez sur **"Config"** ou scrollez pour voir `firebaseConfig`

### 📍 Étape 4.2 : Remplir le fichier .env.local

**Sur votre ordinateur** :

1. Ouvrez un terminal
2. Allez dans le dossier frontend :
```bash
cd /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend
```

3. Ouvrez le fichier `.env.local` (il existe déjà) :
```bash
code .env.local
# ou
open -a "Visual Studio Code" .env.local
# ou
nano .env.local
```

4. **Remplacez les valeurs** avec VOS vraies credentials :

**AVANT** (template) :
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
```

**APRÈS** (vos vraies valeurs) :
```env
VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=simplifia-project-123456.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=simplifia-project-123456
VITE_FIREBASE_STORAGE_BUCKET=simplifia-project-123456.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ENV=development
```

5. **Sauvegardez** le fichier (Ctrl+S ou Cmd+S)

### 📍 Étape 4.3 : Vérifier que .env.local est ignoré par Git

```bash
# Vérifier que .env.local n'apparaît pas
git status

# Si .env.local apparaît dans les fichiers modifiés, c'est MAUVAIS !
# Ajoutez-le au .gitignore
echo ".env.local" >> .gitignore
```

---

## 5. Activer les Services Nécessaires

### 📍 Étape 5.1 : Activer Authentication (Google Sign-In)

1. Dans **Firebase Console**, menu de gauche
2. Cliquez sur **Authentication**
3. Cliquez **"Get started"** (si première fois)

```
┌──────────────────────────────────────────┐
│ Authentication                            │
│                                           │
│ Onglet: Sign-in method                   │
│                                           │
│ Fournisseurs natifs:                     │
│ ┌──────────────────────────────────────┐│
│ │ Email/Password         [Désactivé]   ││
│ │ Phone                  [Désactivé]   ││
│ │ Google             [Activer] ←       ││ Cliquez ici
│ │ Facebook               [Désactivé]   ││
│ └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

4. Cliquez sur **"Google"**
5. **Activer** le bouton en haut
6. **Email de support du projet** : Entrez votre email
7. **Enregistrer**

**✅ Google Sign-In activé** !

### 📍 Étape 5.2 : Activer Firestore Database

1. Menu de gauche → **Firestore Database**
2. Cliquez **"Créer une base de données"**

```
┌──────────────────────────────────────────┐
│ Créer une base de données                │
│                                           │
│ Emplacement:                              │
│ ▼ europe-west9 (Paris)    ← IMPORTANT ! │ Choisissez Paris pour RGPD
│                                           │
│ Mode:                                     │
│ ○ Mode production                         │
│ ● Mode test              ← Pour dev      │ Commencez par test mode
│                                           │
│ [Créer]                                   │
└──────────────────────────────────────────┘
```

3. **Emplacement** : `europe-west9 (Paris)` ✅ (RGPD compliant)
4. **Mode** : "Démarrer en mode test" (pour le développement)
5. Cliquez **"Créer"**

⏱️ **Temps d'attente** : 1-2 minutes

**✅ Firestore créé** !

### 📍 Étape 5.3 : Activer Firebase Hosting

1. Menu de gauche → **Hosting**
2. Cliquez **"Premiers pas"**
3. Ne suivez pas les instructions pour l'instant, on le fera en local

**✅ Hosting activé** !

### 📍 Étape 5.4 : Vérifier Google Analytics

Si vous avez activé Analytics lors de la création :

1. Menu de gauche → **Analytics**
2. Vous devriez voir le dashboard (même vide)

**✅ Analytics OK** !

---

## 6. Configuration Locale

### 📍 Étape 6.1 : Installer Firebase CLI

Si pas déjà fait :

```bash
# Installation globale
npm install -g firebase-tools

# Vérifier l'installation
firebase --version
```

**Résultat attendu** : `13.x.x` ou supérieur

### 📍 Étape 6.2 : Se connecter à Firebase

```bash
firebase login
```

**Ce qui se passe** :
1. Une fenêtre de navigateur s'ouvre
2. Sélectionnez votre compte Google
3. Acceptez les permissions
4. Le terminal affiche : `✔  Success! Logged in as votre-email@gmail.com`

**⚠️ Si la fenêtre ne s'ouvre pas** :
```bash
firebase login --no-localhost
```
Suivez le lien affiché dans le terminal.

### 📍 Étape 6.3 : Initialiser Firebase dans le projet

```bash
# Allez dans le dossier frontend
cd /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend

# Initialiser Firebase
firebase init
```

**Configuration interactive détaillée** :

#### Question 1 : Sélection des features
```
? Which Firebase features do you want to set up for this directory?

◯ Realtime Database
◉ Firestore                    ← Cochez avec ESPACE
◯ Functions
◉ Hosting                      ← Cochez avec ESPACE
◯ Storage
◯ Emulators

Appuyez sur ESPACE pour sélectionner/désélectionner
Appuyez sur ENTRÉE pour valider
```

#### Question 2 : Projet à utiliser
```
? Please select an option:

❯ Use an existing project       ← Sélectionnez avec ENTRÉE
  Create a new project
  Add Firebase to an existing GCP project
  Don't set up a default project
```

#### Question 3 : Sélection du projet
```
? Select a default Firebase project for this directory:

❯ simplifia-project-123456 (SimplifIA Project)  ← Votre projet
  autre-projet-456789 (Autre Project)

Utilisez les flèches ↑↓ pour naviguer
Appuyez sur ENTRÉE pour valider
```

#### Question 4 : Firestore Rules
```
? What file should be used for Firestore Rules?

❯ firestore.rules               ← Laissez par défaut, ENTRÉE
```

#### Question 5 : Firestore Indexes
```
? What file should be used for Firestore indexes?

❯ firestore.indexes.json        ← Laissez par défaut, ENTRÉE
```

#### Question 6 : Public Directory
```
? What do you want to use as your public directory?

❯ dist                          ← IMPORTANT : dist (pas public!)

Tapez "dist" et appuyez sur ENTRÉE
```

#### Question 7 : Single-page app
```
? Configure as a single-page app (rewrite all urls to /index.html)?

❯ Yes                           ← Sélectionnez Yes, ENTRÉE
```

#### Question 8 : GitHub auto-deploys
```
? Set up automatic builds and deploys with GitHub?

❯ No                            ← Non pour l'instant, ENTRÉE
```

**✅ Résultat** :
```
✔  Firebase initialization complete!
```

**Fichiers créés** :
```
frontend/
├── .firebaserc          ← Référence du projet
├── firebase.json        ← Config Hosting
├── firestore.rules      ← Règles Firestore
└── firestore.indexes.json
```

### 📍 Étape 6.4 : Vérifier la configuration

```bash
# Vérifier que le projet est bien lié
firebase projects:list

# Résultat attendu :
┌────────────────────────────────────────────┐
│ Project Display Name │ Project ID          │
├──────────────────────┼─────────────────────┤
│ SimplifIA Project    │ simplifia-project-  │ ← Votre projet avec (current) à côté
│                      │ 123456 (current)    │
└────────────────────────────────────────────┘
```

---

## 7. Tests et Vérification

### 📍 Étape 7.1 : Tester en local

```bash
# Dans le dossier frontend
npm run dev
```

**Ouvrez** : http://localhost:5173

**Ouvrez la console du navigateur** (F12) :

**✅ Pas d'erreur Firebase** = Configuration OK !

**❌ Si erreur** `Firebase: Error (auth/invalid-api-key)` :
- Vérifiez que `.env.local` a les bonnes valeurs
- Redémarrez le dev server

### 📍 Étape 7.2 : Tester la connexion Google

1. Allez sur http://localhost:5173/login
2. Cliquez sur **"Se connecter avec Google"**
3. Sélectionnez votre compte Google

**✅ Si redirection vers /dashboard** = Auth fonctionne !

**❌ Si erreur** `unauthorized-domain` :
1. Firebase Console → Authentication → Settings
2. Onglet **"Authorized domains"**
3. Ajoutez `localhost` si pas déjà présent

### 📍 Étape 7.3 : Tester Firestore

Ouvrez la console du navigateur (F12), puis :

```javascript
// Dans la console
import { collection, addDoc } from 'firebase/firestore';
import { db } from './config/firebase';

// Test d'écriture
await addDoc(collection(db, 'test'), {
  message: 'Hello SimplifIA!',
  timestamp: new Date()
});
```

**Vérifiez dans Firebase Console** :
1. Firestore Database
2. Collection `test`
3. Vous devriez voir votre document !

**✅ Firestore fonctionne** !

### 📍 Étape 7.4 : Script de vérification automatique

```bash
# Dans le dossier frontend
./check-setup.sh
```

**Résultat attendu** :
```
✅ Dossier frontend détecté
✅ node_modules présent
✅ .env.local configuré
✅ Tous les fichiers sources présents (18/18)
✅ Structure de dossiers complète
✅ Dépendances critiques présentes

🎉 Tout est OK ! Vous êtes prêt à coder !
```

---

## 🚨 Problèmes Courants & Solutions Détaillées

### ❌ Erreur : "Firebase: Error (auth/invalid-api-key)"

**Cause** : API Key incorrecte ou manquante dans `.env.local`

**Solution** :
1. Ouvrez `.env.local`
2. Vérifiez que `VITE_FIREBASE_API_KEY` a une valeur qui commence par `AIza`
3. Vérifiez qu'il n'y a pas d'espace avant ou après
4. Redémarrez le dev server : `npm run dev`

### ❌ Erreur : "Firebase: Error (auth/unauthorized-domain)"

**Cause** : Le domaine `localhost` n'est pas autorisé

**Solution** :
1. Firebase Console → Authentication
2. Onglet **Settings** (en haut)
3. Section **Authorized domains**
4. Ajoutez `localhost` si absent
5. Attendez 1-2 minutes
6. Réessayez

### ❌ Erreur : "Missing or insufficient permissions"

**Cause** : Règles Firestore trop restrictives

**Solution** :
1. Firebase Console → Firestore Database
2. Onglet **Rules**
3. Remplacez par :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```
4. Cliquez **"Publier"**

### ❌ Erreur : "firebase: command not found"

**Cause** : Firebase CLI pas installé ou pas dans le PATH

**Solution** :
```bash
# Réinstaller
npm install -g firebase-tools

# Si toujours pas trouvé
sudo npm install -g firebase-tools

# Vérifier
which firebase
```

### ❌ Le fichier .env.local n'est pas lu

**Cause** : Vite ne charge pas les variables

**Solution** :
1. Vérifiez que toutes les variables commencent par `VITE_`
2. Redémarrez complètement le serveur :
```bash
# Tuez tous les processus Node
pkill -9 node

# Relancez
npm run dev
```

---

## 📋 Checklist Finale

Cochez au fur et à mesure :

### Configuration Firebase
- [ ] Projet GCP existant identifié (nom, ID, numéro)
- [ ] Facturation activée sur le projet GCP
- [ ] Firebase ajouté au projet GCP
- [ ] Application Web créée dans Firebase
- [ ] Configuration `firebaseConfig` copiée

### Configuration Locale
- [ ] `.env.local` créé et rempli avec les vraies valeurs
- [ ] `.env.local` dans `.gitignore`
- [ ] Firebase CLI installé (`firebase --version`)
- [ ] Connecté à Firebase (`firebase login`)
- [ ] Projet initialisé (`firebase init`)

### Services Activés
- [ ] Authentication activée (Google)
- [ ] Firestore Database créée (mode test, Paris)
- [ ] Firebase Hosting activé

### Tests
- [ ] `npm run dev` fonctionne sans erreur Firebase
- [ ] Console navigateur sans erreur rouge
- [ ] Connexion Google fonctionne
- [ ] `./check-setup.sh` retourne OK

---

## 🎯 Vous êtes Prêt !

Si toutes les cases sont cochées :

✅ **Votre configuration est complète !**

Vous pouvez maintenant :
1. Coder vos features custom
2. Tester en temps réel
3. Déployer sur Firebase Hosting quand prêt

---

## 📚 Ressources Rapides

| Besoin | URL |
|--------|-----|
| Firebase Console | https://console.firebase.google.com/ |
| GCP Console | https://console.cloud.google.com/ |
| Docs Firebase Auth | https://firebase.google.com/docs/auth |
| Docs Firestore | https://firebase.google.com/docs/firestore |

---

**Dernière mise à jour** : 16 octobre 2025  
**Guide créé pour** : SimplifIA Hackathon Google Agentic AI
