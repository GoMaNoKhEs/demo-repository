import { db } from "./src/config/firebase-config.js";

const testDoc = db.collection("tests").doc("hello");
await testDoc.set({ message: "Coucou Nora 🚀", date: new Date().toISOString() });

console.log("✅ Donnée envoyée à Firestore !");
