# SimplifIA - Assistant Intelligent pour Démarches Administratives

## Vue d'ensemble

SimplifIA est une plateforme d'assistance administrative basée sur l'intelligence artificielle. Elle permet aux citoyens de réaliser leurs démarches administratives françaises de manière conversationnelle, guidée et automatisée.

Le système utilise Vertex AI de Google Cloud pour comprendre les besoins des utilisateurs et orchestrer des workflows complexes impliquant plusieurs organismes administratifs (CAF, Préfecture, services fiscaux, etc.).

### Objectifs

- Simplifier l'accès aux services administratifs français
- Réduire la fracture numérique par une interface conversationnelle
- Automatiser les tâches répétitives et chronophages
- Garantir la transparence et le contrôle utilisateur à chaque étape

---

## Architecture

### Vue d'ensemble technique

```
Frontend (React + TypeScript + Vite)
    |
    v
Firebase Hosting
    |
    v
Cloud Firestore (Base de données temps réel)
    |
    v
Cloud Functions (Node.js 22)
    |
    v
Vertex AI (Analyse conversationnelle)
```

### Stack technologique

**Frontend**
- React 19.1 avec TypeScript
- Vite comme bundler
- Material UI pour l'interface
- Zustand pour la gestion d'état
- Firebase SDK pour l'authentification et Firestore

**Backend**
- Cloud Functions (2ème génération, Node.js 22)
- Firestore pour le stockage des données
- Vertex AI pour le traitement du langage naturel
- Firebase Authentication

**Infrastructure**
- Hébergement: Firebase Hosting
- Région: us-central1
- Base de données: Cloud Firestore
- CDN: Firebase CDN global

---

## Structure du projet

```
demo-repository/
├── frontend/                      # Application React
│   ├── src/
│   │   ├── components/           # Composants React
│   │   │   ├── chat/            # Interface de chat
│   │   │   ├── dashboard/       # Tableau de bord
│   │   │   ├── onboarding/      # Parcours d'accueil
│   │   │   └── layout/          # Composants de mise en page
│   │   ├── pages/               # Pages principales
│   │   ├── services/            # Services Firebase
│   │   ├── hooks/               # React hooks personnalisés
│   │   ├── stores/              # Stores Zustand
│   │   ├── config/              # Configuration Firebase
│   │   └── types/               # Types TypeScript
│   ├── public/                  # Ressources statiques
│   ├── package.json
│   └── vite.config.ts
│
├── simplifia-backend/
│   ├── functions/               # Cloud Functions
│   │   ├── src/
│   │   │   ├── agents/         # Agents IA
│   │   │   │   ├── chat.ts    # Agent conversationnel
│   │   │   │   ├── navigator.ts # Agent de navigation
│   │   │   │   └── validator.ts # Agent de validation
│   │   │   ├── services/       # Services métier
│   │   │   │   ├── orchestrator.ts # Orchestration workflow
│   │   │   │   └── vertex-ai.ts    # Service Vertex AI
│   │   │   ├── middleware/     # Middlewares
│   │   │   ├── utils/          # Utilitaires
│   │   │   └── index.ts        # Point d'entrée
│   │   └── package.json
│   ├── firestore.rules         # Règles de sécurité Firestore
│   └── firebase.json
│
└── README.md                    # Ce fichier
```

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé:

- Node.js 20.x ou supérieur
- npm ou yarn
- Firebase CLI: `npm install -g firebase-tools`
- Git

---

## Installation et lancement du projet

### 1. Cloner le repository

```bash
git clone <url-du-repository>
cd demo-repository
```

### 2. Configuration Firebase (Frontend)

Le frontend nécessite un fichier de configuration Firebase. Créez le fichier suivant:

**Fichier: `frontend/.env.local`**

```bash
# Configuration Firebase
# Ces clés sont spécifiques au projet simplifia-hackathon

VITE_FIREBASE_API_KEY=AIzaSyCNEYSzmKmodOdwGnOa8qJhmrrl2XMaSSU
VITE_FIREBASE_AUTH_DOMAIN=simplifia-hackathon.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=simplifia-hackathon
VITE_FIREBASE_STORAGE_BUCKET=simplifia-hackathon.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1072547192315
VITE_FIREBASE_APP_ID=1:1072547192315:web:bbbdeb6b4eff240f18ff5e
VITE_FIREBASE_MEASUREMENT_ID=G-KKVSF8QVHK
```

**Note importante:** Ce fichier est dans le `.gitignore` et ne doit pas être commité. Les valeurs ci-dessus sont celles du projet de démonstration.

