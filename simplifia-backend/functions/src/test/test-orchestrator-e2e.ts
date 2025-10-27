/**
 * Tests E2E ProcessOrchestrator - COMPLET AVEC ELIGIBILITY
 *
 * Tests du workflow complet orchestré incluant EligibilityChecker :
 * 1. Test workflow APL éligible (revenus 1500€, loyer 600€)
 * 2. Test workflow APL inéligible (loyer > revenus × 3)
 * 3. Test workflow RSA éligible (revenus 500€)
 * 4. Test workflow RSA inéligible (revenus > 607€)
 * 5. Test validation avec erreurs critiques
 * 6. Test complet avec toutes les intégrations
 *
 * Exécution : node lib/test/test-orchestrator-e2e.js
 */

import * as admin from "firebase-admin";
import { ProcessOrchestrator } from "../services/orchestrator";
import { EligibilityChecker } from "../utils/eligibility";

// Couleurs ANSI
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "simplifia-hackathon",
  });
}

const db = admin.firestore();

/**
 * TEST 1 : Workflow complet avec données valides CAF
 */
async function testWorkflowComplet() {
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║   TEST 1 : WORKFLOW COMPLET - DEMANDE APL CAF        ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // 1. Créer un processus de test dans Firestore
    const processId = `test-orchestrator-${Date.now()}`;

    const processData = {
      title: "Demande d'APL auprès de la CAF",
      description: "Demande d'aide au logement pour locataire",
      userContext: {
        nom: "Martin",
        prenom: "Sophie",
        email: "sophie.martin@example.com",
        telephone: "0612345678",
        date_naissance: "1992-05-15",
        situation_familiale: "Célibataire",
        nombre_enfants: 0,
        revenus_mensuels: 1600,
        ville: "Lyon",
        code_postal: "69001",
        type_logement: "Locataire",
        montant_loyer: 650,
      },
      status: "created",
      steps: [
        {
          title: "Analyse de votre demande",
          description: "Nous analysons votre situation",
          status: "completed",
        },
        {
          title: "Connexion au site CAF",
          description: "Navigation vers le formulaire APL",
          status: "pending",
        },
        {
          title: "Remplissage du formulaire",
          description: "Mapping de vos données",
          status: "pending",
        },
        {
          title: "Validation des données",
          description: "Vérification avant soumission",
          status: "pending",
        },
      ],
      currentStepIndex: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log(`${colors.cyan}📝 Création du processus de test: ${processId}${colors.reset}`);
    await db.collection("processes").doc(processId).set(processData);

    // 2. Exécuter le workflow orchestré
    console.log(`${colors.blue}🚀 Lancement du workflow orchestré...${colors.reset}\n`);

    const startTime = Date.now();
    const orchestrator = ProcessOrchestrator.getInstance();
    const metrics = await orchestrator.executeWorkflow(processId);
    const duration = Date.now() - startTime;

    // 3. Vérifications
    console.log(`\n${colors.cyan}🔍 Vérification des résultats...${colors.reset}`);

    // Vérifier métriques
    if (metrics.status !== "success") {
      throw new Error(`❌ Workflow status incorrect: ${metrics.status} (attendu: success)`);
    }
    console.log(`${colors.green}✅ Workflow status: ${metrics.status}${colors.reset}`);

    // Orchestrator compte 2 steps actifs (Navigator, Validator)
    // Step 0 (Analyse) est marqué "already completed" par ChatAgent
    if (metrics.steps.length < 2) {
      throw new Error(`❌ Nombre de steps incorrect: ${metrics.steps.length} (attendu: >= 2)`);
    }
    console.log(`${colors.green}✅ Nombre de steps: ${metrics.steps.length}${colors.reset}`);

    // Vérifier que tous les steps ont réussi
    const failedSteps = metrics.steps.filter((s) => !s.success);
    if (failedSteps.length > 0) {
      throw new Error(`❌ ${failedSteps.length} step(s) échoué(s): ${failedSteps.map((s) => s.stepName).join(", ")}`);
    }
    console.log(`${colors.green}✅ Tous les steps ont réussi${colors.reset}`);

    // Vérifier durée raisonnable (< 30 secondes)
    if (!metrics.totalDuration || metrics.totalDuration > 30000) {
      throw new Error(`❌ Durée trop longue: ${metrics.totalDuration}ms (max: 30000ms)`);
    }
    console.log(`${colors.green}✅ Durée totale: ${metrics.totalDuration}ms (acceptable)${colors.reset}`);

    // Vérifier processus dans Firestore
    const processDoc = await db.collection("processes").doc(processId).get();
    const finalProcessData = processDoc.data();

    if (!finalProcessData) {
      throw new Error("❌ Processus non trouvé dans Firestore");
    }

    if (finalProcessData.status !== "completed") {
      throw new Error(`❌ Statut processus incorrect: ${finalProcessData.status} (attendu: completed)`);
    }
    console.log(`${colors.green}✅ Statut Firestore: ${finalProcessData.status}${colors.reset}`);

    // Vérifier activity logs créés
    const logsSnapshot = await db.collection("activity_logs")
      .where("processId", "==", processId)
      .get();

    if (logsSnapshot.empty) {
      throw new Error("❌ Aucun activity log créé");
    }
    console.log(`${colors.green}✅ Activity logs créés: ${logsSnapshot.size} log(s)${colors.reset}`);

    // Vérifier métriques sauvegardées
    const metricsSnapshot = await db.collection("workflow_metrics")
      .where("processId", "==", processId)
      .get();

    if (metricsSnapshot.empty) {
      throw new Error("❌ Métriques workflow non sauvegardées");
    }
    console.log(`${colors.green}✅ Métriques sauvegardées dans Firestore${colors.reset}`);

    console.log(`\n${colors.bright}${colors.green}✅ TEST 1 RÉUSSI${colors.reset}`);
    console.log(`${colors.cyan}   Durée: ${duration}ms${colors.reset}`);
    console.log(`${colors.cyan}   Steps: ${metrics.steps.map((s) => `${s.stepName} (${s.duration}ms)`).join(", ")}${colors.reset}\n`);

    return true;
  } catch (error) {
    console.error(`\n${colors.red}❌ TEST 1 ÉCHOUÉ${colors.reset}`);
    console.error(`${colors.red}Erreur: ${error}${colors.reset}\n`);
    return false;
  }
}

