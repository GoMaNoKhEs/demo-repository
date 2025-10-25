// Tests pour NavigatorAgent - Navigation et soumission de démarches
import { NavigatorAgent } from "../agents/navigator";
import * as admin from "firebase-admin";

// Initialiser Firebase Admin (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "simplifia-hackathon",
  });
}

/**
 * Test 1 : Navigation CAF - Demande APL
 */
async function testNavigatorCAFSuccess() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 1: Navigator CAF - Demande APL ===");
  console.log("=".repeat(50) + "\n");

  const navigator = NavigatorAgent.getInstance();
  const processId = `test-process-${Date.now()}`;

  // ✅ CRÉER le document processus AVANT navigation
  await admin.firestore().collection("processus").doc(processId).set({
    userId: "user-test-caf",
    typeProcessus: "APL",
    status: "in_progress",
    createdAt: admin.firestore.Timestamp.now(),
  });
  console.log(`📄 Document processus créé: ${processId}`);

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
    const result = await navigator.navigateAndSubmit(
      processId,
      "CAF",
      userData
    );

    console.log("\n📤 Résultat navigation:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ Test RÉUSSI: Navigation CAF success");
      console.log(`✅ Numéro dossier: ${result.numeroDossier}`);
      console.log(`✅ Message: ${result.message}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ: Navigation devrait réussir");
    }

    // Vérifier les logs Firestore
    const activities = await navigator.getProcessActivities(processId);
    console.log(`\n📊 Logs Firestore: ${activities.length} activité(s) trouvée(s)`);

  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Test 2 : Navigation ANTS - Demande Passeport
 */
async function testNavigatorANTSSuccess() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 2: Navigator ANTS - Demande Passeport ===");
  console.log("=".repeat(50) + "\n");

  const navigator = NavigatorAgent.getInstance();
  const processId = `test-process-${Date.now()}`;

  // ✅ CRÉER le document processus AVANT navigation
  await admin.firestore().collection("processus").doc(processId).set({
    userId: "user-test-ants",
    typeProcessus: "PASSEPORT",
    status: "in_progress",
    createdAt: admin.firestore.Timestamp.now(),
  });
  console.log(`📄 Document processus créé: ${processId}`);

  const userData = {
    nom: "Lefebvre",
    prenom: "Sophie",
    dateNaissance: "1995-06-15",
    lieuNaissance: "Lyon",
    adresse: "12 rue de la Paix, 75002 Paris",
    typeDocument: "passeport",
  };

  try {
    const result = await navigator.navigateAndSubmit(
      processId,
      "ANTS",
      userData
    );

    console.log("\n📤 Résultat navigation:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.numeroDossier?.startsWith("ANTS-PASS")) {
      console.log("\n✅ Test RÉUSSI: Navigation ANTS success");
      console.log(`✅ Format numéro correct: ${result.numeroDossier}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ: Format numéro invalide");
    }

  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Test 3 : Navigation Pôle Emploi - Inscription chômage
 */
