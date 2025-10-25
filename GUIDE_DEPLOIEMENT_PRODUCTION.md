# 🚀 Guide de Déploiement Production - SimplifIA

**IMPORTANT:** Ce guide concerne le **déploiement en PRODUCTION sur Firebase remote**, pas l'émulateur local !

---

## 📋 Prérequis

### 1. Compte Firebase & Google Cloud

```bash
# Vérifier connexion Firebase
firebase login

# Lister les projets
firebase projects:list

# Sélectionner votre projet
firebase use votre-projet-id
```

### 2. Configuration Vertex AI

**Dans Google Cloud Console:**
1. Activer l'API Vertex AI
2. Créer une clé de service account
3. Télécharger le fichier JSON

```bash
# Configurer les credentials Vertex AI
firebase functions:config:set vertex.project_id="votre-projet-id"
firebase functions:config:set vertex.location="us-central1"

# OU via fichier service account
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 3. Configuration Firebase Functions

```bash
# Définir les variables d'environnement
firebase functions:config:set app.environment="production"

# Vérifier la config
firebase functions:config:get
```

---

## 🔧 Déploiement Backend (Firebase Functions)

### Étape 1: Compilation TypeScript

```bash
cd simplifia-backend/functions
npm run build
```

**Vérifier:** Aucune erreur de compilation ✅

### Étape 2: Déployer les Functions

```bash
cd simplifia-backend

# Déployer TOUTES les functions
firebase deploy --only functions

# OU déployer functions spécifiques
firebase deploy --only functions:handleChatMessage
firebase deploy --only functions:executeProcessWorkflow
firebase deploy --only functions:testAPISimulator
```

**Sortie attendue:**
```
✔  functions[us-central1-handleChatMessage(us-central1)] Successful update operation.
✔  functions[us-central1-executeProcessWorkflow(us-central1)] Successful update operation.
✔  functions[us-central1-testAPISimulator(us-central1)] Successful update operation.
...
✔  Deploy complete!
```

### Étape 3: Déployer Firestore Rules & Indexes

```bash
# Déployer les règles de sécurité
firebase deploy --only firestore:rules

# Déployer les index (CRITIQUE pour performances)
firebase deploy --only firestore:indexes
```

### Étape 4: Vérifier le déploiement

```bash
# Voir les logs en temps réel
firebase functions:log

# Tester une function
curl -X POST https://us-central1-votre-projet.cloudfunctions.net/testAPISimulator \
  -H "Content-Type: application/json" \
  -d '{"siteName": "CAF", "userData": {"revenus": 1500}}'
```

---

## 🌐 Déploiement Frontend (Firebase Hosting)

### Étape 1: Configuration Firebase Hosting

```bash
cd frontend

# Vérifier firebase.json
cat firebase.json
```

**Contenu attendu:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Étape 2: Build de production

```bash
cd frontend

# Build optimisé pour production
npm run build
```

**Vérifier:** Dossier `dist/` créé avec tous les fichiers ✅

### Étape 3: Déployer sur Firebase Hosting

```bash
cd frontend

# Déploiement
firebase deploy --only hosting

# OU tout déployer en une fois (depuis racine)
cd ..
firebase deploy
```

**Sortie attendue:**
```
✔  hosting: Finished running predeploy script.
✔  hosting[votre-projet]: Beginning deploy...
✔  hosting[votre-projet]: Upload complete.
✔  hosting: Version finalized.
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/votre-projet/overview
Hosting URL: https://votre-projet.web.app
```

### Étape 4: Tester l'application déployée

```bash
# Ouvrir dans le navigateur
open https://votre-projet.web.app

# OU utiliser Firebase Hosting preview
firebase hosting:channel:deploy preview
```

---

## 🔍 Vérification Post-Déploiement

### 1. Firestore Database

**Firebase Console → Firestore Database**

Vérifier les collections:
- ✅ `processes` (vide au départ)
- ✅ `activity_logs` (vide au départ)
- ✅ `chat_messages` (vide au départ)
- ✅ `users` (avec compte demo)

### 2. Cloud Functions

**Firebase Console → Functions**

Vérifier le statut:
- ✅ `handleChatMessage` - Active
- ✅ `executeProcessWorkflow` - Active
- ✅ `testAPISimulator` - Active
- ✅ `testNavigator` - Active
- ✅ `testValidator` - Active

**Métriques à surveiller:**
- Invocations: 0 au départ
- Temps d'exécution: < 10s en moyenne
- Taux d'erreur: < 1%

### 3. Firebase Authentication

**Firebase Console → Authentication**

Créer le compte demo:
```bash
# Via console ou CLI
firebase auth:import users.json
```

**users.json:**
```json
{
  "users": [
    {
      "uid": "demo-user-123",
      "email": "marie.demo@simplifia.fr",
      "displayName": "Marie Dupont",
      "emailVerified": true,
      "disabled": false
    }
  ]
}
```

### 4. Vertex AI Connectivity

**Test depuis Cloud Console:**

```bash
# Tester l'accès Vertex AI
gcloud ai models list --region=us-central1