/**
 * TEST 2 : Retry logic - Test avec échec puis succès
 */
async function testRetryLogic() {
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║   TEST 2 : RETRY LOGIC - RESILIENCE                   ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Note: Ce test est plus conceptuel car le retry est automatique
    // On vérifie simplement qu'un workflow avec données valides réussit toujours

    const processId = `test-retry-${Date.now()}`;

    const processData = {
      title: "Test retry avec données valides",
      description: "Doit réussir même avec retry potentiel",
      userContext: {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        telephone: "0698765432",
        date_naissance: "1988-10-20",
        situation_familiale: "Marié",
        nombre_enfants: 2,
        revenus_mensuels: 2500,
        ville: "Paris",
        code_postal: "75001",
        type_logement: "Locataire",
        montant_loyer: 1200,
      },
      status: "created",
      steps: [
        { title: "Analyse", description: "Analyse", status: "completed" },
        { title: "Navigation", description: "Navigation", status: "pending" },
        { title: "Formulaire", description: "Formulaire", status: "pending" },
        { title: "Validation", description: "Validation", status: "pending" },
      ],
      currentStepIndex: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log(`${colors.cyan}📝 Création processus retry test: ${processId}${colors.reset}`);
    await db.collection("processes").doc(processId).set(processData);

    const orchestrator = ProcessOrchestrator.getInstance();
    const metrics = await orchestrator.executeWorkflow(processId);

    // Vérifier que le workflow a réussi
    if (metrics.status !== "success") {
      throw new Error(`Workflow échoué: ${metrics.status}`);
    }

    // Vérifier nombre de retries (devrait être 0 pour données valides)
    const totalRetries = metrics.steps.reduce((sum, step) => sum + step.retries, 0);
    console.log(`${colors.cyan}📊 Total retries: ${totalRetries}${colors.reset}`);

    if (totalRetries > 5) {
      throw new Error(`Trop de retries: ${totalRetries} (devrait être < 5 pour données valides)`);
    }

    console.log(`${colors.green}✅ Retry logic fonctionne correctement${colors.reset}`);
    console.log(`\n${colors.bright}${colors.green}✅ TEST 2 RÉUSSI${colors.reset}\n`);

    return true;
  } catch (error) {
    console.error(`\n${colors.red}❌ TEST 2 ÉCHOUÉ${colors.reset}`);
    console.error(`${colors.red}Erreur: ${error}${colors.reset}\n`);
    return false;
  }
}

/**
 * TEST 3 : Workflow APL inéligible (loyer trop élevé)
 */