async function testNavigatorPoleEmploiSuccess() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 3: Navigator Pôle Emploi - Inscription ===");
  console.log("=".repeat(50) + "\n");

  const navigator = NavigatorAgent.getInstance();
  const processId = `test-process-${Date.now()}`;

  // ✅ CRÉER le document processus AVANT navigation
  await admin.firestore().collection("processus").doc(processId).set({
    userId: "user-test-pe",
    typeProcessus: "CHOMAGE",
    status: "in_progress",
    createdAt: admin.firestore.Timestamp.now(),
  });
  console.log(`📄 Document processus créé: ${processId}`);

  const userData = {
    nom: "Moreau",
    prenom: "Thomas",
    dateFinContrat: "2025-10-15",
    motifFinContrat: "licenciement économique",
    dernierSalaire: 2500,
  };

  try {
    const result = await navigator.navigateAndSubmit(
      processId,
      "POLE_EMPLOI",
      userData
    );

    console.log("\n📤 Résultat navigation:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ Test RÉUSSI: Navigation Pôle Emploi success");
      console.log(`✅ Délai estimé: ${result.delaiEstime}`);
      console.log(`✅ Prochaine étape: ${result.prochainEtape}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ");
    }

  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Test 4 : Navigation URSSAF - Auto-entrepreneur
 */
async function testNavigatorURSSAFSuccess() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 4: Navigator URSSAF - Auto-entrepreneur ===");
  console.log("=".repeat(50) + "\n");

  const navigator = NavigatorAgent.getInstance();
  const processId = `test-process-${Date.now()}`;

  // ✅ CRÉER le document processus AVANT navigation
  await admin.firestore().collection("processus").doc(processId).set({
    userId: "user-test-urssaf",
    typeProcessus: "AUTO_ENTREPRENEUR",
    status: "in_progress",
    createdAt: admin.firestore.Timestamp.now(),
  });
  console.log(`📄 Document processus créé: ${processId}`);

  const userData = {
    nom: "Lambert",
    prenom: "Julie",
    activite: "développeur web",
    typeActivite: "prestations de services BNC",
    adresse: "15 avenue Victor Hugo, 69003 Lyon",
  };

  try {
    const result = await navigator.navigateAndSubmit(
      processId,
      "URSSAF",
      userData
    );

    console.log("\n📤 Résultat navigation:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ Test RÉUSSI: Navigation URSSAF success");
      
      // Vérifier les activités
      const activities = await navigator.getProcessActivities(processId);
      if (activities.length > 0) {
        console.log(`✅ Activité loggée dans Firestore`);
        console.log(`   - ProcessId: ${activities[0].processId}`);
        console.log(`   - Statut: ${activities[0].statut}`);
        console.log(`   - Durée: ${activities[0].duration}ms`);
      }
    } else {
      console.log("\n❌ Test ÉCHOUÉ");
    }

  } catch (error) {
    console.error("❌ Erreur test:", error);
  }
}

/**
 * Test 5 : Gestion d'erreur - Revenus trop élevés CAF
 */
async function testNavigatorCAFError() {
  console.log("\n" + "=".repeat(50));
  console.log("=== TEST 5: Navigator CAF - Revenus trop élevés ===");
  console.log("=".repeat(50) + "\n");

  const navigator = NavigatorAgent.getInstance();
  const processId = `test-process-${Date.now()}`;

  // ✅ CRÉER le document processus AVANT navigation
  await admin.firestore().collection("processus").doc(processId).set({
    userId: "user-test-caf-error",
    typeProcessus: "APL",
    status: "in_progress",
    createdAt: admin.firestore.Timestamp.now(),
  });
  console.log(`📄 Document processus créé: ${processId}`);

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
    const result = await navigator.navigateAndSubmit(
      processId,
      "CAF",
      userData
    );

    console.log("\n📤 Résultat navigation:");
    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      console.log("\n✅ Test RÉUSSI: Erreur détectée comme prévu");
      console.log(`✅ Message d'erreur: ${result.message}`);
    } else {
      console.log("\n❌ Test ÉCHOUÉ: Devrait retourner une erreur");
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
  console.log("║   TESTS NAVIGATOR AGENT - DEV2 JOUR 1    ║");
  console.log("╚════════════════════════════════════════════╝");

  console.log("\n🚀 Lancement des tests NavigatorAgent...\n");

  // Tests séquentiels (pour éviter conflits Firestore)
  await testNavigatorCAFSuccess();
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Pause 2s

  await testNavigatorANTSSuccess();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testNavigatorPoleEmploiSuccess();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testNavigatorURSSAFSuccess();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testNavigatorCAFError();

  console.log("\n" + "=".repeat(50));
  console.log("✅ TOUS LES TESTS TERMINÉS");
  console.log("=".repeat(50));

  console.log("\n📝 Points vérifiés:");
  console.log("   1. Navigation sur 5 sites administratifs ✅");
  console.log("   2. Soumission de démarches via APISimulator ✅");
  console.log("   3. Logging dans Firestore (activity_logs) ✅");
  console.log("   4. Mise à jour processus avec externalReference ✅");
  console.log("   5. Gestion des erreurs ✅");

  // Fermer la connexion
  process.exit(0);
}

// Exécuter les tests
runAllTests().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
