/**
 * SimplifIA Backend - Cloud Functions
 * Point d'entrée principal des fonctions Cloud avec Firestore Triggers
 */

import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {validateConfig} from "./utils/config";
import { ChatAgent } from "./agents/chat";

// Valider la configuration
validateConfig();

// Initialiser Firebase Admin
admin.initializeApp();

// Export du Firestore pour utilisation dans les services
export const db = admin.firestore();

// ============================================
// FIRESTORE TRIGGERS - PROCESSES
// ============================================

/**
 * Trigger : Quand un nouveau processus est créé
 * Déclenché automatiquement par le frontend quand il écrit dans Firestore
 */
export const onProcessCreated = onDocumentCreated(
  "processes/{processId}",
  async (event) => {
    const processId = event.params?.processId as string; // return undified if params is missing
    const processData = event.data?.data();
    const snap = event.data;

    if (!processData || !snap) return;

    try {
      console.log(`Nouveau processus créé : ${processId}`);
      console.log(`Utilisateur : ${processData.userId}`);
      console.log(`Titre : ${processData.title}`);

      // Il doit TOUJOURS avoir userId et sessionId (sinon c'est un bug interne)
      if (!processData.sessionId || !processData.userId) {
        console.error(
          "🚨 ERREUR CRITIQUE - PROCESSUS MAL FORMÉ: Processus créé sans données d'authentification requises",
          {
            processId,
            processData,
            missingFields: {
              sessionId: !processData.sessionId ? "MANQUANT" : "OK",
              userId: !processData.userId ? "MANQUANT" : "OK",
            },
          }
        );
        throw new Error(
          `ERREUR_PROCESSUS_MAL_FORMÉ: Le processus ${processId} n'a pas ` +
          `les champs requis (sessionId: ${processData.sessionId ? "OK" : "MANQUANT"}, ` +
          `userId: ${processData.userId ? "OK" : "MANQUANT"})`
        );
      }

      // 1. Ajouter un log de démarrage
      await db.collection("activity_logs").add({
        processId: processId,
        type: "info",
        message: "Processus créé avec succès",
        details: "Le système analyse votre demande...",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Ajouter un message de bienvenue dans le chat
      // sessionId est maintenant garanti d'exister (validation ci-dessus)
      await db.collection("messages").add({
        sessionId: processData.sessionId,
        role: "agent",
        content: "Bonjour ! Je suis votre assistant SimplifIA. J'ai bien reçu votre demande " +
          `concernant "${processData.title}". Je vais analyser votre situation et vous ` +
          "guider à travers les étapes nécessaires.",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          isTyping: false,
        },
      });

      // 3. Démarrer l'étape 0 (Analyse initiale)
      await snap.ref.update({
        status: "running",
        currentStepIndex: 0,
        "steps.0.status": "in-progress",
        "steps.0.startedAt": admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ============================================
      // TODO: REMPLACER PAR AGENT IA ANALYZER
      // ============================================

      /* SIMULATION COMMENTÉE - À REMPLACER PAR AGENT ANALYZER

      // Simuler une analyse (à remplacer par Vertex AI)
      setTimeout(async () => {
        try {
          // Compléter l'étape 0
          await snap.ref.update({
            currentStepIndex: 1,
            progress: 17,
            "steps.0.status": "completed",
            "steps.0.completedAt": admin.firestore.FieldValue.serverTimestamp(),
            "steps.1.status": "in-progress",
            "steps.1.startedAt": admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Log de progression
          await db.collection("activity_logs").add({
            processId: processId,
            type: "success",
            message: "Analyse initiale terminée",
            details: "Votre situation a été analysée avec succès",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (error) {
          console.error("❌ Erreur lors de la simulation:", error);
        }
      }, 3000);

      */

      // ============================================
      // ICI : INTÉGRER L'AGENT ANALYZER DE TON AMI
      // ============================================

      console.log("🔍 Processus créé, prêt pour analyse IA:", {
        processId,
        title: processData.title,
        userContext: processData.metadata?.userContext,
      });

      console.log(`✅ Processus ${processId} initialisé avec succès`);
    } catch (error) {
      console.error(
        `❌ Erreur lors de l'initialisation du processus ${processId}:`,
        error,
      );

      // Logger l'erreur
      await db.collection("activity_logs").add({
        processId: processId,
        type: "error",
        message: "Erreur lors de l'initialisation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  },
);

/**
 * Trigger : Quand un processus est mis à jour
 * Surveille les changements d'étapes et de statut
 */
export const onProcessUpdated = onDocumentUpdated(
  "processes/{processId}",
  async (event) => {
    const processId = event.params?.processId as string;
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    try {
      // Détecter si le processus est complété
      if (before.status !== "completed" && after.status === "completed") {
        console.log(`Processus ${processId} complété !`);

        // Ajouter un message de félicitations
        await db.collection("messages").add({
          sessionId: after.sessionId,
          role: "agent",
          content:
            " Félicitations ! Votre démarche est complète. Tous les documents ont été traités avec succès.",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            isTyping: false,
          },
        });

        // Log final
        await db.collection("activity_logs").add({
          processId: processId,
          type: "success",
          message: "Processus complété avec succès",
          details: "Toutes les étapes ont été finalisées",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Détecter changement d'étape
      if (before.currentStepIndex !== after.currentStepIndex) {
        console.log(
          `📊 Processus ${processId} - Étape ${before.currentStepIndex} → ${after.currentStepIndex}`,
        );
      }
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour du processus ${processId}:`,
        error,
      );
    }
  },
);

// ============================================
// FIRESTORE TRIGGERS - CHAT MESSAGES
// ============================================

/**
 * Trigger : Quand un message utilisateur est ajouté
 * Répondre automatiquement avec l'agent IA
 */
export const onChatMessageAdded = onDocumentCreated(
  "messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();

    if (!messageData) return;

    try {
      if (messageData.role !== "user") {
        return;
      }

      console.log(
        `Nouveau message user dans session ${messageData.sessionId}`,
      );
      console.log(`Contenu : ${messageData.content}`);
      // ============================================
      // INTÉGRATION AGENT CHAT IA
      // ============================================

      console.log("Message reçu, lancement de l'agent IA:", {
        sessionId: messageData.sessionId,
        content: messageData.content,
      });

      // Utiliser l'instance unique de l'agent chat (Singleton)
      const chatAgent = ChatAgent.getInstance();
      await chatAgent.processUserMessage(
        messageData.sessionId,
        messageData.content
      );

      console.log(
        `Réponse envoyée pour la session ${messageData.sessionId}`,
      );
    } catch (error) {
      console.error(
        `❌ Erreur lors du traitement du message dans session ${messageData.sessionId}:`,
        error,
      );
    }
  },
);

// ============================================
// TODO: GESTION DES UTILISATEURS
// ============================================
//
// À implémenter plus tard :
// - initializeUserProfile() : Créer/mettre à jour profil utilisateur à la connexion
// - Intégration avec Firebase Auth Google
// - Gestion des statistiques utilisateur
//

// ============================================
// CALLABLE FUNCTIONS - API ENDPOINTS
// ============================================

/**
 * Fonction callable : Créer un nouveau processus
 * Appelée après que l'utilisateur ait validé la création d'une démarche
 */
export const createProcess = onCall(async (request) => {
  // Vérifier l'authentification
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
  }

  // Récupérer les données de la requête
  const { title, description, userContext, sessionId } = request.data;

  // Validation des données requises
  if (!title || !sessionId) {
    throw new HttpsError(
      "invalid-argument",
      "Données manquantes: title et sessionId sont requis"
    );
  }

  try {
    console.log(`🚀 Création d'un nouveau processus pour l'utilisateur ${uid}`);
    console.log(`Titre: ${title}`);
    console.log(`SessionId: ${sessionId}`);

    // Générer les étapes par défaut du processus
    const defaultSteps = [
      {
        id: "0",
        name: "Analyse initiale",
        status: "pending" as const,
        order: 0,
      },
      {
        id: "1",
        name: "Collecte des documents",
        status: "pending" as const,
        order: 1,
      },
      {
        id: "2",
        name: "Validation des informations",
        status: "pending" as const,
        order: 2,
      },
      {
        id: "3",
        name: "Soumission des formulaires",
        status: "pending" as const,
        order: 3,
      },
      {
        id: "4",
        name: "Suivi et finalisation",
        status: "pending" as const,
        order: 4,
      },
    ];

    // Créer le document processus dans Firestore
    const processRef = await db.collection("processes").add({
      userId: uid,
      sessionId: sessionId,
      title: title,
      description: description || `Démarche: ${title}`,
      status: "created",
      steps: defaultSteps,
      currentStepIndex: 0,
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        userContext: userContext || "",
        detectedScenario: "automatique",
        confidence: 85,
      },
    });

    console.log(`✅ Processus créé avec succès - ID: ${processRef.id}`);

    // Mettre à jour les statistiques utilisateur
    await db.collection("users").doc(uid).update({
      "stats.totalProcesses": admin.firestore.FieldValue.increment(1),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Retourner les informations du processus créé
    return {
      success: true,
      processId: processRef.id,
      sessionId: sessionId,
      message: "Processus créé avec succès",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création du processus:", error);
    throw new HttpsError(
      "internal",
      `Erreur lors de la création du processus: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
});