### 3. Installation et lancement du Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur: http://localhost:5173

### 4. Installation et lancement du Backend (optionnel en local)

Le backend tourne sur Cloud Functions. Pour le développement local:

```bash
cd simplifia-backend/functions
npm install
npm run build
```

Pour tester les fonctions localement avec les émulateurs Firebase:

```bash
cd simplifia-backend
firebase emulators:start
```

### 5. Connexion à Firebase

Pour déployer ou utiliser les services Firebase:

```bash
firebase login
firebase use simplifia-hackathon
```

---

## Scripts disponibles

### Frontend

```bash
npm run dev          # Démarre le serveur de développement
npm run build        # Compile l'application pour la production
npm run preview      # Prévisualise la version de production
npm run lint         # Vérifie le code avec ESLint
npm run test         # Lance les tests avec Vitest
```

### Backend

```bash
npm run build        # Compile le TypeScript en JavaScript
npm run deploy       # Déploie les Cloud Functions
npm run logs         # Affiche les logs des fonctions
npm run serve        # Démarre les émulateurs Firebase locaux
```

---

## Architecture des agents

SimplifIA utilise une architecture multi-agents orchestrée:

### ChatAgent
- Gère la conversation avec l'utilisateur
- Analyse l'intention via Vertex AI
- Collecte les informations nécessaires
- Valide la complétude des données avant de créer un processus

### NavigatorAgent
- Simule la navigation sur les sites administratifs
- Identifie les formulaires à remplir
- Gère les connexions aux portails (CAF, Impots.gouv, etc.)

### ValidatorAgent
- Vérifie la cohérence des données saisies
- Valide les formats (dates, codes postaux, emails, etc.)
- Détecte les incohérences avant soumission

### ProcessOrchestrator
- Coordonne l'exécution séquentielle des agents
- Gère les tentatives et la récupération d'erreurs
- Implémente un circuit breaker pour éviter les boucles infinies
- Enregistre les métriques de performance

---

## Flux de données

```
1. Utilisateur envoie un message dans le chat
   |
   v
2. ChatAgent analyse avec Vertex AI
   |
   v
3. ChatAgent collecte les informations manquantes
   |
   v
4. Création d'un document "processes" dans Firestore
   |
   v
5. Trigger Firebase: onProcessCreated
   |
   v
6. ProcessOrchestrator.executeWorkflow()
   |
   v
7. NavigatorAgent -> ValidatorAgent -> Completion
   |
   v
8. Mise à jour en temps réel du tableau de bord
```

---

## Firestore - Collections principales

### processes
Stocke les processus de démarches administratives en cours.

```typescript
{
  id: string
  sessionId: string           // ID de session chat
  userId: string              // ID utilisateur Firebase Auth
  title: string               // Titre de la démarche
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  steps: Array<{
    title: string
    status: 'pending' | 'in-progress' | 'completed' | 'failed'
  }>
  userContext: Record<string, any>  // Données collectées
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### messages
Messages du chat entre l'utilisateur et l'agent.

```typescript
{
  id: string
  sessionId: string
  sender: 'user' | 'agent'
  content: string
  timestamp: Timestamp
  metadata?: {
    intent?: string
    confidence?: number
  }
}
```

### activity_logs
Journal d'activité pour le tableau de bord.

```typescript
{
  id: string
  processId: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: string
  timestamp: Timestamp
}
```

---

## Déploiement

### Déploiement complet

```bash
# Backend (Cloud Functions + Firestore Rules)
cd simplifia-backend
firebase deploy --only functions,firestore:rules

# Frontend (Firebase Hosting)
cd frontend
npm run build
firebase deploy --only hosting
```

### Déploiement partiel

```bash
# Seulement les fonctions
firebase deploy --only functions

# Seulement les règles Firestore
firebase deploy --only firestore:rules

