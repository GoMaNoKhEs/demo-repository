/**
 * Test spécifique pour vérifier la détection de confirmation
 *
 * OBJECTIF: Vérifier que "Lance le processus toi-même" déclenche userConfirmed = true
 */

import * as admin from "firebase-admin";
import { ChatAgent } from "../agents/chat";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testConfirmationDetection() {
  console.log("\n" + "=".repeat(80));
  console.log("  🧪 TEST DÉTECTION CONFIRMATION CHATAGENT");
  console.log("=".repeat(80) + "\n");

  const sessionId = `test-confirmation-${Date.now()}`;

  try {
    // 1. Créer une conversation avec toutes les infos
    console.log("📝 Étape 1: Créer historique de conversation avec infos complètes\n");

    const messages = [
      { role: "user", content: "Je veux faire ma demande d'APL" },
      { role: "agent", content: "Pour votre demande d'APL, précisons votre situation..." },
      { role: "user", content: "Je suis locataire. Mon loyer est de 570€ hors charges avec 50€ pour les charges. Je ne connais pas le numéro SIRET de mon bailleur" },
      { role: "agent", content: "Parfait, nous avançons bien. Récupérez le SIRET..." },
      { role: "user", content: "Oui j'ai déjà un compte sur la caf. Le numéro siret de mon bailleur 56789012345678" },
    ];

    for (const msg of messages) {
      await db.collection("messages").add({
        sessionId,
        role: msg.role,
        content: msg.content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      await new Promise((resolve) => setTimeout(resolve, 100)); // Attendre pour ordre timestamp
    }

    console.log(`✅ ${messages.length} messages créés dans session: ${sessionId}\n`);

    // 2. Envoyer le message de confirmation
    console.log("📤 Étape 2: Envoyer message de confirmation\n");
    console.log("Message utilisateur: \"Lance le processus toi-même\"\n");

    const chatAgent = ChatAgent.getInstance();

    // Ajouter le message utilisateur AVANT processUserMessage
    await db.collection("messages").add({
      sessionId,
      role: "user",
      content: "Lance le processus toi-même",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await chatAgent.processUserMessage(sessionId, "Lance le processus toi-même");

    console.log("\n✅ Message traité par ChatAgent\n");

    // 3. Vérifier si un processus a été créé
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Attendre création

    console.log("🔍 Étape 3: Vérifier si processus créé\n");

    const processSnapshot = await db
      .collection("processes")
      .where("sessionId", "==", sessionId)
      .get();

    if (processSnapshot.empty) {
      console.log("❌ ÉCHEC: Aucun processus créé");
      console.log("\n📊 Raisons possibles:");
      console.log("  1. readyToStart = false (infos manquantes)");
      console.log("  2. userConfirmed = false (confirmation non détectée)");
      console.log("  3. confidence < 0.7");
      console.log("\n💡 Vérifiez les logs [ChatAgent] Intent Analysis ci-dessus\n");
    } else {
      const process = processSnapshot.docs[0].data();
      console.log("✅ SUCCÈS: Processus créé!");
      console.log("\n📋 Détails du processus:");
      console.log(`  - ID: ${processSnapshot.docs[0].id}`);
      console.log(`  - Titre: ${process.title}`);
      console.log(`  - Status: ${process.status}`);
      console.log(`  - UserContext: ${JSON.stringify(process.userContext, null, 2)}`);
      console.log(`  - Steps: ${process.steps?.length || 0}\n`);
    }

    // 4. Afficher le dernier message agent
    console.log("💬 Étape 4: Dernier message de l'agent\n");

    const lastMessageSnapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .where("role", "==", "agent")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (!lastMessageSnapshot.empty) {
      const lastMessage = lastMessageSnapshot.docs[0].data();
      console.log(`Agent: ${lastMessage.content.substring(0, 200)}...\n`);
    }

    // Cleanup
    console.log("🧹 Cleanup: Suppression des données de test...");

    const messagesToDelete = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .get();

    for (const doc of messagesToDelete.docs) {
      await doc.ref.delete();
    }

    if (!processSnapshot.empty) {
      await processSnapshot.docs[0].ref.delete();
    }

    console.log("✅ Cleanup terminé\n");
  } catch (error) {
    console.error("❌ Erreur durant le test:", error);
  }

  console.log("=".repeat(80));
  console.log("  TEST TERMINÉ");
  console.log("=".repeat(80) + "\n");
}

// Exécuter le test
testConfirmationDetection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
