# 🚀 NOUVEAU BACKEND SIMPLIFIA - Firebase/Cloud Functions TypeScript

**Date de création** : 19 octobre 2025  
**Projet** : SimplifIA - Migration Backend Python vers Firebase  
**Configuration** : `simplifia-hackathon` (Firebase Project)

---

## ❓ **QUESTIONS IMPORTANTES AVANT DE COMMENCER**

### **1. C'est quoi Firestore ?**

**Firestore** est une **base de données NoSQL** hébergée par Google Firebase. Contrairement aux bases SQL (comme PostgreSQL), elle n'utilise pas de tables mais des **collections** et **documents**.

**Structure Firestore :**
```
📁 users (collection)
  📄 user123 (document)
    - email: "marc@example.com"
    - name: "Marc"
    
📁 processes (collection)
  📄 process456 (document)
    - title: "Renouvellement passeport"
    - userId: "user123"
    
    📁 chat_messages (sous-collection)
      📄 message1 (document)
        - content: "Bonjour"
        - role: "user"
```

**Avantages de Firestore :**
- ✅ **Temps réel** : Les données se synchronisent automatiquement
- ✅ **Scalable** : S'adapte automatiquement à la charge
- ✅ **Offline** : Fonctionne même sans connexion
- ✅ **Intégré** : Directement lié à Firebase Auth

### **2. C'est quoi les règles Firestore ?**

Les **règles Firestore** (`firestore.rules`) sont un **système de sécurité** pour ta base de données. Elles définissent :

- **QUI** peut lire/écrire les données
- **QUAND** ils peuvent le faire  
- **QUELLES** données ils peuvent accéder

**Exemple simple :**
```javascript
// ❌ DANGEREUX - Mode test (tout le monde peut tout faire)
match /{document=**} {
  allow read, write: if true;
}

// ✅ SÉCURISÉ - Seul le propriétaire peut accéder à ses données
match /processes/{processId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}
```

**Sans règles** = N'importe qui peut lire/modifier toutes les données (DANGEREUX ⚠️)  
**Avec règles** = Seulement les personnes autorisées peuvent accéder aux données (SÉCURISÉ ✅)

### **3. Firestore est déjà configuré dans ton projet ?**

**OUI !** ✅ Ton frontend a déjà :

- **Connexion Firebase** configurée (`frontend/src/config/firebase.ts`)
- **Firestore initialisé** avec `getFirestore()`
- **Projet Firebase** : `simplifia-hackathon`
- **Règles temporaires** dans `frontend/firestore.rules` (mode test, expire le 13 novembre 2025)

**MAIS** :
- ❌ Les règles actuelles sont **temporaires et non sécurisées**
- ❌ Pas de structure de données définie côté backend
- ❌ Pas de Cloud Functions pour la logique métier

**C'est pourquoi on va :**
1. Créer les **Cloud Functions** (logique backend)
2. Définir les **règles de sécurité** (protection des données)
3. Créer les **index** (optimisation des requêtes)

---

## 📊 ARCHITECTURE CIBLE

### ✅ **Stack Technologique**
- **Backend** : Firebase Cloud Functions (TypeScript)
- **Base de données** : Firestore (NoSQL) - **DÉJÀ CRÉÉ DANS LE FRONTEND**
- **IA** : Google Vertex AI (Gemini 1.5 Pro)
- **Auth** : Firebase Authentication - **DÉJÀ CONFIGURÉ**
- **Communication** : Firestore SDK + Cloud Functions
- **Temps réel** : Firestore listeners automatiques
- **Région** : europe-west1 / europe-west9 (Vertex AI)

---

## 🗂️ STRUCTURE FINALE DU PROJET

```
simplifia-backend/
├── firebase.json                 # Configuration Firebase (à créer)
├── .firebaserc                   # Projet Firebase sélectionné (à créer)
├── firestore.rules              # Règles de sécurité Firestore (à créer)
├── firestore.indexes.json       # Index Firestore (à créer)
├── newBackend.md                # Ce fichier ✅
└── functions/                   # À créer avec firebase init
    ├── package.json
    ├── tsconfig.json
    ├── .env
    ├── src/
    │   ├── index.ts            # Point d'entrée
    │   ├── types/
    │   │   └── index.ts        # Types TypeScript
    │   ├── services/
    │   │   ├── firebase.ts     # Service Firebase Admin
    │   │   └── vertex-ai.ts    # Service Vertex AI
    │   ├── agents/             # Agents IA (Phase 3)
    │   └── utils/
    └── lib/                    # Code compilé
```

---

## 📋 **ORDRE DES PHASES (CORRIGÉ)**

