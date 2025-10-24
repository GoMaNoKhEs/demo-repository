# 📚 Documentation des Prompts ChatAgent

**Projet** : SimplifIA - Hackathon Google Agentic AI  
**Agent** : ChatAgent (Conversation intelligente)  
**Fichier source** : `src/agents/chat.ts`  
**Date** : 24 Octobre 2025

---

## 🎯 Vue d'ensemble

Le ChatAgent utilise **4 prompts principaux** pour gérer les conversations avec les utilisateurs et créer automatiquement des processus administratifs. Chaque prompt a un rôle spécifique et retourne des données structurées en JSON.

### Architecture des prompts

```
User Message
     ↓
[1. analyzeContext] ────→ Détecte changement de sujet
     ↓
[2. analyzeIntentAndReadiness] ────→ Extrait infos + Détecte confirmation
     ↓
[3. buildSystemPrompt] ────→ Définit comportement global
     ↓
[4. generateChatResponse] ────→ Génère réponse contextuelle
     ↓
Agent Response
```

---

## 📝 Prompt 1 : Analyse Contexte

### **Méthode** : `analyzeContext(conversationHistory, currentMessage)`

### **Objectif**
Détecter si l'utilisateur change de sujet, continue la conversation, ou revient à un sujet antérieur.

### **Quand est-il appelé ?**
- À chaque nouveau message utilisateur
- Avant l'analyse d'intention
- Uniquement si historique non vide

### **Température IA** : `0.3` (précision importante)

### **Prompt envoyé**
```
Analyse ce contexte conversationnel :

HISTORIQUE:
user: Je veux une aide au logement APL
agent: Pour votre demande APL, précisons...
user: Je suis étudiant à Paris

NOUVEAU MESSAGE:
En fait non, je veux renouveler mon passeport

Détermine :
1. Le sujet précédent (ex: "Demande APL", "Renouvellement passeport", null)
2. Le sujet actuel du message
3. Si c'est un changement de sujet complet
4. Si c'est une continuité du sujet précédent
5. Si c'est un retour à un sujet abandonné

Retourne UNIQUEMENT ce JSON (pas de markdown):
{
  "contextType": "continuation|topic_change|topic_return|new_conversation",
  "previousTopic": "description du sujet précédent ou null",
  "currentTopic": "description du sujet actuel",
  "isTopicChange": true/false,
  "shouldResetContext": true/false,
  "relevantHistory": "résumé des infos importantes à garder"
}
```

### **Format JSON attendu**

```typescript
{
  contextType: "continuation" | "topic_change" | "topic_return" | "new_conversation",
  previousTopic: string | null,
  currentTopic: string,
  isTopicChange: boolean,
  shouldResetContext: boolean,
  relevantHistory: string
}
```

### **Exemples de réponses**

#### Cas 1 : Continuation
```json
{
  "contextType": "continuation",
  "previousTopic": "Demande APL",
  "currentTopic": "Demande APL",
  "isTopicChange": false,
  "shouldResetContext": false,
  "relevantHistory": "Utilisateur étudiant à Paris, locataire, revenus 800€"
}
```

#### Cas 2 : Changement de sujet
```json
{
  "contextType": "topic_change",
  "previousTopic": "Demande APL",
  "currentTopic": "Renouvellement passeport",
  "isTopicChange": true,
  "shouldResetContext": true,
  "relevantHistory": ""
}
```

### **Gestion d'erreurs**

```typescript
try {
  const response = await this.vertexAI.generateResponse("CHAT", prompt, { temperature: 0.3 });
  const cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleanedResponse);
} catch (error) {
  console.error("Error analyzing context:", error);
  // Fallback : considérer comme continuation
  return {
    contextType: "continuation",
    previousTopic: null,
    currentTopic: null,
    isTopicChange: false,
    shouldResetContext: false,
    relevantHistory: conversationHistory,
  };
}
```

