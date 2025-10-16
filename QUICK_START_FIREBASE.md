# ⚡ Quick Start Firebase - SimplifIA (Projet GCP Existant)

**Guide express en 10 minutes chrono !**

---

## 🔥 IMPORTANT : Quel Firebase Utiliser ?

### ✅ Utilisez **Firebase Classic** (PAS App Hosting)

| Type Firebase | URL | Pour SimplifIA ? |
|---------------|-----|------------------|
| **Firebase Classic** ✅ | https://console.firebase.google.com/ | **OUI** - React + Vite |
| Firebase App Hosting ❌ | firebase.google.com/products/app-hosting | NON - Next.js uniquement |

**SimplifIA = React + Vite (SPA)** → Firebase Classic avec Hosting suffit.

---

## 🎯 Vous avez déjà un projet GCP ? Suivez ces étapes !

### 📋 Prérequis
- [ ] Projet GCP existant
- [ ] Facturation activée sur GCP
- [ ] Node.js installé

---

## 🚀 Configuration en 4 Étapes

### ÉTAPE 1 : Ajouter Firebase à votre projet GCP (5 min)

1. **Allez sur** : https://console.firebase.google.com/
2. Cliquez **"Ajouter un projet"**
3. **IMPORTANT** : Sélectionnez **"Sélectionner un projet Google Cloud existant"**
4. Choisissez votre projet GCP dans la liste
5. Cliquez **"Continuer"** → **"Ajouter Firebase"**

⏱️ Attendez 30 secondes...

✅ Vous êtes redirigé vers le dashboard Firebase

---

### ÉTAPE 2 : Créer l'application Web (2 min)

1. Sur la page d'accueil Firebase, cliquez sur l'icône **Web** `</>`
2. **Nom** : `SimplifIA Frontend`
3. **☑ Cochez** : "Configurer aussi Firebase Hosting"
4. Cliquez **"Enregistrer l'application"**

**🔑 IMPORTANT** : Vous verrez le code `firebaseConfig` → **COPIEZ-LE IMMÉDIATEMENT !**

```javascript
// COPIEZ TOUT CE BLOC !
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXX"
};
```

---

### ÉTAPE 3 : Activer les services (3 min)

#### 3A. Authentication (1 min)
1. Menu gauche → **Authentication**
2. **"Get started"**
3. Cliquez sur **Google**
4. **Activer** le toggle
5. Email de support : votre email
6. **Enregistrer**

#### 3B. Firestore (1 min)
1. Menu gauche → **Firestore Database**
2. **"Créer une base de données"**
3. **Emplacement** : `europe-west9 (Paris)`
4. **Mode** : "Démarrer en mode test"
5. **Créer**

⏱️ Attendez 1-2 minutes...

#### 3C. Hosting (30 sec)
1. Menu gauche → **Hosting**
2. **"Premiers pas"** (juste pour activer)

---

### ÉTAPE 4 : Configuration locale (2 min)

#### 4A. Remplir .env.local

```bash
# Ouvrir le fichier
cd /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend
code .env.local
```

**Remplacez avec vos vraies valeurs** (celles que vous avez copiées à l'Étape 2) :

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ENV=development
```

**Sauvegardez** (Cmd+S / Ctrl+S)

#### 4B. Firebase CLI

```bash
# Installer (si pas déjà fait)
npm install -g firebase-tools

# Se connecter
firebase login

# Aller dans frontend
cd /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend

# Initialiser
firebase init
```

**Réponses rapides** :
```
Features ? → ESPACE sur "Firestore" et "Hosting" → ENTRÉE
Project ? → "Use an existing project" → ENTRÉE
Select project ? → Votre projet → ENTRÉE
Firestore rules ? → firestore.rules → ENTRÉE
Firestore indexes ? → firestore.indexes.json → ENTRÉE
Public directory ? → dist → ENTRÉE (IMPORTANT!)
Single-page app ? → Yes → ENTRÉE
GitHub deploys ? → No → ENTRÉE
```

---

## ✅ Vérification Rapide

```bash
# Vérifier la config
./check-setup.sh

# Lancer le dev server
npm run dev
```

**Ouvrez** : http://localhost:5173

**Ouvrez la console (F12)** : Pas d'erreur rouge Firebase ? ✅ C'est bon !

**Testez la connexion** :
- Allez sur http://localhost:5173/login
- Cliquez "Se connecter avec Google"
- Sélectionnez votre compte

✅ **Redirection vers /dashboard ?** = Tout fonctionne !

---

## 🆘 Problème ?

### "Invalid API key"
→ Vérifiez `.env.local`, redémarrez `npm run dev`

### "Unauthorized domain"
→ Firebase Console → Authentication → Settings → Authorized domains → Ajoutez `localhost`

### "firebase: command not found"
```bash
sudo npm install -g firebase-tools
```

---

## 📋 Checklist Rapide

- [ ] Firebase ajouté au projet GCP
- [ ] App Web créée + `firebaseConfig` copié
- [ ] Authentication Google activée
- [ ] Firestore créée (Paris, mode test)
- [ ] Hosting activé
- [ ] `.env.local` rempli avec vraies valeurs
- [ ] `firebase init` exécuté
- [ ] `npm run dev` sans erreur
- [ ] Login Google fonctionne

✅ **Tout coché ?** → **VOUS ÊTES PRÊT ! 🚀**

---

**Temps total** : ~10 minutes  
**Guide complet** : Voir `GUIDE_CONFIGURATION_DETAILLE.md`