| Phase | Durée | Description | Priorité |
|-------|-------|-------------|----------|
| **Phase 1** | 1h | Setup Firebase Functions + TypeScript | 🔴 CRITIQUE |
| **Phase 1.5** | 30min | Configuration Firestore (règles + index) | 🔴 CRITIQUE |
| **Phase 2** | 2h | Développement Cloud Functions principales | 🔴 CRITIQUE |
| **Phase 3** | 1h | Intégration Vertex AI (agents IA) | 🟡 HAUTE |
| **Phase 4** | 1h | Tests et déploiement | 🟡 HAUTE |

---

## 🚀 **PHASE 1 : SETUP FIREBASE FUNCTIONS**

### **Objectif**
Initialiser le projet Firebase Functions avec TypeScript et créer la structure de base.

### **Prérequis**

```bash
# 1. Vérifier Node.js (version 18+)
node --version

# 2. Installer Firebase CLI
npm install -g firebase-tools

# 3. Login Firebase
firebase login

# 4. Vérifier la connexion
firebase projects:list
# Tu devrais voir "simplifia-hackathon" dans la liste
```

### **Étape 1.1 : Initialisation Firebase Functions**

```bash
# Se positionner dans le dossier backend
cd simplifia-backend

# Initialiser Firebase Functions
firebase init functions

# ⚠️ SÉLECTIONS IMPORTANTES :
# ? Please select an option: Use an existing project
# ? Select a default Firebase project: simplifia-hackathon
# ? What language would you like to use: TypeScript
# ? Do you want to use ESLint: Yes
# ? Do you want to install dependencies now: Yes
```

**Résultat :** Firebase va créer automatiquement :
```
simplifia-backend/
├── firebase.json           ✅ Créé
├── .firebaserc            ✅ Créé
└── functions/             ✅ Créé
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   └── index.ts
    └── node_modules/
```

### **Étape 1.2 : Configuration `functions/package.json`**

```bash
cd functions
```

Modifier `package.json` pour ajouter les dépendances et scripts :

```json
{
  "name": "simplifia-functions",
  "version": "1.0.0",
  "description": "SimplifIA Backend - Cloud Functions",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions,firestore",
    "deploy": "firebase deploy --only functions",
    "deploy:rules": "firebase deploy --only firestore:rules",
    "logs": "firebase functions:log",
    "dev": "npm run build:watch",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@google-cloud/vertexai": "^1.7.0",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "joi": "^17.9.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
```

### **Étape 1.3 : Installer les dépendances**

```bash
# Dans le dossier functions/
npm install
```

### **Étape 1.4 : Créer la structure des dossiers**

```bash
# Dans functions/src/
mkdir -p types services agents utils
```

✅ **Phase 1 terminée !** Tu as maintenant la structure de base.

---

## 🗄️ **PHASE 1.5 : CONFIGURATION FIRESTORE**

### **Objectif**
Sécuriser la base de données Firestore et définir la structure des données.

### **Contexte**
Ton frontend utilise déjà Firestore, mais avec des **règles temporaires non sécurisées** qui expirent le **13 novembre 2025**.

**Règles actuelles (frontend/firestore.rules) :**
```javascript
allow read, write: if request.time < timestamp.date(2025, 11, 13);
// ⚠️ DANGEREUX : Tout le monde peut tout faire jusqu'au 13 nov !
```

### **Étape 1.5.1 : Créer les règles de sécurité**

**Fichier : `simplifia-backend/firestore.rules`**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Fonctions helper
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Collection users
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Collection processes
    match /processes/{processId} {
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
                      request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
                               resource.data.userId == request.auth.uid;

      // Sous-collection chat_messages
      match /chat_messages/{messageId} {
        allow read, create: if isAuthenticated() &&
                             get(/databases/$(database)/documents/processes/$(processId)).data.userId == request.auth.uid;
      }

      // Sous-collection activity_logs
      match /activity_logs/{logId} {
        allow read, create: if isAuthenticated() &&
                             get(/databases/$(database)/documents/processes/$(processId)).data.userId == request.auth.uid;
      }
    }

    // Collection config (lecture seule)
    match /config/{configId} {
      allow read: if isAuthenticated();
    }

    // Deny all par défaut
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### **Étape 1.5.2 : Créer les index Firestore**

**Fichier : `simplifia-backend/firestore.indexes.json`**

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
      "collectionGroup": "chat_messages",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "processId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### **Étape 1.5.3 : Déployer les règles**

```bash
# Depuis simplifia-backend/
firebase deploy --only firestore:rules

# Vérifier dans la console Firebase
# https://console.firebase.google.com/project/simplifia-hackathon/firestore/rules
```

✅ **Phase 1.5 terminée !** Ta base de données est maintenant sécurisée.

