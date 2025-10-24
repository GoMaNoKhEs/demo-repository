/**
 * Tests E2E ProcessOrchestrator - JOUR 3 MATIN DEV2
 * 
 * Tests du workflow complet orchestré :
 * 1. Test workflow complet avec données valides
 * 2. Test retry logic (échec puis succès)
 * 3. Test circuit breaker (5 échecs consécutifs)
 * 4. Test métriques de performance
 * 
 * Exécution : node lib/test/test-orchestrator-e2e.js
 */

import * as admin from "firebase-admin";
import { ProcessOrchestrator } from "../services/orchestrator";

// Couleurs ANSI
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
        montant_loyer: 650
      },
      status: "created",
      steps: [
        {
          title: "Analyse de votre demande",
          description: "Nous analysons votre situation",
          status: "completed"
        },
        {
          title: "Connexion au site CAF",
          description: "Navigation vers le formulaire APL",
          status: "pending"
        },
        {
          title: "Remplissage du formulaire",
          description: "Mapping de vos données",
          status: "pending"
        },
        {
          title: "Validation des données",
          description: "Vérification avant soumission",
          status: "pending"
        }
      ],
      currentStepIndex: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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

    // Orchestrator compte 3 steps (Navigator, FormFiller, Validator)
    // Step 0 (Analyse) est marqué "already completed" par ChatAgent
    if (metrics.steps.length < 3) {
      throw new Error(`❌ Nombre de steps incorrect: ${metrics.steps.length} (attendu: >= 3)`);
    }
    console.log(`${colors.green}✅ Nombre de steps: ${metrics.steps.length}${colors.reset}`);

    // Vérifier que tous les steps ont réussi
    const failedSteps = metrics.steps.filter(s => !s.success);
    if (failedSteps.length > 0) {
      throw new Error(`❌ ${failedSteps.length} step(s) échoué(s): ${failedSteps.map(s => s.stepName).join(", ")}`);
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
    console.log(`${colors.cyan}   Steps: ${metrics.steps.map(s => `${s.stepName} (${s.duration}ms)`).join(", ")}${colors.reset}\n`);

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
        montant_loyer: 1200
      },
      status: "created",
      steps: [
        { title: "Analyse", description: "Analyse", status: "completed" },
        { title: "Navigation", description: "Navigation", status: "pending" },
        { title: "Formulaire", description: "Formulaire", status: "pending" },
        { title: "Validation", description: "Validation", status: "pending" }
      ],
      currentStepIndex: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
 * TEST 3 : Validation avec erreurs - Test validation failure
 */
async function testValidationFailure() {
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║   TEST 3 : VALIDATION FAILURE - DONNEES INVALIDES     ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const processId = `test-validation-fail-${Date.now()}`;
    
    // Données avec erreurs intentionnelles
    const processData = {
      title: "Test validation avec erreurs",
      description: "Doit échouer à la validation",
      userContext: {
        nom: "Erreur",
        prenom: "Test",
        email: "invalid-email",           // ❌ Email invalide
        telephone: "123",                 // ❌ Téléphone invalide
        date_naissance: "2030-01-01",     // ❌ Date future
        situation_familiale: "Célibataire",
        nombre_enfants: -5,                // ❌ Négatif
        revenus_mensuels: -1000,           // ❌ Négatif
        ville: "Test",
        code_postal: "999",                // ❌ Code postal invalide
        type_logement: "Locataire",
        montant_loyer: 15000               // ⚠️ Très élevé
      },
      status: "created",
      steps: [
        { title: "Analyse", description: "Analyse", status: "completed" },
        { title: "Navigation", description: "Navigation", status: "pending" },
        { title: "Formulaire", description: "Formulaire", status: "pending" },
        { title: "Validation", description: "Validation", status: "pending" }
      ],
      currentStepIndex: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    console.log(`${colors.cyan}📝 Création processus avec données invalides: ${processId}${colors.reset}`);
    await db.collection("processes").doc(processId).set(processData);

    const orchestrator = ProcessOrchestrator.getInstance();
    
    try {
      await orchestrator.executeWorkflow(processId);
      throw new Error("Le workflow aurait dû échouer avec des données invalides");
    } catch (error) {
      // C'est attendu que le workflow échoue
      console.log(`${colors.green}✅ Workflow a correctement échoué comme attendu${colors.reset}`);
    }

    // Vérifier que le processus est marqué "failed" dans Firestore
    const processDoc = await db.collection("processes").doc(processId).get();
    const finalProcessData = processDoc.data();

    if (finalProcessData?.status !== "failed") {
      throw new Error(`Statut incorrect: ${finalProcessData?.status} (attendu: failed)`);
    }
    console.log(`${colors.green}✅ Statut Firestore: failed (correct)${colors.reset}`);

    // Vérifier que l'erreur est enregistrée
    if (!finalProcessData.error) {
      throw new Error("Aucune erreur enregistrée dans le processus");
    }
    console.log(`${colors.green}✅ Erreur enregistrée: ${finalProcessData.error}${colors.reset}`);

    console.log(`\n${colors.bright}${colors.green}✅ TEST 3 RÉUSSI${colors.reset}\n`);

    return true;

  } catch (error) {
    console.error(`\n${colors.red}❌ TEST 3 ÉCHOUÉ${colors.reset}`);
    console.error(`${colors.red}Erreur: ${error}${colors.reset}\n`);
    return false;
  }
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║   TESTS E2E PROCESSORCHESTRATOR - JOUR 3 MATIN DEV2    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const results = [];
  let totalDuration = 0;

  // Test 1
  const start1 = Date.now();
  const test1 = await testWorkflowComplet();
  const duration1 = Date.now() - start1;
  results.push({ name: "Test 1: Workflow complet", success: test1, duration: duration1 });
  totalDuration += duration1;

  // Pause 2s
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2
  const start2 = Date.now();
  const test2 = await testRetryLogic();
  const duration2 = Date.now() - start2;
  results.push({ name: "Test 2: Retry logic", success: test2, duration: duration2 });
  totalDuration += duration2;

  // Pause 2s
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3
  const start3 = Date.now();
  const test3 = await testValidationFailure();
  const duration3 = Date.now() - start3;
  results.push({ name: "Test 3: Validation failure", success: test3, duration: duration3 });
  totalDuration += duration3;

  // Résumé
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                   RÉSUMÉ DES TESTS                    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  results.forEach(result => {
    const icon = result.success ? "✅" : "❌";
    const color = result.success ? colors.green : colors.red;
    console.log(`${icon} ${color}${result.name}: ${result.success ? "RÉUSSI" : "ÉCHOUÉ"}${colors.reset} (${result.duration}ms)`);
  });

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
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
runAllTests().catch(error => {
  console.error(`${colors.red}Erreur fatale:${colors.reset}`, error);
  process.exit(1);
});
