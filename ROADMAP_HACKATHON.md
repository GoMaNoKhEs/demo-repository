# 🚀 ROADMAP HACKATHON SIMPLIFIA - 2 DÉVELOPPEURS

**Objectif** : Démo fonctionnelle end-to-end d'une démarche administrative automatisée  
**Équipe** : 2 Développeurs Full-Stack (Frontend + Backend)  
**Deadline** : [Date du Hackathon]  
**Stack** : Firebase + Vertex AI + React  

---

## 👥 RÉPARTITION DES TÂCHES

### 🔵 **DEV1** : ChatAgent Intelligent + UI Polish
- **Backend** : ChatAgent amélioré (analyse + création processus)
- **Backend** : ~~FormFiller Agent (mapping formulaires)~~ ✅ **FUSIONNÉ DANS NAVIGATOR (DEV2)**
- **Frontend** : Amélioration UI dashboard + animations
- **Tests** : E2E ChatAgent

### 🟢 **DEV2** : Navigator + Validator + Orchestrateur + Démo
- **Backend** : APISimulator + Navigator Agent
- **Backend** : Validator Agent + ProcessOrchestrator
- **Frontend** : Optimisation temps réel + logs activité
- **Tests** : E2E workflow complet + préparation démo

### 🤝 Points de synchronisation
- **Jour 1 fin** : Validation création processus (DEV1 → DEV2)
- **Jour 3 fin** : ~~Tests intégration FormFiller + Validator~~ Tests intégration NavigatorAgent + Validator (DEV2 complet)
- **Jour 4 midi** : Merge orchestrateur complet
- **Jour 5** : Répétition démo ensemble

---

## 📊 ÉTAT ACTUEL (24 Oct 2025)

### ✅ Ce qui fonctionne
- [x] Frontend React complet (58 fichiers, 0 erreurs)
- [x] Firebase Auth + Firestore configuré
- [x] **ChatAgent conversationnel avec Vertex AI** ✅ **98/100**
  - [x] Analyse intention + contexte
  - [x] Création processus automatique (4 steps)
  - [x] Step 0 completed automatiquement
  - [x] Tests E2E : 6/6 passing
- [x] **APISimulator complet** ✅ **100/100**
  - [x] 7 sites simulés (CAF, ANTS, IMPOTS, SECU, POLE_EMPLOI, PREFECTURE, URSSAF)
  - [x] Tests E2E : 8/8 passing
- [x] **NavigatorAgent + FormFiller intégré** ✅ **100/100**
  - [x] Navigation + mapping données (85% confidence)
  - [x] Activity logs Firestore
  - [x] Tests E2E : 5/5 passing
- [x] **ValidatorAgent complet** ✅ **100/100**
  - [x] Validation Vertex AI
  - [x] Tests E2E : 5/5 passing (latence 2.6s)
- [x] **ProcessOrchestrator** ✅ **90/100**
  - [x] Workflow complet : Navigator → Validator → Completion
  - [x] Retry logic + circuit breaker
  - [x] Métriques performance
  - [x] Tests E2E : 1/1 passing
- [x] Temps réel frontend ↔ backend
- [x] UI/UX complète (dashboard, timeline, chat)
- [x] **Intégration JOUR 1-3 validée** ✅
  - [x] Test E2E ChatAgent → Navigator (4/5 critères)
  - [x] Collection "processes" harmonisée
  - [x] Sync points validés

### ⏸️ Ce qui reste (JOUR 4-5)
- [ ] Test E2E complet avec Orchestrator (2h)
- [ ] Vérifier frontend temps réel (1h)
- [ ] Scénario démo finalisé (2h)
- [ ] Slides présentation (2h)
- [ ] Répétition démo 10x (2h)
- [ ] Mode démo offline (1h)
- [ ] Tests de charge 10 processus (1h)
- [ ] UI polish (tooltips, animations) (2h)

### 📈 Score Global
- **Backend Agents**: ✅ 95% (5/5 agents opérationnels)
- **Tests E2E**: ✅ 100% (25/25 tests passing)
- **Intégration**: ✅ 90% (Sync JOUR 1-3 validés)
- **Frontend Polish**: ⏸️ 70% (UI OK, animations partielles)
- **Démo Préparation**: ⏸️ 30% (Scénario existe, répétition manquante)

**SCORE GLOBAL**: **77%** ✅ **PRÊT POUR DÉMO** (avec finitions JOUR 5)

---

## 🎯 OBJECTIF HACKATHON

**Démontrer** :
1. User décrit sa situation dans le chat
2. ChatAgent pose 2-3 questions précises
3. User confirme → Processus créé automatiquement
4. Navigator simule connexion au site (CAF/ANTS)
5. FormFiller mappe les données
6. Validator vérifie avant soumission
7. Processus complété avec succès

**Scénario de démo** : Demande d'APL (Aide au Logement)

---

## 📅 PLANNING (5 JOURS) - 2 DÉVELOPPEURS

### **JOUR 1 : Fondations Backend + Préparation Frontend** (8h/dev)

#### 🔵 **DEV1 - Matin (4h)** : ChatAgent Intelligent - Partie 1

**Objectif** : ChatAgent qui analyse les conversations et détecte l'intention

**Tâches Backend** :
**Tâches Backend** :

1. ✅ **Ajouter historique conversation** (1h)
   ```typescript
   // Dans agents/chat.ts
   private async getConversationHistory(sessionId: string, limit = 10) {
     const messages = await this.db
       .collection("messages")
       .where("sessionId", "==", sessionId)
       .orderBy("timestamp", "desc")
       .limit(limit)
       .get();
       
     return messages.docs
       .reverse()
       .map(doc => `${doc.data().role}: ${doc.data().content}`)
       .join("\n");
   }
   ```

2. ✅ **Détecter intention + prêt à démarrer** (2h)
   ```typescript
   private async analyzeIntentAndReadiness(history: string, message: string) {
     const prompt = `Historique:
   ${history}
   
   Dernier message: ${message}
   
   Analyse et retourne JSON:
   {
     "demarche": "nom précis (ex: Demande APL)",
     "readyToStart": true/false,
     "confidence": 0.0-1.0,
     "missingInfo": ["info manquante 1", "info 2"],
     "collectedInfo": {
       "situation": "étudiant/salarié/...",
       "logement": "locataire/propriétaire",
       "revenus": "montant approximatif",
       "ville": "nom ville"
     }
   }`;
     
     const response = await this.vertexAI.generateResponse("CHAT", prompt);
     return JSON.parse(response);
   }
   ```

3. ✅ **Améliorer system prompt** (1h)
   ```typescript
   private buildSystemPrompt(): string {
     return `Tu es SimplifIA, expert démarches administratives.
   
   RÈGLES :
   1. Pose 2-3 questions MAX (situation, logement, revenus)
   2. Dès que tu as les infos, PROPOSE de créer le dossier
   3. Phrases clés : "Parfait ! Voulez-vous que je crée votre dossier ?"
   4. NE JAMAIS dépasser 4 échanges sans proposer démarrage
   
   STRUCTURE :
   - Message 1 : Identifier démarche + poser 1-2 questions
   - Message 2 : Résumer + proposer démarrage
   - Message 3 : Confirmation → Créer processus
   `;
   }
   ```

**Tests** : Vérifier historique + analyse intention

---

#### 🟢 **DEV2 - Matin (4h)** : APISimulator Foundation

**Objectif** : Créer simulateur d'API pour 7 sites administratifs français

**Tâches Backend** :

1. ✅ **Créer structure APISimulatorAgent** (2h)
   ```typescript
   // agents/api-simulator.ts
   import { VertexAIService } from "../services/vertex-ai";
   
   export class APISimulatorAgent {
     private vertexAI: VertexAIService;
     
     constructor() {
       this.vertexAI = new VertexAIService();
     }
     
     async simulateAPICall(
       siteName: 'CAF' | 'ANTS' | 'IMPOTS' | 'SECU' | 'POLE_EMPLOI' | 'PREFECTURE' | 'URSSAF',
       endpoint: string,
       userData: any
     ): Promise<any> {
       const siteContext = this.getSiteContext(siteName);
       
       const prompt = `Tu es l'API du site ${siteName}.
       
   Contexte:
   ${siteContext}
   
   Endpoint: ${endpoint}
   Données reçues: ${JSON.stringify(userData, null, 2)}
   
   Génère une réponse JSON réaliste incluant:
   - statut: "success" ou "error"
   - numeroDossier: string (format ${siteName}-2025-XXXXXX)
   - message: string explicatif
   - prochainEtape: string
   - delaiEstime: string
   
   Réponse JSON pure (pas de markdown):`;
       
       const response = await this.vertexAI.generateResponse("NAVIGATOR", prompt, {
         temperature: 0.2 // Très déterministe
       });
       
       try {
         return JSON.parse(response);
       } catch (error) {
         console.error("Invalid JSON from API simulator:", response);
         return {
           statut: "error",
           message: "Erreur de simulation API"
         };
       }
     }
     
     private getSiteContext(siteName: string): string {
       const contexts = {
         CAF: `Caisse d'Allocations Familiales
         Aides: RSA, APL, Prime d'activité
         Documents: RIB, justif domicile, avis imposition
         Délais: 2 mois`,
         
         ANTS: `Agence Nationale Titres Sécurisés
         Services: Passeport, CNI, Permis
         Documents: Photo identité, justif domicile
         Délais: 3-6 semaines`,
         
         IMPOTS: `Finances Publiques
         Services: Déclaration, remboursement
         Délais: 3-6 mois`,
         
         SECU: `Assurance Maladie
         Services: Remboursements, carte vitale
         Délais: 2-4 semaines`,
         
         POLE_EMPLOI: `Pôle Emploi
         Services: Inscription chômage, actualisation
         Documents: Attestation employeur, RIB, pièce d'identité
         Délais: 1-2 semaines`,
         
         PREFECTURE: `Préfecture
         Services: Titre de séjour, changement adresse carte grise
         Documents: Passeport, justif domicile, photos
         Délais: 2-4 mois`,
         
         URSSAF: `URSSAF
         Services: Inscription auto-entrepreneur, cotisations
         Documents: Pièce d'identité, RIB, justif domicile
         Délais: 2-3 semaines`
       };
       return contexts[siteName];
     }
   }
   ```

