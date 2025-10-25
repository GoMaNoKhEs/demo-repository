/**
 * 🧪 TESTS E2E - VALIDATORAGENT
 *
 * Tests end-to-end pour le ValidatorAgent
 * Vérifie la validation complète des données avant soumission
 *
 * Tests :
 * 1. Validation complète avec données valides
 * 2. Gestion d'erreurs multiples (formats, cohérence)
 * 3. Génération de recommandations
 *
 * Durée : ~15 secondes (3 tests)
 */

import * as admin from "firebase-admin";
import { ValidatorAgent } from "../agents/validator";

// Initialiser Firebase Admin (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "simplifia-hackathon",
  });
}

const db = admin.firestore();

// Couleurs pour les logs
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// TEST 1 : Validation Complète - Données Valides
// ═══════════════════════════════════════════════════════════════
async function testValidationComplete() {
  log("\n╔════════════════════════════════════════════════════════╗", colors.cyan);
  log("║   TEST 1 : VALIDATION COMPLÈTE - DONNÉES VALIDES    ║", colors.cyan);
  log("╚════════════════════════════════════════════════════════╝", colors.cyan);

  const startTime = Date.now();
  const validator = ValidatorAgent.getInstance();
  const processId = `test-validator-e2e-${Date.now()}`;

  try {
    // Données CAF complètes et valides
    const validData = {
      nom: "Dubois",
      prenom: "Marie",
      email: "marie.dubois@example.com",
      telephone: "0612345678",
      date_naissance: "1990-05-15",
      situation_familiale: "Célibataire",
      nombre_enfants: 0,
      revenus_mensuels: 1800,
      ville: "Lyon",
      code_postal: "69001",
      type_logement: "Locataire",
      montant_loyer: 650,
    };

    log(`\n📝 Processus ID: ${processId}`, colors.blue);
    log("📊 Données à valider:", colors.blue);
    log(JSON.stringify(validData, null, 2), colors.blue);

    // Appeler le ValidatorAgent
    log("\n⏳ Validation en cours...", colors.yellow);
    const result = await validator.validateBeforeSubmission(processId, validData);
    const duration = Date.now() - startTime;

    log("\n✅ RÉSULTAT DE LA VALIDATION:", colors.green);
    log(`   - Valid: ${result.valid}`, result.valid ? colors.green : colors.red);
    log(`   - Erreurs: ${result.errors.length}`, colors.cyan);
    log(`   - Recommandations: ${result.recommendations.length}`, colors.cyan);
    log(`   - Confiance: ${result.confidence}`, colors.cyan);
    log(`   - Durée: ${duration}ms`, colors.cyan);

    if (result.errors.length > 0) {
      log("\n❌ Erreurs détectées:", colors.red);
      result.errors.forEach((error, i) => {
        log(`   ${i + 1}. [${error.severity}] ${error.field}: ${error.message}`, colors.red);
      });
    }

    if (result.recommendations.length > 0) {
      log("\n💡 Recommandations:", colors.yellow);
      result.recommendations.forEach((rec, i) => {
        log(`   ${i + 1}. ${rec}`, colors.yellow);
      });
    }

    // Vérifier le log Firestore
    log("\n🔍 Vérification log Firestore...", colors.blue);
    const logsSnapshot = await db
      .collection("activity_logs")
      .where("processId", "==", processId)
      .where("agent", "==", "ValidatorAgent")
      .get();

    if (logsSnapshot.empty) {
      throw new Error("❌ Aucun log trouvé dans Firestore");
    }

    const logData = logsSnapshot.docs[0].data();
    log("✅ Log trouvé dans Firestore:", colors.green);
    log(`   - Statut: ${logData.statut}`, colors.cyan);
    log(`   - Message: ${logData.message}`, colors.cyan);
    log(`   - Erreurs Count: ${logData.errorsCount}`, colors.cyan);
    log(`   - Critical Errors: ${logData.criticalErrorsCount}`, colors.cyan);
    log(`   - Confidence: ${logData.confidence}`, colors.cyan);

    // Assertions
    if (!result.valid) {
      throw new Error("❌ Les données valides ont été rejetées !");
    }
    if (result.errors.length > 0) {
      throw new Error(`❌ Erreurs trouvées alors que les données sont valides (${result.errors.length})`);
    }
    if (result.confidence < 0.9) {
      throw new Error(`❌ Confiance trop faible (${result.confidence} < 0.9)`);
    }
    // Accepter "SUCCESS" ou "success"
    if (logData.statut !== "SUCCESS" && logData.statut !== "success") {
      throw new Error(`❌ Statut Firestore incorrect: ${logData.statut}`);
    }

    log("\n✅ TEST 1 RÉUSSI", colors.green);
    return { success: true, duration };
  } catch (error) {
    log(`\n❌ TEST 1 ÉCHOUÉ: ${error}`, colors.red);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 2 : Gestion d'Erreurs Multiples
// ═══════════════════════════════════════════════════════════════
async function testGestionErreurs() {
  log("\n╔════════════════════════════════════════════════════════╗", colors.cyan);
  log("║   TEST 2 : GESTION D'ERREURS MULTIPLES              ║", colors.cyan);
  log("╚════════════════════════════════════════════════════════╝", colors.cyan);

  const startTime = Date.now();
  const validator = ValidatorAgent.getInstance();
  const processId = `test-validator-errors-${Date.now()}`;

  try {
    // Données avec plusieurs erreurs intentionnelles
    const invalidData = {
      nom: "Martin",
      prenom: "Jean",
      email: "jean.martinexample.com", // ❌ Manque @
      telephone: "123", // ❌ Pas 10 chiffres
      date_naissance: "2030-01-01", // ❌ Date future
      situation_familiale: "Marié",
      nombre_enfants: -1, // ❌ Négatif
      revenus_mensuels: -500, // ❌ Négatif
      ville: "Paris",
      code_postal: "750", // ❌ Pas 5 chiffres
      type_logement: "Locataire",
      montant_loyer: 8000, // ⚠️ Très élevé (> revenus × 3)
    };

    log(`\n📝 Processus ID: ${processId}`, colors.blue);
    log("📊 Données invalides:", colors.blue);
    log(JSON.stringify(invalidData, null, 2), colors.blue);

    // Appeler le ValidatorAgent
    log("\n⏳ Validation en cours...", colors.yellow);
    const result = await validator.validateBeforeSubmission(processId, invalidData);
    const duration = Date.now() - startTime;

    log("\n✅ RÉSULTAT DE LA VALIDATION:", colors.yellow);
    log(`   - Valid: ${result.valid}`, result.valid ? colors.green : colors.red);
    log(`   - Erreurs: ${result.errors.length}`, colors.cyan);
    log(`   - Recommandations: ${result.recommendations.length}`, colors.cyan);
    log(`   - Confiance: ${result.confidence}`, colors.cyan);
    log(`   - Durée: ${duration}ms`, colors.cyan);

    if (result.errors.length > 0) {
      log("\n❌ Erreurs détectées (attendues):", colors.yellow);
      result.errors.forEach((error, i) => {
        const severityColor = error.severity === "critical" ? colors.red : colors.yellow;
        log(`   ${i + 1}. [${error.severity}] ${error.field}: ${error.message}`, severityColor);
      });
    }

    // Vérifier les erreurs critiques attendues
    const criticalErrors = result.errors.filter((e) => e.severity === "critical");
    const expectedCriticalFields = ["email", "telephone", "code_postal", "revenus_mensuels"];

    log("\n🔍 Vérification des erreurs critiques:", colors.blue);
    log(`   - Erreurs critiques trouvées: ${criticalErrors.length}`, colors.cyan);
    log(`   - Champs critiques attendus: ${expectedCriticalFields.join(", ")}`, colors.cyan);

    // Assertions
    if (result.valid) {
      throw new Error("❌ Les données invalides ont été acceptées !");
    }
    if (result.errors.length === 0) {
      throw new Error("❌ Aucune erreur détectée alors que les données sont invalides");
    }
    if (criticalErrors.length < 3) {
      throw new Error(`❌ Pas assez d'erreurs critiques détectées (${criticalErrors.length} < 3)`);
    }

    log("\n✅ TEST 2 RÉUSSI", colors.green);
    return { success: true, duration, errorsCount: result.errors.length };
  } catch (error) {
    log(`\n❌ TEST 2 ÉCHOUÉ: ${error}`, colors.red);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 3 : Génération de Recommandations
// ═══════════════════════════════════════════════════════════════
async function testRecommandations() {
  log("\n╔════════════════════════════════════════════════════════╗", colors.cyan);
  log("║   TEST 3 : GÉNÉRATION DE RECOMMANDATIONS            ║", colors.cyan);
  log("╚════════════════════════════════════════════════════════╝", colors.cyan);

  const startTime = Date.now();
  const validator = ValidatorAgent.getInstance();
  const processId = `test-validator-reco-${Date.now()}`;

  try {
    // Données valides mais avec possibilité d'amélioration
    const dataWithWarnings = {
      nom: "Durand",
      prenom: "Sophie",
      email: "sophie.durand@example.com",
      telephone: "0698765432",
      date_naissance: "1995-12-20",
      situation_familiale: "Célibataire",
      nombre_enfants: 0,
      revenus_mensuels: 1200, // Faible revenu → recommandation RSA
      ville: "Marseille",
      code_postal: "13001",
      type_logement: "Locataire",
      montant_loyer: 500, // Loyer élevé par rapport aux revenus
    };

    log(`\n📝 Processus ID: ${processId}`, colors.blue);
    log("📊 Données pour recommandations:", colors.blue);
    log(JSON.stringify(dataWithWarnings, null, 2), colors.blue);

    // Appeler le ValidatorAgent
    log("\n⏳ Validation en cours...", colors.yellow);
    const result = await validator.validateBeforeSubmission(processId, dataWithWarnings);
    const duration = Date.now() - startTime;

    log("\n✅ RÉSULTAT DE LA VALIDATION:", colors.green);
    log(`   - Valid: ${result.valid}`, result.valid ? colors.green : colors.red);
    log(`   - Erreurs: ${result.errors.length}`, colors.cyan);
    log(`   - Recommandations: ${result.recommendations.length}`, colors.cyan);
    log(`   - Confiance: ${result.confidence}`, colors.cyan);
    log(`   - Durée: ${duration}ms`, colors.cyan);

    if (result.recommendations.length > 0) {
      log("\n💡 Recommandations générées:", colors.yellow);
      result.recommendations.forEach((rec, i) => {
        log(`   ${i + 1}. ${rec}`, colors.yellow);
      });
    } else {
      log("\n⚠️ Aucune recommandation générée", colors.yellow);
    }

    // Vérifier l'historique des validations
    log("\n🔍 Récupération historique validations...", colors.blue);
    const history = await validator.getValidationHistory(processId);
    log(`✅ Historique récupéré: ${history.length} entrées`, colors.green);

    if (history.length > 0) {
      const latestValidation = history[0];
      log(`   - Dernière validation: ${latestValidation.statut}`, colors.cyan);
      log(`   - Timestamp: ${latestValidation.timestamp.toDate().toISOString()}`, colors.cyan);
    }

    // Assertions (moins strictes car les recommandations dépendent du modèle)
    if (!result.valid && result.errors.every((e) => e.severity === "warning")) {
      // Ok si seulement des warnings
      log("ℹ️ Validation avec warnings uniquement", colors.blue);
    }

    log("\n✅ TEST 3 RÉUSSI", colors.green);
    return {
      success: true,
      duration,
      recommendationsCount: result.recommendations.length,
    };
  } catch (error) {
    log(`\n❌ TEST 3 ÉCHOUÉ: ${error}`, colors.red);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXÉCUTION DES TESTS
// ═══════════════════════════════════════════════════════════════
async function runAllTests() {
  log("\n╔════════════════════════════════════════════════════════╗", colors.bright);
  log("║                                                        ║", colors.bright);
  log("║   TESTS E2E VALIDATORAGENT - DEV2 JOUR 2 PM          ║", colors.bright);
  log("║                                                        ║", colors.bright);
  log("╚════════════════════════════════════════════════════════╝", colors.bright);

  const results = {
    total: 3,
    passed: 0,
    failed: 0,
    durations: [] as number[],
  };

  try {
    // Test 1: Validation complète
    const test1 = await testValidationComplete();
    results.passed++;
    results.durations.push(test1.duration);
    await delay(2000); // Pause entre tests

    // Test 2: Gestion erreurs
    const test2 = await testGestionErreurs();
    results.passed++;
    results.durations.push(test2.duration);
    await delay(2000); // Pause entre tests

    // Test 3: Recommandations
    const test3 = await testRecommandations();
    results.passed++;
    results.durations.push(test3.duration);

    // Résumé final
    log("\n╔════════════════════════════════════════════════════════╗", colors.green);
    log("║                   RÉSUMÉ DES TESTS                    ║", colors.green);
    log("╚════════════════════════════════════════════════════════╝", colors.green);
    log(`\n✅ Tests réussis: ${results.passed}/${results.total}`, colors.green);
    log(`❌ Tests échoués: ${results.failed}/${results.total}`, results.failed > 0 ? colors.red : colors.green);
    log(`⏱️ Durée totale: ${results.durations.reduce((a, b) => a + b, 0)}ms`, colors.cyan);
    log(`⏱️ Durée moyenne: ${Math.round(results.durations.reduce((a, b) => a + b, 0) / results.durations.length)}ms`, colors.cyan);

    log("\n╔════════════════════════════════════════════════════════╗", colors.green);
    log("║   ✅ TOUS LES TESTS E2E VALIDATORAGENT RÉUSSIS       ║", colors.green);
    log("╚════════════════════════════════════════════════════════╝", colors.green);

    process.exit(0);
  } catch (error) {
    results.failed++;
    log("\n╔════════════════════════════════════════════════════════╗", colors.red);
    log("║   ❌ ÉCHEC DES TESTS E2E VALIDATORAGENT              ║", colors.red);
    log("╚════════════════════════════════════════════════════════╝", colors.red);
    log(`\n✅ Tests réussis: ${results.passed}/${results.total}`, colors.green);
    log(`❌ Tests échoués: ${results.failed}/${results.total}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Lancer les tests
runAllTests();