---

## 📝 **PHASE 2 : TYPES TYPESCRIPT**

### **Objectif**
Définir les types TypeScript pour assurer la sécurité et la clarté du code.

### **Contexte**
Pour faciliter le développement et éviter les erreurs, on va définir des types pour les données Firestore et les requêtes.

### **Étape 2.1 : Installer les dépendances nécessaires**

```bash
# Dans le dossier functions/
npm install --save-dev @types/node
```

### **Étape 2.2 : Créer les types de données**

**Fichier : `functions/src/types/index.ts`**

```typescript
// Types généraux
export type UserId = string;
export type ProcessId = string;
export type MessageId = string;

// Type pour un utilisateur
export interface User {
  id: UserId;
  email: string;
  name: string;
}

// Type pour un processus
export interface Process {
  id: ProcessId;
  title: string;
  userId: UserId;
  createdAt: FirebaseFirestore.Timestamp;
}

// Type pour un message de chat
export interface ChatMessage {
  id: MessageId;
  processId: ProcessId;
  content: string;
  role: 'user' | 'assistant';
  timestamp: FirebaseFirestore.Timestamp;
}
```

### **Étape 2.3 : Utiliser les types dans le code**

Exemple d'utilisation des types dans une fonction Cloud :

```typescript
import { Process, User } from '../types';

export const createProcess = async (data: Process) => {
  // ...
};

export const getUser = async (id: string): Promise<User | null> => {
  // ...
};
```

### **Étape 2.4 : Vérifier les types avec TypeScript

```bash
# Dans le dossier functions/
npm run build
```

✅ **Phase 2 terminée !** Les types TypeScript sont maintenant en place.

---

## ⚙️ **PHASE 2.5 : ENVIRONNEMENT ET CONFIGURATION**

### **Objectif**
Configurer l'environnement de développement et les variables sensibles.

### **Prérequis**
Avoir créé un fichier `.env` à la racine du projet `functions/`.

### **Étape 2.5.1 : Installer les dépendances**

```bash
# Dans le dossier functions/
npm install dotenv
```

### **Étape 2.5.2 : Configurer TypeScript pour dotenv**

Modifier `tsconfig.json` pour inclure le dossier `src` :

```json
{
  "compilerOptions": {
    // ...
    "rootDir": "src",
    "outDir": "../lib",
    // ...
  },
  "include": ["src"]
}
```

### **Étape 2.5.3 : Charger les variables d'environnement**

Dans `functions/src/index.ts`, ajouter :

```typescript
import * as dotenv from 'dotenv';

dotenv.config();
```

### **Étape 2.5.4 : Utiliser les variables d'environnement**

Exemple d'utilisation dans le code :

```typescript
const apiKey = process.env.API_KEY;
```

### **Étape 2.5.5 : Ne pas oublier `.env` dans `.gitignore`**

Vérifier que le fichier `.env` est bien ignoré par Git :

```
# Dans .gitignore
.env
```

✅ **Phase 2.5 terminée !** L'environnement est correctement configuré.

---

## 🔌 **PHASE 3 : DÉVELOPPEMENT CLOUD FUNCTIONS**

### **Objectif**
Développer les fonctions Cloud principales pour la logique backend.

### **Contexte**
Les fonctions Cloud vont gérer la logique métier, l'accès à la base de données et l'intégration avec Vertex AI.

### **Étape 3.1 : Créer une fonction d'exemple**

Dans `functions/src/index.ts` :

```typescript
import * as functions from 'firebase-functions';
import { Process } from './types';

export const createProcess = functions.https.onRequest(async (request, response) => {
  const data: Process = request.body;

  // TODO: Ajouter la logique de création de processus

  response.status(201).send({ id: 'new-process-id' });
});
```

### **Étape 3.2 : Déployer la fonction**

```bash
# Depuis simplifia-backend/
firebase deploy --only functions
```

### **Étape 3.3 : Tester la fonction**

Utiliser Postman ou curl pour tester la fonction :

```bash
curl -X POST https://<region>-<project-id>.cloudfunctions.net/createProcess \
-H "Content-Type: application/json" \
-d '{"title": "Nouveau processus", "userId": "user123"}'
```

### **Étape 3.4 : Gérer les erreurs**

Ajouter une gestion des erreurs dans la fonction :

```typescript
export const createProcess = functions.https.onRequest(async (request, response) => {
  try {
    const data: Process = request.body;

    // TODO: Ajouter la logique de création de processus

    response.status(201).send({ id: 'new-process-id' });
  } catch (error) {
    console.error('Erreur lors de la création du processus:', error);
    response.status(500).send('Erreur serveur');
  }
});
```

