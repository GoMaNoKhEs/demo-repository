import fs from "fs";
import { callLLM } from "./config/ai-config.js";

export async function runMonitor() {
  const filePath = new URL("../shared_context.json", import.meta.url);
  const context = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const prompt = `
Tu es un agent IA MONITOR chargé du suivi des dossiers administratifs.

CONTEXTE : ${JSON.stringify(context, null, 2)}

MISSION :
1. Déterminer si le statut du dossier a changé.
2. Fournir une explication courte et claire du nouveau statut.
3. Estimer le nombre de jours restants avant clôture.

⚠️ Réponds UNIQUEMENT en JSON strict :
{
  "statusChanged": true,
  "newStatus": "en_cours",
  "message": "Votre dossier est en cours de traitement par l'administration.",
  "daysRemaining": 5
}

Exemple :
{
  "statusChanged": true,
  "newStatus": "terminé",
  "message": "Votre dossier a été accepté et clôturé.",
  "daysRemaining": 0
}`;

  const monitor = await callLLM(prompt);

  console.log("\n [Monitor] Réponse IA :\n", JSON.stringify(monitor, null, 2));

  const updated = { ...context, monitor };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  console.log("💾 Contexte mis à jour avec le statut du dossier");
}
