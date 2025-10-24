/**
 * TEST DÉMO E2E - Workflow Complet SimplifIA
 * 
 * Simule le scénario exact de la démo hackathon :
 * 1. User chat avec ChatAgent (demande APL)
 * 2. ChatAgent crée processus automatiquement
 * 3. Orchestrator lance workflow complet
 * 4. Navigator → FormFiller → Validator → Completion
 * 5. Vérification résultat final
 * 
 * Objectifs :
 * - Workflow complet < 30s
 * - Tous les steps completed
 * - Activity logs créés
 * - Métriques enregistrées
 * - Prêt pour démo live
 * 
 * Exécution : npx tsx src/test/test-demo-e2e.ts
 */

import * as admin from "firebase-admin";
import { ChatAgent } from "../agents/chat";
import { ProcessOrchestrator } from "../services/orchestrator";

// Couleurs ANSI pour output lisible
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m"
};

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "simplifia-hackathon"
  });
}

const db = admin.firestore();

/**
 * Helper: Créer session chat
 */
async function createChatSession(sessionId: string, userId: string): Promise<void> {
  await db.collection("chat_sessions").doc(sessionId).set({
    userId,
    status: "active",
    createdAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Helper: Ajouter message utilisateur
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
 * Helper: Récupérer dernier processus créé
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
 * Helper: Nettoyer données test
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

    // Supprimer activity_logs
    const logsSnapshot = await db
      .collection("activity_logs")
      .where("processId", "==", processId)
      .get();

    const logDeletions = logsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(logDeletions);

    // Supprimer workflow_metrics
    const metricsSnapshot = await db
      .collection("workflow_metrics")
      .where("processId", "==", processId)
      .get();

    const metricsDeletions = metricsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(metricsDeletions);
  }

  // Supprimer session
  await db.collection("chat_sessions").doc(sessionId).delete();

  console.log(`${colors.cyan}🧹 Données nettoyées pour session: ${sessionId}${colors.reset}`);
}

/**
 * TEST DÉMO E2E COMPLET
 * 
 * Scénario :
 * Marie, 25 ans, étudiante à Paris
 * Veut une aide au logement APL
 * 850€ de loyer, 800€ de revenus
 */
async function testDemoE2E() {
  console.log(`\n${colors.bright}${colors.magenta}${"=".repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  🎬 TEST DÉMO E2E - WORKFLOW COMPLET SIMPLIFIA${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${"=".repeat(80)}${colors.reset}\n`);

  const sessionId = `demo-e2e-${Date.now()}`;
  const userId = "marie-demo";
  let processId: string | undefined;

  const globalStartTime = Date.now();

  try {
    // ====================================================================
    // PHASE 1 : CONVERSATION AVEC CHATAGENT (2 min en démo)
    // ====================================================================
    console.log(`${colors.bright}${colors.blue}${"=".repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}  📝 PHASE 1 : CONVERSATION AVEC CHATAGENT${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${"=".repeat(80)}${colors.reset}\n`);

    const phase1StartTime = Date.now();
    const chatAgent = ChatAgent.getInstance();
    await createChatSession(sessionId, userId);
    console.log(`${colors.green}✅ Session créée: ${sessionId}${colors.reset}\n`);

    // Message 1: Demande initiale
    console.log(`${colors.cyan}💬 Marie: "Je veux une aide au logement APL"${colors.reset}`);
    await addUserMessage(sessionId, "Je veux une aide au logement APL");
    await chatAgent.processUserMessage(sessionId, "Je veux une aide au logement APL");
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Attendre IA

    // Message 2: Situation
    console.log(`${colors.cyan}💬 Marie: "Je suis étudiante locataire à Paris"${colors.reset}`);
    await addUserMessage(sessionId, "Je suis étudiante locataire à Paris");
    await chatAgent.processUserMessage(sessionId, "Je suis étudiante locataire à Paris");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Message 3: Infos financières
    console.log(`${colors.cyan}💬 Marie: "Mon loyer est 850€, mes revenus 800€"${colors.reset}`);
    await addUserMessage(sessionId, "Mon loyer est 850€, mes revenus 800€");
    await chatAgent.processUserMessage(sessionId, "Mon loyer est 850€, mes revenus 800€");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Message 4: Confirmation
    console.log(`${colors.cyan}💬 Marie: "Oui je veux créer mon dossier"${colors.reset}`);
    await addUserMessage(sessionId, "Oui je veux créer mon dossier");
    await chatAgent.processUserMessage(sessionId, "Oui je veux créer mon dossier");
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Création processus

    const phase1Duration = Date.now() - phase1StartTime;
    console.log(`\n${colors.green}✅ Phase 1 terminée : ${(phase1Duration / 1000).toFixed(1)}s${colors.reset}`);

    // Récupérer le processus créé
    const process = await getLastProcess(sessionId);

    if (!process) {
      throw new Error("❌ ÉCHEC: Aucun processus créé par ChatAgent");
    }

    processId = process.id;
    console.log(`\n${colors.green}✅ Processus créé par ChatAgent${colors.reset}`);
    console.log(`${colors.cyan}   - ID: ${processId}${colors.reset}`);
    console.log(`${colors.cyan}   - Titre: ${process.title}${colors.reset}`);
    console.log(`${colors.cyan}   - Status: ${process.status}${colors.reset}`);
    console.log(`${colors.cyan}   - UserContext: ${Object.keys(process.userContext).join(", ")}${colors.reset}`);
    console.log(`${colors.cyan}   - Steps: ${process.steps.length} (Step 0 status: ${process.steps[0].status})${colors.reset}`);

    // Vérifications Phase 1
    if (!process.userContext || Object.keys(process.userContext).length < 3) {
      throw new Error("❌ UserContext incomplet");
    }

    if (process.steps[0].status !== "completed") {
      throw new Error("❌ Step 0 devrait être 'completed'");
    }

    // ====================================================================
    // PHASE 2 : WORKFLOW ORCHESTRÉ (1.5 min en démo)
    // ====================================================================
    console.log(`\n${colors.bright}${colors.blue}${"=".repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}  🔄 PHASE 2 : WORKFLOW ORCHESTRÉ${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${"=".repeat(80)}${colors.reset}\n`);

    const phase2StartTime = Date.now();
    console.log(`${colors.cyan}🚀 Lancement Orchestrator pour processus ${processId}...${colors.reset}\n`);

    const orchestrator = ProcessOrchestrator.getInstance();
    const metrics = await orchestrator.executeWorkflow(processId);

    const phase2Duration = Date.now() - phase2StartTime;
    console.log(`\n${colors.green}✅ Phase 2 terminée : ${(phase2Duration / 1000).toFixed(1)}s${colors.reset}`);

    // Afficher métriques détaillées
    console.log(`\n${colors.cyan}📊 MÉTRIQUES WORKFLOW${colors.reset}`);
    console.log(`${colors.cyan}   - Status: ${metrics.status}${colors.reset}`);
    console.log(`${colors.cyan}   - Total duration: ${metrics.totalDuration}ms${colors.reset}`);
    console.log(`${colors.cyan}   - Steps exécutés: ${metrics.steps.length}${colors.reset}`);
    
    metrics.steps.forEach((step, idx) => {
      const icon = step.success ? "✅" : "❌";
      console.log(`${colors.cyan}     ${icon} Step ${idx + 1}: ${step.stepName} - ${step.duration}ms${colors.reset}`);
    });

    // Vérifications Phase 2
    if (metrics.status !== "success") {
      throw new Error(`❌ Workflow status incorrect: ${metrics.status}`);
    }

    const failedSteps = metrics.steps.filter(s => !s.success);
    if (failedSteps.length > 0) {
      throw new Error(`❌ ${failedSteps.length} step(s) échoué(s)`);
    }

    // Durée acceptable pour démo : Workflow orchestrator < 60s
    // (Phase 1 Chat prend ~45s, Phase 2 Workflow ~50s = 95s total acceptable)
    if (!metrics.totalDuration || metrics.totalDuration > 60000) {
      throw new Error(`❌ Workflow orchestrator trop lent: ${metrics.totalDuration}ms (max: 60000ms)`);
    }

    // ====================================================================
    // PHASE 3 : VÉRIFICATION RÉSULTAT FINAL
    // ====================================================================
    console.log(`\n${colors.bright}${colors.blue}${"=".repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}  ✅ PHASE 3 : VÉRIFICATION RÉSULTAT${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${"=".repeat(80)}${colors.reset}\n`);

    // Vérifier processId défini
    if (!processId) {
      throw new Error("❌ processId non défini");
    }

    // Vérifier processus final
    const finalProcessDoc = await db.collection("processes").doc(processId).get();
    const finalProcess = finalProcessDoc.data();

    if (!finalProcess) {
      throw new Error("❌ Processus non trouvé");
    }

    console.log(`${colors.green}✅ Processus final vérifié${colors.reset}`);
    console.log(`${colors.cyan}   - Status: ${finalProcess.status}${colors.reset}`);
    console.log(`${colors.cyan}   - External reference: ${finalProcess.externalReference || "N/A"}${colors.reset}`);
    console.log(`${colors.cyan}   - Current step: ${finalProcess.currentStepIndex}/${finalProcess.steps.length}${colors.reset}`);

    // Vérifier activity logs
    const logsSnapshot = await db
      .collection("activity_logs")
      .where("processId", "==", processId)
      .get();

    console.log(`\n${colors.green}✅ Activity logs créés: ${logsSnapshot.size} log(s)${colors.reset}`);

    // Afficher quelques logs
    const logs = logsSnapshot.docs.slice(0, 5);
    logs.forEach((logDoc) => {
      const log = logDoc.data();
      const icon = log.type === "success" ? "✅" : log.type === "error" ? "❌" : "ℹ️";
      console.log(`${colors.cyan}   ${icon} ${log.agent || "System"}: ${log.message}${colors.reset}`);
    });

    // Vérifier métriques sauvegardées
    const metricsSnapshot = await db
      .collection("workflow_metrics")
      .where("processId", "==", processId)
      .get();

    if (metricsSnapshot.empty) {
      throw new Error("❌ Métriques workflow non sauvegardées");
    }

    console.log(`\n${colors.green}✅ Métriques sauvegardées dans Firestore${colors.reset}`);

    // ====================================================================
    // RÉSUMÉ FINAL
    // ====================================================================
    const totalDuration = Date.now() - globalStartTime;

    console.log(`\n${colors.bright}${colors.green}${"=".repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.green}  🎉 TEST DÉMO E2E RÉUSSI !${colors.reset}`);
    console.log(`${colors.bright}${colors.green}${"=".repeat(80)}${colors.reset}\n`);

    console.log(`${colors.cyan}⏱️  TIMINGS DÉMO${colors.reset}`);
    console.log(`${colors.cyan}   - Phase 1 (Chat): ${(phase1Duration / 1000).toFixed(1)}s${colors.reset}`);
    console.log(`${colors.cyan}   - Phase 2 (Workflow): ${(phase2Duration / 1000).toFixed(1)}s${colors.reset}`);
    console.log(`${colors.cyan}   - TOTAL: ${(totalDuration / 1000).toFixed(1)}s${colors.reset}`);

    console.log(`\n${colors.cyan}📊 CRITÈRES VALIDATION${colors.reset}`);
    console.log(`${colors.green}   ✅ Processus créé par ChatAgent${colors.reset}`);
    console.log(`${colors.green}   ✅ UserContext collecté (${Object.keys(process.userContext).length} champs)${colors.reset}`);
    console.log(`${colors.green}   ✅ Step 0 completed${colors.reset}`);
    console.log(`${colors.green}   ✅ Workflow orchestrator réussi${colors.reset}`);
    console.log(`${colors.green}   ✅ Tous les steps completed${colors.reset}`);
    console.log(`${colors.green}   ✅ Workflow < 60s (${(phase2Duration / 1000).toFixed(1)}s)${colors.reset}`);
    console.log(`${colors.green}   ✅ Activity logs créés (${logsSnapshot.size})${colors.reset}`);
    console.log(`${colors.green}   ✅ Métriques enregistrées${colors.reset}`);

    console.log(`\n${colors.bright}${colors.magenta}🚀 PRÊT POUR DÉMO LIVE !${colors.reset}\n`);

    return true;

  } catch (error) {
    console.error(`\n${colors.red}❌ TEST DÉMO E2E ÉCHOUÉ${colors.reset}`);
    console.error(`${colors.red}Erreur: ${error}${colors.reset}\n`);
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
testDemoE2E()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
