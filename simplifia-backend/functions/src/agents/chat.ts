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

      // Générer une réponse avec l'IA
      const systemPrompt = this.buildSystemPrompt();
      const response = await this.generateChatResponse(systemPrompt, userMessage);

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
1. TOUJOURS poser des questions précises pour comprendre la situation exacte
2. JAMAIS de réponses génériques comme "rendez-vous sur le site" 
3. IDENTIFIER précisément l'aide/démarche demandée
4. LISTER les documents exacts nécessaires
5. EXPLIQUER les étapes concrètes à suivre

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
   * Générer une réponse de chat
   */
  private async generateChatResponse(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const prompt = `Message utilisateur: ${userMessage}

Réponse:`;

      const response = await this.vertexAI.generateResponse("CHAT", prompt, {
        systemInstruction: systemPrompt,
      });

      return response.trim() || "Je suis désolé, je n'ai pas pu générer une réponse appropriée.";
    } catch (error) {
      console.error(` Error generating chat response: ${error}`);
      return "Je suis désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre question ?";
    }
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
      role: "agent", // ← Toujours "agent", pas de paramètre
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        isTyping: false,
        suggestedActions: ["Continuer"],
      },
    });
  }
}
