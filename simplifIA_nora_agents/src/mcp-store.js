// simplifIA_nora_agents/src/mcp-store.js
import fs from "fs";
import { db } from "./config/firebase-config.js";

const filePath = new URL("../shared_context.json", import.meta.url);

/** Lecture locale */
export async function loadContext() {
  try {
    const txt = fs.readFileSync(filePath, "utf-8").trim();
    return txt ? JSON.parse(txt) : {};
  } catch {
    console.warn("⚠️ shared_context.json introuvable — nouveau contexte.");
    return {};
  }
}

/** Écriture locale + Firestore (merge) */
export async function saveContext(obj) {
  // fichier local
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));

  // Firestore (optionnel mais tenté)
  try {
    const sessionId = obj.sessionId || process.env.SESSION_ID || "demo-session";
    await db.collection("sessions").doc(sessionId).set(obj, { merge: true });
    console.log("☁️ Contexte sauvegardé dans Firestore (session:", sessionId, ")");
  } catch (err) {
    console.warn("⚠️ Firestore non disponible :", err.message);
  }
}
