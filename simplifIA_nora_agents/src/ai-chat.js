import { callLLM } from "./config/ai-config.js";
import { loadContext, saveContext } from "./mcp-store.js";

export async function runChat(userMessage) {
  const ctx = await loadContext();
  const prompt = `
Tu es SimplifIA, l'assistant bienveillant des démarches administratives françaises.

CONTEXTE : ${JSON.stringify(ctx, null, 2)}
MESSAGE UTILISATEUR : "${userMessage}"

MISSION :
- Fournir une réponse claire, naturelle et empathique.
- Être poli, rassurant et précis.
- Suggérer 2 actions possibles.

⚠️ Réponds UNIQUEMENT en JSON strict :
{
  "response_human": "string",
  "suggestedActions": ["string"]
}

Exemple :
{
  "response_human": "Votre demande est en cours d'instruction, ne vous inquiétez pas. Vous recevrez un message dès que l'administration l'aura validée.",
  "suggestedActions": ["Vérifier mes documents", "Attendre la confirmation"]
}`;

  const chat = await callLLM(prompt);

  console.log("\n💬 [Chat] Réponse IA :\n", JSON.stringify(chat, null, 2));

  const updated = { ...ctx, lastChat: chat, updatedAt: new Date().toISOString() };
  await saveContext(updated);
  console.log("💾 Contexte mis à jour avec la réponse du chat");
}
