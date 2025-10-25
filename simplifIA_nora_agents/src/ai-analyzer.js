import { callLLM } from "./config/ai-config.js";
import { loadContext, saveContext } from "./mcp-store.js";

export async function runAnalyzer(userContext) {
  const prompt = `
Tu es un expert IA spécialisé dans les démarches administratives françaises.
RÈGLES :
- Ne jamais inventer d’informations.
- Si tu n’es pas sûr, écris "unknown".
- Baser les réponses uniquement sur des sites officiels :
  - service-public.fr
  - ameli.fr
  - impots.gouv.fr
  - interieur.gouv.fr
- Répondre UNIQUEMENT en JSON valide, sans texte avant ni après.
CONTEXTE UTILISATEUR : "${userContext}"

MISSION :
1. Analyse le contexte et détermine la démarche administrative la plus probable
2. Évalue ta confiance (0–100 %)
3. Liste les documents nécessaires
4. Donne un plan d’étapes (max 6)
5. Indique un niveau de risque (low, medium, high)

 Réponds UNIQUEMENT en JSON strict :
{
  "scenario": "string",
  "confidence": number,
  "title": "string",
  "description": "string",
  "requiredDocuments": [ { "name": "string", "required": true } ],
  "steps": [ { "id": "string", "title": "string", "description": "string" } ],
  "riskLevel": "low|medium|high"
}

SI TU NE SAIS PAS :
{
  "scenario": "unknown",
  "confidence": 0,
  "title": "Aucune démarche identifiée",
  "description": "Contexte trop flou ou non administratif",
  "requiredDocuments": [],
  "steps": [],
  "riskLevel": "low"
}
Exemple :
{
  "scenario": "carte_europeenne",
  "confidence": 92,
  "title": "Demande de CEAM",
  "description": "Carte européenne d’assurance maladie",
  "requiredDocuments": [{"name": "Carte d'identité","required": true}],
  "steps": [
    {"id": "1","title": "Aller sur ameli.fr","description": "Se connecter"},
    {"id": "2","title": "Remplir le formulaire","description": "CEAM"}
  ],
  "riskLevel": "low"
}`;


  const json = await callLLM(prompt);

  console.log("\n [Analyzer] JSON reçu :\n", JSON.stringify(json, null, 2));

  const base = await loadContext();
  const updated = {
    sessionId: base.sessionId || process.env.SESSION_ID || "demo-session",
    ...base,
    ...json,
    updatedAt: new Date().toISOString(),
  };

  await saveContext(updated);
  console.log("💾 Contexte mis à jour (Analyzer)");
}
  