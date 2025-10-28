// Agent de chat - Gère les conversations avec l'utilisateur

import * as admin from "firebase-admin";
import { VertexAIService } from "../services/vertex-ai";

/**
 * Agent de chat conversationnel avec IA (Pattern Singleton)
 */
export class ChatAgent {
  private static instance: ChatAgent;
  private vertexAI: VertexAIService;
  private db = admin.firestore();

  /**
   * Constructeur privé pour empêcher l'instanciation directe
   */
  private constructor() {
    this.vertexAI = new VertexAIService();
  }

  /**
   * Retourne les champs obligatoires selon le type de démarche
   */
  private getRequiredFieldsForDemarche(demarche: string): string[] {
    const demarcheLower = demarche.toLowerCase();
    
    // APL / Aide au logement
    if (demarcheLower.includes("apl") || demarcheLower.includes("aide au logement") || demarcheLower.includes("caf")) {
      return [
        "nom", "prenom", "email", "telephone", "dateNaissance",
        "adresseComplete", "ville", "codePostal",
        "situation", "logement", "loyer", "charges", "revenus",
        "nomBailleur", "dateEntree", "surfaceLogement"
      ];
    }
    
    // Déclaration de naissance (13 champs)
    if (demarcheLower.includes("naissance") || demarcheLower.includes("déclaration")) {
      return [
        "nom", "prenom", "email", "telephone", "dateNaissance",
        "adresseComplete", "ville", "codePostal", "lieuNaissance",
        "nomEnfant", "prenomEnfant", "dateNaissanceEnfant", "lieuNaissanceEnfant"
      ];
    }
    
    // Carte d'identité / Passeport (14 champs)
    if (demarcheLower.includes("carte d'identité") || demarcheLower.includes("passeport") || demarcheLower.includes("cni")) {
      return [
        "nom", "prenom", "email", "telephone", "dateNaissance", "lieuNaissance",
        "adresseComplete", "ville", "codePostal",
        "numeroSecu", "taille", "couleurYeux", "photo", "timbreFiscal"
      ];
    }
    
    // RSA / Aide sociale (14 champs)
    if (demarcheLower.includes("rsa") || demarcheLower.includes("revenu") || demarcheLower.includes("aide sociale")) {
      return [
        "nom", "prenom", "email", "telephone", "dateNaissance",
        "adresseComplete", "ville", "codePostal",
        "situation", "revenus", "charges", "numeroSecu",
        "numeroAllocataire", "rib"
      ];
    }
    
    // Par défaut : infos de base
    return ["nom", "prenom", "email", "telephone", "ville"];
  }

