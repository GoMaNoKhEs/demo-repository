import fs from "fs";
import { callLLM } from "./config/ai-config.js";

export async function runFormFiller() {
  const filePath = new URL("../shared_context.json", import.meta.url);
  const context = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const prompt = `
Tu es un assistant IA qui remplit un formulaire administratif français.

SCÉNARIO : ${context.scenario}
URL : ${context.navigation?.url || "inconnue"}

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

  const updated = { ...context, form };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  console.log("Contexte mis à jour avec les données de formulaire");
}
