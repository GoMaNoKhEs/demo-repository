// src/config/ai-config.js
import fetch from "node-fetch";
import { VertexAI } from "@google-cloud/vertexai";

// === CONFIGURATION DE BASE ===

//  Modèle local par défaut
export const MODEL_NAME = "gemma3:4b";
export const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";

/**
 * Appelle le modèle local via Ollama et renvoie du JSON parsé.
 * - gère les ```json ... ``` éventuels
 * - lève une erreur claire si le modèle ne renvoie pas du JSON
 */

// ☁️ Modèle cloud (Gemini via Vertex AI)
export const PROJECT_ID = "simplifia-hackathon"; // ton projet Google Cloud
export const LOCATION = "us-central1";           // région stable
export const GEMINI_MODEL = "gemini-2.5-flash";  // mon modèle actuel

// Détermine si on utilise le cloud (USE_VERTEX=1) ou le local (par défaut)
const USE_VERTEX = process.env.USE_VERTEX === "1";

/**
 * Appelle soit le modèle local (Ollama), soit le modèle cloud (Gemini)
 * selon la variable d'environnement USE_VERTEX.
 */
export async function callLLM(prompt) {
  if (!USE_VERTEX) {
    // === MODE LOCAL : OLLAMA ===
    const res = await fetch(OLLAMA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL_NAME, prompt, stream: false })
    });

    const data = await res.json();
    const raw = (data?.response || "").trim();
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Erreur de parsing JSON (Ollama). Réponse brute :\n", raw);
      throw new Error("Le modèle local n’a pas renvoyé un JSON valide.");
    }

  } else {
    // === MODE CLOUD : GEMINI VERTEX AI ===
    const vertex = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    const model = vertex.preview.getGenerativeModel({ model: GEMINI_MODEL });

    try {
      const result = await model.generateContent(prompt);

      // Gestion de la structure de réponse Gemini 2.x
      let text =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      result?.response?.text?.() ||
      JSON.stringify(result);
      // Nettoyage automatique des fences ```json
      text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

      // Essaie de parser la réponse en JSON
      try {
        return JSON.parse(text);
      } catch (e) {
        console.warn("⚠️Réponse Gemini non-JSON, texte brut renvoyé.");
        return { rawText: text };
      }

    } catch (err) {
      console.error(" Erreur lors de l’appel Vertex AI :", err.message);
      throw err;
    }
  }
}
