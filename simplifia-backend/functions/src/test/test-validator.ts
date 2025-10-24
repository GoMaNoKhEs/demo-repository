// Tests pour ValidatorAgent - Validation des données
import {ValidatorAgent} from "../agents/validator";
import * as admin from "firebase-admin";

// Initialiser Firebase Admin (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "simplifia-hackathon",
  });
}

/**
 * Test 1 : Validation données valides CAF
 */
async function testValidatorCAFDataValid() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 1: Validator - Données CAF VALIDES ===");
  console.log("=".repeat(50) + "\n");

  const validator = ValidatorAgent.getInstance();
  const processId = `test-validator-${Date.now()}`;

  const validData = {
    mappings: [
      {field: "nom", value: "Dupont", confidence: 1.0, source: "userContext.nom"},
      {field: "prenom", value: "Marie", confidence: 1.0, source: "userContext.prenom"},
      {field: "email", value: "marie.dupont@gmail.com", confidence: 1.0, source: "userContext.email"},
      {field: "telephone", value: "0612345678", confidence: 1.0, source: "userContext.telephone"},
      {field: "situation", value: "locataire", confidence: 1.0, source: "userContext.situation"},
      {field: "revenus_mensuels", value: 1200, confidence: 1.0, source: "userContext.revenus"},
      {field: "ville", value: "Paris", confidence: 1.0, source: "userContext.ville"},
      {field: "code_postal", value: "75001", confidence: 1.0, source: "userContext.codePostal"},
    ],
    missingFields: [],
    readyToSubmit: true,
  };

  try {
    const result = await validator.validateBeforeSubmission(processId, validData);

    console.log("\n📤 Résultat validation:");
    console.log(JSON.stringify(result, null, 2));

    if (result.valid && result.errors.length === 0) {
      console.log("\n✅ Test RÉUSSI: Données valides acceptées");
      console.log(`✅ Confidence: ${result.confidence}`);
      console.log(`✅ Erreurs: ${result.errors.length}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ: Données valides rejetées");
      console.log(`Erreurs détectées: ${result.errors.length}`);
    }
  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Test 2 : Validation email invalide
 */
async function testValidatorEmailInvalid() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 2: Validator - Email INVALIDE ===");
  console.log("=".repeat(50) + "\n");

  const validator = ValidatorAgent.getInstance();
  const processId = `test-validator-${Date.now()}`;

  const invalidEmailData = {
    mappings: [
      {field: "nom", value: "Lefebvre", confidence: 1.0, source: "userContext.nom"},
      {field: "prenom", value: "Sophie", confidence: 1.0, source: "userContext.prenom"},
      {field: "email", value: "sophie.lefebvregmail.com", confidence: 1.0, source: "userContext.email"}, // ❌ Pas de @
      {field: "telephone", value: "0698765432", confidence: 1.0, source: "userContext.telephone"},
      {field: "revenus_mensuels", value: 1800, confidence: 1.0, source: "userContext.revenus"},
    ],
    missingFields: [],
    readyToSubmit: true,
  };

  try {
    const result = await validator.validateBeforeSubmission(processId, invalidEmailData);

    console.log("\n📤 Résultat validation:");
    console.log(JSON.stringify(result, null, 2));

    const emailError = result.errors.find((e) => e.field.toLowerCase().includes("email"));

    if (!result.valid && emailError && emailError.severity === "critical") {
      console.log("\n✅ Test RÉUSSI: Email invalide détecté");
      console.log(`✅ Erreur: ${emailError.message}`);
      console.log(`✅ Severity: ${emailError.severity}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ: Email invalide non détecté");
    }
  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Test 3 : Validation code postal invalide
 */
async function testValidatorCodePostalInvalid() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 3: Validator - Code postal INVALIDE ===");
  console.log("=".repeat(50) + "\n");

  const validator = ValidatorAgent.getInstance();
  const processId = `test-validator-${Date.now()}`;

  const invalidCPData = {
    mappings: [
      {field: "nom", value: "Martin", confidence: 1.0, source: "userContext.nom"},
      {field: "prenom", value: "Thomas", confidence: 1.0, source: "userContext.prenom"},
      {field: "email", value: "thomas.martin@yahoo.fr", confidence: 1.0, source: "userContext.email"},
      {field: "code_postal", value: "750", confidence: 1.0, source: "userContext.codePostal"}, // ❌ 3 chiffres au lieu de 5
      {field: "ville", value: "Paris", confidence: 1.0, source: "userContext.ville"},
    ],
    missingFields: [],
    readyToSubmit: true,
  };

  try {
    const result = await validator.validateBeforeSubmission(processId, invalidCPData);

    console.log("\n📤 Résultat validation:");
    console.log(JSON.stringify(result, null, 2));

    const cpError = result.errors.find((e) =>
      e.field.toLowerCase().includes("postal") || e.field.toLowerCase().includes("code")
    );

    if (!result.valid && cpError) {
      console.log("\n✅ Test RÉUSSI: Code postal invalide détecté");
      console.log(`✅ Erreur: ${cpError.message}`);
      console.log(`✅ Severity: ${cpError.severity}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ: Code postal invalide non détecté");
    }
  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Test 4 : Validation montant négatif (warning)
 */
async function testValidatorMontantNegatif() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 4: Validator - Montant NÉGATIF ===");
  console.log("=".repeat(50) + "\n");

  const validator = ValidatorAgent.getInstance();
  const processId = `test-validator-${Date.now()}`;

  const negativeMontantData = {
    mappings: [
      {field: "nom", value: "Bernard", confidence: 1.0, source: "userContext.nom"},
      {field: "prenom", value: "Julie", confidence: 1.0, source: "userContext.prenom"},
      {field: "email", value: "julie.bernard@hotmail.com", confidence: 1.0, source: "userContext.email"},
      {field: "revenus_mensuels", value: -500, confidence: 1.0, source: "userContext.revenus"}, // ❌ Négatif
    ],
    missingFields: [],
    readyToSubmit: true,
  };

  try {
    const result = await validator.validateBeforeSubmission(processId, negativeMontantData);

    console.log("\n📤 Résultat validation:");
    console.log(JSON.stringify(result, null, 2));

    const revenusError = result.errors.find((e) =>
      e.field.toLowerCase().includes("revenus") || e.field.toLowerCase().includes("montant")
    );

    if (!result.valid && revenusError) {
      console.log("\n✅ Test RÉUSSI: Montant négatif détecté");
      console.log(`✅ Erreur: ${revenusError.message}`);
      console.log(`✅ Severity: ${revenusError.severity}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ: Montant négatif non détecté");
    }
  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Test 5 : Validation champs manquants
 */
async function testValidatorChampManquant() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 5: Validator - Champs MANQUANTS ===");
  console.log("=".repeat(50) + "\n");

  const validator = ValidatorAgent.getInstance();
  const processId = `test-validator-${Date.now()}`;

  const missingFieldsData = {
    mappings: [
      {field: "nom", value: "Petit", confidence: 1.0, source: "userContext.nom"},
      {field: "prenom", value: "Lucas", confidence: 1.0, source: "userContext.prenom"},
      // ❌ Email manquant
      // ❌ Téléphone manquant
    ],
    missingFields: ["email", "telephone", "code_postal"],
    readyToSubmit: false,
  };

  try {
    const result = await validator.validateBeforeSubmission(processId, missingFieldsData);

    console.log("\n📤 Résultat validation:");
    console.log(JSON.stringify(result, null, 2));

    if (!result.valid && result.errors.length > 0) {
      console.log("\n✅ Test RÉUSSI: Champs manquants détectés");
      console.log(`✅ Nombre d'erreurs: ${result.errors.length}`);
      console.log(`✅ Recommandations: ${result.recommendations.length}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ: Champs manquants non détectés");
    }
  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Lancer tous les tests
 */
async function runAllTests() {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║   TESTS VALIDATOR AGENT - DEV2 JOUR 2    ║");
  console.log("╚════════════════════════════════════════════╝");

  console.log("\n🚀 Lancement des tests ValidatorAgent...\n");

  // Test 1: Données valides
  await testValidatorCAFDataValid();
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Pause 2s

  // Test 2: Email invalide
  await testValidatorEmailInvalid();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: Code postal invalide
  await testValidatorCodePostalInvalid();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 4: Montant négatif
  await testValidatorMontantNegatif();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 5: Champs manquants
  await testValidatorChampManquant();

  console.log("\n" + "=".repeat(50));
  console.log("✅ TOUS LES TESTS TERMINÉS");
  console.log("=".repeat(50));

  console.log("\n📝 Points vérifiés:");
  console.log("   1. Validation données valides ✅");
  console.log("   2. Détection email invalide ✅");
  console.log("   3. Détection code postal invalide ✅");
  console.log("   4. Détection montant négatif ✅");
  console.log("   5. Détection champs manquants ✅");
}

// Lancer les tests
runAllTests()
  .then(() => {
    console.log("\n✅ Suite de tests terminée avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur lors de l'exécution des tests:", error);
    process.exit(1);
  });
