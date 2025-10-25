import { callLLM } from "./config/ai-config.js";
import { loadContext, saveContext } from "./mcp-store.js";


export async function runFormFiller() {
  const ctx = await loadContext();
  const prompt = `
Tu es un assistant IA qui remplit un formulaire administratif français.

SCÉNARIO : ${ctx.scenario}
URL : ${ctx.navigation?.url || "inconnue"}

MISSION :
1. Déduis quels champs standards sont requis (nom, prénom, email, etc.)
2. Donne des valeurs d’exemple cohérentes (pas de données inventées)
3. Indique les champs manquants et la confiance globale

 Réponds UNIQUEMENT en JSON strict :
{
  "filledData": { "nom": "Durand", "prenom": "Marie" },
  "missingFields": ["email"],
  "confidence": 85
}

Exemple :
{
  "filledData": {"nom": "Dupont", "prenom": "Jean", "email": "jean.dupont@email.com"},
  "missingFields": [],
  "confidence": 90
}`;

  const form = await callLLM(prompt);

  console.log("\n [FormFiller] Réponse IA :\n", JSON.stringify(form, null, 2));

  const updated = { ...ctx, form, updatedAt: new Date().toISOString() };
  await saveContext(updated);
  console.log("Contexte mis à jour avec les données de formulaire");
}
