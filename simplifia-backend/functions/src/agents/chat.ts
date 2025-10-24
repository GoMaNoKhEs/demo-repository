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
    userMessage: string
  ): Promise<void> {
    try {
      console.log(`Processing message for session ${sessionId}`);

      // Récupérer l'historique de conversation
      const conversationHistory = await this.getConversationHistory(sessionId);

      // Analyser le contexte et détecter changement de sujet
      const contextAnalysis = await this.analyzeContext(conversationHistory, userMessage);

      // Analyser l'intention et la disponibilité à créer un processus
      const intentAnalysis = await this.analyzeIntentAndReadiness(conversationHistory, userMessage);

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
        await this.createProcessFromConversation(sessionId, intentAnalysis);
        return; // Fin de la conversation
      }

      // Si prêt mais pas encore confirmé → demander confirmation explicite
      if (intentAnalysis.readyToStart && !intentAnalysis.userConfirmed && intentAnalysis.confidence > 0.7) {
        console.log(`[ChatAgent] Ready but not confirmed - asking for confirmation`);
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
        const missingInfoText = intentAnalysis.missingInfo && intentAnalysis.missingInfo.length > 0
          ? intentAnalysis.missingInfo.map((info: string) => `- ${info}`).join("\n")
          : "quelques informations complémentaires";

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
- L'utilisateur confirme EXPLICITEMENT vouloir créer le dossier
- Expressions OUI: "oui", "ok", "d'accord", "vas-y", "lance", "je veux", "crée", "démarre", "go", "c'est bon"
- Expressions NON (hésitations): "oui mais...", "peut-être", "je sais pas", "attends"
- IMPORTANT: Si l'utilisateur dit "lance le processus" ou "fais-le" → userConfirmed = TRUE

EXEMPLES:
- "Oui je veux créer mon dossier" → userConfirmed = true
- "Lance le processus toi-même" → userConfirmed = true  
- "Vas-y crée le dossier" → userConfirmed = true
- "Je pense mais j'hésite" → userConfirmed = false`;

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
   * Créer un processus depuis la conversation
   */
  private async createProcessFromConversation(
    sessionId: string,
    intentAnalysis: any
  ): Promise<void> {
    try {
      // 1. Récupérer userId depuis la session
      const messagesSnapshot = await this.db
        .collection("messages")
        .where("sessionId", "==", sessionId)
        .limit(1)
        .get();

      if (messagesSnapshot.empty) {
        throw new Error("No messages found for session");
      }

      const firstMessage = messagesSnapshot.docs[0].data();
      const userId = firstMessage.userId || "anonymous";

      // 2. Créer le processus avec steps
      const processData = {
        title: intentAnalysis.demarche,
        userId: userId,
        sessionId: sessionId,
        status: "created",
        description: `Demande de ${intentAnalysis.demarche}`,
        userContext: intentAnalysis.collectedInfo,
        steps: [
          {
            id: "0",
            name: "Analyse de la situation",
            status: "completed",
            order: 0,
            description: "Vérification éligibilité et documents",
          },
          {
            id: "1",
            name: "Connexion au site",
            status: "pending",
            order: 1,
            description: "Accès au portail administratif",
          },
          {
            id: "2",
            name: "Remplissage formulaire",
            status: "pending",
            order: 2,
            description: "Saisie des informations",
          },
          {
            id: "3",
            name: "Validation et envoi",
            status: "pending",
            order: 3,
            description: "Vérification finale et soumission",
          },
        ],
        currentStepIndex: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const processRef = await this.db.collection("processes").add(processData);

      console.log(`Processus créé: ${processRef.id}`);

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
    
    const confirmationMessage = `🎉 **Félicitations ! Votre dossier ${intentAnalysis.demarche} a été créé avec succès.**

✅ **SimplifIA s'occupe de tout pour vous :**

1️⃣ **Connexion automatique** au site ${organism}
2️⃣ **Remplissage automatique** du formulaire avec vos informations
3️⃣ **Soumission sécurisée** de votre dossier
4️⃣ **Suivi en temps réel** de l'avancement

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
      situation: "Situation",
      logement: "Logement",
      revenus: "Revenus",
      ville: "Ville",
      statut: "Statut",
      montant: "Montant",
      etablissement: "Établissement",
      garant: "Garant",
    };
    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Obtenir le nom de l'organisme pour une démarche
   */
  private getOrganismForDemarche(demarche: string): string {
    const lowerDemarche = demarche.toLowerCase();
    
    if (lowerDemarche.includes("apl") || lowerDemarche.includes("caf") || lowerDemarche.includes("rsa")) {
      return "CAF (Caisse d'Allocations Familiales)";
    }
    if (lowerDemarche.includes("passeport") || lowerDemarche.includes("carte d'identité") || lowerDemarche.includes("cni")) {
      return "ANTS (Agence Nationale des Titres Sécurisés)";
    }
    if (lowerDemarche.includes("impôt") || lowerDemarche.includes("taxe")) {
      return "Impots.gouv.fr";
    }
    if (lowerDemarche.includes("sécurité sociale") || lowerDemarche.includes("ameli")) {
      return "Ameli (Sécurité Sociale)";
    }
    if (lowerDemarche.includes("pole emploi") || lowerDemarche.includes("chômage")) {
      return "Pôle Emploi";
    }
    
    return "l'organisme administratif concerné";
  }
}