**⚠️ Problèmes courants** :
- IA retourne markdown → Nettoyage avec `.replace(/```json/g, "")`
- JSON invalide → Fallback avec `contextType: "continuation"`
- Historique vide → Retour immédiat `contextType: "new_conversation"`

---

## 🎯 Prompt 2 : Analyse Intention et Disponibilité

### **Méthode** : `analyzeIntentAndReadiness(conversationHistory, currentMessage)`

### **Objectif**
Déterminer si l'utilisateur a fourni assez d'informations et s'il confirme vouloir créer le processus administratif.

### **Quand est-il appelé ?**
- À chaque nouveau message utilisateur
- Après l'analyse de contexte
- Pour extraire les infos collectées

### **Température IA** : `0.3` (précision importante)

### **Prompt envoyé**
```
Analyse cette conversation pour déterminer si l'utilisateur
est prêt à démarrer un processus administratif.

HISTORIQUE:
user: Je veux une APL
agent: Pour votre demande APL, précisons...
user: Je suis étudiant célibataire à Paris, locataire
agent: Très bien, et vos revenus ?
user: 800€ par mois

NOUVEAU MESSAGE:
Oui je veux créer mon dossier

Analyse et retourne UNIQUEMENT ce JSON (pas de markdown):
{
  "demarche": "nom précis de la démarche (ex: Demande APL, Renouvellement passeport)",
  "readyToStart": true/false,
  "userConfirmed": true/false,
  "confidence": 0.0-1.0,
  "missingInfo": ["info manquante 1", "info 2"],
  "collectedInfo": {
    "situation": "étudiant/salarié/etc ou null",
    "logement": "locataire/propriétaire ou null",
    "revenus": "montant approximatif ou null",
    "ville": "nom ville ou null"
  }
}

Critères pour readyToStart = true:
- La démarche est clairement identifiée
- Au moins 2-3 infos essentielles collectées
- L'utilisateur semble avoir répondu aux questions principales

Critères pour userConfirmed = true:
- L'utilisateur confirme explicitement vouloir créer le dossier
- Expressions: "oui", "d'accord", "vas-y", "lance", "je veux", etc.
- Attention aux "oui mais..." ou hésitations → false
```

### **Format JSON attendu**

```typescript
{
  demarche: string,              // "Demande APL", "Renouvellement passeport"...
  readyToStart: boolean,         // A-t-on assez d'infos ?
  userConfirmed: boolean,        // Confirmation explicite ?
  confidence: number,            // 0.0 - 1.0
  missingInfo: string[],         // ["date de naissance", "numéro CAF"]
  collectedInfo: {
    situation?: string,          // "étudiant", "salarié", "demandeur d'emploi"...
    logement?: string,           // "locataire", "propriétaire", "hébergé"...
    revenus?: string,            // "800", "1500€", "950 euros"...
    ville?: string,              // "Paris", "Marseille", "Lyon"...
    [key: string]: any           // Champs additionnels possibles
  }
}
```

### **Exemples de réponses**

#### Cas 1 : Prêt et confirmé
```json
{
  "demarche": "Demande APL",
  "readyToStart": true,
  "userConfirmed": true,
  "confidence": 0.95,
  "missingInfo": [],
  "collectedInfo": {
    "situation": "étudiant",
    "logement": "locataire",
    "revenus": "800€",
    "ville": "Paris"
  }
}
```

#### Cas 2 : Infos manquantes
```json
{
  "demarche": "Demande APL",
  "readyToStart": false,
  "userConfirmed": false,
  "confidence": 0.6,
  "missingInfo": ["revenus", "ville"],
  "collectedInfo": {
    "situation": "étudiant",
    "logement": "locataire",
    "revenus": null,
    "ville": null
  }
}
```

#### Cas 3 : Confirmation sans infos complètes
```json
{
  "demarche": "Demande CAF",
  "readyToStart": false,
  "userConfirmed": true,
  "confidence": 0.4,
  "missingInfo": ["type d'aide exact", "situation", "revenus"],
  "collectedInfo": {
    "situation": null,
    "logement": null,
    "revenus": null,
    "ville": "Lyon"
  }
}
```

### **Seuil de confiance utilisé**

```typescript
// Dans processUserMessage() (ligne 50)
if (intentAnalysis.readyToStart && intentAnalysis.userConfirmed && intentAnalysis.confidence > 0.7) {
  await this.createProcessFromConversation(sessionId, intentAnalysis);
  return;
}
```

**⚠️ Seuil de 0.7** : L'IA doit être assez confiante avant de créer le processus.

### **Gestion d'erreurs**

```typescript
try {
  const response = await this.vertexAI.generateResponse("CHAT", prompt, { temperature: 0.3 });
  const cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleanedResponse);
} catch (error) {
  console.error("Error analyzing intent:", error);
  // Fallback : pas prêt, confidence 0
  return {
    demarche: "Inconnu",
    readyToStart: false,
    userConfirmed: false,
    confidence: 0,
    missingInfo: [],
    collectedInfo: {},
  };
}
```

**⚠️ Problèmes courants** :
- IA retourne markdown → Nettoyage avec `.replace()`
- `confidence` en string au lieu de number → Parser avec `parseFloat()`
- Champs manquants → Fallback avec valeurs par défaut
- Expressions de confirmation non détectées → Ajuster le prompt

---

## 🤖 Prompt 3 : System Prompt Principal

### **Méthode** : `buildSystemPrompt()`

### **Objectif**
Définir le comportement global de SimplifIA et ses règles de conversation.

### **Quand est-il utilisé ?**
- Passé en `systemInstruction` à chaque appel `generateChatResponse()`
- Définit la "personnalité" de l'agent

### **Prompt complet**

```
Tu es SimplifIA, l'expert des démarches administratives françaises. 
Tu es précis, méthodique et tu poses les bonnes questions.

