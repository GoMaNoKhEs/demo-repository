/**
 * Configuration et variables d'environnement
 */

export const config = {
  // Firebase
  projectId: process.env.FIREBASE_PROJECT_ID || 'simplifia-hackathon',

  // Google Cloud
  gcpProjectId: process.env.GCP_PROJECT_ID || 'simplifia-hackathon',
  gcpRegion: process.env.GCP_REGION || 'europe-west1',

  // Vertex AI
  vertexAI: {
    location: process.env.VERTEX_AI_LOCATION || 'europe-west1',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  },

  // Environnement
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
};

/**
 * Valider que toutes les variables requises sont présentes
 */
export const validateConfig = () => {
  const required = ['FIREBASE_PROJECT_ID', 'GCP_PROJECT_ID'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Variables d'environnement manquantes: ${missing.join(', ')}`);
    console.warn('default values will be used.');
  }

  return missing.length === 0;
};

