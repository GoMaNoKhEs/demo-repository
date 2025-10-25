// Test d'intégration JOUR 1 : ChatAgent (DEV1) → Navigator (DEV2)
import { ChatAgent } from "../agents/chat";
import { NavigatorAgent } from "../agents/navigator";
import * as admin from "firebase-admin";

// Initialiser Firebase Admin (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "simplifia-hackathon",
  });
}

const db = admin.firestore();

/**
 * Helper: Récupérer le dernier processus créé pour une session
 */
async function getLastProcess(sessionId: string): Promise<any> {
  const snapshot = await db
    .collection("processes")
    .where("sessionId", "==", sessionId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Helper: Créer une session de chat
 */
async function createChatSession(sessionId: string): Promise<void> {
  await db.collection("chat_sessions").doc(sessionId).set({
    userId: "user-integration-test",
    status: "active",
    createdAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Helper: Ajouter un message utilisateur
 */
async function addUserMessage(sessionId: string, content: string): Promise<void> {
  await db.collection("messages").add({
    sessionId,
    role: "user",
    content,
    timestamp: admin.firestore.Timestamp.now(),
  });
}

/**
 * Helper: Nettoyer les données de test
 */
async function cleanupTestData(sessionId: string, processId?: string): Promise<void> {
  // Supprimer messages
  const messagesSnapshot = await db
    .collection("messages")
    .where("sessionId", "==", sessionId)
    .get();

  const messageDeletions = messagesSnapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(messageDeletions);

  // Supprimer processus
  if (processId) {
    await db.collection("processes").doc(processId).delete();
  }

  // Supprimer session
  await db.collection("chat_sessions").doc(sessionId).delete();

  // Supprimer activity_logs
  const logsSnapshot = await db
    .collection("activity_logs")
    .where("processId", "==", processId)
    .get();

  const logDeletions = logsSnapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(logDeletions);

  console.log(`🧹 Données nettoyées pour session: ${sessionId}`);
}

/**
 * TEST INTÉGRATION JOUR 1 : ChatAgent → Navigator
 *
 * Scénario complet :
 * 1. ChatAgent (DEV1) : User chat → Processus créé
 * 2. Navigator (DEV2) : Lit le processus → Mappe données → Soumet
 */
async function testIntegrationJour1() {
  console.log("\n" + "=".repeat(80));
  console.log("🔄 TEST INTÉGRATION JOUR 1 : ChatAgent (DEV1) → Navigator (DEV2)");
  console.log("=".repeat(80) + "\n");

  const sessionId = `integration-jour1-${Date.now()}`;
  let processId: string | undefined;

  try {
    // ====================================================================
    // PARTIE 1 : DEV1 - ChatAgent crée un processus
    // ====================================================================
    console.log("📝 PARTIE 1 : DEV1 - ChatAgent crée processus\n");

    const chatAgent = ChatAgent.getInstance();
    await createChatSession(sessionId);
    console.log(`✅ Session créée: ${sessionId}\n`);

    // Message 1: Demande initiale
    console.log("💬 Message 1: 'Je veux une aide au logement APL'");
    await addUserMessage(sessionId, "Je veux une aide au logement APL");
    await chatAgent.processUserMessage(sessionId, "Je veux une aide au logement APL");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Message 2: Situation
    console.log("💬 Message 2: 'Je suis étudiant locataire à Paris'");
    await addUserMessage(sessionId, "Je suis étudiant locataire à Paris");
    await chatAgent.processUserMessage(sessionId, "Je suis étudiant locataire à Paris");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Message 3: Infos financières
    console.log("💬 Message 3: 'Mon loyer est 850€, mes revenus 800€'");
    await addUserMessage(sessionId, "Mon loyer est 850€, mes revenus 800€");
    await chatAgent.processUserMessage(sessionId, "Mon loyer est 850€, mes revenus 800€");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Message 4: Confirmation
    console.log("💬 Message 4: 'Oui je veux créer mon dossier'");
    await addUserMessage(sessionId, "Oui je veux créer mon dossier");
    await chatAgent.processUserMessage(sessionId, "Oui je veux créer mon dossier");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Récupérer le processus créé
    const process = await getLastProcess(sessionId);

    if (!process) {
      console.log("❌ ÉCHEC PARTIE 1: Aucun processus créé par ChatAgent");
      return false;
    }

    processId = process.id;
    console.log("\n✅ PARTIE 1 RÉUSSIE: Processus créé par DEV1");
    console.log(`   - ID: ${processId}`);
    console.log(`   - Titre: ${process.title}`);
    console.log(`   - Status: ${process.status}`);
    console.log(`   - UserContext: ${JSON.stringify(process.userContext, null, 2)}`);
    console.log(`   - Steps[0].status: ${process.steps[0].status}`);
    console.log(`   - Steps[1].status: ${process.steps[1].status}`);

    // Vérifier structure attendue par Navigator
    if (!process.userContext || !process.steps || process.steps.length < 2) {
      console.log("❌ ÉCHEC: Structure processus invalide");
      return false;
    }

    // ====================================================================
    // PARTIE 2 : DEV2 - Navigator traite le processus
    // ====================================================================
    console.log("\n" + "=".repeat(80));
    console.log("📝 PARTIE 2 : DEV2 - Navigator traite processus\n");

    const navigator = NavigatorAgent.getInstance();

    console.log(`📍 Navigator lit processus: ${processId}`);
    console.log(`   - UserContext disponible: ${Object.keys(process.userContext).join(", ")}`);

    // TypeScript: Assurer que processId est bien défini
    if (!processId) {
      console.log("❌ ÉCHEC: processId indéfini");
      return false;
    }

    // Tester mapping des données
    console.log("\n🔄 Test mapping FormFiller intégré...");
    const mappedResult = await navigator.mapUserDataToForm(processId, process.userContext, "CAF");

    console.log(`   - Confidence: ${mappedResult.confidence}`);
    console.log(`   - Champs mappés: ${Object.keys(mappedResult.mappedData).length}`);
    console.log(`   - Champs manquants: ${mappedResult.missingFields.length}`);
    console.log(`   - Warnings: ${mappedResult.warnings.length}`);

    if (mappedResult.confidence < 0.8) {
      console.log("⚠️  AVERTISSEMENT: Confidence mapping < 80%");
    }

    // Navigator soumet le formulaire
    console.log("\n🚀 Navigator soumet le formulaire...");
    await navigator.navigateAndSubmit(processId, "CAF", process.userContext);

    // Attendre que le processus soit mis à jour
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Vérifier résultat final
    const updatedProcess = await db.collection("processes").doc(processId!).get();
    const finalProcess = updatedProcess.data();

    if (!finalProcess) {
      console.log("❌ ÉCHEC PARTIE 2: Processus introuvable après Navigator");
      return false;
    }

    console.log("\n✅ PARTIE 2 RÉUSSIE: Navigator a traité le processus");
    console.log(`   - Step 1 status: ${finalProcess.steps[1].status}`);

    // ====================================================================
    // VALIDATION FINALE
    // ====================================================================
    console.log("\n" + "=".repeat(80));
    console.log("🔍 VALIDATION INTÉGRATION FINALE\n");

    const checksPass = [
      { name: "Processus créé par DEV1", pass: processId !== undefined },
      { name: "UserContext collecté", pass: Object.keys(process.userContext).length >= 3 },
      { name: "Step 0 completed", pass: process.steps[0].status === "completed" },
      { name: "Mapping confidence > 80%", pass: mappedResult.confidence >= 0.8 },
      { name: "Navigator a traité Step 1", pass: finalProcess.steps[1].status !== "pending" },
    ];

    checksPass.forEach((check) => {
      console.log(`${check.pass ? "✅" : "❌"} ${check.name}`);
    });

    const allPass = checksPass.every((c) => c.pass);

    console.log("\n" + "=".repeat(80));
    if (allPass) {
      console.log("🎉 TEST INTÉGRATION JOUR 1 RÉUSSI !");
      console.log("✅ DEV1 (ChatAgent) + DEV2 (Navigator) fonctionnent ensemble");
      console.log("✅ Prêt pour JOUR 2 : Validator + Orchestrator");
    } else {
      console.log("⚠️  TEST INTÉGRATION JOUR 1 PARTIELLEMENT RÉUSSI");
      console.log("🔧 Quelques ajustements nécessaires");
    }
    console.log("=".repeat(80));

    return allPass;
  } catch (error) {
    console.error(`\n❌ TEST INTÉGRATION ÉCHOUÉ: ${error}`);
    console.error(error);
    return false;
  } finally {
    if (processId) {
      await cleanupTestData(sessionId, processId);
    } else {
      await cleanupTestData(sessionId);
    }
  }
}

// Exécuter le test
testIntegrationJour1()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