2. ✅ **Tests APISimulator 7 sites** (2h)
   - Test réponse CAF (Demande APL)
   - Test réponse ANTS (Passeport)
   - Test réponse POLE_EMPLOI (Inscription chômage)
   - Test réponse PREFECTURE (Titre séjour)
   - Test réponse URSSAF (Auto-entrepreneur)
   - Test réponse IMPOTS (Déclaration)
   - Test réponse SECU (Carte Vitale)
   - Vérifier formats JSON (8/8 tests ✅)

**Résultat** : 336 lignes, 8 tests passent

---

#### 🔵 **DEV1 - Après-midi (4h)** : ChatAgent Intelligent - Partie 2

**Objectif** : ChatAgent crée automatiquement les processus

**Tâches Backend** :

4. ✅ **Créer processus depuis conversation** (2h)
   ```typescript
   private async createProcessFromConversation(
     sessionId: string,
     analysis: any
   ) {
     // 1. Récupérer userId depuis premier message
     const messagesSnapshot = await this.db
       .collection("messages")
       .where("sessionId", "==", sessionId)
       .limit(1)
       .get();
       
     if (messagesSnapshot.empty) {
       throw new Error("No messages found for session");
     }
     
     const userId = messagesSnapshot.docs[0].data().userId;
     
     // 2. Créer le processus avec steps détaillés
     const processData = {
       title: analysis.demarche,
       userId: userId,
       sessionId: sessionId,
       status: "created",
       description: `Demande de ${analysis.demarche}`,
       userContext: analysis.collectedInfo,
       steps: [
         {
           id: "0",
           name: "Analyse de la situation",
           status: "pending",
           order: 0,
           description: "Vérification éligibilité et documents"
         },
         {
           id: "1",
           name: "Connexion au site",
           status: "pending",
           order: 1,
           description: "Accès au portail administratif"
         },
         {
           id: "2",
           name: "Remplissage formulaire",
           status: "pending",
           order: 2,
           description: "Saisie des informations"
         },
         {
           id: "3",
           name: "Validation et envoi",
           status: "pending",
           order: 3,
           description: "Vérification finale et soumission"
         }
       ],
       currentStepIndex: 0,
       createdAt: admin.firestore.FieldValue.serverTimestamp(),
       updatedAt: admin.firestore.FieldValue.serverTimestamp()
     };
     
     const processRef = await this.db.collection("processes").add(processData);
     
     console.log(`✅ Processus créé: ${processRef.id}`);
     
     // 3. Envoyer message de confirmation
     await this.addAgentResponse(
       sessionId,
       `🎉 Parfait ! J'ai créé votre dossier "${analysis.demarche}".
       
       📋 Documents nécessaires : ${this.getDocumentsList(analysis.demarche)}
       ⏱️ Délai estimé : 2 mois
       
       Je commence l'analyse. Suivez l'avancement dans le tableau de bord ! 🚀`
     );
   }
   
   private getDocumentsList(demarche: string): string {
     const documents = {
       "Demande APL": "Bail, RIB, Avis d'imposition",
       "Renouvellement passeport": "Ancien passeport, Photo, Justif domicile",
       "Demande RSA": "RIB, Justif domicile, Pièce d'identité"
     };
     return documents[demarche] || "Documents à définir";
   }
   ```

5. ✅ **Détection confirmation + limite échanges** (2h)
   ```typescript
   private detectConfirmation(message: string): boolean {
     const confirmWords = [
       'oui', 'ok', 'd\'accord', 'vas-y', 'lance', 'démarre',
       'commence', 'go', 'parfait', 'c\'est bon', 'allons-y'
     ];
     
     const lowerMessage = message.toLowerCase();
     return confirmWords.some(word => lowerMessage.includes(word));
   }
   
   async processUserMessage(sessionId: string, userMessage: string) {
     const history = await this.getConversationHistory(sessionId);
     const messageCount = history.split('\n').filter(l => l.trim()).length;
     
     // Détection confirmation
     const isConfirming = this.detectConfirmation(userMessage);
     
     if (isConfirming) {
       const analysis = await this.analyzeIntentAndReadiness(history, userMessage);
       
       if (analysis.readyToStart && analysis.confidence > 0.7) {
         await this.createProcessFromConversation(sessionId, analysis);
         return; // FIN conversation
       }
     }
     
     // Forcer proposition après 8 messages (4 échanges)
     if (messageCount >= 8) {
       const analysis = await this.analyzeIntentAndReadiness(history, userMessage);
       
       await this.addAgentResponse(
         sessionId,
         `✅ J'ai toutes les informations pour votre ${analysis.demarche} !
         
         Souhaitez-vous que je crée votre dossier maintenant ? 
         (Répondez "oui" pour démarrer)`
       );
       return;
     }
     
     // Conversation normale avec analyse
     const analysis = await this.analyzeIntentAndReadiness(history, userMessage);
     const response = await this.generateContextualResponse(analysis);
     await this.addAgentResponse(sessionId, response);
   }
   ```

**Tests** : E2E création processus depuis chat

---

#### 🟢 **DEV2 - Après-midi (4h)** : Navigator Agent

**Objectif** : Navigator qui utilise APISimulator et log dans Firestore

**Tâches Backend** :

3. ✅ **Implémenter NavigatorAgent** (3h)
   ```typescript
   // agents/navigator.ts
   import * as admin from "firebase-admin";
   import { APISimulatorAgent } from "./api-simulator";
   
   export class NavigatorAgent {
     private static instance: NavigatorAgent;
     private apiSimulator: APISimulatorAgent;
     private db = admin.firestore();
     
     private constructor() {
       this.apiSimulator = new APISimulatorAgent();
     }
     
     public static getInstance(): NavigatorAgent {
       if (!NavigatorAgent.instance) {
         NavigatorAgent.instance = new NavigatorAgent();
       }
       return NavigatorAgent.instance;
     }
     
     async navigateAndSubmit(
       processId: string,
       siteName: 'CAF' | 'ANTS' | 'IMPOTS' | 'SECU' | 'POLE_EMPLOI' | 'PREFECTURE' | 'URSSAF',
       userData: any
     ) {
       try {
         console.log(`🌐 Navigation vers ${siteName} pour processus ${processId}`);
         
         // 1. Log début navigation
         await this.db.collection("activity_logs").add({
           processId,
           type: "info",
           message: `Connexion au site ${siteName}`,
           details: "Initialisation...",
           timestamp: admin.firestore.FieldValue.serverTimestamp()
         });
         
         // 2. Simuler appel API
         const endpoint = this.getEndpointForSite(siteName, userData);
         const response = await this.apiSimulator.simulateAPICall(
           siteName,
           endpoint,
           userData
         );
         
         // 3. Log résultat
         if (response.statut === "success") {
           await this.db.collection("activity_logs").add({
             processId,
             type: "success",
             message: `✅ Dossier créé sur ${siteName}`,
             details: `Numéro: ${response.numeroDossier}`,
             timestamp: admin.firestore.FieldValue.serverTimestamp()
           });
           
           // Mettre à jour processus
           await this.db.collection("processes").doc(processId).update({
             externalReference: response.numeroDossier,
             status: "running",
             updatedAt: admin.firestore.FieldValue.serverTimestamp()
           });
         } else {
           await this.db.collection("activity_logs").add({
             processId,
             type: "error",
             message: `❌ Erreur ${siteName}`,
             details: response.message,
             timestamp: admin.firestore.FieldValue.serverTimestamp()
           });
         }
         
         return response;
       } catch (error) {
         console.error(`❌ Navigator error:`, error);
         throw error;
       }
     }
     
     private getEndpointForSite(siteName: string, userData: any): string {
       const endpoints = {
         CAF: `/demandes/${userData.typeAide || 'apl'}`,
         ANTS: `/demandes/${userData.typeDocument || 'passeport'}`,
         IMPOTS: `/declarations/revenus`,
         SECU: `/remboursements/demande`,
         POLE_EMPLOI: `/inscriptions/demandeur`,
         PREFECTURE: `/titres-sejour/demande`,
         URSSAF: `/auto-entrepreneur/inscription`
       };
       return endpoints[siteName];
     }
   }
   ```

4. ✅ **Tests Navigator** (1h)
   - Test navigation CAF (✅)
   - Test navigation ANTS (✅)
   - Test navigation POLE_EMPLOI (✅)
   - Test erreur CAF (✅)
   - Test update processus (✅)
   - Vérifier logs Firestore (5/5 tests ✅)

**Résultat** : 218 lignes, 5 tests passent
   - Vérifier logs activity_logs
   - Vérifier update processus

**🔄 Point de sync Jour 1** : DEV1 partage structure processus créés → DEV2 peut tester Navigator

**Livrable Jour 1** : 
- ✅ ChatAgent crée processus automatiquement (DEV1)
- ✅ Navigator connecte sites simulés (DEV2)

---

### **JOUR 2 : ~~Agents FormFiller + Validator~~ NavigatorAgent Complet + Validator** (8h/dev)

#### 🔵 **DEV1 - Matin (4h)** : ~~FormFiller Agent~~ ✅ **FUSIONNÉ DANS NAVIGATOR (DEV2)**

**⚠️ CHANGEMENT ARCHITECTURE** : FormFiller a été **fusionné dans NavigatorAgent** pour simplifier.

**Raison** : NavigatorAgent fait maintenant :
1. **Mapping** des données utilisateur → format site (ex: FormFiller)
2. **Soumission** via APISimulator (ancien rôle)

**Impact DEV1** : Cette tâche n'est **plus nécessaire**. DEV2 a déjà implémenté le mapping dans `navigator.ts`.

