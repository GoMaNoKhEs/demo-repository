# 🚀 ROADMAP BACKEND SIMPLIFIA - Migration vers Firebase/Cloud Functions

**Objectif** : Migrer le backend actuel (Flask + PostgreSQL) vers une architecture Firebase/Firestore compatible avec le frontend existant.

---

## 📊 ÉTAT ACTUEL vs CIBLE

### ❌ **Architecture Actuelle**
- **Backend** : Flask (Python) + SQLAlchemy
- **Base de données** : PostgreSQL
- **Auth** : Custom avec firebase_uid
- **Communication** : REST API classique
- **Temps réel** : Aucun

### ✅ **Architecture Cible**
- **Backend** : Firebase Cloud Functions (Python/Node.js)
- **Base de données** : Firestore (NoSQL)
- **Auth** : Firebase Authentication
- **Communication** : Firestore SDK + Cloud Functions
- **Temps réel** : Firestore listeners automatiques

---

## 🗓️ PLANNING GÉNÉRAL (8 semaines)

| Phase | Durée | Description |
|-------|-------|-------------|
| **Phase 1** | Semaine 1-2 | Setup Firebase et migration des données |
| **Phase 2** | Semaine 3-4 | Cloud Functions de base et authentification |
| **Phase 3** | Semaine 5-6 | Agents IA et logique métier |
| **Phase 4** | Semaine 7-8 | Tests, optimisation et déploiement |

---

## 📋 PHASE 1 : SETUP FIREBASE & MIGRATION DES DONNÉES

### 🎯 **Tâche 1.1 : Configuration Firebase Backend**
**Durée** : 2 jours  
**Priorité** : CRITIQUE

#### Actions :
- [ ] Créer projet Firebase (si pas déjà fait)
- [ ] Activer Firestore Database
- [ ] Configurer les règles de sécurité Firestore
- [ ] Activer Firebase Authentication (Google, Email/Password)
- [ ] Configurer Firebase Functions
- [ ] Setup du SDK Admin Firebase

#### Fichiers à créer :
```
simplifia-backend/
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
└── functions/
    ├── package.json
    ├── index.js (ou index.py si Python)
    └── src/
```

#### Commandes :
```bash
firebase login
firebase init functions
firebase init firestore
npm install firebase-admin
```

---

### 🎯 **Tâche 1.2 : Définition du Schéma Firestore**
**Durée** : 1 jour  
**Priorité** : CRITIQUE

#### Collections Firestore à créer :

```typescript
// Collection: users
/users/{userId}
{
  id: string,
  email: string,
  displayName: string,
  photoURL?: string,
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
  preferences?: {
    theme: 'light' | 'dark',
    notifications: boolean
  },
  stats?: {
    totalProcesses: number,
    completedProcesses: number,
    timeSaved: number // en secondes
  }
}

// Collection: processes
/processes/{processId}
{
  id: string,
  userId: string,
  sessionId: string,
  title: string,
  description: string,
  status: 'created' | 'running' | 'paused' | 'completed' | 'failed',
  currentStepIndex: number,
  steps: ProcessStep[],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  completedAt?: Timestamp,
  metadata?: {
    userContext?: string,
    detectedScenario?: string,
    confidence?: number
  }
}

// Sous-collection: activity_logs
/processes/{processId}/activity_logs/{logId}
{
  id: string,
  processId: string,
  timestamp: Timestamp,
  type: 'info' | 'success' | 'warning' | 'error',
  message: string,
  details?: any,
  stepId?: string
}

// Sous-collection: chat_messages
/processes/{processId}/chat_messages/{messageId}
{
  id: string,
  role: 'user' | 'agent' | 'system',
  content: string,
  timestamp: Timestamp,
  metadata?: {
    actionId?: string,
    stepId?: string,
    attachments?: string[],
    suggestedActions?: string[]
  }
}

// Sous-collection: decisions
/processes/{processId}/decisions/{decisionId}
{
  id: string,
  processId: string,
  stepId: string,
  question: string,
  description: string,
  options: DecisionOption[],
  timestamp: Timestamp,
  resolved: boolean,
  userChoice?: string,
  riskLevel: 'critical' | 'warning' | 'info'
}
```

---

### 🎯 **Tâche 1.3 : Script de Migration des Données**
**Durée** : 2 jours  
**Priorité** : HAUTE

#### Actions :
- [ ] Créer script Python pour exporter données PostgreSQL
- [ ] Mapper les données existantes vers le nouveau schéma
- [ ] Créer script d'import vers Firestore
- [ ] Tester la migration sur un subset de données

#### Mapping des données :
```python
# PostgreSQL -> Firestore
users -> /users/{firebase_uid}
sessions -> /processes/{sessionId} (avec transformation)
tasks -> intégré dans processes.steps
task_logs -> /processes/{processId}/activity_logs/{logId}
```

---

## 📋 PHASE 2 : CLOUD FUNCTIONS DE BASE

### 🎯 **Tâche 2.1 : Authentification et Gestion Utilisateurs**
**Durée** : 2 jours  
**Priorité** : CRITIQUE

#### Functions à créer :

```javascript
// functions/src/auth.js
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Créer document utilisateur dans Firestore
  await admin.firestore().collection('users').doc(user.uid).set({
    id: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    stats: {
      totalProcesses: 0,
      completedProcesses: 0,
      timeSaved: 0
    }
  });
});

exports.onUserLogin = functions.https.onCall(async (data, context) => {
  // Mettre à jour lastLoginAt
  const userId = context.auth?.uid;
  if (!userId) throw new Error('Non authentifié');
  
  await admin.firestore().collection('users').doc(userId).update({
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

---

### 🎯 **Tâche 2.2 : CRUD Processus**
**Durée** : 3 jours  
**Priorité** : CRITIQUE

#### Functions à créer :

```javascript
// functions/src/processes.js

// Créer un nouveau processus
exports.createProcess = functions.https.onCall(async (data, context) => {
  const { title, description, userContext } = data;
  const userId = context.auth?.uid;
  
  if (!userId) throw new Error('Non authentifié');
  
  const processDoc = {
    userId,
    sessionId: `session_${Date.now()}`,
    title,
    description,
    status: 'created',
    currentStepIndex: 0,
    steps: await generateProcessSteps(userContext),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      userContext,
      detectedScenario: await detectScenario(userContext),
      confidence: 85
    }
  };
  
  const docRef = await admin.firestore().collection('processes').add(processDoc);
  
  // Déclencher l'agent IA
  await triggerAgent(docRef.id);
  
  return { processId: docRef.id };
});