# Tester Gemini Flash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/votre-projet/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent \
  -d '{"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}'
```

---

## 🎯 Configuration Spécifique Production

### 1. Variables d'environnement

**Dans `simplifia-backend/functions/src/config/`:**

```typescript
// config/production.ts
export const productionConfig = {
  vertexAI: {
    projectId: process.env.VERTEX_PROJECT_ID || 'votre-projet-id',
    location: process.env.VERTEX_LOCATION || 'us-central1',
    model: 'gemini-1.5-flash-002',
  },
  firestore: {
    // Utilise automatiquement le projet Firebase
  },
  orchestrator: {
    maxRetries: 3,
    circuitBreakerThreshold: 5,
    timeout: 120000, // 2 minutes
  },
};
```

### 2. Firestore Security Rules

**CRITIQUE pour la sécurité en production:**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authentification requise
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Processes: utilisateur peut lire/écrire ses propres documents
    match /processes/{processId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
    
    // Activity logs: lecture seule pour utilisateur
    match /activity_logs/{logId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write
    }
    
    // Chat messages: utilisateur peut lire/écrire ses propres messages
    match /chat_messages/{messageId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

**Déployer les règles:**
```bash
firebase deploy --only firestore:rules
```

### 3. Firestore Indexes

**firestore.indexes.json:**

```json
{
  "indexes": [
    {
      "collectionGroup": "processes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activity_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "processId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "chat_messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sessionId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Déployer les indexes:**
```bash
firebase deploy --only firestore:indexes
```

---

## 🔐 Sécurité Production

### 1. API Keys

**Frontend (`firebase.ts`):**

```typescript
// IMPORTANT: Ces clés sont publiques mais restreintes par domaine
const firebaseConfig = {
  apiKey: "AIza...", // Restreindre à votre-projet.web.app
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Restreindre dans Google Cloud Console → APIs & Services → Credentials:**
- Restreindre l'API key aux domaines autorisés
- Limiter aux APIs nécessaires (Firestore, Auth, Functions)

### 2. CORS Configuration

**Backend Functions:**

```typescript
// src/middleware/cors.ts
import * as cors from 'cors';

export const corsMiddleware = cors({
  origin: [
    'https://votre-projet.web.app',
    'https://votre-projet.firebaseapp.com',
    // Pour développement local:
    'http://localhost:5173'
  ],
  credentials: true,
});
```

### 3. Rate Limiting

```typescript
// src/middleware/rateLimiter.ts
const rateLimiter = new Map<string, number[]>();

export function checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Nettoyer les anciennes requêtes
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit dépassé
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}
```

---

## 📊 Monitoring Production

### 1. Firebase Console

**Dashboards à surveiller:**

1. **Functions Dashboard**
   - Invocations/minute
   - Temps d'exécution moyen
   - Taux d'erreur
   - Logs en temps réel

2. **Firestore Dashboard**
   - Lectures/écritures/suppressions
   - Utilisation du stockage
   - Requêtes slow (> 1s)

3. **Hosting Dashboard**
   - Trafic (visiteurs uniques)
   - Bande passante
   - Temps de chargement

### 2. Google Cloud Monitoring

**Créer des alertes:**

```bash
# Alerte si taux d'erreur Functions > 5%
gcloud monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Functions Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05
```

### 3. Logs Aggregation

**Voir les logs en production:**

```bash
# Logs Functions en temps réel
firebase functions:log --limit 100

# Filtrer par function
firebase functions:log --only handleChatMessage

# Logs avec erreurs uniquement
firebase functions:log --severity error
```

### 4. Performance Monitoring

**Activer Firebase Performance Monitoring:**

```typescript
// frontend/src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getPerformance } from 'firebase/performance';

const app = initializeApp(firebaseConfig);
const perf = getPerformance(app);

// Traces automatiques + custom traces
import { trace } from 'firebase/performance';

export async function traceOperation(name: string, operation: () => Promise<any>) {
  const t = trace(perf, name);
  t.start();
  try {
    return await operation();
  } finally {
    t.stop();
  }
}
```

---

## 🎬 Checklist Déploiement Démo

### Avant la démo (J-1)

- [ ] **Backend déployé** sur Firebase Functions (remote)
  ```bash
  firebase deploy --only functions
  ```

- [ ] **Frontend déployé** sur Firebase Hosting (remote)
  ```bash
  firebase deploy --only hosting
  ```

- [ ] **Firestore rules** déployées (sécurité)
  ```bash
  firebase deploy --only firestore:rules
  ```

- [ ] **Firestore indexes** déployés (performance)
  ```bash
  firebase deploy --only firestore:indexes
  ```

- [ ] **Vertex AI configuré** (credentials valides)
  ```bash
  firebase functions:config:set vertex.project_id="..."
  firebase deploy --only functions
  ```

- [ ] **Compte demo créé** (`marie.demo@simplifia.fr`)
  - Via Firebase Console → Authentication

- [ ] **Tests E2E sur l'URL de production**
  - Ouvrir https://votre-projet.web.app
  - Se connecter avec marie.demo@simplifia.fr
  - Tester scénario APL complet
  - Vérifier Firestore (processes, activity_logs, chat_messages)

### Pendant la démo

- [ ] **URL de production** ouverte dans navigateur
  - PAS localhost !
  - https://votre-projet.web.app

- [ ] **Firebase Console** ouverte (2e écran)
  - Onglet Firestore (voir données en temps réel)
  - Onglet Functions (voir logs)

- [ ] **Mode offline préparé** (si problème réseau)
  - Vidéo screen recording de backup
  - Screenshots des étapes clés

---

## 🚨 Troubleshooting Production

### Erreur: "Function timeout after 60s"

**Solution:**
```bash
# Augmenter le timeout dans firebase.json
{
  "functions": {
    "timeoutSeconds": 120,
    "memory": "1GB"
  }
}

firebase deploy --only functions
```

### Erreur: "Insufficient permissions for Vertex AI"

**Solution:**
```bash
# Ajouter le rôle Vertex AI User au service account
gcloud projects add-iam-policy-binding votre-projet \
  --member="serviceAccount:votre-projet@appspot.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Erreur: "Firestore index required"

**Solution:**
```bash
# Cliquer sur le lien dans l'erreur pour créer l'index
# OU déployer firestore.indexes.json
firebase deploy --only firestore:indexes
```

### Erreur: "CORS policy blocked"

**Solution:**
```typescript
// Ajouter CORS dans functions/src/index.ts
import * as cors from 'cors';
const corsHandler = cors({ origin: true });

export const myFunction = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    // Votre code
  });
});
```

---

## 📈 Optimisations Production

### 1. Cold Start Optimization

```typescript
// Initialiser en dehors du handler
import * as admin from 'firebase-admin';
admin.initializeApp(); // Une seule fois

const db = admin.firestore(); // Réutiliser

export const myFunction = functions.https.onRequest(async (req, res) => {
  // Utiliser db (déjà initialisé)
});
```

### 2. Caching Vertex AI

```typescript
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 heure

async function getCachedVertexAIResponse(prompt: string): Promise<string> {
  const cached = responseCache.get(prompt);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  
  const response = await vertexAI.generateResponse(prompt);
  responseCache.set(prompt, { response, timestamp: Date.now() });
  return response;
}
```

### 3. Bundle Size Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'mui': ['@mui/material'],
          'firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
});
```

---

## ✅ Conclusion

**IMPORTANT:** Pour la démo du hackathon, vous DEVEZ utiliser:

✅ **Firebase Functions REMOTE** (pas émulateur local)
- URL: `https://us-central1-votre-projet.cloudfunctions.net/...`

✅ **Firestore REMOTE** (pas émulateur local)
- Console: https://console.firebase.google.com/project/votre-projet/firestore

✅ **Firebase Hosting REMOTE** (pas localhost)
- URL: `https://votre-projet.web.app`

✅ **Vertex AI REMOTE** (avec vraies credentials)
- Service account configuré dans Google Cloud

**Commande de déploiement complète:**
```bash
# Depuis la racine du projet
firebase deploy

# OU étape par étape
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```

**Vérification finale:**
```bash
# Tester l'URL de production
curl https://votre-projet.web.app
# → Doit retourner le HTML de l'app

# Tester une function
curl https://us-central1-votre-projet.cloudfunctions.net/testAPISimulator
# → Doit retourner une réponse JSON
```

🎯 **Vous êtes prêt pour la production !**

---

*Guide créé le 25 octobre 2025*  
*Pour démo Hackathon SimplifIA*
