import { callLLM } from "./config/ai-config.js";
import { loadContext, saveContext } from "./mcp-store.js";



export async function runNavigator() {
  //  Corrige le chemin d'accès : le fichier est à la racine du dossier simplifIA_nora_agents
  const ctx = await loadContext();

  //  Lecture sécurisée du contexte (si le fichier existe)
  let context = {};
  try {
    const fileData = fs.readFileSync(filePath, "utf-8").trim();
    context = fileData ? JSON.parse(fileData) : {};
  } catch (err) {
    console.warn("Impossible de lire shared_context.json, utilisation d'un contexte vide.");
    context = {};
  };

  const prompt = `
Tu es un expert IA en analyse de sites web gouvernementaux.
SCÉNARIO : ${ctx.scenario || "inconnu"}

OBJECTIF :
1. Proposer l’URL officielle probable du site correspondant
2. Décrire le type de page (auth, formulaire, confirmation)
3. Lister 3 éléments clés
4. Donne un JSON clair

Réponds UNIQUEMENT en JSON :
{
  "url": "string",
  "pageType": "auth|form|home|confirmation",
  "keyElements": ["string"],
  "nextAction": "string"
}`;

  
//  Appel au modèle local (Gemma3:4b)
const nav = await callLLM(prompt);

//  Affichage du résultat
console.log("\n [Navigator] Réponse IA :\n", JSON.stringify(nav, null, 2));

//  Mise à jour du contexte MCP partagé
const updated = { ...ctx, navigation: nav, updatedAt: new Date().toISOString() };
await saveContext(updated);
console.log(" Contexte mis à jour avec la navigation");
}