// Mettre à jour le statut d'un processus
exports.updateProcessStatus = functions.https.onCall(async (data, context) => {
  const { processId, status, currentStepIndex } = data;
  const userId = context.auth?.uid;
  
  await admin.firestore().collection('processes').doc(processId).update({
    status,
    currentStepIndex,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(status === 'completed' && {
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  });
});

// Trigger automatique sur création de processus
exports.onProcessCreate = functions.firestore
  .document('processes/{processId}')
  .onCreate(async (snap, context) => {
    const processId = context.params.processId;
    console.log(`Nouveau processus créé: ${processId}`);
    
    // Démarrer l'agent IA automatiquement
    await startAgentForProcess(processId);
  });
```

---

### 🎯 **Tâche 2.3 : Gestion des Logs et Messages**
**Durée** : 2 jours  
**Priorité** : HAUTE

#### Functions à créer :

```javascript
// functions/src/logs.js

// Ajouter un log d'activité
exports.addActivityLog = functions.https.onCall(async (data, context) => {
  const { processId, type, message, details, stepId } = data;
  
  await admin.firestore()
    .collection('processes').doc(processId)
    .collection('activity_logs').add({
      processId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type,
      message,
      details: details || null,
      stepId: stepId || null
    });
});

// Ajouter un message de chat
exports.addChatMessage = functions.https.onCall(async (data, context) => {
  const { processId, role, content, metadata } = data;
  const userId = context.auth?.uid;
  
  const message = {
    processId,
    role,
    content,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: metadata || {}
  };
  
  await admin.firestore()
    .collection('processes').doc(processId)
    .collection('chat_messages').add(message);
    
  // Si c'est un message utilisateur, déclencher l'agent
  if (role === 'user') {
    await triggerAgentResponse(processId, content);
  }
});
```

---

## 📋 PHASE 3 : AGENTS IA ET LOGIQUE MÉTIER

### 🤖 **ARCHITECTURE MULTI-AGENTS IA**

L'architecture repose sur **6 agents IA spécialisés** utilisant **Vertex AI** avec des modèles et prompts optimisés pour chaque tâche administrative.

---

### 🎯 **Tâche 3.1 : Configuration Vertex AI et Modèles**
**Durée** : 2 jours  
**Priorité** : CRITIQUE

#### Modèles IA à utiliser :

```javascript
// functions/src/config/ai-models.js

const AI_MODELS = {
  // Agent Analyseur - Compréhension de contexte
  ANALYZER: {
    model: 'gemini-1.5-pro',
    location: 'europe-west9',
    temperature: 0.3,
    maxTokens: 2048,
    topP: 0.8,
    topK: 40
  },
  
  // Agent Navigateur - Analyse de pages web
  NAVIGATOR: {
    model: 'gemini-1.5-pro',
    location: 'europe-west9', 
    temperature: 0.1, // Très précis pour sélecteurs
    maxTokens: 1024,
    topP: 0.9,
    topK: 20
  },
  
  // Agent Remplisseur - Mapping de données
  FORM_FILLER: {
    model: 'gemini-1.0-pro', // Moins coûteux pour tâches simples
    location: 'europe-west9',
    temperature: 0.2,
    maxTokens: 512,
    topP: 0.8,
    topK: 30
  },
  
  // Agent Validateur - Décisions critiques
  VALIDATOR: {
    model: 'gemini-1.5-pro',
    location: 'europe-west9',
    temperature: 0.1, // Maximum de précision
    maxTokens: 1024,
    topP: 0.9,
    topK: 20
  },
  
  // Agent Conversationnel - Chat avec utilisateur
  CHAT: {
    model: 'gemini-1.5-pro',
    location: 'europe-west9',
    temperature: 0.7, // Plus créatif pour conversation
    maxTokens: 1024,
    topP: 0.9,
    topK: 40
  },
  
  // Agent Moniteur - Analyse de statuts
  MONITOR: {
    model: 'gemini-1.0-pro',
    location: 'europe-west9',
    temperature: 0.2,
    maxTokens: 512,
    topP: 0.8,
    topK: 30
  }
};

// Service IA centralisé
class VertexAIService {
  constructor() {
    this.vertex = new VertexAI({
      project: process.env.VERTEX_AI_PROJECT_ID,
      location: 'europe-west9'
    });
  }

  async generateResponse(agentType, prompt, context = {}) {
    const config = AI_MODELS[agentType];
    
    const request = {
      endpoint: `projects/${process.env.VERTEX_AI_PROJECT_ID}/locations/${config.location}/publishers/google/models/${config.model}`,
      instances: [{
        content: prompt,
        context: JSON.stringify(context),
        parameters: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          topP: config.topP,
          topK: config.topK
        }
      }]
    };

    const [response] = await this.vertex.predict(request);
    return response.predictions[0].content;
  }
}
```

---

### 🎯 **Tâche 3.2 : Agent IA Analyseur (Détection de Scénario)**
**Durée** : 3 jours  
**Priorité** : CRITIQUE

#### Responsabilités :
- **Analyser le contexte utilisateur** avec IA
- **Détecter automatiquement** le type de démarche administrative
- **Identifier les documents** nécessaires via IA
- **Générer un plan d'étapes** personnalisé

```javascript
// functions/src/agents/ai-analyzer.js

class AIAnalyzerAgent {
  constructor() {
    this.aiService = new VertexAIService();
    this.scenarios = [
      'birth_declaration', 'marriage_license', 'passport_renewal',
      'driving_license', 'residence_permit', 'tax_declaration',
      'business_registration', 'housing_aid', 'unemployment_benefits',
      'family_allowance', 'health_insurance', 'retirement_pension'
    ];
  }

  async analyzeUserContext(userContext, userId) {
    const prompt = `
Tu es un expert IA en démarches administratives françaises. 

CONTEXTE UTILISATEUR : "${userContext}"

SCÉNARIOS POSSIBLES :
${this.scenarios.map(s => `- ${s}`).join('\n')}

MISSION :
1. Analyse le contexte et détermine la démarche la plus probable
2. Évalue ta confiance (0-100%)
3. Liste les documents nécessaires
4. Estime la durée totale
5. Génère un plan détaillé avec 6 étapes maximum

RÉPONSE OBLIGATOIRE EN JSON :
{
  "scenario": "scenario_detecte",
  "confidence": 85,
  "title": "Titre de la démarche",
  "description": "Description courte",
  "estimatedDuration": 45,
  "requiredDocuments": [
    {
      "name": "Carte d'identité",
      "required": true,
      "description": "Pièce d'identité en cours de validité"
    }
  ],
  "steps": [
    {
      "id": "step_1",
      "title": "Préparation des documents",
      "description": "Rassembler les pièces justificatives",
      "type": "preparation",
      "estimatedTime": 10,
      "aiActions": ["document_verification"]
    },
    {
      "id": "step_2", 
      "title": "Navigation vers le site officiel",
      "description": "Accès au portail administratif",
      "type": "navigation",
      "targetUrl": "https://site-officiel.gouv.fr",
      "estimatedTime": 5,
      "aiActions": ["page_analysis", "form_detection"]
    },
    {
      "id": "step_3",
      "title": "Remplissage du formulaire",
      "description": "Complétion automatique des champs",
      "type": "form_filling", 
      "estimatedTime": 15,
      "aiActions": ["field_mapping", "data_validation"]
    },
    {
      "id": "step_4",
      "title": "Vérification et validation",
      "description": "Contrôle des informations saisies",
      "type": "validation",
      "estimatedTime": 10,
      "aiActions": ["data_review", "critical_decision"]
    },
    {
      "id": "step_5",
      "title": "Soumission officielle",
      "description": "Envoi du dossier complet",
      "type": "submission",
      "estimatedTime": 5,
      "aiActions": ["form_submission", "confirmation_capture"]
    }
  ],
  "riskLevel": "medium",
  "legalWarning": "Cette démarche engage votre responsabilité légale"
}

IMPORTANT : 
- Sois précis et réaliste
- Adapte les étapes au scénario détecté
- La réponse doit être au format JSON exact`;

    const response = await this.aiService.generateResponse('ANALYZER', prompt, {
      userContext,
      userId,
      timestamp: new Date().toISOString()
    });

    return JSON.parse(response);
  }

  async refineAnalysis(initialAnalysis, userFeedback) {
    const prompt = `
ANALYSE INITIALE :
${JSON.stringify(initialAnalysis, null, 2)}

RETOUR UTILISATEUR : "${userFeedback}"

Affine l'analyse en tenant compte du feedback utilisateur.
Garde le même format JSON mais ajuste :
- Le scénario si nécessaire
- Les étapes selon les précisions
- La confiance selon la pertinence
- Les documents requis

RÉPONSE JSON AFFINÉE :`;

    const response = await this.aiService.generateResponse('ANALYZER', prompt, {
      initialAnalysis,
      userFeedback
    });

    return JSON.parse(response);
  }
}

// Cloud Function pour déclencher l'analyse
exports.analyzeUserRequest = functions.https.onCall(async (data, context) => {
  const { userContext } = data;
  const userId = context.auth?.uid;
  
  if (!userId) throw new Error('Non authentifié');
  
  const analyzer = new AIAnalyzerAgent();
  const analysis = await analyzer.analyzeUserContext(userContext, userId);
  
  // Sauvegarder l'analyse
  const processDoc = {
    userId,
    sessionId: `session_${Date.now()}`,
    title: analysis.title,
    description: analysis.description,
    status: 'created',
    currentStepIndex: 0,
    steps: analysis.steps.map((step, index) => ({
      ...step,
      order: index,
      status: 'pending'
    })),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      userContext,
      detectedScenario: analysis.scenario,
      confidence: analysis.confidence,
      estimatedDuration: analysis.estimatedDuration,
      requiredDocuments: analysis.requiredDocuments,
      riskLevel: analysis.riskLevel
    }
  };
  
  const docRef = await admin.firestore().collection('processes').add(processDoc);
  
  return { 
    processId: docRef.id,
    analysis 
  };
});
```

---

### 🎯 **Tâche 3.3 : Agent IA Navigateur (Analyse de Pages Web)**
**Durée** : 4 jours  
**Priorité** : HAUTE

#### Responsabilités :
- **Analyser les pages web** avec IA pour comprendre la structure
- **Générer des sélecteurs CSS** automatiquement
- **Identifier les formulaires** et champs avec IA
- **Détecter les erreurs** et obstacles

```javascript
// functions/src/agents/ai-navigator.js

