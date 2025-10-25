/**
 * Script de test pour APISimulatorAgent
 *
 * Tests manuels pour vérifier les réponses simulées
 * des différents sites administratifs
 *
 * Usage:
 * cd simplifia-backend/functions
 * npm run build
 * node lib/test/test-api-simulator.js
 */

import { APISimulatorAgent } from "../agents/api-simulator";

// Couleurs pour console
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

/**
 * Test 1: Demande APL à la CAF (succès attendu)
 */
async function testCAFSuccess() {
  console.log(`\n${colors.blue}=== TEST 1: CAF - Demande APL (SUCCÈS) ===${colors.reset}\n`);

  const simulator = new APISimulatorAgent();

  const userData = {
    nom: "Dupont",
    prenom: "Marie",
    situation: "locataire",
    revenus: 1200,
    ville: "Paris",
    codePostal: "75001",
    loyer: 850,
  };

  try {
    const response = await simulator.simulateAPICall("CAF", "/demandes/apl", userData);

    console.log("📥 Données envoyées:", JSON.stringify(userData, null, 2));
    console.log("\n📤 Réponse API simulée:", JSON.stringify(response, null, 2));

    // Vérifications
    if (response.statut === "success") {
      console.log(`\n${colors.green}✅ Test RÉUSSI: Statut = success${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ Test ÉCHOUÉ: Statut attendu = success, reçu = ${response.statut}${colors.reset}`);
    }

    if (response.numeroDossier && response.numeroDossier.startsWith("CAF-2025-")) {
      console.log(`${colors.green}✅ Numéro dossier valide: ${response.numeroDossier}${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Numéro dossier invalide: ${response.numeroDossier}${colors.reset}`);
    }

    if (response.message && response.message.length > 0) {
      console.log(`${colors.green}✅ Message présent: "${response.message}"${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Message manquant${colors.reset}`);
    }

    if (response.delaiEstime) {
      console.log(`${colors.green}✅ Délai estimé: ${response.delaiEstime}${colors.reset}`);
    }

    if (response.prochainEtape) {
      console.log(`${colors.green}✅ Prochaine étape: ${response.prochainEtape}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ ERREUR:${colors.reset}`, error);
  }
}

/**
 * Test 2: Demande APL avec revenus trop élevés (erreur attendue)
 */
async function testCAFError() {
  console.log(`\n${colors.blue}=== TEST 2: CAF - Revenus trop élevés (ERREUR) ===${colors.reset}\n`);

  const simulator = new APISimulatorAgent();

  const userData = {
    nom: "Martin",
    prenom: "Jean",
    situation: "locataire",
    revenus: 5000, // Trop élevé pour APL
    ville: "Paris",
    codePostal: "75001",
    loyer: 850,
  };

  try {
    const response = await simulator.simulateAPICall("CAF", "/demandes/apl", userData);

    console.log("📥 Données envoyées:", JSON.stringify(userData, null, 2));
    console.log("\n📤 Réponse API simulée:", JSON.stringify(response, null, 2));

    // Vérifications
    if (response.statut === "error") {
      console.log(`\n${colors.green}✅ Test RÉUSSI: Statut = error (attendu)${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠️  Statut = ${response.statut} (error attendu mais pas bloquant)${colors.reset}`);
    }

    if (response.message && response.message.length > 0) {
      console.log(`${colors.green}✅ Message d'erreur: "${response.message}"${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ ERREUR:${colors.reset}`, error);
  }
}

/**
 * Test 3: Demande de passeport ANTS (succès attendu)
 */
async function testANTSSuccess() {
  console.log(`\n${colors.blue}=== TEST 3: ANTS - Demande Passeport (SUCCÈS) ===${colors.reset}\n`);

  const simulator = new APISimulatorAgent();

  const userData = {
    nom: "Lefebvre",
    prenom: "Sophie",
    dateNaissance: "1995-06-15",
    lieuNaissance: "Lyon",
    adresse: "12 rue de la Paix, 75002 Paris",
    typeDocument: "passeport",
  };

  try {
    const response = await simulator.simulateAPICall("ANTS", "/demandes/passeport", userData);

    console.log("📥 Données envoyées:", JSON.stringify(userData, null, 2));
    console.log("\n📤 Réponse API simulée:", JSON.stringify(response, null, 2));

    // Vérifications
    if (response.statut === "success") {
      console.log(`\n${colors.green}✅ Test RÉUSSI: Statut = success${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ Test ÉCHOUÉ: Statut attendu = success, reçu = ${response.statut}${colors.reset}`);
    }

    if (response.numeroDossier && response.numeroDossier.startsWith("ANTS-")) {
      console.log(`${colors.green}✅ Numéro dossier valide: ${response.numeroDossier}${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Numéro dossier invalide: ${response.numeroDossier}${colors.reset}`);
    }

    if (response.delaiEstime && response.delaiEstime.includes("semaine")) {
      console.log(`${colors.green}✅ Délai estimé cohérent: ${response.delaiEstime}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ ERREUR:${colors.reset}`, error);
  }
}

/**
 * Test 4: Demande Impôts (succès attendu)
 */
async function testIMPOTSSuccess() {
  console.log(`\n${colors.blue}=== TEST 4: IMPOTS - Déclaration revenus (SUCCÈS) ===${colors.reset}\n`);

  const simulator = new APISimulatorAgent();

  const userData = {
    nom: "Bernard",
    prenom: "Luc",
    numeroFiscal: "1234567890123",
    revenus: 35000,
    charges: 5000,
  };

  try {
    const response = await simulator.simulateAPICall("IMPOTS", "/declarations/revenus", userData);

    console.log("📥 Données envoyées:", JSON.stringify(userData, null, 2));
    console.log("\n📤 Réponse API simulée:", JSON.stringify(response, null, 2));

    if (response.statut === "success") {
      console.log(`\n${colors.green}✅ Test RÉUSSI: Statut = success${colors.reset}`);
    }

    if (response.numeroDossier && response.numeroDossier.startsWith("DGFIP-")) {
      console.log(`${colors.green}✅ Numéro dossier valide: ${response.numeroDossier}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ ERREUR:${colors.reset}`, error);
  }
}

/**
 * Test 5: Demande Sécu (succès attendu)
 */
async function testSECUSuccess() {
  console.log(`\n${colors.blue}=== TEST 5: SECU - Remboursement soins (SUCCÈS) ===${colors.reset}\n`);

  const simulator = new APISimulatorAgent();

  const userData = {
    nom: "Dubois",
    prenom: "Claire",
    numeroSecu: "2950678901234",
    montantSoins: 150,
    typeSoins: "consultation spécialiste",
  };

  try {
    const response = await simulator.simulateAPICall("SECU", "/remboursements/demande", userData);

    console.log("📥 Données envoyées:", JSON.stringify(userData, null, 2));
    console.log("\n📤 Réponse API simulée:", JSON.stringify(response, null, 2));

    if (response.statut === "success") {
      console.log(`\n${colors.green}✅ Test RÉUSSI: Statut = success${colors.reset}`);
    }

    if (response.numeroDossier && response.numeroDossier.startsWith("SECU-")) {
      console.log(`${colors.green}✅ Numéro dossier valide: ${response.numeroDossier}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ ERREUR:${colors.reset}`, error);
  }
}

/**
 * Test 6: Demande Pôle Emploi (succès attendu)
 */
async function testPoleEmploiSuccess() {
  console.log(`\n${colors.blue}=== TEST 6: POLE EMPLOI - Inscription chômage (SUCCÈS) ===${colors.reset}\n`);

  const simulator = new APISimulatorAgent();

  const userData = {
    nom: "Moreau",
    prenom: "Thomas",
    dateFinContrat: "2025-10-15",
    motifFinContrat: "licenciement économique",
    dernierSalaire: 2500,
  };

  try {
    const response = await simulator.simulateAPICall("POLE_EMPLOI", "/inscription", userData);

    console.log("📥 Données envoyées:", JSON.stringify(userData, null, 2));
    console.log("\n📤 Réponse API simulée:", JSON.stringify(response, null, 2));

    if (response.statut === "success") {
      console.log(`\n${colors.green}✅ Test RÉUSSI: Statut = success${colors.reset}`);
    }

    if (response.numeroDossier && response.numeroDossier.startsWith("PE-")) {
      console.log(`${colors.green}✅ Numéro dossier valide: ${response.numeroDossier}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ ERREUR:${colors.reset}`, error);
  }
}

/**
 * Test 7: Demande Préfecture (succès attendu)
 */
async function testPrefectureSuccess() {
  console.log(`\n${colors.blue}=== TEST 7: PREFECTURE - Titre de séjour (SUCCÈS) ===${colors.reset}\n`);

  const simulator = new APISimulatorAgent();

  const userData = {
    nom: "Silva",
    prenom: "Maria",
    nationalite: "Brésilienne",
    typeTitre: "salarié",
    contratTravail: "CDI",
  };

  try {
    const response = await simulator.simulateAPICall("PREFECTURE", "/titre-sejour", userData);

    console.log("📥 Données envoyées:", JSON.stringify(userData, null, 2));
    console.log("\n📤 Réponse API simulée:", JSON.stringify(response, null, 2));

    if (response.statut === "success") {
      console.log(`\n${colors.green}✅ Test RÉUSSI: Statut = success${colors.reset}`);
    }

    if (response.numeroDossier && response.numeroDossier.startsWith("PREF-")) {
      console.log(`${colors.green}✅ Numéro dossier valide: ${response.numeroDossier}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ ERREUR:${colors.reset}`, error);
  }
}

/**
 * Test 8: Demande URSSAF (succès attendu)
 */
async function testURSSAFSuccess() {
  console.log(`\n${colors.blue}=== TEST 8: URSSAF - Auto-entrepreneur (SUCCÈS) ===${colors.reset}\n`);

  const simulator = new APISimulatorAgent();

  const userData = {
    nom: "Lambert",
    prenom: "Julie",
    activite: "développeur web",
    typeActivite: "prestations de services BNC",
    adresse: "15 avenue Victor Hugo, 69003 Lyon",
  };

  try {
    const response = await simulator.simulateAPICall("URSSAF", "/inscription-auto-entrepreneur", userData);

    console.log("📥 Données envoyées:", JSON.stringify(userData, null, 2));
    console.log("\n📤 Réponse API simulée:", JSON.stringify(response, null, 2));

    if (response.statut === "success") {
      console.log(`\n${colors.green}✅ Test RÉUSSI: Statut = success${colors.reset}`);
    }

    if (response.numeroDossier && (response.numeroDossier.startsWith("URSSAF-") || response.numeroDossier.length === 14)) {
      console.log(`${colors.green}✅ Numéro dossier valide: ${response.numeroDossier}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ ERREUR:${colors.reset}`, error);
  }
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   TESTS API SIMULATOR - DEV2 JOUR 1      ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);

  console.log("\n🚀 Lancement des tests...\n");

  // Tests principaux (CAF + ANTS selon roadmap)
  await testCAFSuccess();
  await testCAFError();
  await testANTSSuccess();

  // Tests bonus (Impôts + Sécu + nouveaux services)
  await testIMPOTSSuccess();
  await testSECUSuccess();
  await testPoleEmploiSuccess();
  await testPrefectureSuccess();
  await testURSSAFSuccess();

  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ TOUS LES TESTS TERMINÉS${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

  console.log("📝 Points à vérifier manuellement:");
  console.log("   1. Format numéro dossier correct (XXX-2025-XXXXXX)");
  console.log("   2. Messages cohérents et en français");
  console.log("   3. Délais réalistes (2 mois CAF, 3-6 sem ANTS, etc.)");
  console.log("   4. Prochaine étape claire et actionnable");
  console.log("   5. Pas de markdown dans les réponses JSON");
  console.log("   6. 7 sites administratifs supportés ✅\n");
}

// Exécuter les tests
runAllTests().catch((error) => {
  console.error(`${colors.red}❌ ERREUR FATALE:${colors.reset}`, error);
  process.exit(1);
});