### **Étape 3.5 : Ajouter des tests unitaires**

Créer des tests pour la fonction :

```typescript
import { createProcess } from './index';

test('should create a new process', async () => {
  const request = {
    body: {
      title: 'Nouveau processus',
      userId: 'user123',
    },
  } as any;

  const response = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as any;

  await createProcess(request, response);

  expect(response.status).toHaveBeenCalledWith(201);
  expect(response.send).toHaveBeenCalledWith({ id: 'new-process-id' });
});
```

✅ **Phase 3 terminée !** Les fonctions Cloud principales sont développées.

---

## 🧠 **PHASE 3.5 : INTÉGRATION VERTEX AI**

### **Objectif**
Intégrer Vertex AI pour utiliser les modèles Gemini 1.5 Pro.

### **Contexte**
Vertex AI permet d'utiliser des modèles d'IA avancés pour traiter les données et générer des insights.

### **Étape 3.5.1 : Installer les dépendances Vertex AI**

```bash
# Dans le dossier functions/
npm install @google-cloud/vertexai
```

### **Étape 3.5.2 : Créer un service Vertex AI**

Dans `functions/src/services/vertex-ai.ts` :

```typescript
import { VertexAI } from '@google-cloud/vertexai';

const client = new VertexAI({
  projectId: process.env.GCP_PROJECT_ID,
  location: 'us-central1',
});

export const runGeminiModel = async (input: string) => {
  const [response] = await client.predict({
    endpoint: process.env.GEMINI_ENDPOINT!,
    instances: [{ content: input }],
  });

  return response;
};
```

### **Étape 3.5.3 : Utiliser le service dans une fonction Cloud**

Dans `functions/src/index.ts` :

```typescript
import { runGeminiModel } from './services/vertex-ai';

export const generateInsight = functions.https.onRequest(async (request, response) => {
  const { input } = request.body;

  try {
    const result = await runGeminiModel(input);
    response.send(result);
  } catch (error) {
    console.error('Erreur lors de l\'appel à Vertex AI:', error);
    response.status(500).send('Erreur serveur');
  }
});
```

### **Étape 3.5.4 : Déployer les fonctions avec Vertex AI**

```bash
# Depuis simplifia-backend/
firebase deploy --only functions
```

### **Étape 3.5.5 : Tester les fonctions avec Vertex AI**

```bash
curl -X POST https://<region>-<project-id>.cloudfunctions.net/generateInsight \
-H "Content-Type: application/json" \
-d '{"input": "Analyse des données de vente"}'
```

✅ **Phase 3.5 terminée !** Vertex AI est intégré et fonctionnel.

---

## 🔍 **PHASE 4 : TESTS ET DÉPLOIEMENT**

### **Objectif**
Tester l'ensemble du système et déployer en production.

### **Contexte**
Avant de déployer en production, il est crucial de tester toutes les fonctionnalités pour s'assurer qu'elles fonctionnent comme prévu.

### **Étape 4.1 : Tester les fonctions Cloud**

Utiliser les tests unitaires et des tests manuels pour vérifier le bon fonctionnement des fonctions Cloud.

### **Étape 4.2 : Vérifier les règles Firestore**

S'assurer que les règles de sécurité Firestore sont correctement appliquées et protègent les données.

### **Étape 4.3 : Déployer en production**

```bash
# Depuis simplifia-backend/
firebase deploy --only functions,firestore
```

### **Étape 4.4 : Surveiller les logs et les performances**

Après le déploiement, surveiller les logs et les performances pour détecter d'éventuels problèmes.

### **Étape 4.5 : Effectuer des ajustements si nécessaire**

Si des problèmes sont détectés, apporter les ajustements nécessaires et redéployer.

✅ **Phase 4 terminée !** Le système est testé et déployé en production.

---

## 🎉 **FÉLICITATIONS !**

Tu as réussi à mettre en place le nouveau backend SimplifIA avec Firebase et Cloud Functions. Voici un récapitulatif des étapes réalisées :

1. **Setup Firebase Functions** : Initialisation du projet Firebase Functions avec TypeScript.
2. **Configuration Firestore** : Sécurisation de la base de données Firestore avec des règles et des index.
3. **Développement Cloud Functions** : Création des fonctions Cloud pour la logique backend.
4. **Intégration Vertex AI** : Utilisation des modèles Gemini 1.5 Pro pour l'analyse des données.
5. **Tests et déploiement** : Vérification du bon fonctionnement et déploiement en production.

Maintenant, tu peux profiter d'un backend puissant, scalable et sécurisé pour ton projet SimplifIA. N'oublie pas de surveiller régulièrement les performances et la sécurité de ton application.
