# 🔗 Guide d'Intégration Backend - SimplifIA

**Document à destination des développeurs backend**

Ce guide explique comment le frontend SimplifIA s'intègre avec le backend, la structure attendue des données, les API contracts, et comment configurer Firebase pour la communication en temps réel.

---

## 📋 Table des Matières

- [Vue d'Ensemble](#-vue-densemble)
- [Architecture Firebase](#-architecture-firebase)
- [Structure des Données](#-structure-des-données)
- [API Contracts TypeScript](#-api-contracts-typescript)
- [Real-time Subscriptions](#-real-time-subscriptions)
- [Schéma de la Base de Données](#-schéma-de-la-base-de-données)
- [Exemples de Code Backend](#-exemples-de-code-backend)
- [Variables d'Environnement](#-variables-denvironnement)
- [Guide de Connexion](#-guide-de-connexion)
- [Tests d'Intégration](#-tests-dintégration)
- [Déploiement](#-déploiement)

---

## 🎯 Vue d'Ensemble

### Stack Technique

**Frontend** :
- React 19 + TypeScript
- Firebase SDK 11.1.0 (Authentication + Firestore)
- Zustand pour state management
- Real-time updates via Firestore listeners

**Backend Attendu** :
- Firebase Functions (Node.js ou Python)
- Firestore pour persistence
- Firebase Authentication pour sécurité
- Vertex AI Agent Builder pour l'agent IA

### Flux de Communication

```
User → Frontend → Firebase Auth → Firestore → Cloud Functions → Vertex AI Agent
                                      ↓
                                  Real-time
                                  Updates
                                      ↑
Frontend ← Firestore Listeners ← Cloud Functions ← Agent Responses
```

---

## 🔥 Architecture Firebase

### Services Utilisés

1. **Firebase Authentication**
   - Google Sign-In configuré
   - Session management automatique
   - Token refresh automatique

2. **Firestore Database**
   - Collections : `processes`, `users`, `activity_logs`, `chat_messages`
   - Security Rules configurées
   - Offline persistence activée côté frontend

3. **Firebase Functions** (Backend)
   - Trigger sur création de `process` → Démarre agent IA
   - Trigger sur message chat → Envoie à Vertex AI
   - Scheduled functions pour cleanup

### Configuration Firestore

```javascript
// Frontend config (déjà fait)
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(err => {
  console.warn('Firestore persistence error:', err);
});
```

**Backend doit utiliser Firebase Admin SDK** :

```javascript
// Backend (Cloud Functions)
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
```

---

## 📊 Structure des Données

### Collections Firestore Attendues

#### 1. `processes` (Collection principale)

Stocke les missions en cours ou terminées.

**Document ID** : Auto-généré par Firestore ou UUID  
**Chemin** : `/processes/{processId}`

**Schéma** :

```typescript
interface Process {
  id: string;                    // ID du document
  userId: string;                // ID de l'utilisateur propriétaire
  title: string;                 // "Déclaration de naissance", etc.
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  
  currentStep: number;           // Étape actuelle (0-5)
  steps: ProcessStep[];          // Liste des 6 étapes
  
  progress: number;              // Progression globale (0-100)
  estimatedTimeRemaining?: number; // En secondes
  
  createdAt: Timestamp;          // Date de création
  updatedAt: Timestamp;          // Dernière mise à jour
  completedAt?: Timestamp;       // Date de completion (si completed)
  
  metadata?: {
    userContext?: string;        // Contexte fourni par l'user
    detectedScenario?: string;   // Scénario détecté par l'agent
    confidence?: number;         // Niveau de confiance (0-100)
  };
}

interface ProcessStep {
  id: number;                    // 0-5
  name: string;                  // "Analyse initiale", etc.
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  description: string;           // Description de l'étape
  duration?: number;             // Durée en secondes
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  errorMessage?: string;         // Si failed
}
```

**Exemple de document** :

```json
{
  "id": "proc_abc123",
  "userId": "user_xyz789",
  "title": "Déclaration de naissance",
  "status": "in-progress",
  "currentStep": 2,
  "progress": 45,
  "estimatedTimeRemaining": 180,
  "steps": [
    {
      "id": 0,
      "name": "Analyse initiale",
      "status": "completed",
      "description": "Analyse de votre situation et des documents nécessaires",
      "duration": 45,
      "startedAt": "2025-01-15T10:00:00Z",
      "completedAt": "2025-01-15T10:00:45Z"
    },
    {
      "id": 1,
      "name": "Vérification des prérequis",
      "status": "completed",
      "description": "Vérification de l'éligibilité et des documents fournis",
      "duration": 60,
      "startedAt": "2025-01-15T10:00:45Z",
      "completedAt": "2025-01-15T10:01:45Z"
    },
    {
      "id": 2,
      "name": "Remplissage des formulaires",
      "status": "in-progress",
      "description": "Complétion automatique des formulaires administratifs",
      "startedAt": "2025-01-15T10:01:45Z"
    },
    {
      "id": 3,
      "name": "Validation et vérification",
      "status": "pending",
      "description": "Vérification finale avant soumission"
    },
    {
      "id": 4,
      "name": "Soumission",
      "status": "pending",
      "description": "Envoi des documents aux autorités compétentes"
    },
    {
      "id": 5,
      "name": "Confirmation",
      "status": "pending",
      "description": "Confirmation de la réception et suivi"
    }
  ],
  "metadata": {
    "userContext": "Je viens d'avoir un bébé",
    "detectedScenario": "birth_declaration",
    "confidence": 95
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:02:30Z"
}
```

---

#### 2. `activity_logs` (Sous-collection de `processes`)

Stocke les logs d'activité pour chaque process.

**Chemin** : `/processes/{processId}/activity_logs/{logId}`

**Schéma** :

```typescript
interface ActivityLog {
  id: string;                    // Auto-généré
  processId: string;             // Référence au process parent
  
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;               // Message du log
  details?: string;              // Détails additionnels
  
  stepId?: number;               // Étape associée (0-5)
  timestamp: Timestamp;          // Date/heure du log
  
  metadata?: {
    action?: string;             // Action effectuée
    documentId?: string;         // ID document traité
    errorCode?: string;          // Code erreur si applicable
  };
}
```

**Exemple** :

```json
{
  "id": "log_def456",
  "processId": "proc_abc123",
  "type": "success",
  "message": "Formulaire CERFA n°15286*03 rempli avec succès",
  "details": "Tous les champs obligatoires complétés automatiquement",
  "stepId": 2,
  "timestamp": "2025-01-15T10:02:15Z",
  "metadata": {
    "action": "form_completion",
    "documentId": "cerfa_15286_03"
  }
}
```

---

#### 3. `chat_messages` (Sous-collection de `processes`)

Stocke les messages du chat entre l'utilisateur et l'agent.

**Chemin** : `/processes/{processId}/chat_messages/{messageId}`

**Schéma** :

```typescript
interface ChatMessage {
  id: string;                    // Auto-généré
  processId: string;             // Référence au process parent
  
  sender: 'user' | 'agent' | 'system';
  content: string;               // Texte du message
  timestamp: Timestamp;          // Date/heure du message
  
  metadata?: {
    isTyping?: boolean;          // Indicateur "agent est en train d'écrire"
    attachments?: string[];      // URLs de fichiers joints
    suggestedActions?: string[]; // Actions suggérées
  };
}
```

**Exemple** :

```json
{
  "id": "msg_ghi789",
  "processId": "proc_abc123",
  "sender": "agent",
  "content": "J'ai trouvé le formulaire CERFA n°15286*03 pour la déclaration de naissance. Je vais le remplir automatiquement avec les informations que vous m'avez fournies.",
  "timestamp": "2025-01-15T10:01:50Z",
  "metadata": {
    "suggestedActions": [
      "Continuer",
      "Voir le formulaire",
      "Modifier les informations"
    ]
  }
}
```

---

#### 4. `users` (Collection)

Stocke les informations utilisateur (optionnel mais recommandé).

**Chemin** : `/users/{userId}`

**Schéma** :

```typescript
interface User {
  id: string;                    // Firebase Auth UID
  email: string;                 // Email de connexion
  displayName?: string;          // Nom affiché
  photoURL?: string;             // URL de la photo de profil
  
  createdAt: Timestamp;          // Date d'inscription
  lastLoginAt: Timestamp;        // Dernière connexion
  
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
  
  stats?: {
    totalProcesses: number;      // Nombre de missions totales
    completedProcesses: number;  // Missions complétées
    timeSaved: number;           // Temps économisé (en secondes)
  };
}
```

---

#### 5. `decisions` (Sous-collection de `processes`)

Stocke les décisions critiques prises par l'agent ou l'utilisateur.

**Chemin** : `/processes/{processId}/decisions/{decisionId}`

**Schéma** :

```typescript
interface Decision {
  id: string;                    // Auto-généré
  processId: string;             // Référence au process parent
  
  type: 'agent' | 'user';        // Qui a pris la décision
  action: string;                // Description de l'action
  riskLevel: 'critical' | 'warning' | 'info';
  
  consequences: string[];        // Liste des conséquences
  
  status: 'pending' | 'approved' | 'rejected' | 'reverted';
  authorizedBy?: string;         // User ID si approved/rejected
  
  timestamp: Timestamp;          // Date de la décision
  processedAt?: Timestamp;       // Date de traitement
  revertedAt?: Timestamp;        // Date d'annulation
  
  metadata?: {
    screenshot?: string;         // URL du screenshot de l'action
    confidence?: number;         // Niveau de confiance (0-100)
  };
}
```

**Exemple** :

```json
{
  "id": "dec_jkl012",
  "processId": "proc_abc123",
  "type": "agent",
  "action": "Soumettre le formulaire à la mairie",
  "riskLevel": "critical",
  "consequences": [
    "Le formulaire sera envoyé officiellement",
    "Vous ne pourrez plus modifier les informations",
    "Un email de confirmation sera envoyé à la mairie"
  ],
  "status": "pending",
  "timestamp": "2025-01-15T10:03:00Z",
  "metadata": {
    "screenshot": "https://storage.googleapis.com/simplif-ia/screenshots/dec_jkl012.png",
    "confidence": 88
  }
}
```

---

## 🔌 API Contracts TypeScript

Le frontend attend ces types. **Backend doit respecter ces structures** lors de l'écriture dans Firestore.

Tous les types sont disponibles dans `/src/types/index.ts` :

```typescript
// /src/types/index.ts (Frontend)

export type ProcessStatus = 'pending' | 'in-progress' | 'completed' | 'failed';
export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'failed';
export type LogType = 'success' | 'error' | 'warning' | 'info';
export type MessageSender = 'user' | 'agent' | 'system';
export type RiskLevel = 'critical' | 'warning' | 'info';

export interface Process {
  id: string;
  userId: string;
  title: string;
  status: ProcessStatus;
  currentStep: number;
  steps: ProcessStep[];
  progress: number;
  estimatedTimeRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: {
    userContext?: string;
    detectedScenario?: string;
    confidence?: number;
  };
}

export interface ProcessStep {
  id: number;
  name: string;
  status: StepStatus;
  description: string;
  duration?: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface ActivityLog {
  id: string;
  processId: string;
  type: LogType;
  message: string;
  details?: string;
  stepId?: number;
  timestamp: Date;
  metadata?: {
    action?: string;
    documentId?: string;
    errorCode?: string;
  };
}

export interface ChatMessage {
  id: string;
  processId: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  metadata?: {
    isTyping?: boolean;
    attachments?: string[];
    suggestedActions?: string[];
  };
}

export interface Decision {
  id: string;
  processId: string;
  type: 'agent' | 'user';
  action: string;
  riskLevel: RiskLevel;
  consequences: string[];
  status: 'pending' | 'approved' | 'rejected' | 'reverted';
  authorizedBy?: string;
  timestamp: Date;
  processedAt?: Date;
  revertedAt?: Date;
  metadata?: {
    screenshot?: string;
    confidence?: number;
  };
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
  stats?: {
    totalProcesses: number;
    completedProcesses: number;
    timeSaved: number;
  };
}
```

**Backend peut copier ces types** pour assurer la cohérence !

---

## 🔄 Real-time Subscriptions

Le frontend écoute les changements Firestore en temps réel via le service `realtime.ts`.

### Service Frontend (`/src/services/realtime.ts`)

```typescript
import { collection, doc, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';

// Subscription au process principal
export const subscribeToProcess = (
  processId: string,
  onUpdate: (process: Process) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const processRef = doc(db, 'processes', processId);
  
  return onSnapshot(
    processRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          id: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
        } as Process);
      }
    },
    onError
  );
};

// Subscription aux logs d'activité
export const subscribeToActivityLogs = (
  processId: string,
  onUpdate: (logs: ActivityLog[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const logsRef = collection(db, 'processes', processId, 'activity_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate(),
        } as ActivityLog);
      });
      onUpdate(logs);
    },
    onError
  );
};

// Subscription aux messages chat
export const subscribeToChatMessages = (
  processId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const messagesRef = collection(db, 'processes', processId, 'chat_messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate(),
        } as ChatMessage);
      });
      onUpdate(messages);
    },
    onError
  );
};

// Subscription aux décisions
export const subscribeToDecisions = (
  processId: string,
  onUpdate: (decisions: Decision[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const decisionsRef = collection(db, 'processes', processId, 'decisions');
  const q = query(decisionsRef, orderBy('timestamp', 'desc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const decisions: Decision[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        decisions.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate(),
          processedAt: data.processedAt?.toDate(),
          revertedAt: data.revertedAt?.toDate(),
        } as Decision);
      });
      onUpdate(decisions);
    },
    onError
  );
};
```

### Comment le Backend Doit Écrire dans Firestore

**Backend (Cloud Function) doit utiliser Firebase Admin SDK** pour écrire :

```javascript
// Backend - Cloud Function Example (Node.js)
const admin = require('firebase-admin');
const db = admin.firestore();

// 1. Créer un nouveau process
exports.createProcess = async (userId, userContext) => {
  const processRef = db.collection('processes').doc();
  
  const newProcess = {
    id: processRef.id,
    userId: userId,
    title: "Mission en cours",
    status: "pending",
    currentStep: 0,
    progress: 0,
    steps: [
      { id: 0, name: "Analyse initiale", status: "pending", description: "..." },
      { id: 1, name: "Vérification", status: "pending", description: "..." },
      { id: 2, name: "Remplissage", status: "pending", description: "..." },
      { id: 3, name: "Validation", status: "pending", description: "..." },
      { id: 4, name: "Soumission", status: "pending", description: "..." },
      { id: 5, name: "Confirmation", status: "pending", description: "..." },
    ],
    metadata: {
      userContext: userContext,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  await processRef.set(newProcess);
  return processRef.id;
};

// 2. Mettre à jour un process (par exemple, passer à l'étape suivante)
exports.updateProcessStep = async (processId, stepId) => {
  const processRef = db.collection('processes').doc(processId);
  
  await processRef.update({
    currentStep: stepId,
    progress: Math.round((stepId / 6) * 100),
    [`steps.${stepId}.status`]: 'in-progress',
    [`steps.${stepId}.startedAt`]: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// 3. Ajouter un log d'activité
exports.addActivityLog = async (processId, logData) => {
  const logRef = db.collection('processes').doc(processId).collection('activity_logs').doc();
  
  await logRef.set({
    id: logRef.id,
    processId: processId,
    type: logData.type,       // 'success' | 'error' | 'warning' | 'info'
    message: logData.message,
    details: logData.details || null,
    stepId: logData.stepId || null,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: logData.metadata || {},
  });
};

// 4. Ajouter un message chat
exports.addChatMessage = async (processId, sender, content) => {
  const messageRef = db.collection('processes').doc(processId).collection('chat_messages').doc();
  
  await messageRef.set({
    id: messageRef.id,
    processId: processId,
    sender: sender,           // 'user' | 'agent' | 'system'
    content: content,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {},
  });
};

// 5. Créer une décision critique
exports.createDecision = async (processId, decisionData) => {
  const decisionRef = db.collection('processes').doc(processId).collection('decisions').doc();
  
  await decisionRef.set({
    id: decisionRef.id,
    processId: processId,
    type: 'agent',
    action: decisionData.action,
    riskLevel: decisionData.riskLevel, // 'critical' | 'warning' | 'info'
    consequences: decisionData.consequences,
    status: 'pending',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: decisionData.metadata || {},
  });
  
  return decisionRef.id;
};
```

### Exemple de Flux Complet (Backend)

**Scénario** : L'agent IA démarre une nouvelle mission

```javascript
// Cloud Function - onProcessCreate
exports.onProcessCreate = functions.firestore
  .document('processes/{processId}')
  .onCreate(async (snap, context) => {
    const processId = context.params.processId;
    const processData = snap.data();
    
    // 1. Analyser le contexte utilisateur avec Vertex AI
    const analysis = await analyzeWithVertexAI(processData.metadata.userContext);
    
    // 2. Mettre à jour le process avec le scénario détecté
    await snap.ref.update({
      'metadata.detectedScenario': analysis.scenario,
      'metadata.confidence': analysis.confidence,
      title: analysis.title,
    });
    
    // 3. Ajouter un log de démarrage
    await addActivityLog(processId, {
      type: 'info',
      message: 'Analyse de votre demande démarrée',
      stepId: 0,
    });
    
    // 4. Ajouter un message de l'agent dans le chat
    await addChatMessage(processId, 'agent', 
      `Bonjour ! J'ai analysé votre demande concernant "${analysis.scenario}". Je vais vous aider à compléter cette démarche automatiquement.`
    );
    
    // 5. Passer à l'étape 1
    await updateProcessStep(processId, 1);
  });
```

---

## 🗂️ Schéma de la Base de Données

```
Firestore Database
│
├── processes (collection)
│   ├── {processId} (document)
│   │   ├── id: string
│   │   ├── userId: string
│   │   ├── title: string
│   │   ├── status: string
│   │   ├── currentStep: number
│   │   ├── steps: array
│   │   ├── progress: number
│   │   ├── createdAt: timestamp
│   │   ├── updatedAt: timestamp
│   │   ├── metadata: object
│   │   │
│   │   ├── activity_logs (subcollection)
│   │   │   ├── {logId} (document)
│   │   │   │   ├── id: string
│   │   │   │   ├── processId: string
│   │   │   │   ├── type: string
│   │   │   │   ├── message: string
│   │   │   │   ├── timestamp: timestamp
│   │   │   │   └── metadata: object
│   │   │
│   │   ├── chat_messages (subcollection)
│   │   │   ├── {messageId} (document)
│   │   │   │   ├── id: string
│   │   │   │   ├── processId: string
│   │   │   │   ├── sender: string
│   │   │   │   ├── content: string
│   │   │   │   ├── timestamp: timestamp
│   │   │   │   └── metadata: object
│   │   │
│   │   └── decisions (subcollection)
│   │       ├── {decisionId} (document)
│   │       │   ├── id: string
│   │       │   ├── processId: string
│   │       │   ├── type: string
│   │       │   ├── action: string
│   │       │   ├── riskLevel: string
│   │       │   ├── consequences: array
│   │       │   ├── status: string
│   │       │   ├── timestamp: timestamp
│   │       │   └── metadata: object
│
└── users (collection)
    ├── {userId} (document)
    │   ├── id: string
    │   ├── email: string
    │   ├── displayName: string
    │   ├── photoURL: string
    │   ├── createdAt: timestamp
    │   ├── lastLoginAt: timestamp
    │   ├── preferences: object
    │   └── stats: object
```

---

## 🔐 Firestore Security Rules

**À configurer dans Firebase Console** → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Processes collection
    match /processes/{processId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      
      // Activity logs subcollection
      match /activity_logs/{logId} {
        allow read: if isSignedIn() && 
                      get(/databases/$(database)/documents/processes/$(processId)).data.userId == request.auth.uid;
        allow write: if false; // Only backend can write logs
      }
      
      // Chat messages subcollection
      match /chat_messages/{messageId} {
        allow read: if isSignedIn() && 
                      get(/databases/$(database)/documents/processes/$(processId)).data.userId == request.auth.uid;
        allow create: if isSignedIn() && 
                        get(/databases/$(database)/documents/processes/$(processId)).data.userId == request.auth.uid &&
                        request.resource.data.sender == 'user';
        allow update: if false; // Only backend can update messages
      }
      
      // Decisions subcollection
      match /decisions/{decisionId} {
        allow read: if isSignedIn() && 
                      get(/databases/$(database)/documents/processes/$(processId)).data.userId == request.auth.uid;
        allow update: if isSignedIn() && 
                        get(/databases/$(database)/documents/processes/$(processId)).data.userId == request.auth.uid &&
                        request.resource.data.keys().hasOnly(['status', 'authorizedBy', 'processedAt']);
      }
    }
  }
}
```

**Explications** :
- Users : Chaque utilisateur peut seulement lire/écrire ses propres données
- Processes : Utilisateur peut créer et lire ses propres processes
- Activity Logs : Lecture seule pour l'utilisateur, écriture par backend seulement
- Chat Messages : Utilisateur peut créer des messages avec sender='user'
- Decisions : Utilisateur peut mettre à jour le statut (approve/reject)

---

## 🌐 Variables d'Environnement

### Frontend (`.env.local`)

```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=simplif-ia.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=simplif-ia
VITE_FIREBASE_STORAGE_BUCKET=simplif-ia.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Optional
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Backend (Cloud Functions)

```env
# Firebase Admin SDK (Auto-injecté par Firebase Functions)
FIREBASE_CONFIG={"projectId":"simplif-ia",...}

# Vertex AI Configuration
VERTEX_AI_PROJECT_ID=simplif-ia
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_AGENT_ID=your-agent-id-here

# Optional
SENDGRID_API_KEY=SG.xxx    # Pour emails
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx  # Pour notifications
```

---

## 🧪 Tests d'Intégration

### Test 1 : Créer un Process et Vérifier la Subscription

**Backend** :

```javascript
// Test function
exports.testCreateProcess = functions.https.onRequest(async (req, res) => {
  const processId = await createProcess('test_user_123', 'Je viens d\'avoir un bébé');
  
  // Attendre 1 seconde
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Ajouter des logs
  await addActivityLog(processId, {
    type: 'info',
    message: 'Test log 1',
    stepId: 0,
  });
  
  await addActivityLog(processId, {
    type: 'success',
    message: 'Test log 2',
    stepId: 0,
  });
  
  res.json({ success: true, processId });
});
```

**Frontend** (dans la console du navigateur) :

```javascript
// Appeler la fonction de test
fetch('https://us-central1-simplif-ia.cloudfunctions.net/testCreateProcess')
  .then(r => r.json())
  .then(data => {
    console.log('Process créé:', data.processId);
    
    // Le frontend devrait recevoir les updates en temps réel
    // Vérifier dans le Dashboard que les logs apparaissent
  });
```

### Test 2 : Envoyer un Message Chat

**Frontend** :

```typescript
// Dans le composant ChatInterface
const handleSendMessage = async (content: string) => {
  const messageRef = collection(db, 'processes', currentProcessId, 'chat_messages');
  
  await addDoc(messageRef, {
    processId: currentProcessId,
    sender: 'user',
    content: content,
    timestamp: serverTimestamp(),
    metadata: {},
  });
};
```

**Backend** (Cloud Function trigger) :

```javascript
// Trigger on new user message
exports.onChatMessage = functions.firestore
  .document('processes/{processId}/chat_messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    
    if (message.sender === 'user') {
      // Envoyer à Vertex AI
      const agentResponse = await sendToVertexAI(message.content);
      
      // Répondre dans le chat
      await addChatMessage(context.params.processId, 'agent', agentResponse);
    }
  });
```

---

## 🚀 Déploiement

### Étapes Backend

1. **Installer Firebase CLI**

```bash
npm install -g firebase-tools
firebase login
```

2. **Initialiser Functions**

```bash
firebase init functions
# Choisir TypeScript ou JavaScript
# Installer ESLint
```

3. **Développer les Functions**

```bash
cd functions
npm install firebase-admin @google-cloud/aiplatform
```

4. **Déployer**

```bash
firebase deploy --only functions
```

### Étapes Frontend

1. **Build Production**

```bash
cd frontend
npm run build
```

2. **Déployer sur Firebase Hosting**

```bash
firebase deploy --only hosting
```

3. **Ou déployer sur Vercel/Netlify**

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

---

## 📞 Support & Questions

### Pour les Développeurs Backend

Si vous avez des questions sur :
- **Structure des données** : Référez-vous à la section [Structure des Données](#-structure-des-données)
- **Types TypeScript** : Copiez `/src/types/index.ts` du frontend
- **Real-time updates** : Voir [Real-time Subscriptions](#-real-time-subscriptions)
- **Security Rules** : Voir [Firestore Security Rules](#-firestore-security-rules)

### Ressources Officielles

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Vertex AI Agent Builder](https://cloud.google.com/vertex-ai/docs/generative-ai/agent-builder/overview)
- [Cloud Functions](https://firebase.google.com/docs/functions)

---

## ✅ Checklist Backend

Avant de dire "intégration complète", vérifiez :

- [ ] Firebase Admin SDK configuré
- [ ] Cloud Functions déployées
- [ ] Collection `processes` créée avec bon schéma
- [ ] Sous-collections `activity_logs`, `chat_messages`, `decisions` créées
- [ ] Security Rules configurées et testées
- [ ] Vertex AI Agent connecté
- [ ] Triggers Firestore opérationnels (onCreate, onUpdate)
- [ ] Tests d'intégration frontend ↔ backend réussis
- [ ] Variables d'environnement configurées
- [ ] Logs backend visibles dans Cloud Logging

---

**Développé avec ❤️ pour le Hackathon Google Cloud 2025**  
**Powered by Vertex AI Agent Builder** 🚀

---

**Questions ou blocages ?** Contactez l'équipe frontend :  
📧 Email : esdras.gbedozin@example.com  
💬 Slack : #simplif-ia-dev
