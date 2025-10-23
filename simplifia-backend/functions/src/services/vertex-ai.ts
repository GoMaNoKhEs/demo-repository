// Service Vertex AI pour l'intégration avec Gemini
import { VertexAI } from "@google-cloud/vertexai";
import { AI_MODELS } from "../utils/ai-models";

// Créer un type strict pour les agents valides
type AgentType = keyof typeof AI_MODELS;

/**
 * Service Vertex AI pour l'intégration avec les modèles Gemini
 */
export class VertexAIService {
  private vertex: VertexAI;

  /**
   * Constructeur du service Vertex AI
   */
  constructor() {
    this.vertex = new VertexAI({
      project: process.env.VERTEX_AI_PROJECT_ID || "simplifia-hackathon",
      location: "us-central1",
    });
  }

  /**
   * Génère une réponse avec Vertex AI
   * @param {AgentType} agentType - Type d'agent IA
   * @param {string} prompt - Prompt à envoyer
   * @param {Record<string, any>} context - Contexte additionnel
   * @return {Promise<string>} Réponse générée
   */
  async generateResponse(
    agentType: AgentType,
    prompt: string,
    context: Record<string, any> = {}
  ) {
    try {
      const config = AI_MODELS[agentType];

      if (!config) {
        throw new Error(`Agent type "${String(agentType)}" not found in AI_MODELS`);
      }

      // Utiliser la bonne API Vertex AI
      const generativeModel = this.vertex.getGenerativeModel({
        model: config.model,
      });

      const response = await generativeModel.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          topP: config.topP,
          topK: config.topK,
        },
        systemInstruction: context.systemInstruction || undefined,
      });

      // ✅ Extraction sûre de la réponse avec optional chaining
      return response.response.candidates?.[0].content.parts?.[0].text || "";
    } catch (error) {
      console.error("❌ Erreur Vertex AI:", error);
      throw error;
    }
  }
}