  /**
   * Valide programmatiquement que TOUS les champs requis sont collectés
   * Retourne {valid: boolean, missingFields: string[]}
   */
  private validateRequiredFields(demarche: string, collectedInfo: any): {valid: boolean, missingFields: string[]} {
    const requiredFields = this.getRequiredFieldsForDemarche(demarche);
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = collectedInfo[field];
      if (!value || value === null || value === "" || value === "null") {
        missingFields.push(field);
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Obtenir l'instance unique de ChatAgent (Singleton Pattern)
   */
  public static getInstance(): ChatAgent {
    if (!ChatAgent.instance) {
      ChatAgent.instance = new ChatAgent();
    }
    return ChatAgent.instance;
  }

  /**
   * Traiter un message utilisateur et répondre
   */
  async processUserMessage(
    sessionId: string,
    userMessage: string,
    userId?: string  // ✅ OPTIONNEL pour rétrocompatibilité
  ): Promise<void> {
    try {
      console.log(`Processing message for session ${sessionId}`);
      console.log(`userId from trigger: ${userId}`);

      // Récupérer l'historique de conversation
      const conversationHistory = await this.getConversationHistory(sessionId);

      // Analyser le contexte et détecter changement de sujet
      const contextAnalysis = await this.analyzeContext(conversationHistory, userMessage);

      // Analyser l'intention et la disponibilité à créer un processus
      const intentAnalysis = await this.analyzeIntentAndReadiness(conversationHistory, userMessage);

      // ⚠️ VALIDATION PROGRAMMATIQUE : Override readyToStart si champs manquants
      const fieldsValidation = this.validateRequiredFields(intentAnalysis.demarche, intentAnalysis.collectedInfo);
      if (!fieldsValidation.valid) {
        console.log(`❌ [ChatAgent] readyToStart forcé à FALSE - Champs manquants: ${fieldsValidation.missingFields.join(", ")}`);
        intentAnalysis.readyToStart = false;
        intentAnalysis.missingInfo = fieldsValidation.missingFields;
      } else {
        console.log(`✅ [ChatAgent] Tous les champs requis sont collectés (${this.getRequiredFieldsForDemarche(intentAnalysis.demarche).length} champs)`);
      }

      // Logs détaillés pour debug
      console.log(`[ChatAgent] Intent Analysis for session ${sessionId}:`);
      console.log(`  - demarche: ${intentAnalysis.demarche}`);
      console.log(`  - readyToStart: ${intentAnalysis.readyToStart}`);
      console.log(`  - userConfirmed: ${intentAnalysis.userConfirmed}`);
      console.log(`  - confidence: ${intentAnalysis.confidence}`);
      console.log(`  - missingInfo: ${JSON.stringify(intentAnalysis.missingInfo)}`);
      console.log(`  - collectedInfo: ${JSON.stringify(intentAnalysis.collectedInfo)}`);

      // Si l'utilisateur est prêt et confirme (détecté par l'IA), créer le processus
      if (intentAnalysis.readyToStart && intentAnalysis.userConfirmed && intentAnalysis.confidence > 0.7) {
        console.log(`[ChatAgent] Creating process for session ${sessionId}`);
        await this.createProcessFromConversation(sessionId, intentAnalysis, userId);  // ✅ PASSER userId
        return; // Fin de la conversation
      }

      // Si prêt mais pas encore confirmé → demander confirmation explicite
      if (intentAnalysis.readyToStart && !intentAnalysis.userConfirmed && intentAnalysis.confidence > 0.7) {
        console.log("[ChatAgent] Ready but not confirmed - asking for confirmation");
        const collectedInfoSummary = Object.entries(intentAnalysis.collectedInfo || {})
          .filter(([_, value]) => value !== null && value !== "")
          .map(([key, value]) => `✓ ${this.formatFieldName(key)}: ${value}`)
          .join("\n");

        const confirmationPrompt = `✅ Parfait ! J'ai toutes les informations nécessaires pour votre ${intentAnalysis.demarche}.

📋 **Récapitulatif :**
${collectedInfoSummary}

🚀 **SimplifIA va maintenant s'occuper de tout :**
- Connexion automatique au site ${this.getOrganismForDemarche(intentAnalysis.demarche)}
- Remplissage automatique du formulaire
- Soumission de votre dossier
- Suivi en temps réel de l'avancement

⏱️ **Temps estimé :** 2-3 minutes (au lieu de 45 minutes manuellement)

**Souhaitez-vous que je crée votre dossier maintenant ?**
(Répondez "oui" pour démarrer le processus automatique)`;

        await this.addAgentResponse(sessionId, confirmationPrompt);
        return;
      }

      // Compter les messages réels depuis Firestore (limite à 4 échanges = 8 messages)
      const messagesSnapshot = await this.db
        .collection("messages")
        .where("sessionId", "==", sessionId)
        .get();

      // +1 pour inclure le message utilisateur actuel (pas encore sauvegardé dans messages)
      // +1 pour le message agent qu'on va créer
      const messageCount = messagesSnapshot.size + 2;

      // Forcer proposition après 8 messages
      if (messageCount >= 8 && !intentAnalysis.readyToStart) {
        // Construire message avec infos manquantes lisibles
        const missingInfoText = intentAnalysis.missingInfo && intentAnalysis.missingInfo.length > 0 ?
          intentAnalysis.missingInfo.map((info: string) => `- ${info}`).join("\n") :
          "quelques informations complémentaires";

        const collectedInfoText = Object.entries(intentAnalysis.collectedInfo || {})
          .filter(([_, value]) => value !== null && value !== "")
          .map(([key, value]) => `✓ ${key}: ${value}`)
          .join("\n");

        const response = `✅ D'accord, je vais vous aider avec votre ${intentAnalysis.demarche || "demande"} !

${collectedInfoText ? `Informations collectées :\n${collectedInfoText}\n\n` : ""}J'ai encore besoin de :
${missingInfoText}

Pouvez-vous me donner ces informations ?

Ou si vous avez déjà toutes les infos, répondez "oui" pour que je crée votre dossier maintenant.`;

        await this.addAgentResponse(sessionId, response);
        return;
      }

      // Conversation normale avec contexte
      const systemPrompt = this.buildSystemPrompt();
      const response = await this.generateChatResponse(
        systemPrompt,
        userMessage,
        conversationHistory,
        contextAnalysis,
        intentAnalysis
      );

      // Ajouter la réponse de l'agent au chat
      await this.addAgentResponse(sessionId, response);

      console.log(`Message processed for session ${sessionId}`);
    } catch (error) {
      console.error(`CHAT: Error processing message for session ${sessionId}: ${error}`);

      // L'agent ne gère pas les messages système d'erreur
      // C'est la responsabilité du niveau supérieur (index.ts)
      throw error;
    }
  }

  /**
   * Construire le system prompt pour le chat
   */
  private buildSystemPrompt(): string {
    return `Tu es SimplifIA, l'expert des démarches administratives françaises. 
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

TOUJOURS finir par une question pour approfondir.`;
  }

  /**
   * Récupérer l'historique de conversation (10 derniers messages)
   */
  private async getConversationHistory(sessionId: string, limit = 10): Promise<string> {
    const messages = await this.db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    if (messages.empty) {
      return "";
    }

    return messages.docs
      .reverse()
      .map((doc) => {
        const data = doc.data();
        return `${data.role}: ${data.content}`;
      })
      .join("\n");
  }

  /**
   * Analyser le contexte pour détecter changement de sujet ou continuité
   */
  private async analyzeContext(
    conversationHistory: string,
    currentMessage: string
  ): Promise<any> {
    if (!conversationHistory) {
      return {
        contextType: "new_conversation",
        previousTopic: null,
        currentTopic: null,
        isTopicChange: false,
        shouldResetContext: false,
      };
    }

    try {
      const prompt = `Analyse ce contexte conversationnel :

HISTORIQUE:
${conversationHistory}

NOUVEAU MESSAGE:
${currentMessage}

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
}`;

      const response = await this.vertexAI.generateResponse("CHAT", prompt, {
        temperature: 0.3,
      });

      // Nettoyer la réponse (enlever les markdown si présents)
      const cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Error analyzing context:", error);
      // Fallback: considérer comme continuation
      return {
        contextType: "continuation",
        previousTopic: null,
        currentTopic: null,
        isTopicChange: false,
        shouldResetContext: false,
        relevantHistory: conversationHistory,
      };
    }
  }

  /**
   * Générer une réponse de chat avec contexte intelligent
   */
  private async generateChatResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: string,
    contextAnalysis: any,
    intentAnalysis?: any
  ): Promise<string> {
    try {
      let contextInstruction = "";

      // Adapter la réponse selon le type de contexte
      switch (contextAnalysis.contextType) {
      case "topic_change":
        contextInstruction = `⚠️ L'utilisateur CHANGE DE SUJET.
Ancien sujet: ${contextAnalysis.previousTopic}
Nouveau sujet: ${contextAnalysis.currentTopic}

➡️ Tu dois:
1. Accuser réception du changement (ex: "D'accord, parlons de ${contextAnalysis.currentTopic}")
2. Repartir de zéro sur ce nouveau sujet
3. Ne pas mélanger avec le contexte précédent`;
        break;

      case "topic_return":
        contextInstruction = `L'utilisateur REVIENT à un sujet antérieur.
Sujet retrouvé: ${contextAnalysis.currentTopic}

 Tu dois:
1. Reconnaître le retour (ex: "Ah oui, revenons à votre ${contextAnalysis.currentTopic}")
2. Reprendre les infos déjà collectées: ${contextAnalysis.relevantHistory}
3. Continuer depuis où vous étiez`;
        break;

      case "continuation":
        contextInstruction = `L'utilisateur CONTINUE le sujet en cours.
Sujet: ${contextAnalysis.currentTopic}

 Tu dois:
1. Prendre en compte TOUT l'historique
2. Ne PAS redemander des infos déjà données
3. Progresser logiquement dans la conversation`;
        break;

      case "new_conversation":
        contextInstruction = `NOUVELLE CONVERSATION (pas d'historique)

 Tu dois:
1. Accueillir l'utilisateur
2. Identifier sa demande
3. Commencer à poser les bonnes questions`;
        break;
      }

      const prompt = `${contextInstruction}

${conversationHistory ? `HISTORIQUE DE LA CONVERSATION:\n${conversationHistory}\n` : ""}

NOUVEAU MESSAGE UTILISATEUR:
${userMessage}

INSTRUCTIONS:
- Répondre de manière précise et méthodique
- Adapter ta réponse au contexte détecté ci-dessus
- Poser les bonnes questions pour comprendre la situation exacte
- Fournir des étapes concrètes et des informations pratiques
- Maximum 2-3 questions à la fois

Réponse:`;

      const response = await this.vertexAI.generateResponse("CHAT", prompt, {
        systemInstruction: systemPrompt,
      });

      return response.trim() || "Je suis désolé, je n'ai pas pu générer une réponse appropriée.";
    } catch (error) {
      console.error("Error generating chat response:", error);
      return "Je suis désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre question ?";
    }
  }

  /**
   * Analyser l'intention et la disponibilité à créer un processus
   */
  private async analyzeIntentAndReadiness(
    conversationHistory: string,
    currentMessage: string
  ): Promise<any> {
    try {
      const prompt = `Analyse cette conversation pour déterminer si l'utilisateur
est prêt à démarrer un processus administratif.

HISTORIQUE:
${conversationHistory}

NOUVEAU MESSAGE:
${currentMessage}

Analyse et retourne UNIQUEMENT ce JSON (pas de markdown):
{
  "demarche": "nom précis de la démarche (ex: Demande APL, Renouvellement passeport)",
  "readyToStart": true/false,
  "userConfirmed": true/false,
  "confidence": 0.0-1.0,
  "missingInfo": ["info manquante 1", "info 2"],
  "collectedInfo": {
    "nom": "nom de famille ou null",
    "prenom": "prénom ou null",
    "email": "adresse email ou null",
    "telephone": "numéro de téléphone ou null",
    "dateNaissance": "date de naissance (format JJ/MM/AAAA) ou null",
    "situation": "étudiant/salarié/demandeur d'emploi/retraité ou null",
    "logement": "locataire/propriétaire/colocataire/sous-locataire ou null",
    "adresseComplete": "adresse complète du logement (rue, code postal, ville) ou null",
    "ville": "nom ville ou null",
    "codePostal": "code postal ou null",
    "loyer": "montant du loyer mensuel (nombre) ou null",
    "charges": "montant des charges (nombre) ou null",
    "revenus": "revenus mensuels nets (nombre) ou null",
    "nomBailleur": "nom du propriétaire/bailleur ou null",
    "dateEntree": "date d'entrée dans le logement (format MM/AAAA) ou null",
    "surfaceLogement": "surface en m² (nombre) ou null",
    "numeroSecu": "numéro de sécurité sociale (optionnel) ou null",
    "etablissement": "nom établissement scolaire/entreprise (si étudiant/salarié) ou null"
  }
}

Critères pour readyToStart = true:
- La démarche est clairement identifiée
- TOUS LES CHAMPS OBLIGATOIRES SUIVANTS SONT COLLECTÉS (pas de null):
  * nom, prenom, email, telephone, dateNaissance
  * adresseComplete, ville, codePostal
  * situation (étudiant/salarié/etc)
  * logement (locataire/propriétaire)
  * loyer, charges, revenus
  * nomBailleur, dateEntree, surfaceLogement
- Si UN SEUL champ obligatoire manque → readyToStart = FALSE
- TOUJOURS vérifier TOUS les champs avant de dire readyToStart = true

Critères pour userConfirmed = true:
- L'utilisateur confirme EXPLICITEMENT vouloir créer le dossier
- Expressions OUI: "oui", "ok", "d'accord", "vas-y", "lance", "je veux", "crée", "démarre", "go", "c'est bon", "c'est parti"
- Expressions NON (hésitations): "oui mais...", "peut-être", "je sais pas", "attends"
- IMPORTANT: Si l'utilisateur dit "lance le processus" ou "fais-le" → userConfirmed = TRUE

EXEMPLES:
- "Oui je veux créer mon dossier" → userConfirmed = true
- "Lance le processus toi-même" → userConfirmed = true  
- "Vas-y crée le dossier" → userConfirmed = true
- "Je pense mais j'hésite" → userConfirmed = false

EXTRACTION INTELLIGENTE:
- Extraire les informations même si elles sont dans des phrases longues
- Exemple: "Je m'appelle Jean Dubois, j'habite à Lyon 69003, je paie 850€ de loyer"
  → nom: "Dubois", prenom: "Jean", ville: "Lyon", codePostal: "69003", loyer: 850
- Si le loyer est mentionné avec "€/mois" ou "euros par mois", extraire le nombre`;

      const response = await this.vertexAI.generateResponse("CHAT", prompt, {
        temperature: 0.2, // Baissé pour plus de déterminisme
      });

      const cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Error analyzing intent:", error);
      return {
        demarche: "Inconnu",
        readyToStart: false,
        userConfirmed: false,
        confidence: 0,
        missingInfo: [],
        collectedInfo: {},
      };
    }
  }

  /**
   * Générer des steps détaillées et spécifiques à la démarche
   * IMPORTANT: Retourner des étapes descriptives et révélatrices du processus réel
   */
  private generateDetailedSteps(demarche: string, collectedInfo: any): any[] {
    // Étape 0 toujours présente: Analyse
    const baseSteps = [
      {
        id: "0",
        name: "Analyse et vérification d'éligibilité",
        status: "completed",
        order: 0,
        description: `Collecte et vérification des informations pour ${demarche}`,
      },
    ];

    // Étapes spécifiques selon le type de démarche
    let specificSteps: any[] = [];

    if (demarche.toLowerCase().includes("apl") || demarche.toLowerCase().includes("aide au logement")) {
      specificSteps = [
        {
          id: "1",
          name: "Connexion au site de la CAF",
          status: "pending",
          order: 1,
          description: "Accès sécurisé au portail caf.fr avec vos identifiants",
        },
        {
          id: "2",
          name: "Remplissage formulaire APL",
          status: "pending",
          order: 2,
          description: `Saisie automatique: identité, logement à ${collectedInfo.ville || "votre ville"}, loyer ${collectedInfo.loyer || "..."}€`,
        },
        {
          id: "3",
          name: "Validation des données CAF",
          status: "pending",
          order: 3,
          description: "Vérification automatique éligibilité APL selon revenus et situation",
        },
        {
          id: "4",
          name: "Soumission du dossier",
          status: "pending",
          order: 4,
          description: "Envoi sécurisé à la CAF et confirmation de réception",
        },
      ];
    } else if (demarche.toLowerCase().includes("naissance") || demarche.toLowerCase().includes("déclaration")) {
      specificSteps = [
        {
          id: "1",
          name: "Connexion au site de la Mairie",
          status: "pending",
          order: 1,
          description: `Accès au portail mairie de ${collectedInfo.ville || "votre commune"}`,
        },
        {
          id: "2",
          name: "Déclaration de naissance",
          status: "pending",
          order: 2,
          description: "Saisie informations enfant, parents et lieu de naissance",
        },
        {
          id: "3",
          name: "Upload documents justificatifs",
          status: "pending",
          order: 3,
          description: "Téléversement certificat médical et pièces d'identité",
        },
        {
          id: "4",
          name: "Prise de rendez-vous",
          status: "pending",
          order: 4,
          description: "Sélection automatique du créneau disponible",
        },
      ];
    } else {
      // Étapes génériques si démarche inconnue
      specificSteps = [
        {
          id: "1",
          name: "Connexion au portail administratif",
          status: "pending",
          order: 1,
          description: "Accès sécurisé au site officiel",
        },
        {
          id: "2",
          name: "Remplissage du formulaire",
          status: "pending",
          order: 2,
          description: "Saisie automatique de vos informations",
        },
        {
          id: "3",
          name: "Validation et soumission",
          status: "pending",
          order: 3,
          description: "Vérification et envoi du dossier",
        },
      ];
    }

    return [...baseSteps, ...specificSteps];
  }

  /**
   * Créer un processus automatiquement depuis la conversation
   */
  private async createProcessFromConversation(
    sessionId: string,
    intentAnalysis: any,
    providedUserId?: string  // ✅ NOUVEAU : userId passé depuis le trigger
  ): Promise<void> {
    try {
      // 1. Récupérer userId : priorité au providedUserId, sinon fallback sur first message
      let userId = providedUserId;
      
      if (!userId) {
        console.log("⚠️ userId non fourni, recherche dans les messages...");
        const messagesSnapshot = await this.db
          .collection("messages")
          .where("sessionId", "==", sessionId)
          .orderBy("timestamp", "asc")
          .limit(1)
          .get();

        if (messagesSnapshot.empty) {
          throw new Error("No messages found for session");
        }

        const firstMessage = messagesSnapshot.docs[0].data();
        userId = firstMessage.userId;
      }

      // STRICT : userId est obligatoire
      if (!userId) {
        throw new Error("userId manquant - l'utilisateur doit être authentifié");
      }
      
      console.log(`✅ userId récupéré : ${userId}`);

      // 2. Créer le processus avec steps **détaillées et spécifiques à la démarche**
      const steps = this.generateDetailedSteps(intentAnalysis.demarche, intentAnalysis.collectedInfo);
      
      console.log(`🔍 [ChatAgent] Steps générées:`, JSON.stringify(steps, null, 2));
      
      const processData = {
        title: intentAnalysis.demarche,
        userId: userId,
        sessionId: sessionId,
        status: "created",
        description: `Demande de ${intentAnalysis.demarche}`,
        userContext: intentAnalysis.collectedInfo,
        steps: steps,
        currentStepIndex: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      console.log(`🔍 [ChatAgent] processData AVANT .add():`, JSON.stringify(processData, null, 2));

      const processRef = await this.db.collection("processes").add(processData);

      console.log(`✅ Processus créé avec succès:`, {
        processId: processRef.id,
        userId: userId,
        sessionId: sessionId,
        title: intentAnalysis.demarche,
        status: "created",
        stepsCount: steps.length
      });

      // 3. Envoyer message de confirmation généré par l'IA
      await this.generateAndSendConfirmationMessage(sessionId, intentAnalysis);
    } catch (error) {
      console.error("Error creating process:", error);
      throw error;
    }
  }

  /**
   * Générer et envoyer un message de confirmation personnalisé
   */
  private async generateAndSendConfirmationMessage(
    sessionId: string,
    intentAnalysis: any
  ): Promise<void> {
    const organism = this.getOrganismForDemarche(intentAnalysis.demarche);
    const documents = this.getDocumentsList(intentAnalysis.demarche);

    const confirmationMessage = `🎉 **Félicitations ! Votre dossier "${intentAnalysis.demarche}" a été créé avec succès.**

✅ **SimplifIA s'occupe de tout pour vous :**

1️⃣ **Connexion automatique** au site ${organism}
2️⃣ **Remplissage automatique** du formulaire avec vos informations
3️⃣ **Soumission sécurisée** de votre dossier
4️⃣ **Suivi en temps réel** de l'avancement

📋 **Documents nécessaires :** 
${documents}

⏱️ **Temps estimé :** 2-3 minutes (au lieu de 45 minutes manuellement)

📊 **Vous pouvez suivre la progression en direct :**
- Chaque étape s'affiche en temps réel sur votre tableau de bord
- Vous serez notifié à chaque validation
- Un récapitulatif complet vous sera envoyé à la fin

🚀 **Le processus démarre maintenant automatiquement...**

_Vous n'avez rien à faire, SimplifIA gère toute la démarche administrative pour vous !_`;

    await this.addAgentResponse(sessionId, confirmationMessage);
  }

  /**
   * Ajouter une réponse de l'agent au chat
   */
  private async addAgentResponse(
    sessionId: string,
    content: string
  ): Promise<void> {
    await this.db.collection("messages").add({
      sessionId,
      role: "agent",
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        isTyping: false,
        suggestedActions: ["Continuer"],
      },
    });
  }

  /**
   * Formater le nom d'un champ pour affichage utilisateur
   */
  private formatFieldName(fieldName: string): string {
    const fieldNames: Record<string, string> = {
      nom: "Nom",
      prenom: "Prénom",
      email: "Email",
      telephone: "Téléphone",
      dateNaissance: "Date de naissance",
      situation: "Situation professionnelle",
      logement: "Type de logement",
      adresseComplete: "Adresse complète",
      ville: "Ville",
      codePostal: "Code postal",
      loyer: "Loyer mensuel",
      charges: "Charges mensuelles",
      revenus: "Revenus mensuels",
      nomBailleur: "Nom du bailleur",
      dateEntree: "Date d'entrée dans le logement",
      surfaceLogement: "Surface du logement (m²)",
      numeroSecu: "Numéro de sécurité sociale",
      etablissement: "Établissement",
      statut: "Statut",
      montant: "Montant",
      garant: "Garant",
    };
    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Obtenir le nom de l'organisme pour une démarche
   */
  private getOrganismForDemarche(demarche: string): string {
    const lowerDemarche = demarche.toLowerCase();

    // CAF (Caisse d'Allocations Familiales)
    if (lowerDemarche.includes("apl") || 
        lowerDemarche.includes("aide au logement") ||
        lowerDemarche.includes("caf") || 
        lowerDemarche.includes("rsa") ||
        lowerDemarche.includes("allocation familiale") ||
        lowerDemarche.includes("prime d'activité") ||
        lowerDemarche.includes("aah")) {
      return "CAF (Caisse d'Allocations Familiales)";
    }
    
    // ANTS (Agence Nationale des Titres Sécurisés)
    if (lowerDemarche.includes("passeport") || 
        lowerDemarche.includes("carte d'identité") || 
        lowerDemarche.includes("cni") ||
        lowerDemarche.includes("permis de conduire") ||
        lowerDemarche.includes("titre de voyage")) {
      return "ANTS (Agence Nationale des Titres Sécurisés)";
    }
    
    // Impôts (Direction Générale des Finances Publiques)
    if (lowerDemarche.includes("impôt") || 
        lowerDemarche.includes("taxe") ||
        lowerDemarche.includes("déclaration revenus") ||
        lowerDemarche.includes("dgfip")) {
      return "Impots.gouv.fr";
    }
    
    // Assurance Maladie / Sécurité Sociale
    if (lowerDemarche.includes("sécurité sociale") || 
        lowerDemarche.includes("ameli") ||
        lowerDemarche.includes("carte vitale") ||
        lowerDemarche.includes("remboursement") ||
        lowerDemarche.includes("cpam")) {
      return "Ameli (Sécurité Sociale)";
    }
    
    // Pôle Emploi
    if (lowerDemarche.includes("pole emploi") || 
        lowerDemarche.includes("pôle emploi") ||
        lowerDemarche.includes("chômage") ||
        lowerDemarche.includes("inscription demandeur") ||
        lowerDemarche.includes("actualisation")) {
      return "Pôle Emploi";
    }
    
    // Préfecture
    if (lowerDemarche.includes("titre de séjour") || 
        lowerDemarche.includes("carte de séjour") ||
        lowerDemarche.includes("préfecture") ||
        lowerDemarche.includes("carte grise") ||
        lowerDemarche.includes("certificat d'immatriculation")) {
      return "Préfecture";
    }
    
    // URSSAF
    if (lowerDemarche.includes("urssaf") || 
        lowerDemarche.includes("auto-entrepreneur") ||
        lowerDemarche.includes("micro-entreprise") ||
        lowerDemarche.includes("cotisation sociale")) {
      return "URSSAF";
    }

    return "l'organisme administratif concerné";
  }

  /**
   * Obtenir la liste des documents nécessaires pour une démarche
   */
  private getDocumentsList(demarche: string): string {
    const lowerDemarche = demarche.toLowerCase();
    
    // CAF - APL / Aide au logement
    if (lowerDemarche.includes("apl") || lowerDemarche.includes("aide au logement")) {
      return "Bail de location, RIB, Avis d'imposition N-1, Justificatif de domicile, Pièce d'identité";
    }
    
    // CAF - RSA
    if (lowerDemarche.includes("rsa")) {
      return "RIB, Justificatif de domicile, Pièce d'identité, Attestation Pôle Emploi (si inscrit), Relevé d'identité bancaire";
    }
    
    // CAF - Allocations familiales
    if (lowerDemarche.includes("allocation familiale")) {
      return "Livret de famille, RIB, Justificatif de domicile, Avis d'imposition";
    }
    
    // CAF - Prime d'activité
    if (lowerDemarche.includes("prime d'activité")) {
      return "Bulletins de salaire (3 derniers mois), RIB, Avis d'imposition, Justificatif de domicile";
    }
    
    // ANTS - Passeport (renouvellement)
    if (lowerDemarche.includes("passeport") && (lowerDemarche.includes("renouvellement") || lowerDemarche.includes("renouveler"))) {
      return "Ancien passeport, Photo d'identité (format ANTS), Justificatif de domicile de moins de 6 mois, Timbre fiscal électronique (86€)";
    }
    
    // ANTS - Passeport (première demande)
    if (lowerDemarche.includes("passeport")) {
      return "Acte de naissance, Photo d'identité (format ANTS), Justificatif de domicile de moins de 6 mois, Pièce d'identité, Timbre fiscal électronique (86€)";
    }
    
    // ANTS - Carte d'identité
    if (lowerDemarche.includes("carte d'identité") || lowerDemarche.includes("cni")) {
      return "Ancien titre (CNI ou passeport), Photo d'identité (format ANTS), Justificatif de domicile de moins de 6 mois";
    }
    
    // ANTS - Permis de conduire
    if (lowerDemarche.includes("permis de conduire")) {
      return "Pièce d'identité, Justificatif de domicile, Photo d'identité (format ANTS), Attestation de formation (code + conduite)";
    }
    
    // Impôts - Déclaration de revenus
    if (lowerDemarche.includes("déclaration") && lowerDemarche.includes("revenus")) {
      return "Justificatifs de revenus (salaires, pensions, etc.), Justificatifs de charges déductibles, RIB pour remboursement";
    }
    
    // Sécu - Carte Vitale
    if (lowerDemarche.includes("carte vitale")) {
      return "Pièce d'identité, Justificatif de domicile, RIB, Photo d'identité";
    }
    
    // Sécu - Remboursement
    if (lowerDemarche.includes("remboursement")) {
      return "Feuille de soins, Ordonnance, Factures, RIB, Carte Vitale";
    }
    
    // Pôle Emploi - Inscription
    if (lowerDemarche.includes("inscription") && (lowerDemarche.includes("chômage") || lowerDemarche.includes("pole emploi"))) {
      return "Attestation employeur (certificat de travail), RIB, Pièce d'identité, CV, Justificatif de domicile";
    }
    
    // Préfecture - Titre de séjour
    if (lowerDemarche.includes("titre de séjour") || lowerDemarche.includes("carte de séjour")) {
      return "Passeport, Visa (si applicable), Justificatif de domicile, Photos d'identité, Justificatif de ressources, Attestation d'assurance maladie";
    }
    
    // Préfecture - Carte grise
    if (lowerDemarche.includes("carte grise") || lowerDemarche.includes("certificat d'immatriculation")) {
      return "Certificat de cession (si occasion), Justificatif de domicile, Pièce d'identité, Contrôle technique (si + 4 ans), Justificatif d'assurance";
    }
    
    // URSSAF - Auto-entrepreneur
    if (lowerDemarche.includes("auto-entrepreneur") || lowerDemarche.includes("micro-entreprise")) {
      return "Pièce d'identité, RIB, Justificatif de domicile, Déclaration d'activité (formulaire P0)";
    }
    
    // Défaut générique
    return "Documents à définir selon votre situation (nous vous guiderons)";
  }
}
