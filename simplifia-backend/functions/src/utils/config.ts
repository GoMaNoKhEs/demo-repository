/**
 * Configuration et variables d'environnement
 */

export const config = {
  // Firebase - utilisons directement le nom du projet
  projectId: "simplifia-hackathon",

  // Google Cloud
  gcpProjectId: "simplifia-hackathon",
  gcpRegion: "europe-west1",

  // Vertex AI
  vertexAI: {
    location: process.env.VERTEX_AI_LOCATION || "europe-west1",
    model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
  },

  // Environnement
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV !== "production",
  isProduction: process.env.NODE_ENV === "production",
};

/**
 * Valider que toutes les variables requises sont présentes
 * @return {void}
 */
export const validateConfig = () => {
  // Configuration statique - pas de validation nécessaire
};
