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

      // Si l'utilisateur est prêt et confirme (détecté par l'IA), créer le processus
      if (intentAnalysis.readyToStart && intentAnalysis.userConfirmed && intentAnalysis.confidence > 0.7) {
        await this.createProcessFromConversation(sessionId, intentAnalysis);
        return; // Fin de la conversation
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
        const response = `✅ J'ai collecté plusieurs informations sur votre demande.

Résumé :
${JSON.stringify(intentAnalysis.collectedInfo, null, 2)}

Souhaitez-vous que je crée votre dossier maintenant ?
(Répondez "oui" pour démarrer)`;

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
- L'utilisateur confirme explicitement vouloir créer le dossier
- Expressions: "oui", "d'accord", "vas-y", "lance", "je veux", etc.
- Attention aux "oui mais..." ou hésitations → false`;

      const response = await this.vertexAI.generateResponse("CHAT", prompt, {
        temperature: 0.3,
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
    const prompt = `Tu viens de créer un dossier pour une démarche administrative.

DÉMARCHE: ${intentAnalysis.demarche}
INFORMATIONS COLLECTÉES: ${JSON.stringify(intentAnalysis.collectedInfo, null, 2)}

Génère un message de confirmation chaleureux et informatif qui inclut:
1. Félicitations pour la création du dossier
2. Liste PRÉCISE des documents nécessaires (selon tes connaissances à jour)
3. Délai estimé RÉALISTE (selon tes connaissances actuelles)
4. Prochaines étapes claires
5. Un conseil pratique spécifique

IMPORTANT:
- Utilise tes connaissances à jour sur les démarches administratives françaises
- Sois précis sur les documents (pas de liste générique)
- Donne des délais réalistes actuels
- Personnalise selon les infos de l'utilisateur

Message:`;

    const confirmationMessage = await this.vertexAI.generateResponse("CHAT", prompt, {
      temperature: 0.4,
    });

    await this.addAgentResponse(sessionId, confirmationMessage.trim());
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
}