const puppeteer = require('puppeteer');

class AINavigatorAgent {
  constructor() {
    this.aiService = new VertexAIService();
    this.browser = null;
    this.page = null;
  }

  async analyzePageWithAI(targetUrl, objective) {
    try {
      await this.initBrowser();
      await this.navigateToPage(targetUrl);
      
      // Extraire le HTML de la page
      const pageHTML = await this.extractPageStructure();
      
      // Analyser avec IA
      const analysis = await this.getAIPageAnalysis(pageHTML, objective);
      
      // Prendre une capture d'écran
      const screenshot = await this.takeScreenshot();
      
      return {
        status: 'completed',
        analysis,
        screenshot,
        pageInfo: {
          url: targetUrl,
          title: await this.page.title(),
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getAIPageAnalysis(pageHTML, objective) {
    const prompt = `
Tu es un expert IA en analyse de pages web administratives françaises.

OBJECTIF : ${objective}

PAGE HTML (extrait) :
${pageHTML.substring(0, 4000)}

ANALYSE DEMANDÉE :
1. Type de page (accueil, formulaire, authentification, confirmation, erreur)
2. Éléments clés détectés
3. Sélecteurs CSS précis pour les actions
4. Obstacles potentiels
5. Prochaines étapes recommandées

RÉPONSE JSON OBLIGATOIRE :
{
  "pageType": "form|auth|home|confirmation|error|loading",
  "title": "Titre de la page",
  "mainForm": {
    "detected": true,
    "selector": "#main-form",
    "action": "/submit",
    "method": "POST"
  },
  "keyElements": [
    {
      "type": "input|button|link|select",
      "label": "Nom du champ",
      "selector": "#element-id",
      "required": true,
      "inputType": "text|email|tel|date"
    }
  ],
  "actions": [
    {
      "name": "fill_form",
      "description": "Remplir le formulaire principal",
      "selectors": {
        "firstName": "#prenom",
        "lastName": "#nom",
        "email": "#email"
      }
    },
    {
      "name": "submit",
      "description": "Soumettre le formulaire",
      "selector": "#submit-btn",
      "waitFor": "#confirmation"
    }
  ],
  "obstacles": [
    {
      "type": "captcha|auth|validation",
      "description": "Description de l'obstacle",
      "severity": "low|medium|high",
      "solution": "Stratégie de contournement"
    }
  ],
  "nextSteps": [
    "Action 1 à effectuer",
    "Action 2 à effectuer"
  ],
  "confidence": 90
}

IMPORTANT :
- Fournis des sélecteurs CSS précis et testables
- Identifie tous les champs obligatoires
- Détecte les validations côté client
- Repère les éléments de sécurité (CAPTCHA, etc.)`;

    const response = await this.aiService.generateResponse('NAVIGATOR', prompt, {
      objective,
      pageUrl: this.page.url()
    });

    return JSON.parse(response);
  }

  async extractPageStructure() {
    return await this.page.evaluate(() => {
      // Nettoyer et extraire le HTML pertinent
      const removeNoise = (element) => {
        // Supprimer scripts, styles, commentaires
        const scripts = element.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        
        // Garder seulement les éléments interactifs et texte
        const keepTags = ['form', 'input', 'button', 'select', 'textarea', 'a', 'h1', 'h2', 'h3', 'label', 'div', 'span', 'p'];
        return element.innerHTML;
      };
      
      return removeNoise(document.body);
    });
  }

  async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    this.page = await this.browser.newPage();
    
    // Simuler un navigateur réel
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await this.page.setViewport({ width: 1366, height: 768 });
  }

  async takeScreenshot() {
    const buffer = await this.page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    
    // Sauvegarder dans Cloud Storage
    const fileName = `screenshots/${Date.now()}.png`;
    // TODO: Upload to Cloud Storage
    
    return fileName;
  }
}

// Cloud Function pour analyser une page
exports.analyzePage = functions.https.onCall(async (data, context) => {
  const { processId, stepId, targetUrl, objective } = data;
  const userId = context.auth?.uid;
  
  if (!userId) throw new Error('Non authentifié');
  
  const navigator = new AINavigatorAgent();
  const result = await navigator.analyzePageWithAI(targetUrl, objective);
  
  // Sauvegarder l'analyse
  await admin.firestore()
    .collection('processes').doc(processId)
    .collection('activity_logs').add({
      type: 'info',
      message: `Page analysée: ${targetUrl}`,
      details: result,
      stepId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  
  return result;
});
```

---

### 🎯 **Tâche 3.4 : Agent IA Remplisseur de Formulaires**
**Durée** : 4 jours  
**Priorité** : HAUTE

#### Responsabilités :
- **Mapper intelligemment** les données utilisateur aux champs
- **Valider automatiquement** les formats avec IA  
- **Gérer les champs conditionnels** via logique IA
- **Détecter les erreurs** de validation

```javascript
// functions/src/agents/ai-form-filler.js

class AIFormFillerAgent {
  constructor() {
    this.aiService = new VertexAIService();
  }

  async fillFormWithAI(formStructure, userData, context) {
    // Analyser la structure du formulaire avec IA
    const mapping = await this.getAIFieldMapping(formStructure, userData);
    
    // Valider les données avec IA
    const validation = await this.validateDataWithAI(mapping, formStructure);
    
    if (!validation.isValid) {
      return {
        status: 'validation_error',
        errors: validation.errors,
        suggestions: validation.suggestions
      };
    }
    
    return {
      status: 'completed',
      filledData: mapping.fieldValues,
      confidence: mapping.confidence
    };
  }

  async getAIFieldMapping(formStructure, userData) {
    const prompt = `
Tu es un expert IA en remplissage automatique de formulaires administratifs français.

STRUCTURE DU FORMULAIRE :
${JSON.stringify(formStructure, null, 2)}

DONNÉES UTILISATEUR :
${JSON.stringify(userData, null, 2)}

MISSION :
1. Mappe chaque champ du formulaire avec les données utilisateur
2. Respecte les formats exacts demandés
3. Gère les variations de noms (prénom/firstName/given_name)
4. Convertis les dates au bon format
5. Applique les validations (email, téléphone, etc.)
6. Détecte les champs manquants

RÉPONSE JSON OBLIGATOIRE :
{
  "fieldValues": {
    "nom": "Dupont",
    "prenom": "Jean", 
    "email": "jean.dupont@email.com",
    "telephone": "0123456789",
    "date_naissance": "15/03/1985",
    "adresse": "123 Rue de la Paix, 75001 Paris"
  },
  "missingFields": [
    {
      "fieldName": "numero_secu",
      "description": "Numéro de sécurité sociale",
      "required": true,
      "format": "15 digits"
    }
  ],
  "formatConversions": [
    {
      "field": "date_naissance", 
      "original": "1985-03-15",
      "converted": "15/03/1985",
      "reason": "Format français DD/MM/YYYY requis"
    }
  ],
  "validationWarnings": [
    {
      "field": "telephone",
      "warning": "Format recommandé: 01 23 45 67 89",
      "current": "0123456789"
    }
  ],
  "confidence": 85
}

RÈGLES IMPORTANTES :
- Respecte exactement les noms de champs du formulaire
- Formate selon les standards français
- Valide les emails, téléphones, codes postaux
- Signale les données manquantes obligatoires
- Propose des corrections si nécessaire`;

    const response = await this.aiService.generateResponse('FORM_FILLER', prompt, {
      formStructure,
      userData
    });

    return JSON.parse(response);
  }

  async validateDataWithAI(mapping, formStructure) {
    const prompt = `
Tu es un validateur IA expert pour formulaires administratifs français.

DONNÉES À VALIDER :
${JSON.stringify(mapping.fieldValues, null, 2)}

STRUCTURE DU FORMULAIRE :
${JSON.stringify(formStructure, null, 2)}

VALIDATION DEMANDÉE :
1. Vérifier tous les champs obligatoires
2. Valider les formats (email, téléphone, date, etc.)
3. Contrôler la cohérence des données
4. Détecter les erreurs potentielles
5. Proposer des corrections

RÉPONSE JSON OBLIGATOIRE :
{
  "isValid": true,
  "errors": [
    {
      "field": "email",
      "message": "Format email invalide",
      "severity": "error|warning",
      "suggestion": "Vérifiez l'adresse email"
    }
  ],
  "suggestions": [
    {
      "field": "telephone", 
      "current": "0123456789",
      "suggested": "01 23 45 67 89",
      "reason": "Format standard français"
    }
  ],
  "requiredFieldsMissing": ["numero_secu"],
  "confidenceScore": 90
}`;

    const response = await this.aiService.generateResponse('FORM_FILLER', prompt, {
      fieldValues: mapping.fieldValues,
      formStructure
    });

    return JSON.parse(response);
  }

  async handleConditionalFields(baseFields, conditionalRules, userData) {
    const prompt = `
Tu gères les champs conditionnels d'un formulaire administratif.

CHAMPS DE BASE REMPLIS :
${JSON.stringify(baseFields, null, 2)}

RÈGLES CONDITIONNELLES :
${JSON.stringify(conditionalRules, null, 2)}

DONNÉES UTILISATEUR :
${JSON.stringify(userData, null, 2)}

Détermine quels champs conditionnels doivent être affichés et remplis.

RÉPONSE JSON :
{
  "additionalFields": {
    "field_name": "value"
  },
  "hiddenFields": ["field1", "field2"],
  "triggers": [
    {
      "condition": "marital_status == 'married'",
      "showFields": ["spouse_name", "wedding_date"],
      "hideFields": ["single_declaration"]
    }
  ]
}`;

    const response = await this.aiService.generateResponse('FORM_FILLER', prompt);
    return JSON.parse(response);
  }
}

// Cloud Function pour remplir un formulaire
exports.fillForm = functions.https.onCall(async (data, context) => {
  const { processId, stepId, formStructure } = data;
  const userId = context.auth?.uid;
  
  if (!userId) throw new Error('Non authentifié');
  
  // Récupérer les données utilisateur
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  const formFiller = new AIFormFillerAgent();
  const result = await formFiller.fillFormWithAI(formStructure, userData, {
    processId,
    stepId
  });
  
  // Log de l'activité
  await admin.firestore()
    .collection('processes').doc(processId)
    .collection('activity_logs').add({
      type: result.status === 'completed' ? 'success' : 'warning',
      message: `Formulaire ${result.status === 'completed' ? 'rempli' : 'partiellement rempli'}`,
      details: result,
      stepId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  
  return result;
});
```

---

### 🎯 **Tâche 3.5 : Agent IA Validateur et Décisions Critiques**
**Durée** : 3 jours  
**Priorité** : HAUTE

#### Responsabilités :
- **Analyser les risques** avec IA avant soumission
- **Détecter les actions critiques** automatiquement
- **Générer des questions** de validation intelligentes
- **Évaluer l'impact** des décisions

```javascript
// functions/src/agents/ai-validator.js

class AIValidatorAgent {
  constructor() {
    this.aiService = new VertexAIService();
  }

  async validateActionWithAI(processData, stepData, proposedAction) {
    const riskAnalysis = await this.analyzeRiskWithAI(processData, stepData, proposedAction);
    
    if (riskAnalysis.requiresApproval) {
      // Créer une décision critique
      const decision = await this.generateCriticalDecision(riskAnalysis);
      await this.createDecisionInFirestore(processData.id, decision);
      
      return {
        status: 'waiting_approval',
        decision,
        riskLevel: riskAnalysis.riskLevel
      };
    }
    
    return {
      status: 'approved',
      riskLevel: riskAnalysis.riskLevel,
      autoApproved: true
    };
  }

  async analyzeRiskWithAI(processData, stepData, proposedAction) {
    const prompt = `
Tu es un expert IA en validation de démarches administratives critiques.

PROCESSUS EN COURS :
${JSON.stringify(processData, null, 2)}

ÉTAPE ACTUELLE :
${JSON.stringify(stepData, null, 2)}

ACTION PROPOSÉE :
${JSON.stringify(proposedAction, null, 2)}

ANALYSE DE RISQUE DEMANDÉE :
1. Évalue le niveau de risque (low, medium, high, critical)
2. Identifie les conséquences irréversibles
3. Détermine si une validation utilisateur est nécessaire
4. Liste les points d'attention
5. Propose des questions de confirmation

RÉPONSE JSON OBLIGATOIRE :
{
  "riskLevel": "low|medium|high|critical",
  "requiresApproval": true,
  "irreversibleActions": [
    "Soumission officielle du dossier",
    "Engagement financier de 150€"
  ],
  "consequences": [
    {
      "type": "legal|financial|administrative",
      "description": "Description de la conséquence",
      "severity": "low|medium|high",
      "reversible": false
    }
  ],
  "warningPoints": [
    "Les données seront transmises à l'administration",
    "Modification impossible après soumission",
    "Délai de traitement: 15 jours ouvrés"
  ],
  "requiredConfirmations": [
    {
      "question": "Confirmez-vous que toutes les informations sont exactes ?",
      "type": "checkbox",
      "required": true
    },
    {
      "question": "Acceptez-vous les frais de dossier de 150€ ?",
      "type": "checkbox", 
      "required": true
    }
  ],
  "recommendations": [
    "Vérifiez une dernière fois vos documents",
    "Conservez une copie du récépissé"
  ],
  "confidence": 95
}

CRITÈRES DE RISQUE :
- CRITICAL: Actions légales irréversibles, engagements financiers >500€
- HIGH: Soumissions officielles, données sensibles
- MEDIUM: Modifications importantes, validations administratives  
- LOW: Consultations, sauvegardes, préparations`;

    const response = await this.aiService.generateResponse('VALIDATOR', prompt, {
      processData,
      stepData,
      proposedAction
    });

    return JSON.parse(response);
  }

  async generateCriticalDecision(riskAnalysis) {
    const prompt = `
Génère une décision critique claire et compréhensible pour l'utilisateur.

ANALYSE DE RISQUE :
${JSON.stringify(riskAnalysis, null, 2)}

Crée une question de validation avec options claires.

RÉPONSE JSON :
{
  "question": "Êtes-vous sûr de vouloir soumettre ce dossier ?",
  "description": "Cette action va officiellement transmettre votre dossier à l'administration. Une fois soumis, vous ne pourrez plus modifier les informations.",
  "options": [
    {
      "label": "Oui, soumettre le dossier",
      "value": "confirm",
      "isIrreversible": true,
      "consequences": [
        "Dossier transmis officiellement",
        "Aucune modification possible",
        "Frais de 150€ prélevés"
      ]
    },
    {
      "label": "Non, continuer à vérifier",
      "value": "cancel", 
      "isIrreversible": false,
      "consequences": [
        "Retour aux vérifications",
        "Possibilité de modifier"
      ]
    }
  ],
  "deadline": "Cette décision doit être prise dans les 30 minutes",
  "legalWarning": "Cette action engage votre responsabilité légale"
}`;

    const response = await this.aiService.generateResponse('VALIDATOR', prompt, {
      riskAnalysis
    });

    return JSON.parse(response);
  }

  async createDecisionInFirestore(processId, decision) {
    const decisionDoc = {
      processId,
      stepId: decision.stepId,
      question: decision.question,
      description: decision.description,
      options: decision.options,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      resolved: false,
      riskLevel: decision.riskLevel || 'medium',
      deadline: decision.deadline,
      legalWarning: decision.legalWarning
    };

    await admin.firestore()
      .collection('processes').doc(processId)
      .collection('decisions').add(decisionDoc);
  }
}

// Cloud Function pour résoudre une décision
exports.resolveDecision = functions.https.onCall(async (data, context) => {
  const { processId, decisionId, userChoice, userJustification } = data;
  const userId = context.auth?.uid;
  
  if (!userId) throw new Error('Non authentifié');
  
  // Mettre à jour la décision
  await admin.firestore()
    .collection('processes').doc(processId)
    .collection('decisions').doc(decisionId)
    .update({
      resolved: true,
      userChoice,
      userJustification: userJustification || '',
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedBy: userId
    });
  
  // Analyser la décision et continuer le processus
  const validator = new AIValidatorAgent();
  const nextAction = await validator.getNextActionAfterDecision(userChoice);
  
  return { nextAction };
});
```

---

### 🎯 **Tâche 3.6 : Agent IA Conversationnel (Chat)**
**Durée** : 3 jours  
**Priorité** : HAUTE

#### Responsabilités :
- **Répondre aux questions** utilisateur avec contextualisation
- **Expliquer les étapes** en cours automatiquement
- **Guider l'utilisateur** avec suggestions intelligentes
- **Gérer les demandes d'aide** contextuelles

```javascript
// functions/src/agents/ai-chat.js

class AIChatAgent {
  constructor() {
    this.aiService = new VertexAIService();
  }

  async generateContextualResponse(userMessage, processContext, chatHistory) {
    const prompt = `
Tu es l'assistant IA personnel SimplifIA pour les démarches administratives françaises.

CONTEXTE DU PROCESSUS :
${JSON.stringify(processContext, null, 2)}

HISTORIQUE DU CHAT (5 derniers messages) :
${chatHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

MESSAGE UTILISATEUR : "${userMessage}"

TON RÔLE :
- Assistant bienveillant et expert en administratif français
- Explique clairement les étapes en cours
- Rassure l'utilisateur sur le processus
- Propose des actions concrètes
- Répond aux questions avec précision

RÉPONSE JSON OBLIGATOIRE :
{
  "response": "Message de réponse naturel et bienveillant",
  "suggestedActions": [
    {
      "label": "Continuer l'étape en cours",
      "action": "continue_step",
      "icon": "play"
    },
    {
      "label": "Voir mes documents",
      "action": "show_documents", 
      "icon": "file"
    }
  ],
  "quickReplies": [
    "Où en est mon dossier ?",
    "Que dois-je faire maintenant ?",
    "Puis-je modifier quelque chose ?"
  ],
  "contextualInfo": {
    "currentStep": "Remplissage du formulaire CERFA",
    "progress": "75%",
    "nextAction": "Validation des données"
  },
  "tone": "helpful|informative|reassuring|urgent",
  "requiresAction": false
}

INSTRUCTIONS SPÉCIALES :
- Utilise un langage simple et accessible
- Évite le jargon administratif
- Sois rassurant mais précis
- Propose toujours des actions concrètes
- Mentionne les délais et échéances importantes`;

    const response = await this.aiService.generateResponse('CHAT', prompt, {
      userMessage,
      processContext,
      chatHistory
    });

    return JSON.parse(response);
  }

  async generateProactiveMessage(processContext, triggerEvent) {
    const prompt = `
Génère un message proactif pour informer l'utilisateur d'un événement.

CONTEXTE DU PROCESSUS :
${JSON.stringify(processContext, null, 2)}

ÉVÉNEMENT DÉCLENCHEUR : ${triggerEvent}

Types d'événements :
- step_completed: Étape terminée avec succès
- step_failed: Erreur dans une étape
- decision_required: Validation utilisateur nécessaire
- process_completed: Démarche terminée
- deadline_approaching: Échéance proche

Génère un message adapté à l'événement.

RÉPONSE JSON :
{
  "message": "Message informatif et utile",
  "urgency": "low|medium|high",
  "actionRequired": true,
  "suggestedActions": [...],
  "emoji": "✅"
}`;

    const response = await this.aiService.generateResponse('CHAT', prompt, {
      processContext,
      triggerEvent
    });

    return JSON.parse(response);
  }
}

// Cloud Function pour le chat
exports.chatWithAI = functions.https.onCall(async (data, context) => {
  const { processId, message } = data;
  const userId = context.auth?.uid;
  
  if (!userId) throw new Error('Non authentifié');
  
  // Récupérer le contexte du processus
  const processDoc = await admin.firestore().collection('processes').doc(processId).get();
  const processContext = processDoc.data();
  
  // Récupérer l'historique du chat
  const chatHistory = await admin.firestore()
    .collection('processes').doc(processId)
    .collection('chat_messages')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  const historyArray = chatHistory.docs.map(doc => doc.data());
  
  // Générer la réponse IA
  const chatAgent = new AIChatAgent();
  const aiResponse = await chatAgent.generateContextualResponse(
    message,
    processContext,
    historyArray
  );
  
  // Sauvegarder les messages
  const messagesRef = admin.firestore()
    .collection('processes').doc(processId)
    .collection('chat_messages');
  
  // Message utilisateur
  await messagesRef.add({
    role: 'user',
    content: message,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Réponse IA
  await messagesRef.add({
    role: 'agent',
    content: aiResponse.response,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      suggestedActions: aiResponse.suggestedActions,
      quickReplies: aiResponse.quickReplies,
      contextualInfo: aiResponse.contextualInfo
    }
  });
  
  return aiResponse;
});
```

---

### 🎯 **Tâche 3.7 : Agent IA Moniteur (Suivi des Dossiers)**
**Durée** : 2 jours  
**Priorité** : MOYENNE

#### Responsabilités :
- **Surveiller automatiquement** l'état des dossiers
- **Détecter les changements** via IA
- **Générer des notifications** intelligentes
- **Prédire les délais** de traitement

```javascript
// functions/src/agents/ai-monitor.js

class AIMonitorAgent {
  constructor() {
    this.aiService = new VertexAIService();
  }

  async analyzeApplicationStatus(applicationData, previousStatus) {
    const prompt = `
Tu es un expert IA en suivi de dossiers administratifs français.

DONNÉES DU DOSSIER :
${JSON.stringify(applicationData, null, 2)}

STATUT PRÉCÉDENT :
${JSON.stringify(previousStatus, null, 2)}

ANALYSE DEMANDÉE :
1. Détermine si le statut a changé
2. Interprète la signification du changement
3. Estime les prochaines étapes
4. Prédit les délais restants
5. Identifie les actions requises

RÉPONSE JSON :
{
  "statusChanged": true,
  "newStatus": "en_cours_instruction",
  "statusInterpretation": "Votre dossier est maintenant en cours d'instruction par les services compétents",
  "significance": "positive|negative|neutral",
  "nextSteps": [
    "Instruction du dossier par l'administration",
    "Vérification des pièces justificatives",
    "Décision finale dans 10-15 jours"
  ],
  "estimatedCompletion": "2024-11-15",
  "daysRemaining": 12,
  "actionRequired": false,
  "userNotification": {
    "title": "Bonne nouvelle ! Votre dossier avance",
    "message": "Votre dossier de déclaration de naissance est maintenant en cours d'instruction.",
    "urgency": "low",
    "emoji": "⏳"
  },
  "confidence": 90
}`;

    const response = await this.aiService.generateResponse('MONITOR', prompt, {
      applicationData,
      previousStatus
    });

    return JSON.parse(response);
  }

  async predictDelayRisk(processData, historicalData) {
    const prompt = `
Analyse le risque de retard pour ce dossier administratif.

DONNÉES DU PROCESSUS :
${JSON.stringify(processData, null, 2)}

DONNÉES HISTORIQUES :
${JSON.stringify(historicalData, null, 2)}

Évalue le risque de retard et propose des actions préventives.

RÉPONSE JSON :
{
  "delayRisk": "low|medium|high",
  "riskFactors": [
    "Période de forte affluence",
    "Documents manquants"
  ],
  "preventiveActions": [
    "Vérifier l'état du dossier dans 3 jours",
    "Préparer les documents complémentaires"
  ],
  "estimatedDelay": 5,
  "confidence": 80
}`;

    const response = await this.aiService.generateResponse('MONITOR', prompt);
    return JSON.parse(response);
  }
}

// Fonction programmée pour surveiller tous les dossiers
exports.monitorAllApplications = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {
    const monitor = new AIMonitorAgent();
    
    // Récupérer tous les processus actifs
    const activeProcesses = await admin.firestore()
      .collection('processes')
      .where('status', 'in', ['running', 'completed'])
      .get();
    
    for (const doc of activeProcesses.docs) {
      const processData = doc.data();
      
      try {
        // Vérifier le statut avec IA
        const statusAnalysis = await monitor.analyzeApplicationStatus(
          processData,
          processData.lastKnownStatus
        );
        
        if (statusAnalysis.statusChanged) {
          // Notifier l'utilisateur
          await sendNotificationToUser(processData.userId, statusAnalysis.userNotification);
          
          // Mettre à jour le processus
          await doc.ref.update({
            lastKnownStatus: statusAnalysis.newStatus,
            lastChecked: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
      } catch (error) {
        console.error(`Erreur monitoring processus ${doc.id}:`, error);
      }
    }
  });
```

---

## 📋 PHASE 4 : TESTS, OPTIMISATION ET DÉPLOIEMENT

### 🎯 **Tâche 4.1 : Tests Unitaires et d'Intégration des Agents IA**
**Durée** : 3 jours  
**Priorité** : HAUTE

#### Tests à implémenter pour chaque agent IA :

```javascript
// functions/test/agents/ai-analyzer.test.js

const { AIAnalyzerAgent } = require('../../src/agents/ai-analyzer');

describe('Agent IA Analyseur', () => {
  let analyzer;
  
  beforeEach(() => {
    analyzer = new AIAnalyzerAgent();
  });

  test('devrait détecter une déclaration de naissance', async () => {
    const context = "Je viens d'avoir un bébé et je dois le déclarer en mairie";
    const result = await analyzer.analyzeUserContext(context, 'test-user-id');
    
    expect(result.scenario).toBe('birth_declaration');
    expect(result.confidence).toBeGreaterThan(80);
    expect(result.steps).toHaveLength(5);
    expect(result.requiredDocuments).toContain({
      name: expect.stringContaining('Carte d\'identité'),
      required: true
    });
  });

  test('devrait détecter un renouvellement de passeport', async () => {
    const context = "Mon passeport expire dans 2 mois, je dois le renouveler";
    const result = await analyzer.analyzeUserContext(context, 'test-user-id');
    
    expect(result.scenario).toBe('passport_renewal');
    expect(result.confidence).toBeGreaterThan(75);
  });

  test('devrait gérer un contexte ambigu avec faible confiance', async () => {
    const context = "J'ai des papiers à faire";
    const result = await analyzer.analyzeUserContext(context, 'test-user-id');
    
    expect(result.confidence).toBeLessThan(60);
    expect(result.steps).toHaveLength(1); // Étape de clarification
  });
});

// functions/test/agents/ai-navigator.test.js
describe('Agent IA Navigateur', () => {
  let navigator;
  
  beforeEach(() => {
    navigator = new AINavigatorAgent();
  });

  test('devrait analyser une page de formulaire gouvernemental', async () => {
    const mockHTML = `
      <form id="cerfa-form" action="/submit" method="POST">
        <input name="nom" type="text" required>
        <input name="prenom" type="text" required>
        <input name="email" type="email">
        <button type="submit">Valider</button>
      </form>
    `;
    
    const result = await navigator.getAIPageAnalysis(mockHTML, 'Remplir formulaire CERFA');
    
    expect(result.pageType).toBe('form');
    expect(result.mainForm.detected).toBe(true);
    expect(result.keyElements).toHaveLength(4);
    expect(result.actions[0].name).toBe('fill_form');
  });
});

// functions/test/agents/ai-form-filler.test.js
describe('Agent IA Remplisseur', () => {
  test('devrait mapper correctement les données utilisateur', async () => {
    const formStructure = {
      fields: [
        { name: 'nom', type: 'text', required: true },
        { name: 'prenom', type: 'text', required: true },
        { name: 'date_naissance', type: 'date', format: 'DD/MM/YYYY' }
      ]
    };
    
    const userData = {
      lastName: 'Dupont',
      firstName: 'Jean', 
      birthDate: '1985-03-15'
    };
    
    const formFiller = new AIFormFillerAgent();
    const result = await formFiller.fillFormWithAI(formStructure, userData);
    
    expect(result.status).toBe('completed');
    expect(result.filledData.nom).toBe('Dupont');
    expect(result.filledData.date_naissance).toBe('15/03/1985');
  });
});

// functions/test/agents/ai-validator.test.js
describe('Agent IA Validateur', () => {
  test('devrait détecter une action critique nécessitant validation', async () => {
    const processData = { id: 'test-process', scenario: 'birth_declaration' };
    const stepData = { type: 'submission', description: 'Soumettre le formulaire officiel' };
    const proposedAction = { type: 'submit_form', irreversible: true, cost: 25 };
    
    const validator = new AIValidatorAgent();
    const result = await validator.validateActionWithAI(processData, stepData, proposedAction);
    
    expect(result.status).toBe('waiting_approval');
    expect(result.riskLevel).toBeOneOf(['high', 'critical']);
  });
});
```

#### Tests d'intégration :

```javascript
// functions/test/integration/agent-workflow.test.js

describe('Workflow complet des agents IA', () => {
  test('devrait exécuter un workflow complet de déclaration de naissance', async () => {
    // 1. Analyse initiale
    const analyzer = new AIAnalyzerAgent();
    const analysis = await analyzer.analyzeUserContext(
      "Je viens d'avoir un bébé", 
      'test-user-id'
    );
    
    expect(analysis.scenario).toBe('birth_declaration');
    
    // 2. Navigation vers le site
    const navigator = new AINavigatorAgent();
    const pageAnalysis = await navigator.analyzePageWithAI(
      'https://www.service-public.fr/particuliers/vosdroits/R1617',
      'Accéder au formulaire de déclaration'
    );
    
    expect(pageAnalysis.status).toBe('completed');
    
    // 3. Remplissage du formulaire
    const formFiller = new AIFormFillerAgent();
    const fillResult = await formFiller.fillFormWithAI(
      pageAnalysis.analysis.mainForm,
      { lastName: 'Test', firstName: 'User' }
    );
    
    expect(fillResult.status).toBe('completed');
    
    // 4. Validation
    const validator = new AIValidatorAgent();
    const validation = await validator.validateActionWithAI(
      { id: 'test' },
      { type: 'submission' },
      { type: 'submit_form' }
    );
    
    expect(validation.status).toBeOneOf(['approved', 'waiting_approval']);
  });
});
```

---

### 🎯 **Tâche 4.2 : Monitoring et Observabilité des Agents IA**
**Durée** : 2 jours  
**Priorité** : HAUTE

#### Métriques spécifiques aux agents IA :

```javascript
// functions/src/monitoring/ai-metrics.js

class AIMetricsCollector {
  static async recordAgentExecution(agentType, executionTime, success, confidence) {
    const metric = {
      agentType,
      executionTime,
      success,
      confidence,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('ai_metrics').add(metric);
    
    // Envoyer à Cloud Monitoring
    await this.sendToCloudMonitoring(metric);
  }
  
  static async recordTokenUsage(agentType, inputTokens, outputTokens, cost) {
    const usage = {
      agentType,
      inputTokens,
      outputTokens,
      cost,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('token_usage').add(usage);
  }
  
  static async recordAgentError(agentType, error, context) {
    const errorLog = {
      agentType,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('ai_errors').add(errorLog);
    
    // Alerter si trop d'erreurs
    await this.checkErrorThreshold(agentType);
  }
}

// Dashboard de monitoring
exports.getAIDashboard = functions.https.onCall(async (data, context) => {
  const { timeRange = '24h' } = data;
  const userId = context.auth?.uid;
  
  if (!userId) throw new Error('Non authentifié');
  
  const metrics = await Promise.all([
    this.getAgentSuccessRates(timeRange),
    this.getTokenUsageStats(timeRange),
    this.getAverageExecutionTimes(timeRange),
    this.getErrorRates(timeRange)
  ]);
  
  return {
    successRates: metrics[0],
    tokenUsage: metrics[1],
    executionTimes: metrics[2],
    errorRates: metrics[3],
    generatedAt: new Date().toISOString()
  };
});
```

#### Alertes intelligentes :

```javascript
// functions/src/monitoring/ai-alerts.js

class AIAlertSystem {
  static async checkAgentHealth() {
    const agents = ['ANALYZER', 'NAVIGATOR', 'FORM_FILLER', 'VALIDATOR', 'CHAT', 'MONITOR'];
    
    for (const agent of agents) {
      const metrics = await this.getAgentMetrics(agent, '1h');
      
      // Vérifier le taux de succès
      if (metrics.successRate < 0.9) {
        await this.sendAlert('LOW_SUCCESS_RATE', {
          agent,
          successRate: metrics.successRate,
          threshold: 0.9
        });
      }
      
      // Vérifier les temps de réponse
      if (metrics.avgResponseTime > 30000) { // 30 secondes
        await this.sendAlert('HIGH_RESPONSE_TIME', {
          agent,
          responseTime: metrics.avgResponseTime,
          threshold: 30000
        });
      }
      
      // Vérifier les coûts
      if (metrics.hourlyCost > 50) { // 50€/heure
        await this.sendAlert('HIGH_COST', {
          agent,
          cost: metrics.hourlyCost,
          threshold: 50
        });
      }
    }
  }
  
  static async sendAlert(type, data) {
    const alert = {
      type,
      data,
      severity: this.getAlertSeverity(type),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Sauvegarder l'alerte
    await admin.firestore().collection('alerts').add(alert);
    
    // Envoyer notification selon la gravité
    if (alert.severity === 'critical') {
      await this.sendImmediateNotification(alert);
    }
  }
}

// Fonction programmée pour vérifier la santé des agents
exports.checkAIHealth = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    await AIAlertSystem.checkAgentHealth();
  });
```

---

### 🎯 **Tâche 4.3 : Optimisation des Performances IA**
**Durée** : 2 jours  
**Priorité** : HAUTE

#### Cache intelligent pour les agents :

```javascript
// functions/src/optimization/ai-cache.js

class AICache {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  generateCacheKey(agentType, prompt, context) {
    const hash = crypto
      .createHash('md5')
      .update(`${agentType}:${prompt}:${JSON.stringify(context)}`)
      .digest('hex');
    return `ai_cache:${agentType}:${hash}`;
  }
  
  async getCached(agentType, prompt, context) {
    const key = this.generateCacheKey(agentType, prompt, context);
    const cached = await this.redis.get(key);
    
    if (cached) {
      await AIMetricsCollector.recordCacheHit(agentType);
      return JSON.parse(cached);
    }
    
    await AIMetricsCollector.recordCacheMiss(agentType);
    return null;
  }
  
  async setCached(agentType, prompt, context, response, ttl = 3600) {
    const key = this.generateCacheKey(agentType, prompt, context);
    await this.redis.setex(key, ttl, JSON.stringify(response));
  }
  
  // Cache spécialisé par type d'agent
  async getCachedAnalysis(userContext) {
    return await this.getCached('ANALYZER', userContext, {});
  }
  
  async setCachedAnalysis(userContext, analysis) {
    // Cache plus long pour les analyses stables
    await this.setCached('ANALYZER', userContext, {}, analysis, 7200);
  }
}

// Optimisation des prompts
class PromptOptimizer {
  static optimizeForAgent(agentType, basePrompt, context) {
    const optimizations = {
      ANALYZER: {
        maxLength: 2000,
        includeExamples: true,
        useStructuredOutput: true
      },
      NAVIGATOR: {
        maxLength: 1500,
        focusOnSelectors: true,
        includeErrorHandling: true
      },
      FORM_FILLER: {
        maxLength: 1000,
        useTemplates: true,
        validateFormats: true
      },
      CHAT: {
        maxLength: 800,
        conversationalTone: true,
        contextWindow: 5 // derniers messages
      }
    };
    
    const config = optimizations[agentType];
    let optimizedPrompt = basePrompt;
    
    // Tronquer si trop long
    if (optimizedPrompt.length > config.maxLength) {
      optimizedPrompt = optimizedPrompt.substring(0, config.maxLength - 100) + "...";
    }
    
    // Ajouter des exemples si nécessaire
    if (config.includeExamples) {
      optimizedPrompt += this.getExamplesForAgent(agentType);
    }
    
    return optimizedPrompt;
  }
}
```

#### Rate limiting intelligent :

```javascript
// functions/src/optimization/rate-limiter.js

class AIRateLimiter {
  constructor() {
    this.limits = {
      ANALYZER: { perMinute: 10, perHour: 100, perDay: 500 },
      NAVIGATOR: { perMinute: 5, perHour: 50, perDay: 200 },
      FORM_FILLER: { perMinute: 15, perHour: 150, perDay: 800 },
      VALIDATOR: { perMinute: 8, perHour: 80, perDay: 400 },
      CHAT: { perMinute: 20, perHour: 200, perDay: 1000 },
      MONITOR: { perMinute: 2, perHour: 20, perDay: 100 }
    };
  }
  
  async checkLimit(userId, agentType) {
    const limits = this.limits[agentType];
    const now = Date.now();
    
    // Vérifier limite par minute
    const minuteKey = `rate:${userId}:${agentType}:${Math.floor(now / 60000)}`;
    const minuteCount = await this.redis.incr(minuteKey);
    await this.redis.expire(minuteKey, 60);
    
    if (minuteCount > limits.perMinute) {
      throw new Error(`Rate limit dépassé pour ${agentType}: ${limits.perMinute}/min`);
    }
    
    // Vérifier limite journalière
    const dayKey = `rate:${userId}:${agentType}:${Math.floor(now / 86400000)}`;
    const dayCount = await this.redis.incr(dayKey);
    await this.redis.expire(dayKey, 86400);
    
    if (dayCount > limits.perDay) {
      throw new Error(`Quota journalier dépassé pour ${agentType}: ${limits.perDay}/jour`);
    }
    
    return true;
  }
}
```

---

### 🎯 **Tâche 4.4 : Sécurité et Règles Firestore**
**Durée** : 2 jours  
**Priorité** : CRITIQUE

#### Règles Firestore sécurisées :

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction helper pour vérifier l'ownership
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Fonction helper pour vérifier si l'utilisateur est admin
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Collection users - accès restreint
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow read: if isAdmin(); // Les admins peuvent lire tous les users
    }
    
    // Collection processes - accès strict par propriétaire
    match /processes/{processId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      
      // Sous-collection activity_logs
      match /activity_logs/{logId} {
        allow read, write: if isOwner(
          get(/databases/$(database)/documents/processes/$(processId)).data.userId
        );
      }
      
      // Sous-collection chat_messages
      match /chat_messages/{messageId} {
        allow read, write: if isOwner(
          get(/databases/$(database)/documents/processes/$(processId)).data.userId
        );
        
        // Règles spéciales pour les messages système
        allow write: if request.resource.data.role == 'system' && 
                       request.auth.token.admin == true;
      }
      
      // Sous-collection decisions - lecture seule pour l'utilisateur
      match /decisions/{decisionId} {
        allow read: if isOwner(
          get(/databases/$(database)/documents/processes/$(processId)).data.userId
        );
        allow write: if isAdmin(); // Seuls les agents peuvent écrire
      }
    }
    
    // Collections de monitoring - accès admin uniquement
    match /ai_metrics/{metricId} {
      allow read, write: if isAdmin();
    }
    
    match /token_usage/{usageId} {
      allow read, write: if isAdmin();
    }
    
    match /ai_errors/{errorId} {
      allow read, write: if isAdmin();
    }
    
    match /alerts/{alertId} {
      allow read, write: if isAdmin();
    }
    
    // Configuration système - lecture seule pour les utilisateurs authentifiés
    match /config/{configId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

#### Validation et sanitisation des données :

```javascript
// functions/src/security/data-validator.js

class DataValidator {
  static validateUserInput(input, type) {
    const validators = {
      userContext: (data) => {
        if (typeof data !== 'string') throw new Error('Context doit être une string');
        if (data.length > 2000) throw new Error('Context trop long');
        if (this.containsSensitiveData(data)) throw new Error('Données sensibles détectées');
        return this.sanitizeText(data);
      },
      
      chatMessage: (data) => {
        if (typeof data !== 'string') throw new Error('Message doit être une string');
        if (data.length > 500) throw new Error('Message trop long');
        return this.sanitizeText(data);
      },
      
      formData: (data) => {
        if (typeof data !== 'object') throw new Error('FormData doit être un object');
        return this.sanitizeFormData(data);
      }
    };
    
    const validator = validators[type];
    if (!validator) throw new Error(`Type de validation inconnu: ${type}`);
    
    return validator(input);
  }
  
  static containsSensitiveData(text) {
    const sensitivePatterns = [
      /\b\d{15}\b/, // Numéro de sécurité sociale
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Numéro de carte
      /\b[A-Z0-9]{2}\d{9}\b/, // IBAN simplifié
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(text));
  }
  
  static sanitizeText(text) {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
}

// Middleware de sécurité pour les Cloud Functions
exports.securityMiddleware = (req, res, next) => {
  // Rate limiting par IP
  const ip = req.ip;
  const rateLimiter = new IPRateLimiter();
  
  if (!rateLimiter.isAllowed(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  // Validation de l'origine
  const allowedOrigins = [
    'https://your-domain.com',
    'https://your-domain.firebaseapp.com'
  ];
  
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  
  next();
};
```

---

### 🎯 **Tâche 4.5 : Déploiement et CI/CD**
**Durée** : 2 jours  
**Priorité** : HAUTE

#### Pipeline de déploiement automatisé :

```yaml
# .github/workflows/deploy-ai-backend.yml
name: Deploy AI Backend to Firebase

on:
  push:
    branches: [ main ]
    paths: [ 'functions/**' ]
  pull_request:
    branches: [ main ]
    paths: [ 'functions/**' ]

env:
  VERTEX_AI_PROJECT_ID: ${{ secrets.VERTEX_AI_PROJECT_ID }}
  FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'functions/package-lock.json'
      
      - name: Install dependencies
        run: |
          cd functions
          npm ci
      
      - name: Run linting
        run: |
          cd functions
          npm run lint
      
      - name: Run unit tests
        run: |
          cd functions
          npm run test:unit
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080
          FIREBASE_AUTH_EMULATOR_HOST: localhost:9099
      
      - name: Run integration tests
        run: |
          cd functions
          npm run test:integration
        env:
          VERTEX_AI_PROJECT_ID: ${{ env.VERTEX_AI_PROJECT_ID }}
      
      - name: Security audit
        run: |
          cd functions
          npm audit --audit-level high

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
      
      - name: Deploy to staging
        run: |
          cd functions
          firebase use staging
          firebase deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
      
      - name: Deploy to production
        run: |
          cd functions
          firebase use production
          firebase deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
      
      - name: Run smoke tests
        run: |
          cd functions
          npm run test:smoke
        env:
          FIREBASE_PROJECT_URL: https://${{ env.FIREBASE_PROJECT_ID }}.firebaseapp.com
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '🚀 Déploiement des agents IA réussi en production'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

  rollback:
    runs-on: ubuntu-latest
    if: failure()
    steps:
      - name: Rollback on failure
        run: |
          firebase functions:config:unset ai.version
          firebase deploy --only functions:rollback
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

#### Configuration des environnements :

```javascript
// functions/src/config/environments.js

const environments = {
  development: {
    vertex: {
      projectId: 'simplif-ia-dev',
      location: 'europe-west9',
      models: {
        ANALYZER: 'gemini-1.0-pro', // Modèle moins cher pour dev
        NAVIGATOR: 'gemini-1.0-pro',
        FORM_FILLER: 'gemini-1.0-pro',
        VALIDATOR: 'gemini-1.0-pro',
        CHAT: 'gemini-1.0-pro',
        MONITOR: 'gemini-1.0-pro'
      }
    },
    rateLimits: {
      perMinute: 100,
      perHour: 1000,
      perDay: 10000
    },
    cache: {
      enabled: true,
      ttl: 300 // 5 minutes
    }
  },
  
  staging: {
    vertex: {
      projectId: 'simplif-ia-staging',
      location: 'europe-west9',
      models: {
        ANALYZER: 'gemini-1.5-pro',
        NAVIGATOR: 'gemini-1.5-pro',
        FORM_FILLER: 'gemini-1.0-pro',
        VALIDATOR: 'gemini-1.5-pro',
        CHAT: 'gemini-1.5-pro',
        MONITOR: 'gemini-1.0-pro'
      }
    },
    rateLimits: {
      perMinute: 50,
      perHour: 500,
      perDay: 5000
    },
    cache: {
      enabled: true,
      ttl: 600 // 10 minutes
    }
  },
  
  production: {
    vertex: {
      projectId: 'simplif-ia-prod',
      location: 'europe-west9',
      models: {
        ANALYZER: 'gemini-1.5-pro',
        NAVIGATOR: 'gemini-1.5-pro',
        FORM_FILLER: 'gemini-1.0-pro',
        VALIDATOR: 'gemini-1.5-pro',
        CHAT: 'gemini-1.5-pro',
        MONITOR: 'gemini-1.0-pro'
      }
    },
    rateLimits: {
      perMinute: 30,
      perHour: 300,
      perDay: 3000
    },
    cache: {
      enabled: true,
      ttl: 3600 // 1 heure
    },
    monitoring: {
      alerts: true,
      metrics: true,
      logging: 'info'
    }
  }
};

module.exports = environments[process.env.NODE_ENV || 'development'];
```

#### `.env.example`
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Vertex AI Configuration
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=europe-west9

# Rate Limiting
REDIS_URL=redis://localhost:6379

# Monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
EMAIL_SERVICE_API_KEY=your-email-api-key

# Environment
NODE_ENV=development
LOG_LEVEL=debug

# Security
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

---

### **9. Tests**

#### `functions/test/setup.ts`
```typescript
import { initializeTestApp, clearFirestoreData } from 'firebase-functions-test/lib/providers/firestore';

// Configuration des tests
const testConfig = {
  projectId: 'test-project-id',
  storageBucket: 'test-bucket',
};

export const testEnv = initializeTestApp(testConfig);

// Nettoyage après chaque test
afterEach(async () => {
  await clearFirestoreData(testConfig);
});

// Variables globales pour les tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

#### `functions/test/agents/ai-analyzer.test.ts`
```typescript
import { AIAnalyzerAgent } from '@/agents/ai-analyzer';

describe('AIAnalyzerAgent', () => {
  let analyzer: AIAnalyzerAgent;
  
  beforeEach(() => {
    analyzer = new AIAnalyzerAgent();
  });

  test('devrait analyser un contexte de déclaration de naissance', async () => {
    const context = {
      context: "Je viens d'avoir un bébé et je dois le déclarer en mairie",
      preferredLanguage: 'fr' as const,
      urgency: 'medium' as const
    };
    
    const result = await analyzer.analyzeUserContext(context);
    
    expect(result.scenario).toBe('birth_declaration');
    expect(result.confidence).toBeGreaterThan(80);
    expect(result.steps).toHaveLength(5);
    expect(result.requiredDocuments).toContain({
      name: expect.stringContaining('Carte d\'identité'),
      required: true
    });
  });

  test('devrait détecter un renouvellement de passeport', async () => {
    const context = {
      context: "Mon passeport expire dans 2 mois, je dois le renouveler",
      preferredLanguage: 'fr' as const,
      urgency: 'medium' as const
    };
    
    const result = await analyzer.analyzeUserContext(context);
    
    expect(result.scenario).toBe('passport_renewal');
    expect(result.confidence).toBeGreaterThan(75);
  });

  test('devrait gérer un contexte ambigu avec faible confiance', async () => {
    const context = {
      context: "J'ai des papiers à faire",
      preferredLanguage: 'fr' as const,
      urgency: 'low' as const
    };
    
    const result = await analyzer.analyzeUserContext(context);
    
    expect(result.confidence).toBeLessThan(60);
    expect(result.steps[0].type).toBe('preparation'); // Première étape de clarification
  });

  test('devrait rejeter un contexte invalide', async () => {
    const invalidContext = {
      context: "x", // Trop court
      preferredLanguage: 'fr' as const
    };
    
    await expect(analyzer.analyzeUserContext(invalidContext))
      .rejects
      .toThrow();
  });
});
```

---

## 🚀 **COMMANDES DE DÉMARRAGE**

### **Commandes d'initialisation**
```bash
# 1. Initialiser Firebase
firebase login
firebase init functions firestore hosting

# 2. Installer les dépendances
cd functions
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Editer .env avec tes valeurs

# 4. Démarrer les émulateurs
npm run dev

# 5. Lancer les tests
npm test

# 6. Déployer
npm run deploy
```

### **Scripts de développement utiles**
```bash
# Build et watch
npm run build -- --watch

# Tests en continu
npm run test:watch

# Linter et format
npm run lint:fix

# Coverage des tests
npm run test:coverage

# Deploy spécifique
firebase deploy --only functions:analyzeUserRequest
firebase deploy --only firestore:rules
```

---

Cette roadmap complète couvre maintenant tous les aspects de la migration vers une architecture Firebase avec des agents IA spécialisés. Chaque phase est détaillée avec des exemples de code concrets, des tests, du monitoring, et un plan de déploiement progressif. 

L'architecture proposée te permettra d'avoir un backend parfaitement compatible avec ton frontend existant, avec des agents IA performants utilisant Vertex AI pour automatiser les démarches administratives.

Veux-tu que j'ajoute ou détaille un aspect particulier de cette roadmap ?
