import fs from "fs";
import { callLLM } from "./config/ai-config.js";

export async function runValidator() {
  const filePath = new URL("../shared_context.json", import.meta.url);
  const context = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const prompt = `
Tu es un validateur IA expert des démarches administratives françaises.

SCÉNARIO : ${context.scenario}
FORMULAIRE : ${JSON.stringify(context.form)}

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

  const updated = { ...context, validation: val };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  console.log(" Contexte mis à jour avec la validation");
}