**Nouvelle tâche recommandée pour DEV1 JOUR 2 MATIN** :
- Améliorer ChatAgent (gestion multi-langues, détection d'intention avancée)
- OU Commencer UI Dashboard animations/polish
- OU Tests E2E ChatAgent (Jour 1 PM anticipé)

~~**Objectif** : Mapper données utilisateur → champs formulaire~~

~~**Tâches Backend** :~~

~~1. ✅ **Implémenter FormFillerAgent** (3h)~~
   ```typescript
   // agents/formFiller.ts
   import * as admin from "firebase-admin";
   import { VertexAIService } from "../services/vertex-ai";
   
   export class FormFillerAgent {
     private static instance: FormFillerAgent;
     private vertexAI: VertexAIService;
     private db = admin.firestore();
     
     private constructor() {
       this.vertexAI = new VertexAIService();
     }
     
     public static getInstance(): FormFillerAgent {
       if (!FormFillerAgent.instance) {
         FormFillerAgent.instance = new FormFillerAgent();
       }
       return FormFillerAgent.instance;
     }
     
     async mapUserDataToForm(
       processId: string,
       userData: any,
       formStructure: any
     ) {
       try {
         console.log(`📝 Mapping données pour processus ${processId}`);
         
         const prompt = `Tu es un expert en remplissage de formulaires administratifs.
         
   Données utilisateur:
   ${JSON.stringify(userData, null, 2)}
   
   Structure du formulaire:
   ${JSON.stringify(formStructure, null, 2)}
   
   Tâche: Mappe chaque donnée utilisateur au bon champ du formulaire.
   
   Retourne JSON:
   {
     "mappings": [
       {
         "field": "nom_champ_formulaire",
         "value": "valeur",
         "confidence": 0.0-1.0,
         "source": "champ_user_data"
       }
     ],
     "missingFields": ["champ1", "champ2"],
     "readyToSubmit": true/false
   }`;
         
         const response = await this.vertexAI.generateResponse("FORM_FILLER", prompt);
         const mapping = JSON.parse(response);
         
         // Log résultat
         await this.db.collection("activity_logs").add({
           processId,
           type: mapping.readyToSubmit ? "success" : "warning",
           message: mapping.readyToSubmit 
             ? "✅ Formulaire prêt"
             : "⚠️ Données manquantes",
           details: mapping.missingFields.length > 0 
             ? `Manquants: ${mapping.missingFields.join(', ')}`
             : "Tous les champs remplis",
           timestamp: admin.firestore.FieldValue.serverTimestamp()
         });
         
         return mapping;
       } catch (error) {
         console.error(`❌ FormFiller error:`, error);
         throw error;
       }
     }
   }
   ```

2. ✅ **Créer structures formulaires** (1h)
   ```typescript
   const FORM_STRUCTURES = {
     CAF: {
       fields: [
         { name: "nom", type: "text", required: true },
         { name: "prenom", type: "text", required: true },
         { name: "situation", type: "select", required: true },
         { name: "revenus_mensuels", type: "number", required: true },
         { name: "ville", type: "text", required: true }
       ]
     },
     ANTS: {
       fields: [
         { name: "nom", type: "text", required: true },
         { name: "prenom", type: "text", required: true },
         { name: "date_naissance", type: "date", required: true },
         { name: "lieu_naissance", type: "text", required: true }
       ]
     }
   };
   ```

**Tests** : Mapping CAF + ANTS

---

#### 🟢 **DEV2 - Matin (4h)** : Validator Agent

**Objectif** : Valider données avant soumission avec règles strictes

**Tâches Backend** :

1. ✅ **Implémenter ValidatorAgent** (3h)
   ```typescript
   // agents/validator.ts
   import * as admin from "firebase-admin";
   import { VertexAIService } from "../services/vertex-ai";
   
   export class ValidatorAgent {
     private static instance: ValidatorAgent;
     private vertexAI: VertexAIService;
     private db = admin.firestore();
     
     private constructor() {
       this.vertexAI = new VertexAIService();
     }
     
     public static getInstance(): ValidatorAgent {
       if (!ValidatorAgent.instance) {
         ValidatorAgent.instance = new ValidatorAgent();
       }
       return ValidatorAgent.instance;
     }
     
     async validateBeforeSubmission(
       processId: string,
       mappedData: any
     ) {
       try {
         console.log(`✅ Validation pour processus ${processId}`);
         
         const prompt = `Tu es un validateur strict de données administratives.
         
   Données à valider:
   ${JSON.stringify(mappedData, null, 2)}
   
   Vérifie 4 catégories:
   1. Formats (email xxx@yyy.zzz, téléphone 10 chiffres 06/07/01-05/09, code postal 5 chiffres)
   2. Cohérence (dates non futures, montants positifs, valeurs réalistes)
   3. Complétude (champs requis présents, valeurs non vides)
   4. Logique métier (revenus>0 sauf RSA, loyer<revenus×3 pour APL, age>=18)
   
   Retourne JSON:
   {
     "valid": true/false,
     "errors": [
       { "field": "nom_champ", "message": "erreur", "severity": "critical|warning" }
     ],
     "recommendations": ["conseil 1"],
     "confidence": 0.0-1.0
   }`;
         
         const response = await this.vertexAI.generateResponse("VALIDATOR", prompt, {
           temperature: 0.2 // Strict et déterministe
         });
         const validation = JSON.parse(response);
         
         // Log résultat détaillé
         await this.db.collection("activity_logs").add({
           processId,
           agent: "ValidatorAgent",
           statut: validation.valid ? "SUCCESS" : "PARTIAL",
           message: validation.valid 
             ? "✅ Validation réussie"
             : `❌ ${validation.errors.length} erreurs détectées`,
           details: validation,
           errorsCount: validation.errors.length,
           criticalErrorsCount: validation.errors.filter(e => e.severity === "critical").length,
           warningsCount: validation.errors.filter(e => e.severity === "warning").length,
           recommendations: validation.recommendations,
           confidence: validation.confidence,
           timestamp: admin.firestore.FieldValue.serverTimestamp()
         });
         
         return validation;
       } catch (error) {
         console.error(`❌ Validator error for process ${processId}:`, error);
         throw error;
       }
     }
   }
   ```

2. ✅ **Tests ValidatorAgent** (1h)
   - Test données valides CAF (✅)
   - Test email invalide (✅)
   - Test code postal invalide (✅)
   - Test montant négatif (✅)
   - Test champs manquants (✅)
   - Vérifier logs Firestore (5/5 tests ✅)

**Résultat** : 272 lignes, 5 tests passent, latence moy 2.6s

---

#### 🔵 **DEV1 - Après-midi (4h)** : Tests FormFiller + Frontend Dashboard

**Tâches** :

3. ✅ **Tests E2E FormFiller** (2h)
   - Test mapping complet CAF
   - Test mapping ANTS
   - Test détection champs manquants

**Tâches Frontend** :

4. ✅ **Améliorer affichage process dans Dashboard** (2h)
   ```typescript
   // Ajouter indicateurs de progression
   - Barre de progression des steps
   - Affichage temps écoulé
   - Icônes de statut animés (spinner, checkmark)
   ```

---

#### 🟢 **DEV2 - Après-midi (4h)** : Tests Validator + Frontend Logs

**Tâches** :

3. ✅ **Tests E2E Validator** (2h)
   - Test validation complète
   - Test gestion erreurs
   - Test recommandations

**Tâches Frontend** :

4. ✅ **Optimiser affichage logs activité** (2h)
   ```typescript
   // Améliorer realtime listeners
   - Grouper logs par type
   - Animations d'apparition
   - Couleurs par type (success/error/warning/info)
   - Auto-scroll vers dernier log
   ```

**Livrable Jour 2** : 
- ✅ FormFiller opérationnel (DEV1)
- ✅ Validator opérationnel (DEV2)
- ✅ Frontend amélioré (DEV1 + DEV2)

---

### **JOUR 3 : Orchestrateur + Tests E2E** (8h/dev)

#### 🟢 **DEV2 - Matin (4h)** : ProcessOrchestrator

**Objectif** : Coordonner tous les agents dans un workflow

**Tâches Backend** :

1. ✅ **Créer ProcessOrchestrator** (4h)
   ```typescript
   // services/orchestrator.ts
   import * as admin from "firebase-admin";
   import { ChatAgent } from "../agents/chat";
   import { NavigatorAgent } from "../agents/navigator";
   import { FormFillerAgent } from "../agents/formFiller";
   import { ValidatorAgent } from "../agents/validator";
   
   export class ProcessOrchestrator {
     private static instance: ProcessOrchestrator;
     private db = admin.firestore();
     
     private constructor() {}
     
     public static getInstance(): ProcessOrchestrator {
       if (!ProcessOrchestrator.instance) {
         ProcessOrchestrator.instance = new ProcessOrchestrator();
       }
       return ProcessOrchestrator.instance;
     }
     
     async executeWorkflow(processId: string) {
       try {
         const processDoc = await this.db.collection("processes").doc(processId).get();
         const processData = processDoc.data();
         
         if (!processData) {
           throw new Error(`Process ${processId} not found`);
         }
         
         console.log(`🎯 Starting workflow for process ${processId}`);
         
         // ÉTAPE 0: Analyse (déjà complétée par ChatAgent)
         await this.updateStep(processId, 0, "completed");
         
         // ÉTAPE 1: Navigator - Connexion au site
         await this.updateStep(processId, 1, "in-progress");
         
         const siteName = this.determineSite(processData.title);
         const navigator = NavigatorAgent.getInstance();
         const navResponse = await navigator.navigateAndSubmit(
           processId,
           siteName,
           processData.userContext
         );
         
         if (navResponse.statut !== "success") {
           throw new Error(`Navigation failed: ${navResponse.message}`);
         }
         
         await this.updateStep(processId, 1, "completed");
         
         // ÉTAPE 2: FormFiller - Mapping données
         await this.updateStep(processId, 2, "in-progress");
         
         const formStructure = this.getFormStructure(siteName);
         const formFiller = FormFillerAgent.getInstance();
         const mapping = await formFiller.mapUserDataToForm(
           processId,
           processData.userContext,
           formStructure
         );
         
         await this.updateStep(processId, 2, "completed");
         
         // ÉTAPE 3: Validator - Validation
         await this.updateStep(processId, 3, "in-progress");
         
         const validator = ValidatorAgent.getInstance();
         const validation = await validator.validateBeforeSubmission(
           processId,
           mapping
         );
         
         if (!validation.valid) {
           await this.updateStep(processId, 3, "failed");
           await this.db.collection("processes").doc(processId).update({
             status: "failed",
             error: "Validation échouée",
             updatedAt: admin.firestore.FieldValue.serverTimestamp()
           });
           return;
         }
         
         await this.updateStep(processId, 3, "completed");
         
         // PROCESSUS COMPLET
         await this.db.collection("processes").doc(processId).update({
           status: "completed",
           completedAt: admin.firestore.FieldValue.serverTimestamp(),
           updatedAt: admin.firestore.FieldValue.serverTimestamp()
         });
         
         console.log(`✅ Workflow completed for process ${processId}`);
         
       } catch (error) {
         console.error(`❌ Workflow failed for process ${processId}:`, error);
         
         await this.db.collection("processes").doc(processId).update({
           status: "failed",
           error: String(error),
           updatedAt: admin.firestore.FieldValue.serverTimestamp()
         });
       }
     }
     
     private async updateStep(processId: string, stepIndex: number, status: string) {
       const updateData: any = {
         [`steps.${stepIndex}.status`]: status,
         currentStepIndex: stepIndex,
         updatedAt: admin.firestore.FieldValue.serverTimestamp()
       };
       
       if (status === "in-progress") {
         updateData[`steps.${stepIndex}.startedAt`] = admin.firestore.FieldValue.serverTimestamp();
       } else if (status === "completed") {
         updateData[`steps.${stepIndex}.completedAt`] = admin.firestore.FieldValue.serverTimestamp();
       }
       
       await this.db.collection("processes").doc(processId).update(updateData);
     }
     
     private determineSite(title: string): 'CAF' | 'ANTS' | 'IMPOTS' | 'SECU' {
       if (title.includes("APL") || title.includes("RSA") || title.includes("CAF")) {
         return "CAF";
       }
       if (title.includes("passeport") || title.includes("carte") || title.includes("identité")) {
         return "ANTS";
       }
       if (title.includes("impôts") || title.includes("déclaration")) {
         return "IMPOTS";
       }
       return "SECU";
     }
     
     private getFormStructure(siteName: string): any {
       const structures = {
         CAF: {
           fields: [
             { name: "nom", type: "text", required: true },
             { name: "prenom", type: "text", required: true },
             { name: "situation", type: "select", required: true },
             { name: "revenus_mensuels", type: "number", required: true },
             { name: "ville", type: "text", required: true }
           ]
         },
         ANTS: {
           fields: [
             { name: "nom", type: "text", required: true },
             { name: "prenom", type: "text", required: true },
             { name: "date_naissance", type: "date", required: true }
           ]
         },
         IMPOTS: {
           fields: [
             { name: "nom", type: "text", required: true },
             { name: "numero_fiscal", type: "text", required: true },
             { name: "revenus_annuels", type: "number", required: true }
           ]
         },
         SECU: {
           fields: [
             { name: "nom", type: "text", required: true },
             { name: "numero_secu", type: "text", required: true }
           ]
         }
       };
       return structures[siteName];
     }
   }
   ```

---

#### 🔵 **DEV1 - Matin (4h)** : Intégration Orchestrator + Tests

**Tâches Backend** :

1. ✅ **Intégrer orchestrator dans index.ts** (1h)
   ```typescript
   // Dans index.ts
   import { ProcessOrchestrator } from "./services/orchestrator";
   
   export const onProcessCreated = onDocumentCreated(
     "processes/{processId}",
     async (event) => {
       const processId = event.params?.processId as string;
       const processData = event.data?.data();
       
       if (!processData) return;
       
       try {
         console.log(`📋 Nouveau processus créé: ${processId}`);
         
         // Lancer workflow orchestré après 3s
         setTimeout(async () => {
           const orchestrator = ProcessOrchestrator.getInstance();
           await orchestrator.executeWorkflow(processId);
         }, 3000);
         
       } catch (error) {
         console.error("Process orchestration failed:", error);
       }
     }
   );
   ```

2. ✅ **Tests unitaires agents** (3h)
   - Test ChatAgent création processus
   - Test Navigator simulation API
   - Test FormFiller mapping
   - Test Validator validation

---

#### 🔵 **DEV1 - Après-midi (4h)** : Tests E2E Workflow

**Tâches** :

3. ✅ **Test workflow complet APL** (2h)
   ```typescript
   // Scénario de test:
   1. User: "Je veux l'APL"
   2. Agent: Questions
   3. User: Réponses + confirmation
   4. → Process créé
   5. → Navigator (CAF)
   6. → FormFiller
   7. → Validator
   8. → Process completed
   ```

4. ✅ **Debugging & optimisation** (2h)
   - Corriger bugs détectés
   - Optimiser délais entre steps
   - Améliorer logs

---

#### 🟢 **DEV2 - Après-midi (4h)** : Tests E2E + Performance

**Tâches** :

2. ✅ **Test workflow complet Passeport** (2h)
   - Conversation → Processus ANTS
   - Vérifier tous les steps
   - Vérifier logs en temps réel

3. ✅ **Optimisation performance** (2h)
   - Réduire latence IA (ajuster températures)
   - Optimiser requêtes Firestore
   - Vérifier timeout functions

**🔄 Point de sync Jour 3** : Merge complet + tests croisés

**Livrable Jour 3** : 
- ✅ Workflow end-to-end opérationnel
- ✅ Tests E2E APL + Passeport
- ✅ 0 bug critique

---

### **JOUR 4 : Polish Frontend + Tests** (8h/dev)

#### 🔵 **DEV1 - Journée complète (8h)** : UI/UX Polish

**Tâches Frontend** :

1. ✅ **Améliorer animations dashboard** (3h)
   ```typescript
   // Animations Material-UI
   - Transitions steps (Slide, Fade)
   - Loading skeletons
   - Progress bars animées
   - Confetti à la completion
   ```

2. ✅ **Responsive mobile** (2h)
   - Tester sur mobile
   - Adapter chat mobile
   - Timeline responsive
   - Touch gestures

3. ✅ **Messages de succès améliorés** (1h)
   - Snackbars stylés
   - Toast notifications
   - Celebration animation

4. ✅ **Tests UI** (2h)
   - Test navigation
   - Test responsive
   - Test accessibilité

---

#### 🟢 **DEV2 - Journée complète (8h)** : Tests + Monitoring

**Tâches Backend** :

1. ✅ **Tests de charge** (2h)
   - 10 processus simultanés
   - Vérifier quotas Vertex AI
   - Optimiser si nécessaire

2. ✅ **Error handling** (2h)
   - Gestion timeout IA
   - Retry logic
   - Fallbacks gracieux

3. ✅ **Logging amélioré** (2h)
   - Structurer logs Cloud Functions
   - Ajouter métriques (durée steps)
   - Dashboard monitoring

**Tâches Frontend** :

4. ✅ **Tests realtime** (2h)
   - Test listeners Firestore
   - Test latence affichage
   - Test déconnexion/reconnexion

**Livrable Jour 4** : 
- ✅ UI polie et responsive (DEV1)
- ✅ Backend robuste avec error handling (DEV2)

---

### **JOUR 5 : Préparation Démo** (8h/dev)

#### 🔵🟢 **DEV1 + DEV2 - Matin (4h)** : Scénario Démo

**Tâches communes** :

1. ✅ **Créer scénario démo détaillé** (1h)
   ```markdown
   # SCÉNARIO DÉMO SIMPLIFIA - 5 MINUTES
   
   ## Persona: Marie, 25 ans, étudiante à Paris
   
   ### 1. Introduction (1min)
   - Problème: Démarches administratives = cauchemar
   - Solution: SimplifIA automatise tout
   - Démo: Demande APL en 5 min
   
   ### 2. Conversation (2min)
   Marie: "Je veux une aide pour mon loyer"
   Agent: Questions (locataire, 850€, 800€/mois)
   Marie: "Oui, créez mon dossier"
   
   ### 3. Workflow automatique (1.5min)
   - Connexion CAF simulée
   - Formulaire pré-rempli
   - Validation automatique
   - ✅ Dossier CAF-2025-123456 créé
   
   ### 4. Impact (30s)
   - ⏱️ 45min → 5min (90% gain)
   - ✅ 0 erreur
   - 🎯 100% succès
   ```

2. ✅ **Préparer données de test** (1h)
   - Compte demo: marie.demo@simplifia.fr
   - Données pré-remplies
   - Process rapide (15-20s total)

3. ✅ **Créer slides présentation** (2h)
   ```
   Slide 1: Le problème (démarches = enfer)
   Slide 2: Notre solution (IA + automatisation)
   Slide 3: Architecture (Firebase + Vertex AI)
   Slide 4: DÉMO LIVE
   Slide 5: Impact (métriques)
   Slide 6: Vision (roadmap future)
   ```

---

#### 🔵🟢 **DEV1 + DEV2 - Après-midi (4h)** : Répétition & Backup

**Tâches** :

4. ✅ **Répétition démo** (2h)
   - Run démo 10 fois
   - Chronométrer (objectif: < 5min)
   - Identifier points de blocage
   - Préparer réponses Q&A

5. ✅ **Plan B - Mode démo offline** (1h)
   ```typescript
   // Si backend down, activer mode demo
   const DEMO_MODE = true;
   
   if (DEMO_MODE) {
     // Messages pre-enregistrés
     // Processus simulé frontend
     // Pas d'appels Firebase
   }
   ```

6. ✅ **Vidéo backup** (1h)
   - Enregistrer démo complète
   - Éditer vidéo (5min)
   - Backup si problème technique

**Livrable Jour 5** : 
- ✅ Démo rodée (< 5min)
- ✅ Slides prêtes
- ✅ Plan B opérationnel
- ✅ Vidéo backup

---

## 🎯 CHECKLIST FINALE

### Avant le Hackathon

**Backend** (DEV2 responsable)
   ```typescript
   private async getConversationHistory(sessionId: string, limit = 10) {
     const messages = await this.db
       .collection("messages")
       .where("sessionId", "==", sessionId)
       .orderBy("timestamp", "desc")
       .limit(limit)
       .get();
       
     return messages.docs
       .reverse()
       .map(doc => `${doc.data().role}: ${doc.data().content}`)
       .join("\n");
   }
   ```

2. ✅ **Détecter intention + prêt à démarrer** (1.5h)
   ```typescript
   private async analyzeIntentAndReadiness(history: string, message: string) {
     const prompt = `Historique:
   ${history}
   
   Dernier message: ${message}
   
   Analyse et retourne JSON:
   {
     "demarche": "nom précis (ex: Demande APL)",
     "readyToStart": true/false,
     "confidence": 0.0-1.0,
     "missingInfo": ["info manquante 1", "info 2"],
     "collectedInfo": {
       "situation": "étudiant/salarié/...",
       "logement": "locataire/propriétaire",
       "revenus": "montant approximatif",
       "ville": "nom ville"
     }
   }`;
     
     const response = await this.vertexAI.generateResponse("CHAT", prompt);
     return JSON.parse(response);
   }
   ```

3. ✅ **Améliorer system prompt** (0.5h)
   ```typescript
   private buildSystemPrompt(): string {
     return `Tu es SimplifIA, expert démarches administratives.
   
   RÈGLES :
   1. Pose 2-3 questions MAX (situation, logement, revenus)
   2. Dès que tu as les infos, PROPOSE de créer le dossier
   3. Phrases clés : "Parfait ! Voulez-vous que je crée votre dossier ?"
   4. NE JAMAIS dépasser 4 échanges sans proposer démarrage
   
   STRUCTURE :
   - Message 1 : Identifier démarche + poser 1-2 questions
   - Message 2 : Résumer + proposer démarrage
   - Message 3 : Confirmation → Créer processus
   
   EXEMPLE :
   User: "Je veux une aide au logement"
   Agent: "Pour l'APL, j'ai besoin de savoir : 
          1. Êtes-vous locataire ou propriétaire ?
          2. Vos revenus mensuels approximatifs ?
          3. Votre ville ?"
   User: "Locataire, 1200€, Paris"
   Agent: "Parfait ! Pour un locataire à Paris avec 1200€/mois, vous êtes éligible à l'APL.
          Documents nécessaires : bail, RIB, avis d'imposition.
          Voulez-vous que je crée votre dossier maintenant ? (Répondez 'oui' pour démarrer)"
   `;
   }
   ```

4. ✅ **Créer processus depuis conversation** (1h)
   ```typescript
   private async createProcessFromConversation(
     sessionId: string,
     analysis: any
   ) {
     // 1. Récupérer userId
     const messagesSnapshot = await this.db
       .collection("messages")
       .where("sessionId", "==", sessionId)
       .limit(1)
       .get();
       
     if (messagesSnapshot.empty) {
       throw new Error("No messages found for session");
     }
     
     // 2. Créer le processus
     const processData = {
       title: analysis.demarche,
       userId: "user-from-session", // À récupérer depuis le message
       sessionId: sessionId,
       status: "created",
       description: `Demande de ${analysis.demarche}`,
       userContext: analysis.collectedInfo,
       steps: [
         {
           id: "0",
           name: "Analyse de la situation",
           status: "pending",
           order: 0,
           description: "Vérification de l'éligibilité et des documents"
         },
         {
           id: "1",
           name: "Connexion au site CAF",
           status: "pending",
           order: 1,
           description: "Accès au portail CAF"
         },
         {
           id: "2",
           name: "Remplissage du formulaire",
           status: "pending",
           order: 2,
           description: "Saisie des informations"
         },
         {
           id: "3",
           name: "Validation et envoi",
           status: "pending",
           order: 3,
           description: "Vérification finale et soumission"
         }
       ],
       currentStepIndex: 0,
       createdAt: admin.firestore.FieldValue.serverTimestamp(),
       updatedAt: admin.firestore.FieldValue.serverTimestamp()
     };
     
     const processRef = await this.db.collection("processes").add(processData);
     
     console.log(`✅ Processus créé: ${processRef.id}`);
     
     // 3. Envoyer message de confirmation
     await this.addAgentResponse(
       sessionId,
       `🎉 Parfait ! J'ai créé votre dossier "${analysis.demarche}".
       
       📋 Documents identifiés : ${this.getDocumentsList(analysis.demarche)}
       ⏱️ Délai estimé : 2 mois
       
       Je commence l'analyse de votre situation. Suivez l'avancement dans le tableau de bord ! 🚀`
     );
   }
   
   private getDocumentsList(demarche: string): string {
     const documents = {
       "Demande APL": "Bail de location, RIB, Avis d'imposition N-1",
       "Renouvellement passeport": "Ancienne carte/passeport, Photo d'identité, Justificatif de domicile",
       "Demande RSA": "RIB, Justificatif de domicile, Pièce d'identité"
     };
     return documents[demarche] || "Documents à définir";
   }
   ```

**Tests** :
- Conversation complète 3-4 échanges
- Vérifier création processus dans Firestore
- Vérifier affichage dans dashboard frontend

#### Après-midi (4h) - Détection de confirmation

**Tâches** :

5. ✅ **Détecteur de mots-clés confirmation** (1h)
   ```typescript
   private async detectConfirmation(message: string): Promise<boolean> {
     const confirmWords = [
       'oui', 'ok', 'd\'accord', 'vas-y', 'lance', 'démarre',
       'commence', 'go', 'parfait', 'c\'est bon', 'allons-y',
       'valide', 'confirme', 'je veux', 'commencer'
     ];
     
     const lowerMessage = message.toLowerCase();
     return confirmWords.some(word => lowerMessage.includes(word));
   }
   ```

6. ✅ **Limite d'échanges (max 4)** (1h)
   ```typescript
   async processUserMessage(sessionId: string, userMessage: string) {
     const history = await this.getConversationHistory(sessionId);
     const messageCount = history.split('\n').filter(l => l.trim()).length;
     
     // Détection confirmation
     const isConfirming = await this.detectConfirmation(userMessage);
     
     if (isConfirming) {
       const analysis = await this.analyzeIntentAndReadiness(history, userMessage);
       
       if (analysis.readyToStart && analysis.confidence > 0.7) {
         await this.createProcessFromConversation(sessionId, analysis);
         return; // FIN conversation
       }
     }
     
     // Forcer proposition après 8 messages (4 échanges)
     if (messageCount >= 8) {
       const analysis = await this.analyzeIntentAndReadiness(history, userMessage);
       
       await this.addAgentResponse(
         sessionId,
         `✅ J'ai toutes les informations pour votre ${analysis.demarche} !
         
         Résumé :
         ${JSON.stringify(analysis.collectedInfo, null, 2)}
         
         Souhaitez-vous que je crée votre dossier maintenant ? 
         (Répondez "oui" pour démarrer)`
       );
       return;
     }
     
     // Conversation normale avec analyse
     const analysis = await this.analyzeIntentAndReadiness(history, userMessage);
     const response = await this.generateContextualResponse(analysis);
     await this.addAgentResponse(sessionId, response);
   }
   ```

7. ✅ **Tests end-to-end ChatAgent** (2h)
   - Scénario 1 : Confirmation rapide (2 échanges)
   - Scénario 2 : Limite atteinte (4 échanges)
   - Scénario 3 : Infos manquantes (relance questions)

**Livrable Jour 1** : ChatAgent qui crée automatiquement des processus ✅

---

### **JOUR 2 : APISimulator + Navigator** (8h)

#### Matin (4h) - APISimulator

**Objectif** : Simuler réponses CAF, ANTS, Impôts, Sécu

**Tâches** :

1. ✅ **Créer APISimulatorAgent** (2h)
   ```typescript
   // agents/api-simulator.ts
   import { VertexAIService } from "../services/vertex-ai";
   
   export class APISimulatorAgent {
     private vertexAI: VertexAIService;
     
     constructor() {
       this.vertexAI = new VertexAIService();
     }
     
     async simulateAPICall(
       siteName: 'CAF' | 'ANTS' | 'IMPOTS' | 'SECU',
       endpoint: string,
       userData: any
     ): Promise<any> {
       const siteContext = this.getSiteContext(siteName);
       
       const prompt = `Tu es l'API du site ${siteName}.
       
   Contexte:
   ${siteContext}
   
   Endpoint: ${endpoint}
   Données reçues: ${JSON.stringify(userData, null, 2)}
   
   Génère une réponse JSON réaliste incluant:
   - statut: "success" ou "error"
   - numeroDossier: string
   - message: string explicatif
   - documentsManquants: array (si erreur)
   - prochainEtape: string
   - delaiEstime: string
   
   Réponse JSON pure (pas de markdown):`;
       
       const response = await this.vertexAI.generateResponse("NAVIGATOR", prompt, {
         temperature: 0.2 // Très déterministe
       });
       
       // Parser et valider JSON
       try {
         return JSON.parse(response);
       } catch (error) {
         console.error("Invalid JSON from API simulator:", response);
         return {
           statut: "error",
           message: "Erreur de simulation API"
         };
       }
     }
     
     private getSiteContext(siteName: string): string {
       const contexts = {
         CAF: `Caisse d'Allocations Familiales
         Aides: RSA, APL, Prime d'activité, Allocations familiales
         Documents requis: RIB, justificatif domicile, avis imposition
         Délais traitement: 2 mois
         Format numéro dossier: CAF-2025-XXXXXX`,
         
         ANTS: `Agence Nationale Titres Sécurisés
         Services: Passeport, CNI, Permis
         Documents: Photo identité, justif domicile, ancien titre
         Délais: 3-6 semaines
         Format: ANTS-PASS-XXXXXX`,
         
         IMPOTS: `Direction Générale Finances Publiques
         Services: Déclaration, remboursement
         Documents: Justificatifs revenus/charges
         Délais: 3-6 mois
         Format: DGFIP-2025-XXXXXX`,
         
         SECU: `Assurance Maladie
         Services: Remboursements, carte vitale
         Documents: RIB, justif identité
         Délais: 2-4 semaines
         Format: SECU-2025-XXXXXX`
       };
       return contexts[siteName];
     }
   }
   ```

2. ✅ **Tests APISimulator** (2h)
   ```typescript
   // Test CAF - Demande APL
   const cafResponse = await simulator.simulateAPICall(
     'CAF',
     '/demandes/apl',
     {
       nom: "Dupont",
       prenom: "Jean",
       situation: "locataire",
       revenus: 1200,
       ville: "Paris"
     }
   );
   
   // Vérifier réponse
   console.log(cafResponse);
   // Expected: {
   //   statut: "success",
   //   numeroDossier: "CAF-2025-123456",
   //   message: "Demande APL enregistrée",
   //   prochainEtape: "Envoi documents justificatifs",
   //   delaiEstime: "2 mois"
   // }
   ```

#### Après-midi (4h) - Navigator

**Tâches** :

3. ✅ **Implémenter NavigatorAgent** (3h)
   ```typescript
   // agents/navigator.ts
   import * as admin from "firebase-admin";
   import { APISimulatorAgent } from "./api-simulator";
   
   export class NavigatorAgent {
     private static instance: NavigatorAgent;
     private apiSimulator: APISimulatorAgent;
     private db = admin.firestore();
     
     private constructor() {
       this.apiSimulator = new APISimulatorAgent();
     }
     
     public static getInstance(): NavigatorAgent {
       if (!NavigatorAgent.instance) {
         NavigatorAgent.instance = new NavigatorAgent();
       }
       return NavigatorAgent.instance;
     }
     
     async navigateAndSubmit(
       processId: string,
       siteName: 'CAF' | 'ANTS' | 'IMPOTS' | 'SECU',
       userData: any
     ) {
       try {
         console.log(`🌐 Navigation vers ${siteName} pour processus ${processId}`);
         
         // 1. Log début navigation
         await this.db.collection("activity_logs").add({
           processId,
           type: "info",
           message: `Connexion au site ${siteName}`,
           details: "Initialisation de la connexion...",
           timestamp: admin.firestore.FieldValue.serverTimestamp()
         });
         
         // 2. Simuler appel API
         const endpoint = this.getEndpointForSite(siteName, userData);
         const response = await this.apiSimulator.simulateAPICall(
           siteName,
           endpoint,
           userData
         );
         
         // 3. Log résultat
         if (response.statut === "success") {
           await this.db.collection("activity_logs").add({
             processId,
             type: "success",
             message: `✅ Dossier créé sur ${siteName}`,
             details: `Numéro: ${response.numeroDossier}\n${response.message}`,
             timestamp: admin.firestore.FieldValue.serverTimestamp()
           });
           
           // Mettre à jour le processus
           await this.db.collection("processes").doc(processId).update({
             externalReference: response.numeroDossier,
             status: "running",
             updatedAt: admin.firestore.FieldValue.serverTimestamp()
           });
         } else {
           await this.db.collection("activity_logs").add({
             processId,
             type: "error",
             message: `❌ Erreur ${siteName}`,
             details: response.message,
             timestamp: admin.firestore.FieldValue.serverTimestamp()
           });
         }
         
         return response;
       } catch (error) {
         console.error(`❌ Navigator error for ${processId}:`, error);
         throw error;
       }
     }
     
     private getEndpointForSite(siteName: string, userData: any): string {
       const endpoints = {
         CAF: `/demandes/${userData.typeAide || 'apl'}`,
         ANTS: `/demandes/${userData.typeDocument || 'passeport'}`,
         IMPOTS: `/declarations/revenus`,
         SECU: `/remboursements/demande`
       };
       return endpoints[siteName];
     }
   }
   ```

4. ✅ **Intégrer Navigator dans workflow** (1h)
   ```typescript
   // Dans index.ts - Compléter onProcessCreated
   export const onProcessCreated = onDocumentCreated(
     "processes/{processId}",
     async (event) => {
       // ... code existant ...
       
       // Après création, lancer Navigator
       setTimeout(async () => {
         try {
           const navigator = NavigatorAgent.getInstance();
           
           // Déterminer le site selon la démarche
           const siteName = processData.title.includes("APL") ? "CAF" 
                          : processData.title.includes("passeport") ? "ANTS"
                          : "CAF";
           
           await navigator.navigateAndSubmit(
             processId,
             siteName,
             processData.userContext
           );
         } catch (error) {
           console.error("Navigator failed:", error);
         }
       }, 3000); // 3s après création
     }
   );
   ```

**Livrable Jour 2** : Navigator qui simule connexion aux sites ✅

---

### **JOUR 3 : FormFiller + Validator** (8h)

#### Matin (4h) - FormFiller

**Objectif** : Mapper données user → champs formulaire

**Tâches** :

1. ✅ **Implémenter FormFillerAgent** (3h)
   ```typescript
   // agents/formFiller.ts
   import * as admin from "firebase-admin";
   import { VertexAIService } from "../services/vertex-ai";
   
   export class FormFillerAgent {
     private static instance: FormFillerAgent;
     private vertexAI: VertexAIService;
     private db = admin.firestore();
     
     private constructor() {
       this.vertexAI = new VertexAIService();
     }
     
     public static getInstance(): FormFillerAgent {
       if (!FormFillerAgent.instance) {
         FormFillerAgent.instance = new FormFillerAgent();
       }
       return FormFillerAgent.instance;
     }
     
     async mapUserDataToForm(
       processId: string,
       userData: any,
       formStructure: any
     ) {
       try {
         console.log(`📝 Mapping données pour processus ${processId}`);
         
         const prompt = `Tu es un expert en remplissage de formulaires administratifs.
         
   Données utilisateur:
   ${JSON.stringify(userData, null, 2)}
   
   Structure du formulaire:
   ${JSON.stringify(formStructure, null, 2)}
   
   Tâche: Mappe chaque donnée utilisateur au bon champ du formulaire.
   
   Retourne JSON:
   {
     "mappings": [
       {
         "field": "nom_champ_formulaire",
         "value": "valeur",
         "confidence": 0.0-1.0,
         "source": "champ_user_data"
       }
     ],
     "missingFields": ["champ1", "champ2"],
     "readyToSubmit": true/false
   }`;
         
         const response = await this.vertexAI.generateResponse("FORM_FILLER", prompt);
         const mapping = JSON.parse(response);
         
         // Log résultat
         await this.db.collection("activity_logs").add({
           processId,
           type: mapping.readyToSubmit ? "success" : "warning",
           message: mapping.readyToSubmit 
             ? "✅ Formulaire prêt à être soumis"
             : "⚠️ Données manquantes",
           details: mapping.missingFields.length > 0 
             ? `Champs manquants: ${mapping.missingFields.join(', ')}`
             : "Tous les champs sont remplis",
           timestamp: admin.firestore.FieldValue.serverTimestamp()
         });
         
         return mapping;
       } catch (error) {
         console.error(`❌ FormFiller error:`, error);
         throw error;
       }
     }
   }
   ```

2. ✅ **Structure de formulaire CAF simulée** (1h)
   ```typescript
   const CAF_FORM_STRUCTURE = {
     fields: [
       { name: "nom", type: "text", required: true },
       { name: "prenom", type: "text", required: true },
       { name: "situation", type: "select", options: ["locataire", "proprietaire"], required: true },
       { name: "revenus_mensuels", type: "number", required: true },
       { name: "ville", type: "text", required: true },
       { name: "code_postal", type: "text", required: true },
       { name: "rib", type: "file", required: true },
       { name: "bail", type: "file", required: true }
     ]
   };
   ```

#### Après-midi (4h) - Validator

**Tâches** :

3. ✅ **Implémenter ValidatorAgent** (3h)
   ```typescript
   // agents/validator.ts
   import * as admin from "firebase-admin";
   import { VertexAIService } from "../services/vertex-ai";
   
   export class ValidatorAgent {
     private static instance: ValidatorAgent;
     private vertexAI: VertexAIService;
     private db = admin.firestore();
     
     private constructor() {
       this.vertexAI = new VertexAIService();
     }
     
     public static getInstance(): ValidatorAgent {
       if (!ValidatorAgent.instance) {
         ValidatorAgent.instance = new ValidatorAgent();
       }
       return ValidatorAgent.instance;
     }
     
     async validateBeforeSubmission(
       processId: string,
       mappedData: any
     ) {
       try {
         console.log(`✅ Validation pour processus ${processId}`);
         
         const prompt = `Tu es un validateur strict de données administratives.
         
   Données à valider:
   ${JSON.stringify(mappedData, null, 2)}
   
   Vérifie:
   1. Formats (email, téléphone, code postal)
   2. Cohérence (dates, montants)
   3. Complétude (champs requis)
   4. Logique (ex: revenus > 0)
   
   Retourne JSON:
   {
     "valid": true/false,
     "errors": [
       { "field": "nom_champ", "message": "erreur", "severity": "critical|warning" }
     ],
     "recommendations": ["conseil 1", "conseil 2"],
     "confidence": 0.0-1.0
   }`;
         
         const response = await this.vertexAI.generateResponse("VALIDATOR", prompt);
         const validation = JSON.parse(response);
         
         // Log résultat
         await this.db.collection("activity_logs").add({
           processId,
           type: validation.valid ? "success" : "error",
           message: validation.valid 
             ? "✅ Validation réussie"
             : "❌ Erreurs détectées",
           details: validation.errors && validation.errors.length > 0
             ? validation.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n')
             : "Toutes les données sont valides",
           recommendations: validation.recommendations || [],
           confidence: typeof validation.confidence === "number" ? validation.confidence : 0,
           errors: validation.errors || [],
           valid: typeof validation.valid === "boolean" ? validation.valid : false,
           timestamp: admin.firestore.FieldValue.serverTimestamp()
         });
         
         return {
           valid: typeof validation.valid === "boolean" ? validation.valid : false,
           errors: validation.errors || [],
           recommendations: validation.recommendations || [],
           confidence: typeof validation.confidence === "number" ? validation.confidence : 0
         };
       } catch (error) {
         console.error(`❌ Validator error:`, error);
         throw error;
       }
     }
   }
   ```

4. ✅ **Tests validation** (1h)
   - Données valides → validation OK
   - Email invalide → erreur détectée
   - Montant négatif → warning

**Livrable Jour 3** : FormFiller + Validator opérationnels ✅

---

### **JOUR 4 : Orchestration Complète** (8h)

#### Matin (4h) - Orchestrateur

**Objectif** : Coordonner tous les agents dans un workflow

**Tâches** :

1. ✅ **Créer ProcessOrchestrator** (3h)
   ```typescript
   // services/orchestrator.ts
   import * as admin from "firebase-admin";
   import { ChatAgent } from "../agents/chat";
   import { NavigatorAgent } from "../agents/navigator";
   import { FormFillerAgent } from "../agents/formFiller";
   import { ValidatorAgent } from "../agents/validator";
   
   export class ProcessOrchestrator {
     private static instance: ProcessOrchestrator;
     private db = admin.firestore();
     
     private constructor() {}
     
     public static getInstance(): ProcessOrchestrator {
       if (!ProcessOrchestrator.instance) {
         ProcessOrchestrator.instance = new ProcessOrchestrator();
       }
       return ProcessOrchestrator.instance;
     }
     
     async executeWorkflow(processId: string) {
       try {
         const processDoc = await this.db.collection("processes").doc(processId).get();
         const processData = processDoc.data();
         
         if (!processData) {
           throw new Error(`Process ${processId} not found`);
         }
         
         console.log(`🎯 Starting workflow for process ${processId}`);
         
         // ÉTAPE 1: Navigator - Connexion au site
         await this.updateStep(processId, 1, "in-progress");
         
         const siteName = this.determineSite(processData.title);
         const navigator = NavigatorAgent.getInstance();
         const navResponse = await navigator.navigateAndSubmit(
           processId,
           siteName,
           processData.userContext
         );
         
         await this.updateStep(processId, 1, "completed");
         
         // ÉTAPE 2: FormFiller - Mapping données
         await this.updateStep(processId, 2, "in-progress");
         
         const formStructure = this.getFormStructure(siteName);
         const formFiller = FormFillerAgent.getInstance();
         const mapping = await formFiller.mapUserDataToForm(
           processId,
           processData.userContext,
           formStructure
         );
         
         await this.updateStep(processId, 2, "completed");
         
         // ÉTAPE 3: Validator - Validation
         await this.updateStep(processId, 3, "in-progress");
         
         const validator = ValidatorAgent.getInstance();
         const validation = await validator.validateBeforeSubmission(
           processId,
           mapping
         );
         
         if (!validation.valid) {
           await this.updateStep(processId, 3, "failed");
           await this.db.collection("processes").doc(processId).update({
             status: "failed",
             error: "Validation échouée",
             updatedAt: admin.firestore.FieldValue.serverTimestamp()
           });
           return;
         }
         
         await this.updateStep(processId, 3, "completed");
         
         // PROCESSUS COMPLET
         await this.db.collection("processes").doc(processId).update({
           status: "completed",
           completedAt: admin.firestore.FieldValue.serverTimestamp(),
           updatedAt: admin.firestore.FieldValue.serverTimestamp()
         });
         
         console.log(`✅ Workflow completed for process ${processId}`);
         
       } catch (error) {
         console.error(`❌ Workflow failed for process ${processId}:`, error);
         
         await this.db.collection("processes").doc(processId).update({
           status: "failed",
           error: String(error),
           updatedAt: admin.firestore.FieldValue.serverTimestamp()
         });
       }
     }
     
     private async updateStep(processId: string, stepIndex: number, status: string) {
       const updateData: any = {
         [`steps.${stepIndex}.status`]: status,
         currentStepIndex: stepIndex,
         updatedAt: admin.firestore.FieldValue.serverTimestamp()
       };
       
       if (status === "in-progress") {
         updateData[`steps.${stepIndex}.startedAt`] = admin.firestore.FieldValue.serverTimestamp();
       } else if (status === "completed") {
         updateData[`steps.${stepIndex}.completedAt`] = admin.firestore.FieldValue.serverTimestamp();
       }
       
       await this.db.collection("processes").doc(processId).update(updateData);
     }
     
     private determineSite(title: string): 'CAF' | 'ANTS' | 'IMPOTS' | 'SECU' {
       if (title.includes("APL") || title.includes("RSA") || title.includes("CAF")) {
         return "CAF";
       }
       if (title.includes("passeport") || title.includes("carte") || title.includes("identité")) {
         return "ANTS";
       }
       if (title.includes("impôts") || title.includes("déclaration")) {
         return "IMPOTS";
       }
       return "SECU";
     }
     
     private getFormStructure(siteName: string): any {
       const structures = {
         CAF: {
           fields: [
             { name: "nom", type: "text", required: true },
             { name: "prenom", type: "text", required: true },
             { name: "situation", type: "select", required: true },
             { name: "revenus_mensuels", type: "number", required: true },
             { name: "ville", type: "text", required: true }
           ]
         },
         ANTS: {
           fields: [
             { name: "nom", type: "text", required: true },
             { name: "prenom", type: "text", required: true },
             { name: "date_naissance", type: "date", required: true },
             { name: "lieu_naissance", type: "text", required: true }
           ]
         },
         IMPOTS: {
           fields: [
             { name: "nom", type: "text", required: true },
             { name: "numero_fiscal", type: "text", required: true },
             { name: "revenus_annuels", type: "number", required: true }
           ]
         },
         SECU: {
           fields: [
             { name: "nom", type: "text", required: true },
             { name: "numero_secu", type: "text", required: true },
             { name: "date_naissance", type: "date", required: true }
           ]
         }
       };
       return structures[siteName];
     }
   }
   ```

2. ✅ **Intégrer orchestrateur dans onProcessCreated** (1h)
   ```typescript
   // Dans index.ts
   export const onProcessCreated = onDocumentCreated(
     "processes/{processId}",
     async (event) => {
       const processId = event.params?.processId as string;
       const processData = event.data?.data();
       
       if (!processData) return;
       
       try {
         // ... logs initiaux ...
         
         // Lancer workflow orchestré
         setTimeout(async () => {
           const orchestrator = ProcessOrchestrator.getInstance();
           await orchestrator.executeWorkflow(processId);
         }, 5000); // 5s pour laisser temps au frontend de charger
         
       } catch (error) {
         console.error("Process orchestration failed:", error);
       }
     }
   );
   ```

#### Après-midi (4h) - Tests End-to-End

**Tâches** :

3. ✅ **Test workflow complet** (2h)
   - User: "Je veux l'APL"
   - ChatAgent: Questions
   - User: Confirmation
   - → Process créé
   - → Navigator connecte CAF
   - → FormFiller mappe données
   - → Validator vérifie
   - → Process completed

4. ✅ **Debugging & fixes** (2h)
   - Corriger erreurs détectées
   - Améliorer logs
   - Optimiser délais

**Livrable Jour 4** : Workflow end-to-end fonctionnel ✅

---

### **JOUR 5 : Préparation Démo** (8h)

#### Matin (4h) - Scénario de démo

**Objectif** : Script détaillé pour présentation

**Tâches** :

1. ✅ **Créer scénario démo APL** (1h)
   ```markdown
   # SCÉNARIO DÉMO SIMPLIFIA - DEMANDE APL
   
   ## Contexte
   Marie, 25 ans, étudiante à Paris, vient de louer son premier appartement.
   Elle découvre SimplifIA pour l'aider à demander l'APL.
   
   ## Déroulé (5 minutes)
   
   ### 1. Connexion (30s)
   - Ouvrir SimplifIA
   - Connexion Google (marie.dupont@gmail.com)
   - Arrivée sur le dashboard
   
   ### 2. Conversation avec l'agent (2min)
   
   **Marie** : "Bonjour, je viens de louer un appartement à Paris et je voudrais savoir si je peux avoir une aide pour le loyer"
   
   **SimplifIA** : "Bonjour Marie ! Pour l'Aide Personnalisée au Logement (APL), j'ai besoin de quelques informations :
   1. Êtes-vous locataire ou colocataire ?
   2. Quel est votre loyer mensuel ?
   3. Quels sont vos revenus mensuels approximatifs ?"
   
   **Marie** : "Je suis locataire, mon loyer est de 850€ et mes revenus sont de 800€ par mois"
   
   **SimplifIA** : "Parfait ! Avec un loyer de 850€ et des revenus de 800€/mois à Paris, vous êtes éligible à l'APL.
   
   📋 Documents nécessaires :
   - Bail de location
   - RIB
   - Avis d'imposition 2024
   - Justificatif d'identité
   
   ⏱️ Délai : Environ 2 mois
   💰 Estimation : Vous pourriez recevoir environ 250€/mois
   
   Souhaitez-vous que je crée votre dossier maintenant ?"
   
   **Marie** : "Oui, on y va !"
   
   ### 3. Création processus automatique (30s)
   
   **SimplifIA** : "🎉 Parfait ! J'ai créé votre dossier 'Demande APL'.
   Je vais maintenant me connecter au site de la CAF et préparer votre demande.
   Suivez l'avancement dans le tableau de bord !"
   
   ### 4. Visualisation workflow (2min)
   
   **Montrer dashboard** :
   - Timeline avec 4 étapes
   - Étape 1 : Analyse (✅ completed)
   - Étape 2 : Connexion CAF (🔄 in-progress)
   - Étape 3 : Remplissage formulaire (⏳ pending)
   - Étape 4 : Validation (⏳ pending)
   
   **Logs d'activité en temps réel** :
   - "✅ Connexion au site CAF réussie"
   - "📝 Dossier CAF-2025-123456 créé"
   - "✅ Formulaire pré-rempli avec vos informations"
   - "✅ Validation des données : OK"
   - "🎉 Dossier soumis avec succès !"
   
   ### 5. Résultat final (30s)
   
   **SimplifIA** : "🎉 Félicitations Marie ! Votre demande d'APL a été soumise avec succès.
   
   📋 Numéro de dossier : CAF-2025-123456
   ⏱️ Délai de traitement : 2 mois
   📧 Vous recevrez un email de confirmation de la CAF
   
   Prochaines étapes :
   1. Vous recevrez un email de la CAF dans 48h
   2. Envoi des justificatifs sous 15 jours
   3. Premier versement dans 2 mois
   
   Besoin d'aide pour autre chose ?"
   
   ### 6. Statistiques (30s)
   
   **Montrer dashboard stats** :
   - ⏱️ Temps gagné : 45 minutes (vs démarche manuelle)
   - ✅ Taux de succès : 100%
   - 📄 4 étapes automatisées
   - 🚀 0 erreur
   ```

2. ✅ **Préparer données de test** (1h)
   - Compte user "marie.dupont@gmail.com"
   - Données pré-remplies pour démo fluide
   - Processus mock si besoin

3. ✅ **Créer slides présentation** (2h)
   - Slide 1 : Problème (démarches = 💀)
   - Slide 2 : Solution SimplifIA
   - Slide 3 : Architecture IA
   - Slide 4 : Démo live
   - Slide 5 : Impact & KPIs

#### Après-midi (4h) - Polish & Rehearsal

**Tâches** :

4. ✅ **Polish UI/UX** (2h)
   - Vérifier responsive mobile
   - Améliorer animations
   - Corriger bugs visuels

5. ✅ **Répétition démo** (2h)
   - Run démo complète 5 fois
   - Chronométrer (objectif: 5min)
   - Préparer plan B si bug

**Livrable Jour 5** : Démo prête à présenter ✅

---

## 🎯 CHECKLIST FINALE

### Avant le Hackathon

**Backend** (DEV2 responsable)
- [ ] ChatAgent crée processus automatiquement
- [ ] APISimulator répond correctement (CAF/ANTS)
- [ ] Navigator connecte et log
- [ ] FormFiller mappe données
- [ ] Validator valide correctement
- [ ] Orchestrator coordonne tout
- [ ] 0 erreur sur workflow E2E

**Frontend** (DEV1 responsable)
- [ ] Dashboard affiche processus en temps réel
- [ ] Timeline steps animée
- [ ] Logs activité colorés
- [ ] Chat fluide et responsive
- [ ] Animations polies
- [ ] Mobile OK

**Démo** (DEV1 + DEV2)
- [ ] Scénario APL rodé (< 5min)
- [ ] Slides prêtes
- [ ] Vidéo backup enregistrée
- [ ] Compte demo configuré
- [ ] Git backup (push tout)

### Le jour J

- [ ] Arriver 30min en avance
- [ ] Tester WiFi venue
- [ ] Run démo 1 fois sur place
- [ ] Vérifier Firebase credits
- [ ] Charger laptops + powerbanks
- [ ] Ouvrir vidéo backup (juste au cas où)

### Pendant la démo

- [ ] Introduction (1min) → DEV1
- [ ] Démo live (3min) → DEV2
- [ ] Résultats + impact (1min) → DEV1
- [ ] Q&A (variable) → DEV1 + DEV2

---

## 📊 MÉTRIQUES DE SUCCÈS

### Techniques
- ✅ 0 erreur pendant démo
- ✅ Workflow complet en < 30s
- ✅ Réponses IA pertinentes (100%)
- ✅ Temps réel frontend/backend < 2s

### Business
- 🎯 Temps gagné : 45min → 5min (90% réduction)
- 🎯 Taux de succès : 100% (vs 70% manuel)
- 🎯 Satisfaction : Démo fluide et impressionnante
- 🎯 "Wow effect" : Automatisation visible en temps réel

---

## 🚨 PLAN B (si problème)

### Backend down (DEV2)
```typescript
// Activer DEMO_MODE dans frontend
const DEMO_MODE = true;

if (DEMO_MODE) {
  // Messages pre-enregistrés
  // Processus simulé frontend
  // Timeline animée avec fake data
}
```

### WiFi défaillant
- Hotspot mobile (DEV1)
- Vidéo backup (DEV2 lance)

### Bug inattendu
- DEV2: "Laissez-moi vous montrer en vidéo"
- DEV1: Switch vers environnement backup

---

## 📈 RÉPARTITION DES RESPONSABILITÉS

### 🔵 DEV1 - Chef Frontend + ChatAgent
**Compétences clés** : React, UI/UX, IA conversationnelle

**Responsabilités** :
- ChatAgent intelligent (analyse + création processus)
- FormFiller Agent
- UI/UX polish (animations, responsive)
- Présentation slides
- Introduction démo (1min)

**Fichiers principaux** :
- `functions/src/agents/chat.ts`
- `functions/src/agents/formFiller.ts`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/ProcessTimeline.tsx`

---

### 🟢 DEV2 - Chef Backend + Orchestration
**Compétences clés** : Cloud Functions, orchestration, monitoring

**Responsabilités** :
- APISimulator + Navigator
- Validator Agent
- ProcessOrchestrator
- Tests de charge + monitoring
- Démo live technique (3min)

**Fichiers principaux** :
- `functions/src/agents/api-simulator.ts`
- `functions/src/agents/navigator.ts`
- `functions/src/agents/validator.ts`
- `functions/src/services/orchestrator.ts`
- `functions/src/index.ts`

---

## 🎉 APRÈS LE HACKATHON

### Améliorations V2 (si on gagne 🏆)
1. **Navigation web réelle** (Puppeteer)
   - Vraies connexions CAF/ANTS
   - Screenshots du processus
   - Detection CAPTCHA

2. **Plus de démarches**
   - Impôts (déclaration revenus)
   - Sécu (remboursements)
   - Pôle Emploi (inscription)
   - CPAM (carte vitale)

3. **Upload documents**
   - OCR pour extraire données
   - Validation automatique documents
   - Stockage sécurisé Cloud Storage

4. **Notifications intelligentes**
   - Email + Push
   - Rappels échéances
   - Suivi dossier

5. **Mobile app**
   - React Native
   - Offline mode
   - Biométrie

### Opportunités Business
- 🤝 Partenariats administrations
- 💰 Levée de fonds (impact social)
- 🌍 Open source partiel (communauté)
- 📈 B2B (entreprises pour employés)

---

## 💡 CONSEILS PERFORMANCE

### Optimisations Backend
```typescript
// 1. Réduire latence IA
temperature: 0.2 // Plus déterministe = plus rapide

// 2. Paralléliser quand possible
await Promise.all([
  formFiller.mapUserDataToForm(...),
  // Autres tâches indépendantes
]);

// 3. Cache Firestore
const cachedProcess = await cache.get(processId);
if (cachedProcess) return cachedProcess;

// 4. Timeout Functions (éviter timeout)
export const onProcessCreated = onDocumentCreated({
  timeoutSeconds: 300, // 5min max
  ...
});
```

### Optimisations Frontend
```typescript
// 1. Lazy loading components
const Dashboard = lazy(() => import('./pages/Dashboard'));

// 2. Optimiser listeners Firestore
.limit(50) // Pas tout récupérer

// 3. Debounce realtime updates
const debouncedUpdate = debounce(updateUI, 500);

// 4. Memoization
const memoizedValue = useMemo(() => 
  computeExpensiveValue(data), 
  [data]
);
```

---

## 🔥 POINTS D'ATTENTION CRITIQUES

### ⚠️ Vertex AI Quotas
- **Limite** : 60 requêtes/min par projet
- **Solution** : Retry avec backoff exponentiel
- **Monitoring** : Logger toutes les requêtes

### ⚠️ Firestore Coûts
- **Lectures** : 50k/jour gratuit
- **Écritures** : 20k/jour gratuit
- **Solution** : Limiter logs activité (max 20/process)

### ⚠️ Cold Start Functions
- **Problème** : 1ère requête lente (3-5s)
- **Solution** : Warmer function (cron 5min)

### ⚠️ Demo Day WiFi
- **Risque** : WiFi surchargé
- **Solutions** :
  1. Hotspot 4G backup
  2. Mode demo offline
  3. Vidéo pre-enregistrée

---

## 📞 COMMUNICATION ÉQUIPE

### Daily Sync (15min)
- **9h00** : Check-in
  - Bloquer? → Aide immédiate
  - Avancement? → Mise à jour
  - Prochain objectif? → Clarification

### Git Workflow
```bash
# DEV1
git checkout -b dev1/feature-name
git commit -m "feat(chat): add intent detection"
git push origin dev1/feature-name

# DEV2  
git checkout -b dev2/feature-name
git commit -m "feat(navigator): add API simulator"
git push origin dev2/feature-name

# Merge daily (fin de journée)
git checkout main
git merge dev1/feature-name
git merge dev2/feature-name
```

### Points de sync obligatoires
1. **Jour 1 - 17h** : Validation création processus
2. **Jour 3 - 12h** : Merge orchestrator
3. **Jour 4 - 17h** : Tests E2E ensemble
4. **Jour 5 - 10h** : Répétition démo 1

---

**BONNE CHANCE ! 🚀**

**Remember** : 
- 💪 Restez focus sur l'essentiel
- 🤝 Communiquez tôt et souvent
- 🎯 MVP > Perfect
- 🔥 La démo est ROI !
