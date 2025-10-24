export const AI_MODELS = {
  // Agent Analyseur - Compréhension de contexte
  ANALYZER: {
    model: "gemini-2.5-pro",
    location: "us-central1",
    temperature: 0.3,
    maxTokens: 2048,
    topP: 0.8,
    topK: 40,
  },

  // Agent Navigateur - Analyse de pages web
  NAVIGATOR: {
    model: "gemini-2.5-flash",
    location: "us-central1",
    temperature: 0.1,
    maxTokens: 1024,
    topP: 0.9,
    topK: 20,
  },

  // Agent Remplisseur - Mapping de données
  FORM_FILLER: {
    model: "gemini-2.0-flash-lite",
    location: "us-central1",
    temperature: 0.2,
    maxTokens: 512,
    topP: 0.8,
    topK: 30,
  },

  // Agent Validateur - Décisions critiques
  VALIDATOR: {
    model: "gemini-2.0-flash-lite",
    location: "us-central1",
    temperature: 0.1,
    maxTokens: 1024,
    topP: 0.9,
    topK: 20,
  },

  // Agent Conversationnel - Chat avec utilisateur
  CHAT: {
    model: "gemini-2.0-flash",
    location: "us-central1",
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    topK: 40,
  },

  // Agent Moniteur - Analyse de statuts
  MONITOR: {
    model: "gemini-2.0-flash-lite",
    location: "us-central1",
    temperature: 0.2,
    maxTokens: 512,
    topP: 0.8,
    topK: 30,
  },
};