RÈGLES ABSOLUES :
1. MAXIMUM 2-3 questions à la fois (éviter la surcharge cognitive)
2. Après 4 échanges (8 messages total), TOUJOURS proposer de créer le dossier
3. TOUJOURS poser des questions précises pour comprendre la situation exacte
4. JAMAIS de réponses génériques comme "rendez-vous sur le site" 
5. IDENTIFIER précisément l'aide/démarche demandée
6. LISTER les documents exacts nécessaires
7. EXPLIQUER les étapes concrètes à suivre

EXEMPLES PRÉCIS :

Pour "demande CAF" :
"Pour votre demande CAF, précisons :
Quelle aide exactement ? (RSA, APL, Prime d'activité, AAH, allocation familiale...)
Votre situation ? (étudiant, salarié, demandeur d'emploi, parent isolé...)
Votre logement ? (locataire, propriétaire, hébergé chez famille...)
Vos revenus mensuels approximatifs ?

Avec ces infos, je vous donnerai la liste exacte des documents et les étapes précises."

Pour "carte d'identité" :
"Pour renouveler votre CNI :
Votre commune a-t-elle un service CNI ? (pas toutes les mairies)
Première demande ou renouvellement ?
Avez-vous votre ancienne carte ou passeport ?
Voulez-vous que je vérifie les créneaux disponibles dans votre secteur ?"

TOUJOURS finir par une question pour approfondir.
```

### **Évolution du prompt**

| Version | Règles | Conformité ROADMAP |
|---------|--------|-------------------|
| **v1** (Initiale) | 5 règles basiques | ❌ 75% |
| **v2** (Actuelle) | 7 règles + concision | ✅ 100% |

**Ajouts v2** :
- ✅ Règle #1 : "MAXIMUM 2-3 questions à la fois"
- ✅ Règle #2 : "Après 4 échanges (8 messages), TOUJOURS proposer"

### **Impact des règles**

#### Règle 1 : Maximum 2-3 questions
**Avant** :
```
Agent: "Pour votre demande APL, j'ai besoin de plusieurs informations :
1. Quelle est votre situation professionnelle ?
2. Êtes-vous locataire ou propriétaire ?
3. Quels sont vos revenus mensuels ?
4. Avez-vous des personnes à charge ?
5. Depuis combien de temps habitez-vous à cette adresse ?"
```

**Après** :
```
Agent: "Pour votre demande APL, précisons d'abord :
1. Quelle est votre situation ? (étudiant, salarié, demandeur d'emploi...)
2. Êtes-vous locataire ou propriétaire ?"
```

#### Règle 2 : Limite 4 échanges (8 messages)
**Implémentation** :
```typescript
// Dans processUserMessage() (ligne 57-75)
const messageCount = messagesSnapshot.size + 2;

if (messageCount >= 8 && !intentAnalysis.readyToStart) {
  const response = `✅ J'ai collecté plusieurs informations sur votre demande.

Résumé :
${JSON.stringify(intentAnalysis.collectedInfo, null, 2)}

Souhaitez-vous que je crée votre dossier maintenant ?
(Répondez "oui" pour démarrer)`;

  await this.addAgentResponse(sessionId, response);
  return;
}
```

---

## 💬 Prompt 4 : Génération Réponse Contextuelle

### **Méthode** : `generateChatResponse(systemPrompt, userMessage, conversationHistory, contextAnalysis, intentAnalysis?)`

### **Objectif**
Générer une réponse adaptée au contexte détecté (continuation, changement de sujet, etc.).

### **Température IA** : `0.7` (par défaut, non spécifiée)

### **Instructions dynamiques selon contexte**

#### Contexte : `topic_change`
```
⚠️ L'utilisateur CHANGE DE SUJET.
Ancien sujet: Demande APL
Nouveau sujet: Renouvellement passeport

➡️ Tu dois:
1. Accuser réception du changement (ex: "D'accord, parlons de Renouvellement passeport")
2. Repartir de zéro sur ce nouveau sujet
3. Ne pas mélanger avec le contexte précédent
```

#### Contexte : `topic_return`
```
L'utilisateur REVIENT à un sujet antérieur.
Sujet retrouvé: Demande APL

Tu dois:
1. Reconnaître le retour (ex: "Ah oui, revenons à votre Demande APL")
2. Reprendre les infos déjà collectées: étudiant, locataire, Paris
3. Continuer depuis où vous étiez
```

#### Contexte : `continuation`
```
L'utilisateur CONTINUE le sujet en cours.
Sujet: Demande APL

Tu dois:
1. Prendre en compte TOUT l'historique
2. Ne PAS redemander des infos déjà données
3. Progresser logiquement dans la conversation
```

#### Contexte : `new_conversation`
```
NOUVELLE CONVERSATION (pas d'historique)

Tu dois:
1. Accueillir l'utilisateur
2. Identifier sa demande
3. Commencer à poser les bonnes questions
```

### **Prompt complet généré**

```
[INSTRUCTION CONTEXTUELLE CI-DESSUS]

HISTORIQUE DE LA CONVERSATION:
user: Je veux une aide au logement
agent: Pour votre demande d'aide au logement...
user: Je suis étudiant à Paris

NOUVEAU MESSAGE UTILISATEUR:
Mon loyer est de 850€ par mois

INSTRUCTIONS:
- Répondre de manière précise et méthodique
- Adapter ta réponse au contexte détecté ci-dessus
- Poser les bonnes questions pour comprendre la situation exacte
- Fournir des étapes concrètes et des informations pratiques
- Maximum 2-3 questions à la fois

Réponse:
```

### **Gestion d'erreurs**

```typescript
try {
  const response = await this.vertexAI.generateResponse("CHAT", prompt, {
    systemInstruction: systemPrompt,
  });

  return response.trim() || "Je suis désolé, je n'ai pas pu générer une réponse appropriée.";
} catch (error) {
  console.error("Error generating chat response:", error);
  return "Je suis désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre question ?";
}
```

**⚠️ Fallback** : Message d'erreur générique pour ne jamais laisser l'utilisateur sans réponse.

---

## 🔧 Cas d'erreur communs

### Erreur 1 : JSON avec markdown
**Symptôme** :
```json
```json
{
  "demarche": "Demande APL",
  ...
}
```
```

**Solution** :
```typescript
const cleanedResponse = response
  .replace(/```json\n?/g, "")
  .replace(/```\n?/g, "")
  .trim();
```

### Erreur 2 : Champs manquants dans JSON
**Symptôme** :
```json
{
  "demarche": "Demande APL"
  // manque readyToStart, userConfirmed, etc.
}
```

**Solution** : Toujours vérifier et fournir des fallbacks
```typescript
const intentAnalysis = {
  demarche: parsed.demarche || "Inconnu",
  readyToStart: parsed.readyToStart ?? false,
  userConfirmed: parsed.userConfirmed ?? false,
  confidence: parsed.confidence ?? 0,
  missingInfo: parsed.missingInfo || [],
  collectedInfo: parsed.collectedInfo || {},
};
```

### Erreur 3 : Types incorrects
**Symptôme** :
```json
{
  "confidence": "0.95"  // string au lieu de number
}
```

**Solution** : Parser les valeurs
```typescript
confidence: typeof parsed.confidence === "string" 
  ? parseFloat(parsed.confidence) 
  : parsed.confidence
```

### Erreur 4 : Quota Vertex AI dépassé
**Symptôme** :
```
Error: 429 RESOURCE_EXHAUSTED: Quota exceeded
```

**Solution actuelle** : Laisser l'erreur remonter
**Solution future** : Implémenter retry logic (voir tâche optionnelle)

---

## 📊 Métriques et Performance

### Temps de réponse moyen

| Prompt | Durée moyenne | Complexité |
|--------|--------------|------------|
| analyzeContext | 1-2s | Faible |
| analyzeIntentAndReadiness | 2-3s | Moyenne |
| generateChatResponse | 2-4s | Élevée |
| **Total par message** | **5-9s** | - |

### Coûts Vertex AI (estimation)

**Modèle** : `gemini-2.0-flash-lite` (AI_MODELS.CHAT)

| Prompt | Tokens input | Tokens output | Coût unitaire |
|--------|--------------|---------------|---------------|
| analyzeContext | ~300 | ~100 | $0.0001 |
| analyzeIntentAndReadiness | ~400 | ~150 | $0.0002 |
| generateChatResponse | ~500 | ~200 | $0.0003 |
| **Total par message** | **~1200** | **~450** | **$0.0006** |

**Pour 1000 conversations** (4 échanges/conversation) :
- Total tokens : ~6.6M
- Coût estimé : ~$2.40

---

## 🧪 Tests E2E

Tous les prompts sont testés dans `src/test/test-chat.ts` :

| Test | Prompts testés | Status |
|------|----------------|--------|
| Test 1 : Conversation complète | Tous les 4 | ✅ |
| Test 2 : Détection confirmation | analyzeIntentAndReadiness | ✅ |
| Test 3 : Limite 8 messages | buildSystemPrompt | ✅ |
| Test 4 : Analyse intention | analyzeIntentAndReadiness | ✅ |
| Test 5 : Historique vide | generateChatResponse | ✅ |
| Test 6 : Changement sujet | analyzeContext | ✅ |

**Commande pour lancer les tests** :
```bash
cd simplifia-backend/functions
npm run build
node lib/test/test-chat.js
```

---

## 🔮 Améliorations futures

### Priorité HAUTE
- [ ] Ajouter retry logic pour Vertex AI (3 tentatives max)
- [ ] Valider strictement les formats JSON retournés
- [ ] Logger les prompts/réponses pour debugging

### Priorité MOYENNE
- [ ] Ajouter métriques (durée, taux succès par prompt)
- [ ] Créer variants A/B du system prompt
- [ ] Optimiser les tokens (réduire longueur prompts)

### Priorité BASSE
- [ ] Support multi-langues (anglais, espagnol...)
- [ ] Personnalisation du ton selon utilisateur
- [ ] Cache des réponses fréquentes

---

## 📖 Références

- **Fichier source** : `src/agents/chat.ts`
- **Tests** : `src/test/test-chat.ts`
- **Modèle IA** : Configuration dans `src/config/ai-models.ts`
- **ROADMAP** : `ROADMAP_HACKATHON.md` (Jour 1 - ChatAgent)

---

**Dernière mise à jour** : 24 Octobre 2025  
**Auteur** : DEV1 (avec audit DEV2)  
**Version** : 2.0 (avec règles concision)
