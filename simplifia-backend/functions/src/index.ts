/**
 * SimplifIA Backend - Cloud Functions
 * Point d'entrée principal des fonctions Cloud avec Firestore Triggers
 */

import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {beforeUserCreated} from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import {validateConfig} from "./utils/config";

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
    const processId = event.params?.processId as string;
    const processData = event.data?.data();
    const snap = event.data;

    if (!processData || !snap) return;

    try {
      console.log(`✅ Nouveau processus créé : ${processId}`);
      console.log(`Utilisateur : ${processData.userId}`);
      console.log(`Titre : ${processData.title}`);

      // Sécurité : Ajouter sessionId si manquant
      if (!processData.sessionId) {
        const sessionId = `session-${processId}-${Date.now()}`;
        await snap.ref.update({ sessionId });
        console.log(`📝 SessionId généré : ${sessionId}`);
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
      const currentSessionId =
        processData.sessionId || `session-${processId}-${Date.now()}`;
      await db.collection("messages").add({
        sessionId: currentSessionId,
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

      // 4. TODO : Analyser avec Vertex AI
      // const analysis = await vertexAIService.analyzeContext(processData.metadata?.userContext);

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
        console.log(`🎉 Processus ${processId} complété !`);

        // Ajouter un message de félicitations
        await db.collection("messages").add({
          sessionId: after.sessionId,
          role: "agent",
          content:
            "🎉 Félicitations ! Votre démarche est complète. Tous les documents ont été traités avec succès.",
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
        `❌ Erreur lors de la mise à jour du processus ${processId}:`,
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
      // Ne répondre qu'aux messages de l'utilisateur
      if (messageData.role !== "user") {
        return;
      }

      console.log(
        `💬 Nouveau message user dans session ${messageData.sessionId}`,
      );
      console.log(`Contenu : ${messageData.content}`);

      // Indicateur "agent est en train d'écrire"
      const typingMessageRef = await db.collection("messages").add({
        sessionId: messageData.sessionId,
        role: "agent",
        content: "...",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          isTyping: true,
        },
      });

      // TODO : Envoyer le message à Vertex AI
      // const aiResponse = await vertexAIService.chat(processId, messageData.content);

      // Simuler une réponse de l'agent (à remplacer par Vertex AI)
      setTimeout(async () => {
        try {
          // Supprimer l'indicateur de typing
          await typingMessageRef.delete();

          // Ajouter la vraie réponse
          await db.collection("messages").add({
            sessionId: messageData.sessionId,
            role: "agent",
            content: `J'ai bien reçu votre message : "${messageData.content}". Je traite votre demande...`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              isTyping: false,
              suggestedActions: ["Continuer", "Voir les détails", "Modifier"],
            },
          });
        } catch (error) {
          console.error("❌ Erreur lors de la réponse:", error);
        }
      }, 2000);

      console.log(
        `✅ Réponse envoyée pour la session ${messageData.sessionId}`,
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
// FIRESTORE TRIGGERS - USERS
// ============================================

/**
 * Trigger : Quand un nouvel utilisateur se connecte
 * Créer son profil utilisateur
 */
export const onUserCreated = beforeUserCreated(async (event) => {
  const user = event.data;

  if (!user) return;

  try {
    console.log(`👤 Nouvel utilisateur créé : ${user.uid}`);
    console.log(`Email : ${user.email}`);

    // Créer le document utilisateur dans Firestore
    await db
      .collection("users")
      .doc(user.uid)
      .set({
        id: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        preferences: {
          theme: "light",
          notifications: true,
        },
        stats: {
          totalProcesses: 0,
          completedProcesses: 0,
          timeSaved: 0,
        },
      });

    console.log(`✅ Profil utilisateur créé pour ${user.uid}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création du profil utilisateur:",
      error,
    );
  }
});

/**
 * Fonction callable : Mettre à jour lastLoginAt
 */
export const updateLastLogin = onCall(async (request) => {
  // Vérifier l'authentification
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
  }

  try {
    await db.collection("users").doc(uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de lastLogin:", error);
    throw new HttpsError("internal", "Erreur lors de la mise à jour");
  }
});