# Seulement le hosting
firebase deploy --only hosting
```

---

## Configuration Vertex AI

Le backend utilise Vertex AI pour l'analyse conversationnelle. La configuration se trouve dans:

- **Projet GCP**: simplifia-hackathon
- **Région**: us-central1
- **Modèle**: gemini-1.5-flash-002

Les identifiants sont gérés automatiquement par les Cloud Functions via le service account par défaut.

---

## Sécurité - Règles Firestore

Les règles de sécurité Firestore permettent:

- Lecture/écriture des messages si l'utilisateur est authentifié
- Lecture/mise à jour des processus par sessionId
- Lecture/création des logs d'activité
- Toute opération nécessite une authentification Firebase

Fichier: `simplifia-backend/firestore.rules`

---

## Variables d'environnement

### Frontend (.env.local)

Toutes les variables commencent par `VITE_` pour être exposées au frontend:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Backend

Le backend n'a pas besoin de fichier .env en production. Les Cloud Functions utilisent automatiquement les credentials du projet Firebase.

Pour le développement local, un fichier `functions/.env.example` est disponible.

---

## Dépannage

### Problème: "Missing or insufficient permissions"

**Solution**: Vérifiez que vous êtes bien authentifié:
```bash
firebase login
firebase use simplifia-hackathon
```

### Problème: Les messages du chat ne s'affichent pas

**Solution**: Vérifiez que:
1. Le frontend est bien connecté à Firebase (voir console du navigateur)
2. Les règles Firestore autorisent la lecture
3. L'utilisateur est authentifié

### Problème: Les Cloud Functions ne se déclenchent pas

**Solution**: Vérifiez les logs:
```bash
firebase functions:log
```

Ou dans la console GCP: Cloud Functions > Logs

### Problème: Build error avec Vite

**Solution**: Nettoyez et réinstallez:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Tests

### Frontend

```bash
cd frontend
npm run test              # Lance les tests une fois
npm run test:watch        # Mode watch
npm run test:coverage     # Avec couverture de code
```

### Backend

Les tests backend utilisent les émulateurs Firebase:

```bash
cd simplifia-backend/functions
npm run serve
```

---

## Structure des composants React

### Composants principaux

- **ChatInterface**: Interface de chat avec l'agent
- **DashboardPage**: Tableau de bord avec processus et logs
- **ProcessTimeline**: Affichage visuel des étapes d'un processus
- **ActivityLogList**: Liste filtrée des logs d'activité

### Hooks personnalisés

- **useSessionManager**: Gestion de la session chat
- **useNotifications**: Gestion des notifications toast
- **useThemeMode**: Mode clair/sombre

### Services

- **firestore.ts**: Opérations CRUD sur Firestore
- **realtime.ts**: Abonnements temps réel (onSnapshot)

---

## Technologies utilisées

### Frontend
- React 19.1
- TypeScript 5.9
- Vite (bundler)
- Material UI 7
- Zustand (state management)
- React Router 7
- Framer Motion (animations)
- Firebase SDK 12

### Backend
- Node.js 22
- TypeScript 5.7
- Firebase Admin SDK 12
- Firebase Functions 6 (2nd gen)
- Vertex AI SDK 1.7
- Express 4

### Infrastructure
- Firebase Hosting
- Cloud Functions
- Cloud Firestore
- Firebase Authentication
- Vertex AI

---

## Fonctionnalités principales

### 1. Chat conversationnel
L'utilisateur peut discuter naturellement avec l'agent pour décrire sa démarche administrative.

### 2. Collecte intelligente d'informations
L'agent identifie automatiquement les informations manquantes et les demande de manière contextuelle.

### 3. Orchestration de workflow
Une fois les informations collectées, le système crée un processus et orchestre les différentes étapes automatiquement.

### 4. Tableau de bord temps réel
L'utilisateur peut suivre en temps réel l'avancement de ses démarches avec un journal d'activité détaillé.

### 5. Types de démarches supportées
- Aide au logement (APL/CAF)
- Déclaration de naissance
- Passeport / Carte d'identité
- Déclaration d'impôts
- RSA / Aides sociales

---

## URLs importantes

- **Application production**: https://simplifia-hackathon.web.app
- **Console Firebase**: https://console.firebase.google.com/project/simplifia-hackathon
- **Console GCP**: https://console.cloud.google.com/

---

## Support et contribution

Ce projet a été développé dans le cadre d'un hackathon Google Agentic AI.

Pour toute question technique, consultez:
- Les logs Firebase: `firebase functions:log`
- La console Firestore pour l'état des données
- Les DevTools du navigateur (onglet Console et Network)

---

## Licence

MIT

## Note sur la souveraineté des données

**État actuel**: Le projet utilise la région `us-central1` pour des raisons de compatibilité maximale avec tous les services Google Cloud (Vertex AI, Cloud Functions Gen 2).

**Plan de migration**: Pour une mise en production réelle, une migration vers `europe-west1` (Belgique) est prévue afin de garantir la conformité RGPD et la souveraineté des données européennes. Cette migration nécessite:
- La création d'un nouveau projet Firebase
- Le déploiement de Firestore en région européenne
- La reconfiguration de Vertex AI
- La migration des données utilisateurs

**Estimation**: 4 heures de travail, faisable sans interruption de service via une migration progressive.