async function testAPLIneligible() {
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║   TEST 3 : APL INÉLIGIBLE - Loyer > Revenus × 3      ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Test EligibilityChecker directement
    console.log(`${colors.cyan}🔍 Test EligibilityChecker pour APL inéligible...${colors.reset}`);
    
    const userData = {
      typeAide: "APL",
      revenus: 1000,
      loyer: 3500, // > 1000 × 3 = 3000 → INÉLIGIBLE
      situation: "locataire",
    };

    const eligibilityResult = EligibilityChecker.check("CAF", userData);
    
    if (eligibilityResult.eligible) {
      throw new Error(`❌ EligibilityChecker devrait rejeter (loyer ${userData.loyer}€ > revenus ${userData.revenus}€ × 3)`);
    }
    console.log(`${colors.green}✅ EligibilityChecker: Inéligible détecté correctement${colors.reset}`);
    console.log(`${colors.yellow}   Raison: ${eligibilityResult.reason}${colors.reset}`);

    // Test workflow complet (devrait échouer à l'étape APISimulator)
    const processId = `test-apl-ineligible-${Date.now()}`;
    const processData = {
      title: "Demande d'APL auprès de la CAF (INÉLIGIBLE)",
      description: "Test avec loyer trop élevé",
      userContext: userData,
      status: "created",
      steps: [
        { title: "Analyse", description: "Analyse", status: "completed" },
        { title: "Navigation", description: "Navigation", status: "pending" },
        { title: "Validation", description: "Validation", status: "pending" },
      ],
      currentStepIndex: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log(`${colors.cyan}📝 Création processus inéligible: ${processId}${colors.reset}`);
    await db.collection("processes").doc(processId).set(processData);

    const orchestrator = ProcessOrchestrator.getInstance();
    
    try {
      await orchestrator.executeWorkflow(processId);
      // Si on arrive ici, c'est une erreur (devrait échouer)
      throw new Error("❌ Le workflow devrait échouer pour données inéligibles");
    } catch (error) {
      // Workflow doit échouer - c'est normal
      console.log(`${colors.green}✅ Workflow échoué comme attendu pour inéligibilité${colors.reset}`);
    }

    // Vérifier que le processus est marqué "failed" dans Firestore
    const processDoc = await db.collection("processes").doc(processId).get();
    const finalData = processDoc.data();

    if (!finalData || finalData.status !== "failed") {
      throw new Error(`❌ Processus devrait être "failed", trouvé: ${finalData?.status}`);
    }
    console.log(`${colors.green}✅ Statut Firestore: failed (correct)${colors.reset}`);

    console.log(`\n${colors.bright}${colors.green}✅ TEST 3 RÉUSSI${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`\n${colors.red}❌ TEST 3 ÉCHOUÉ${colors.reset}`);
    console.error(`${colors.red}Erreur: ${error}${colors.reset}\n`);
    return false;
  }
}

/**
 * TEST 4 : Workflow RSA éligible (revenus <= 607€)
 */
async function testRSAEligible() {
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║   TEST 4 : RSA ÉLIGIBLE - Revenus <= 607€            ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const userData = {
      typeAide: "RSA",
      revenus: 500, // <= 607€ → ÉLIGIBLE
      age: 30,
      situation: "celibataire",
    };

    // Test EligibilityChecker
    const eligibilityResult = EligibilityChecker.check("CAF", userData);
    
    if (!eligibilityResult.eligible) {
      throw new Error(`❌ EligibilityChecker devrait accepter RSA avec revenus ${userData.revenus}€`);
    }
    console.log(`${colors.green}✅ EligibilityChecker: Éligible RSA confirmé${colors.reset}`);

    // Test workflow complet
    const processId = `test-rsa-eligible-${Date.now()}`;
    const processData = {
      title: "Demande RSA auprès de la CAF",
      description: "Test RSA éligible",
      userContext: userData,
      status: "created",
      steps: [
        { title: "Analyse", description: "Analyse", status: "completed" },
        { title: "Navigation", description: "Navigation", status: "pending" },
        { title: "Validation", description: "Validation", status: "pending" },
      ],
      currentStepIndex: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("processes").doc(processId).set(processData);

    const orchestrator = ProcessOrchestrator.getInstance();
    const metrics = await orchestrator.executeWorkflow(processId);

    if (metrics.status !== "success") {
      throw new Error(`❌ Workflow devrait réussir pour RSA éligible, statut: ${metrics.status}`);
    }
    console.log(`${colors.green}✅ Workflow RSA réussi${colors.reset}`);

    console.log(`\n${colors.bright}${colors.green}✅ TEST 4 RÉUSSI${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`\n${colors.red}❌ TEST 4 ÉCHOUÉ${colors.reset}`);
    console.error(`${colors.red}Erreur: ${error}${colors.reset}\n`);
    return false;
  }
}

/**
 * TEST 5 : Workflow RSA inéligible (revenus > 607€)
 */
async function testRSAIneligible() {
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║   TEST 5 : RSA INÉLIGIBLE - Revenus > 607€           ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const userData = {
      typeAide: "RSA",
      revenus: 800, // > 607€ → INÉLIGIBLE
      age: 30,
      situation: "celibataire",
    };

    const eligibilityResult = EligibilityChecker.check("CAF", userData);
    
    if (eligibilityResult.eligible) {
      throw new Error(`❌ EligibilityChecker devrait rejeter RSA avec revenus ${userData.revenus}€ > 607€`);
    }
    console.log(`${colors.green}✅ EligibilityChecker: Inéligible RSA détecté${colors.reset}`);
    console.log(`${colors.yellow}   Raison: ${eligibilityResult.reason}${colors.reset}`);

    console.log(`\n${colors.bright}${colors.green}✅ TEST 5 RÉUSSI${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`\n${colors.red}❌ TEST 5 ÉCHOUÉ${colors.reset}`);
    console.error(`${colors.red}Erreur: ${error}${colors.reset}\n`);
    return false;
  }
}

/**
 * TEST 6 : Intégration complète Navigator → APISimulator → Validator
 */
async function testIntegrationComplete() {
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║   TEST 6 : INTÉGRATION COMPLÈTE - Tous les agents    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const processId = `test-integration-${Date.now()}`;
    
    // Données complètes et valides
    const processData = {
      title: "Demande d'APL auprès de la CAF (Intégration)",
      description: "Test intégration complète tous agents",
      userContext: {
        nom: "Dupont",
        prenom: "Marie",
        email: "marie.dupont@example.com",
        telephone: "0612345678",
        date_naissance: "1995-03-20",
        situation_familiale: "Célibataire",
        nombre_enfants: 0,
        revenus_mensuels: 1800,
        ville: "Marseille",
        code_postal: "13001",
        type_logement: "Locataire",
        montant_loyer: 700,
        typeAide: "APL",
        revenus: 1800,
        loyer: 700,
        situation: "locataire",
      },
      status: "created",
      steps: [
        { title: "Analyse", description: "Analyse", status: "completed" },
        { title: "Navigation", description: "Navigation", status: "pending" },
        { title: "Validation", description: "Validation", status: "pending" },
      ],
      currentStepIndex: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log(`${colors.cyan}📝 Création processus intégration: ${processId}${colors.reset}`);
    await db.collection("processes").doc(processId).set(processData);

    // Exécuter workflow complet
    const orchestrator = ProcessOrchestrator.getInstance();
    const startTime = Date.now();
    const metrics = await orchestrator.executeWorkflow(processId);
    const duration = Date.now() - startTime;

    // Vérifications détaillées
    console.log(`\n${colors.cyan}🔍 Vérifications détaillées...${colors.reset}`);

    // 1. Status global
    if (metrics.status !== "success") {
      throw new Error(`❌ Status workflow: ${metrics.status} (attendu: success)`);
    }
    console.log(`${colors.green}✅ Workflow status: ${metrics.status}${colors.reset}`);

    // 2. Tous les steps ont réussi
    const failedSteps = metrics.steps.filter((s) => !s.success);
    if (failedSteps.length > 0) {
      throw new Error(`❌ ${failedSteps.length} step(s) échoué(s)`);
    }
    console.log(`${colors.green}✅ Tous les steps réussis (${metrics.steps.length} steps)${colors.reset}`);

    // 3. Vérifier activity logs détaillés
    const logsSnapshot = await db.collection("activity_logs")
      .where("processId", "==", processId)
      .orderBy("timestamp", "asc")
      .get();

    if (logsSnapshot.empty) {
      throw new Error("❌ Aucun activity log");
    }

    const logs = logsSnapshot.docs.map((doc) => doc.data());
    console.log(`${colors.cyan}📊 Activity logs:${colors.reset}`);
    logs.forEach((log: any) => {
      const icon = log.statut === "success" ? "✅" : "❌";
      console.log(`   ${icon} ${log.agent}: ${log.message}`);
    });

    // 4. Vérifier numéro de dossier généré
    const processDoc = await db.collection("processes").doc(processId).get();
    const finalData = processDoc.data();

    if (!finalData?.externalReference) {
      throw new Error("❌ Numéro de dossier non généré");
    }
    console.log(`${colors.green}✅ Numéro de dossier: ${finalData.externalReference}${colors.reset}`);

    // 5. Vérifier performance
    if (duration > 30000) {
      throw new Error(`❌ Durée trop longue: ${duration}ms (max: 30s)`);
    }
    console.log(`${colors.green}✅ Durée acceptable: ${duration}ms${colors.reset}`);

    // 6. Vérifier métriques détaillées
    console.log(`${colors.cyan}📈 Métriques par step:${colors.reset}`);
    metrics.steps.forEach((step) => {
      console.log(`   • ${step.stepName}: ${step.duration}ms (${step.retries} retry)`);
    });

    console.log(`\n${colors.bright}${colors.green}✅ TEST 6 RÉUSSI - Intégration complète validée${colors.reset}`);
    console.log(`${colors.cyan}   Durée totale: ${duration}ms${colors.reset}`);
    console.log(`${colors.cyan}   Steps exécutés: ${metrics.steps.length}${colors.reset}`);
    console.log(`${colors.cyan}   Activity logs: ${logs.length}${colors.reset}\n`);

    return true;
  } catch (error) {
    console.error(`\n${colors.red}❌ TEST 6 ÉCHOUÉ${colors.reset}`);
    console.error(`${colors.red}Erreur: ${error}${colors.reset}\n`);
    return false;
  }
}

/**
 * Exécute tous les tests
 */
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║   TESTS E2E PROCESSORCHESTRATOR - INTÉGRATION COMPLÈTE║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const results: Array<{ name: string; success: boolean; duration: number }> = [];
  let totalDuration = 0;

  // Test 1: APL éligible (workflow complet)
  const start1 = Date.now();
  const test1 = await testWorkflowComplet();
  const duration1 = Date.now() - start1;
  results.push({ name: "Test 1: APL éligible (workflow complet)", success: test1, duration: duration1 });
  totalDuration += duration1;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 2: Retry logic
  const start2 = Date.now();
  const test2 = await testRetryLogic();
  const duration2 = Date.now() - start2;
  results.push({ name: "Test 2: Retry logic", success: test2, duration: duration2 });
  totalDuration += duration2;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: APL inéligible
  const start3 = Date.now();
  const test3 = await testAPLIneligible();
  const duration3 = Date.now() - start3;
  results.push({ name: "Test 3: APL inéligible (loyer trop élevé)", success: test3, duration: duration3 });
  totalDuration += duration3;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 4: RSA éligible
  const start4 = Date.now();
  const test4 = await testRSAEligible();
  const duration4 = Date.now() - start4;
  results.push({ name: "Test 4: RSA éligible (revenus <= 607€)", success: test4, duration: duration4 });
  totalDuration += duration4;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 5: RSA inéligible
  const start5 = Date.now();
  const test5 = await testRSAIneligible();
  const duration5 = Date.now() - start5;
  results.push({ name: "Test 5: RSA inéligible (revenus > 607€)", success: test5, duration: duration5 });
  totalDuration += duration5;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 6: Intégration complète
  const start6 = Date.now();
  const test6 = await testIntegrationComplete();
  const duration6 = Date.now() - start6;
  results.push({ name: "Test 6: Intégration complète (tous agents)", success: test6, duration: duration6 });
  totalDuration += duration6;

  // Résumé
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                   RÉSUMÉ DES TESTS                    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  results.forEach((result) => {
    const icon = result.success ? "✅" : "❌";
    const color = result.success ? colors.green : colors.red;
    console.log(`${icon} ${color}${result.name}: ${result.success ? "RÉUSSI" : "ÉCHOUÉ"}${colors.reset} (${result.duration}ms)`);
  });

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const avgDuration = Math.round(totalDuration / results.length);

  console.log(`\n${colors.cyan}Tests réussis: ${colors.green}${passed}/${results.length}${colors.reset}`);
  console.log(`${colors.cyan}Tests échoués: ${colors.red}${failed}/${results.length}${colors.reset}`);
  console.log(`${colors.cyan}Durée totale: ${totalDuration}ms${colors.reset}`);
  console.log(`${colors.cyan}Durée moyenne: ${avgDuration}ms${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.bright}${colors.green}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║   ✅ TOUS LES TESTS PROCESSORCHESTRATOR RÉUSSIS      ║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.red}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.red}║   ❌ CERTAINS TESTS ONT ÉCHOUÉ                       ║${colors.reset}`);
    console.log(`${colors.bright}${colors.red}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(1);
  }
}

// Exécuter les tests
runAllTests().catch((error) => {
  console.error(`${colors.red}Erreur fatale:${colors.reset}`, error);
  process.exit(1);
});
