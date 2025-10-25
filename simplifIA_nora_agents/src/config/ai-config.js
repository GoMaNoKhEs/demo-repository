// src/config/ai-config.js
export const MODEL_NAME = "gemma3:4b";  // ← change ici une seule fois si besoin
export const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";

/**
 * Appelle le modèle local via Ollama et renvoie du JSON parsé.
 * - gère les ```json ... ``` éventuels
 * - lève une erreur claire si le modèle ne renvoie pas du JSON
 */
export async function callLLM(prompt) {
  const res = await fetch(OLLAMA_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL_NAME, prompt, stream: false })
  });

  const data = await res.json();
  const raw = (data?.response || "").trim();

  // Nettoyage si le modèle renvoie des fences ```json
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(" Échec parse JSON. Réponse brute du modèle:\n", raw);
    throw new Error("Le modèle n'a pas renvoyé un JSON valide.");
  }
}
