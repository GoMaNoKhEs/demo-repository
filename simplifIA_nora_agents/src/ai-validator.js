import { callLLM } from "./config/ai-config.js";
import { loadContext, saveContext } from "./mcp-store.js";


export async function runValidator() {
  const ctx = await loadContext();
  const prompt = `
Tu es un validateur IA expert des démarches administratives françaises.

SCÉNARIO : ${ctx.scenario}
FORMULAIRE : ${JSON.stringify(ctx.form, null, 2)}

MISSION :
1. Vérifie la cohérence et les champs obligatoires
2. Évalue le risque avant soumission (low, medium, high)
3. Indique si une validation humaine est nécessaire

⚠️ Réponds UNIQUEMENT en JSON strict :
{
  "isValid": true,
  "riskLevel": "low|medium|high",
  "requiresApproval": false,
  "warnings": ["string"]
}

Exemple :
{
  "isValid": true,
  "riskLevel": "medium",
  "requiresApproval": false,
  "warnings": ["Format de date non standard"]
}`;

  const val = await callLLM(prompt);

  console.log("\n [Validator] Réponse IA :\n", JSON.stringify(val, null, 2));

  const updated = { ...ctx, validation: val, updatedAt: new Date().toISOString() };
  await saveContext(updated);
  console.log(" Contexte mis à jour avec la validation");
}
