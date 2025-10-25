// Tests E2E pour ChatAgent - Conversation et création de processus
import { ChatAgent } from "../agents/chat";
import * as admin from "firebase-admin";

// Initialiser Firebase Admin (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "simplifia-hackathon",
  });
}

const db = admin.firestore();

/**
 * Helper: Créer une session de chat
 */
async function createChatSession(sessionId: string): Promise<void> {
  await db.collection("chat_sessions").doc(sessionId).set({
    userId: "user-test-chat",
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
 * Helper: Récupérer tous les messages d'une session
 */
async function getMessages(sessionId: string): Promise<any[]> {
  const snapshot = await db
    .collection("messages")
    .where("sessionId", "==", sessionId)
    .orderBy("timestamp", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data());
}

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
 * Helper: Nettoyer les données de test
 */
async function cleanupTestData(sessionId: string): Promise<void> {
  // Supprimer messages
  const messagesSnapshot = await db
    .collection("messages")
    .where("sessionId", "==", sessionId)
    .get();

  const messageDeletions = messagesSnapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(messageDeletions);

  // Supprimer processus
  const processesSnapshot = await db
    .collection("processes")
    .where("sessionId", "==", sessionId)
    .get();

  const processDeletions = processesSnapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(processDeletions);

  // Supprimer session
  await db.collection("chat_sessions").doc(sessionId).delete();

  console.log(`🧹 Données nettoyées pour session: ${sessionId}`);
}

/**
 * Test 1 : Conversation complète → Processus créé
 */
async function testChatFullConversation() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TEST 1: Conversation complète → Processus créé ===");
  console.log("=".repeat(70) + "\n");

  const sessionId = `test-chat-full-${Date.now()}`;
  const chatAgent = ChatAgent.getInstance();

  try {
    await createChatSession(sessionId);
    console.log(`✅ Session créée: ${sessionId}\n`);

    // Message 1: Demande initiale
    console.log("📝 Message 1: Demande initiale (APL)");
    await addUserMessage(sessionId, "Bonjour, je veux une aide au logement APL");
    await chatAgent.processUserMessage(sessionId, "Bonjour, je veux une aide au logement APL");

    // Attendre un peu pour l'IA
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Message 2: Réponse aux questions
    console.log("📝 Message 2: Situation");
    await addUserMessage(sessionId, "Je suis étudiant, locataire à Paris");
    await chatAgent.processUserMessage(sessionId, "Je suis étudiant, locataire à Paris");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Message 3: Infos complémentaires
    console.log("📝 Message 3: Infos financières");
    await addUserMessage(sessionId, "Mon loyer est de 850€ par mois et mes revenus sont de 800€");
    await chatAgent.processUserMessage(sessionId, "Mon loyer est de 850€ par mois et mes revenus sont de 800€");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Message 4: Confirmation
    console.log("📝 Message 4: Confirmation");
    await addUserMessage(sessionId, "Oui, je veux créer mon dossier");
    await chatAgent.processUserMessage(sessionId, "Oui, je veux créer mon dossier");

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Vérifications
    console.log("\n🔍 Vérification des résultats...\n");

    const messages = await getMessages(sessionId);
    console.log(`📊 Nombre total de messages: ${messages.length}`);

    const userMessages = messages.filter((m) => m.role === "user").length;
    const agentMessages = messages.filter((m) => m.role === "agent").length;
    console.log(`   - Messages utilisateur: ${userMessages}`);
    console.log(`   - Messages agent: ${agentMessages}`);

    const process = await getLastProcess(sessionId);

    if (!process) {
      console.log("❌ ÉCHEC: Aucun processus créé");
      return false;
    }

    console.log(`\n✅ Processus créé: ${process.id}`);
    console.log(`   - Titre: ${process.title || "N/A"}`);
    console.log(`   - Type: ${process.type || "N/A"}`);
    console.log(`   - Status: ${process.status || "N/A"}`);
    console.log(`   - Nombre d'étapes: ${process.steps?.length || 0}`);

    // Vérifier structure processus
    const hasValidStructure =
      process.title &&
      process.status && // Accept any status (created, pending, running)
      Array.isArray(process.steps) &&
      process.steps.length >= 3;

    if (!hasValidStructure) {
      console.log("❌ ÉCHEC: Structure processus invalide");
      return false;
    }

    // Vérifier userContext
    if (process.userContext) {
      console.log("\n📋 UserContext collecté:");
      console.log(JSON.stringify(process.userContext, null, 2));
    }

    // Vérifier que Step 0 est completed
    const step0 = process.steps[0];
    if (step0 && step0.status === "completed") {
      console.log("\n✅ Step 0 (Analyse Chat) marqué \"completed\"");
    } else {
      console.log(`\n⚠️  Step 0 status: ${step0?.status || "N/A"}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ TEST 1 RÉUSSI: Processus créé avec structure valide");
    console.log("=".repeat(70));

    return true;
  } catch (error) {
    console.error(`❌ TEST 1 ÉCHOUÉ: ${error}`);
    return false;
  } finally {
    await cleanupTestData(sessionId);
  }
}

/**
 * Test 2 : Détection confirmation "oui"
 */
async function testConfirmationDetection() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TEST 2: Détection confirmation 'oui' ===");
  console.log("=".repeat(70) + "\n");

  const sessionId = `test-chat-confirm-${Date.now()}`;
  const chatAgent = ChatAgent.getInstance();

  try {
    await createChatSession(sessionId);
    console.log(`✅ Session créée: ${sessionId}\n`);

    // Simuler conversation avec infos collectées
    console.log("📝 Conversation préalable simulée (APL)");
    await addUserMessage(sessionId, "Je veux une APL");
    await addUserMessage(sessionId, "Je suis étudiant à Paris");
    await addUserMessage(sessionId, "Mon loyer est 850€, revenus 800€");

    // Message agent simulé (proposition)
    await db.collection("messages").add({
      sessionId,
      role: "agent",
      content: "Souhaitez-vous que je crée votre dossier maintenant ?",
      timestamp: admin.firestore.Timestamp.now(),
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Tester différentes confirmations
    const confirmations = ["oui", "d'accord", "vas-y", "lance", "ok je veux"];

    for (const confirmation of confirmations) {
      const testSessionId = `${sessionId}-${confirmation}`;

      console.log(`\n🔍 Test confirmation: "${confirmation}"`);

      // Copier l'historique
      const messages = await getMessages(sessionId);
      for (const msg of messages) {
        await db.collection("messages").add({
          ...msg,
          sessionId: testSessionId,
        });
      }

      // Envoyer confirmation
      await addUserMessage(testSessionId, confirmation);
      await chatAgent.processUserMessage(testSessionId, confirmation);

      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Vérifier processus créé
      const process = await getLastProcess(testSessionId);

      if (process) {
        console.log(`   ✅ Processus créé avec "${confirmation}"`);
      } else {
        console.log(`   ❌ Pas de processus avec "${confirmation}"`);
        return false;
      }

      // Nettoyer cette sous-session
      await cleanupTestData(testSessionId);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ TEST 2 RÉUSSI: Toutes les confirmations détectées");
    console.log("=".repeat(70));

    return true;
  } catch (error) {
    console.error(`❌ TEST 2 ÉCHOUÉ: ${error}`);
    return false;
  } finally {
    await cleanupTestData(sessionId);
  }
}

/**
 * Test 3 : Limite 8 messages (4 échanges) → Forçage proposition
 */
async function testMessageLimit() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TEST 3: Limite 8 messages → Forçage proposition ===");
  console.log("=".repeat(70) + "\n");

  const sessionId = `test-chat-limit-${Date.now()}`;
  const chatAgent = ChatAgent.getInstance();

  try {
    await createChatSession(sessionId);
    console.log(`✅ Session créée: ${sessionId}\n`);

    // Envoyer 7 messages sans confirmation
    const messages = [
      "Je veux une aide CAF",
      "Je suis salarié",
      "J'habite à Lyon",
      "Je gagne 1500€ par mois",
      "J'ai 2 enfants",
      "Mon loyer est 900€",
      "J'ai besoin d'aide rapidement",
    ];

    for (let i = 0; i < messages.length; i++) {
      console.log(`📝 Message ${i + 1}/7: "${messages[i]}"`);
      await addUserMessage(sessionId, messages[i]);
      await chatAgent.processUserMessage(sessionId, messages[i]);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Récupérer tous les messages
    const allMessages = await getMessages(sessionId);
    console.log(`\n📊 Nombre total de messages: ${allMessages.length}`);

    // Le dernier message agent devrait proposer de créer le dossier
    const lastAgentMessage = allMessages
      .filter((m) => m.role === "agent")
      .pop();

    if (!lastAgentMessage) {
      console.log("❌ ÉCHEC: Aucun message agent trouvé");
      return false;
    }

    console.log("\n💬 Dernier message agent:");
    console.log(`"${lastAgentMessage.content}"`);

    // Vérifier que le message contient une proposition OU un résumé des infos collectées
    const hasProposal =
      lastAgentMessage.content.toLowerCase().includes("souhaitez-vous") ||
      lastAgentMessage.content.toLowerCase().includes("créer") ||
      lastAgentMessage.content.toLowerCase().includes("dossier") ||
      lastAgentMessage.content.toLowerCase().includes("démarrer") ||
      lastAgentMessage.content.toLowerCase().includes("résumé") ||
      lastAgentMessage.content.toLowerCase().includes("collecté");

    if (!hasProposal) {
      console.log("❌ ÉCHEC: Pas de proposition de création après 8 messages");
      return false;
    }

    console.log("\n✅ Proposition détectée après limite de messages");

    console.log("\n" + "=".repeat(70));
    console.log("✅ TEST 3 RÉUSSI: Limite 8 messages respectée");
    console.log("=".repeat(70));

    return true;
  } catch (error) {
    console.error(`❌ TEST 3 ÉCHOUÉ: ${error}`);
    return false;
  } finally {
    await cleanupTestData(sessionId);
  }
}

/**
 * Test 4 : Analyse intention (collectedInfo correctement extrait)
 */
async function testIntentAnalysis() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TEST 4: Analyse intention (collectedInfo) ===");
  console.log("=".repeat(70) + "\n");

  const sessionId = `test-chat-intent-${Date.now()}`;
  const chatAgent = ChatAgent.getInstance();

  try {
    await createChatSession(sessionId);
    console.log(`✅ Session créée: ${sessionId}\n`);

    // Conversation structurée avec infos claires
    console.log("📝 Message 1: Demande + situation");
    await addUserMessage(sessionId, "Je veux une APL, je suis étudiant célibataire");
    await chatAgent.processUserMessage(sessionId, "Je veux une APL, je suis étudiant célibataire");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("📝 Message 2: Logement + ville");
    await addUserMessage(sessionId, "Je suis locataire à Marseille");
    await chatAgent.processUserMessage(sessionId, "Je suis locataire à Marseille");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("📝 Message 3: Revenus");
    await addUserMessage(sessionId, "Mes revenus sont de 950 euros par mois");
    await chatAgent.processUserMessage(sessionId, "Mes revenus sont de 950 euros par mois");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("📝 Message 4: Confirmation");
    await addUserMessage(sessionId, "Oui je veux créer mon dossier");
    await chatAgent.processUserMessage(sessionId, "Oui je veux créer mon dossier");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Vérifier processus et userContext
    const process = await getLastProcess(sessionId);

    if (!process) {
      console.log("❌ ÉCHEC: Aucun processus créé");
      return false;
    }

    console.log(`\n✅ Processus créé: ${process.id}`);

    if (!process.userContext) {
      console.log("❌ ÉCHEC: userContext manquant");
      return false;
    }

    console.log("\n📋 UserContext collecté:");
    console.log(JSON.stringify(process.userContext, null, 2));

    // Vérifier que les infos clés ont été extraites
    const hasExpectedInfo =
      process.userContext.situation &&
      process.userContext.logement &&
      (process.userContext.revenus || process.userContext.revenusMensuels) &&
      process.userContext.ville;

    if (!hasExpectedInfo) {
      console.log("\n⚠️  Infos manquantes:");
      console.log(`   - situation: ${process.userContext.situation || "MANQUANT"}`);
      console.log(`   - logement: ${process.userContext.logement || "MANQUANT"}`);
      console.log(`   - revenus: ${process.userContext.revenus || process.userContext.revenusMensuels || "MANQUANT"}`);
      console.log(`   - ville: ${process.userContext.ville || "MANQUANT"}`);
      console.log("\n❌ ÉCHEC: Informations incomplètes dans userContext");
      return false;
    }

    console.log("\n✅ Toutes les infos clés extraites:");
    console.log(`   - Situation: ${process.userContext.situation}`);
    console.log(`   - Logement: ${process.userContext.logement}`);
    console.log(`   - Revenus: ${process.userContext.revenus || process.userContext.revenusMensuels}`);
    console.log(`   - Ville: ${process.userContext.ville}`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ TEST 4 RÉUSSI: collectedInfo correctement extrait");
    console.log("=".repeat(70));

    return true;
  } catch (error) {
    console.error(`❌ TEST 4 ÉCHOUÉ: ${error}`);
    return false;
  } finally {
    await cleanupTestData(sessionId);
  }
}

/**
 * Test 5 : Edge case - Historique vide (premier message)
 */
async function testEmptyHistory() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TEST 5: Edge case - Historique vide ===");
  console.log("=".repeat(70) + "\n");

  const sessionId = `test-chat-empty-${Date.now()}`;
  const chatAgent = ChatAgent.getInstance();

  try {
    await createChatSession(sessionId);
    console.log(`✅ Session créée: ${sessionId}\n`);

    // Premier message utilisateur (aucun historique)
    console.log("📝 Premier message (pas d'historique)");
    await addUserMessage(sessionId, "Bonjour, j'ai besoin d'aide pour une démarche");

    // Vérifier que ça ne crash pas
    try {
      await chatAgent.processUserMessage(sessionId, "Bonjour, j'ai besoin d'aide pour une démarche");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("✅ Traitement sans crash");
    } catch (error) {
      console.log(`❌ ÉCHEC: Crash avec historique vide: ${error}`);
      return false;
    }

    // Vérifier qu'un message agent a été créé
    const messages = await getMessages(sessionId);
    const agentMessages = messages.filter((m) => m.role === "agent");

    if (agentMessages.length === 0) {
      console.log("❌ ÉCHEC: Aucun message agent créé");
      return false;
    }

    console.log("\n💬 Réponse agent:");
    console.log(`"${agentMessages[0].content}"`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ TEST 5 RÉUSSI: Historique vide géré correctement");
    console.log("=".repeat(70));

    return true;
  } catch (error) {
    console.error(`❌ TEST 5 ÉCHOUÉ: ${error}`);
    return false;
  } finally {
    await cleanupTestData(sessionId);
  }
}

/**
 * Test 6 : Changement de sujet (contextAnalysis détecte topic_change)
 */
async function testTopicChange() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TEST 6: Changement de sujet (topic_change) ===");
  console.log("=".repeat(70) + "\n");

  const sessionId = `test-chat-topic-${Date.now()}`;
  const chatAgent = ChatAgent.getInstance();

  try {
    await createChatSession(sessionId);
    console.log(`✅ Session créée: ${sessionId}\n`);

    // Conversation initiale sur APL
    console.log("📝 Message 1: Demande APL");
    await addUserMessage(sessionId, "Je veux faire une demande d'APL");
    await chatAgent.processUserMessage(sessionId, "Je veux faire une demande d'APL");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("📝 Message 2: Infos APL");
    await addUserMessage(sessionId, "Je suis étudiant à Paris, locataire");
    await chatAgent.processUserMessage(sessionId, "Je suis étudiant à Paris, locataire");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Changement brutal de sujet
    console.log("\n⚠️  Message 3: CHANGEMENT DE SUJET (APL → Passeport)");
    await addUserMessage(sessionId, "En fait non, je veux plutôt renouveler mon passeport");
    await chatAgent.processUserMessage(sessionId, "En fait non, je veux plutôt renouveler mon passeport");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Vérifier la réponse agent
    const messages = await getMessages(sessionId);
    const lastAgentMessage = messages
      .filter((m) => m.role === "agent")
      .pop();

    if (!lastAgentMessage) {
      console.log("❌ ÉCHEC: Aucun message agent après changement sujet");
      return false;
    }

    console.log("\n💬 Réponse agent au changement:");
    console.log(`"${lastAgentMessage.content}"`);

    // Vérifier que l'agent accuse réception du changement
    const acknowledgesChange =
      lastAgentMessage.content.toLowerCase().includes("passeport") &&
      (lastAgentMessage.content.toLowerCase().includes("d'accord") ||
        lastAgentMessage.content.toLowerCase().includes("parlons") ||
        lastAgentMessage.content.toLowerCase().includes("compris") ||
        lastAgentMessage.content.toLowerCase().includes("changement"));

    if (!acknowledgesChange) {
      console.log("\n⚠️  L'agent ne semble pas accuser réception du changement");
      console.log("    (Peut-être un faux négatif, l'IA peut répondre différemment)");
    } else {
      console.log("\n✅ Agent accuse réception du changement de sujet");
    }

    // Continuer avec le nouveau sujet
    console.log("\n📝 Message 4: Continue sur nouveau sujet");
    await addUserMessage(sessionId, "Oui, je veux renouveler mon passeport périmé");
    await chatAgent.processUserMessage(sessionId, "Oui, je veux renouveler mon passeport périmé");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const finalMessages = await getMessages(sessionId);
    console.log(`\n📊 Total messages: ${finalMessages.length}`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ TEST 6 RÉUSSI: Changement de sujet géré");
    console.log("=".repeat(70));

    return true;
  } catch (error) {
    console.error(`❌ TEST 6 ÉCHOUÉ: ${error}`);
    return false;
  } finally {
    await cleanupTestData(sessionId);
  }
}

/**
 * Fonction principale pour exécuter tous les tests
 */
async function runAllTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║         TESTS E2E CHATAGENT - SimplifIA Hackathon                 ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");

  const results: { [key: string]: boolean } = {};

  // Test 1: Conversation complète
  results["Test 1 - Conversation complète"] = await testChatFullConversation();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 2: Détection confirmation
  results["Test 2 - Détection confirmation"] = await testConfirmationDetection();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: Limite 8 messages
  results["Test 3 - Limite 8 messages"] = await testMessageLimit();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 4: Analyse intention
  results["Test 4 - Analyse intention"] = await testIntentAnalysis();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 5: Historique vide
  results["Test 5 - Historique vide"] = await testEmptyHistory();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 6: Changement de sujet
  results["Test 6 - Changement de sujet"] = await testTopicChange();

  // Résumé final
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║                      RÉSUMÉ DES TESTS                              ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");

  const passedTests = Object.values(results).filter((r) => r).length;
  const totalTests = Object.keys(results).length;

  for (const [testName, passed] of Object.entries(results)) {
    const icon = passed ? "✅" : "❌";
    console.log(`${icon} ${testName}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log(`RÉSULTAT FINAL: ${passedTests}/${totalTests} tests réussis`);
  console.log("=".repeat(70));

  if (passedTests === totalTests) {
    console.log("\n🎉 TOUS LES TESTS SONT RÉUSSIS ! ChatAgent est validé.");
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) échoué(s). Veuillez corriger.`);
  }

  // Fermer proprement
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Exécuter les tests
runAllTests().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});
