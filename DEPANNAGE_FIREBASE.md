# 🔧 Dépannage Firebase - SimplifIA

**Solutions aux problèmes courants**

---

## 🔍 Table des Problèmes

| Erreur | Page |
|--------|------|
| [Invalid API Key](#1-invalid-api-key) | #1 |
| [Unauthorized Domain](#2-unauthorized-domain) | #2 |
| [Missing Permissions](#3-missing-permissions) | #3 |
| [Command Not Found](#4-command-not-found) | #4 |
| [Project Not Found](#5-project-not-found) | #5 |
| [Variables d'env non chargées](#6-variables-denvironnement-non-chargées) | #6 |
| [CORS Errors](#7-cors-errors) | #7 |

---

## 1. Invalid API Key

### 🔴 Erreur complète
```
Firebase: Error (auth/invalid-api-key)
```

### 📍 Cause
L'API Key dans `.env.local` est incorrecte, manquante, ou mal formatée.

### ✅ Solution

**Étape 1** : Vérifier `.env.local`

```bash
cd /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend
cat .env.local
```

**Vérifiez** :
- ✅ La ligne commence bien par `VITE_FIREBASE_API_KEY=`
- ✅ La valeur commence par `AIza`
- ✅ Pas d'espace avant ou après le `=`
- ✅ Pas de guillemets autour de la valeur
- ✅ Pas de commentaire sur la même ligne

**Exemple CORRECT** :
```env
VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Exemples INCORRECTS** :
```env
VITE_FIREBASE_API_KEY = AIza...     ❌ (espaces)
VITE_FIREBASE_API_KEY="AIza..."    ❌ (guillemets)
VITE_FIREBASE_API_KEY=your_api_key ❌ (pas remplacé)
```

**Étape 2** : Récupérer la vraie API Key

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet
3. ⚙️ **Paramètres du projet**
4. Onglet **Général**
5. Section **"Vos applications"**
6. Copiez la valeur de `apiKey`

**Étape 3** : Remplacer dans `.env.local`

```bash
# Ouvrir l'éditeur
code .env.local

# Remplacez la ligne
VITE_FIREBASE_API_KEY=<VOTRE_VRAIE_VALEUR>
```

**Étape 4** : Redémarrer le serveur

```bash
# Tuez le serveur (Ctrl+C)
# Relancez
npm run dev
```

**Étape 5** : Vérifier

Ouvrez http://localhost:5173 et F12 (console).

✅ **Pas d'erreur** = Résolu !

---

## 2. Unauthorized Domain

### 🔴 Erreur complète
```
Firebase: Error (auth/unauthorized-domain)
```

### 📍 Cause
Le domaine `localhost` n'est pas autorisé dans les paramètres Firebase Authentication.

### ✅ Solution

**Étape 1** : Aller dans Firebase Console

1. https://console.firebase.google.com/
2. Sélectionnez votre projet
3. Menu gauche → **Authentication**
4. Onglet **Settings** (en haut)

**Étape 2** : Vérifier les domaines autorisés

Scrollez jusqu'à **"Authorized domains"**

```
Authorized domains
──────────────────────────────────────
localhost                  ← Doit être là !
votre-projet.firebaseapp.com
votre-projet.web.app
```

**Étape 3** : Ajouter localhost si absent

1. Cliquez **"Add domain"**
2. Tapez : `localhost`
3. Cliquez **"Add"**

**Étape 4** : Attendre

⏱️ Attendez 1-2 minutes que la config se propage.

**Étape 5** : Réessayer

Rechargez la page et reconnectez-vous.

✅ **Connexion réussie** = Résolu !

---

## 3. Missing Permissions

### 🔴 Erreur complète
```
FirebaseError: Missing or insufficient permissions.
```

### 📍 Cause
Les règles Firestore sont trop restrictives ou mal configurées.

### ✅ Solution

**Étape 1** : Aller dans Firestore Console

1. https://console.firebase.google.com/
2. Votre projet → **Firestore Database**
3. Onglet **Rules**

**Étape 2** : Vérifier les règles

Pour le **développement**, utilisez :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Mode test : Tout le monde peut lire/écrire jusqu'au 31/12/2025
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

**Étape 3** : Publier

1. Cliquez **"Publier"**
2. Attendez 10-20 secondes

**Étape 4** : Réessayer

Rechargez votre app.

✅ **Opération réussie** = Résolu !

**⚠️ IMPORTANT** : Avant de mettre en production, sécurisez les règles :

```javascript
// Production : Seuls les utilisateurs authentifiés
allow read, write: if request.auth != null;
```

---

## 4. Command Not Found

### 🔴 Erreur complète
```bash
zsh: command not found: firebase
```

### 📍 Cause
Firebase CLI n'est pas installé ou pas dans le PATH.

### ✅ Solution

**Étape 1** : Installer Firebase CLI

```bash
# Installation globale
npm install -g firebase-tools

# Si permission denied, utilisez sudo
sudo npm install -g firebase-tools
```

**Étape 2** : Vérifier l'installation

```bash
firebase --version
```

✅ **Affiche `13.x.x`** = Installé !

**Étape 3** : Si toujours pas trouvé

```bash
# Trouver où npm installe les globaux
npm config get prefix

# Résultat exemple : /usr/local
# Les binaires sont dans : /usr/local/bin

# Ajouter au PATH (macOS/Linux)
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Vérifier
which firebase
```

---

## 5. Project Not Found

### 🔴 Erreur complète
```bash
Error: Failed to get Firebase project <project-id>. Please make sure the project exists.
```

### 📍 Cause
Le projet sélectionné n'existe pas ou vous n'y avez pas accès.

### ✅ Solution

**Étape 1** : Lister vos projets Firebase

```bash
firebase projects:list
```

**Résultat attendu** :
```
┌────────────────────────────────┐
│ Project Display Name  Project ID        Resource Location ID │
├──────────────────────┼──────────────────────────────────────┤
│ SimplifIA Project    │ simplifia-project-123  europe-west9  │
│ Autre Projet         │ autre-projet-456       us-central1   │
└────────────────────────────────┘
```

**Étape 2** : Sélectionner le bon projet

```bash
# Utiliser l'ID du projet (colonne 2)
firebase use simplifia-project-123
```

**Étape 3** : Vérifier

```bash
# Afficher le projet actif
firebase projects:list
# Cherchez "(current)" à côté du bon projet
```

✅ **Projet actif** = Résolu !

---

## 6. Variables d'Environnement Non Chargées

### 🔴 Symptôme
```javascript
console.log(import.meta.env.VITE_FIREBASE_API_KEY)
// Affiche: undefined
```

### 📍 Cause
Vite ne charge pas les variables d'environnement.

### ✅ Solution

**Étape 1** : Vérifier le nom du fichier

```bash
cd /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend
ls -la | grep env
```

✅ **Doit afficher** : `.env.local`

**Étape 2** : Vérifier le préfixe

Toutes les variables **DOIVENT** commencer par `VITE_` :

```env
✅ VITE_FIREBASE_API_KEY=...
❌ FIREBASE_API_KEY=...
❌ REACT_APP_FIREBASE_API_KEY=...
```

**Étape 3** : Redémarrer complètement

```bash
# Tuez TOUS les processus Node
pkill -9 node

# Relancez proprement
npm run dev
```

**Étape 4** : Vérifier dans le code

```typescript
// Dans un composant
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
```

✅ **Affiche la clé** = Résolu !

---

## 7. CORS Errors

### 🔴 Erreur complète
```
Access to fetch at 'https://identitytoolkit.googleapis.com/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

### 📍 Cause
Problème de domaine autorisé ou configuration réseau.

### ✅ Solution

**Solution 1** : Autoriser localhost

1. Firebase Console → Authentication → Settings
2. **Authorized domains** → Vérifier que `localhost` est présent
3. Attendez 2 minutes

**Solution 2** : Vider le cache

```bash
# Ouvrir en navigation privée
Cmd+Shift+N (Chrome) / Cmd+Shift+P (Firefox)

# Tester dans cette fenêtre
```

**Solution 3** : Vérifier les extensions navigateur

Désactivez temporairement :
- AdBlock
- Privacy Badger
- HTTPS Everywhere
- Autres extensions de sécurité

**Solution 4** : Utiliser 127.0.0.1

Dans `.env.local`, changez temporairement :
```env
VITE_FIREBASE_AUTH_DOMAIN=127.0.0.1
```

Non, attendez, gardez le domaine Firebase original.

**Solution 5** : Vérifier les règles réseau

```bash
# macOS : Vérifier le firewall
sudo pfctl -s rules

# Si problème, désactivez temporairement
```

---

## 🚨 Dernier Recours : Reset Complet

Si rien ne fonctionne, reset complet :

```bash
cd /Users/esdrasgbedozin/Documents/Hackathon_google_agentic-ai/demo-repository/frontend

# 1. Nettoyer
rm -rf node_modules
rm -rf .firebase
rm -rf dist

# 2. Réinstaller
npm install

# 3. Re-login Firebase
firebase logout
firebase login

# 4. Re-init Firebase
firebase init
# (Sélectionnez à nouveau Firestore + Hosting, projet existant)

# 5. Vérifier .env.local
cat .env.local
# Assurez-vous que les valeurs sont correctes

# 6. Relancer
npm run dev
```

✅ **Devrait fonctionner maintenant !**

---

## 📞 Besoin d'Aide Supplémentaire ?

### Documentation Officielle
- Firebase Docs : https://firebase.google.com/docs
- Vite Docs : https://vitejs.dev/guide/env-and-mode.html

### Logs de Debug

Activez les logs détaillés :

```bash
# Terminal 1 : Logs Firebase
export DEBUG=firebaseui:*
npm run dev

# Terminal 2 : Logs réseau
export DEBUG=*
npm run dev
```

### Script de Diagnostic

```bash
./check-setup.sh
```

Ce script vérifie automatiquement :
- Présence des fichiers
- Configuration .env.local
- Dépendances installées
- Structure du projet

---

**Dernière mise à jour** : 16 octobre 2025  
**Pour** : SimplifIA Hackathon
