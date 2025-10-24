/**
 * SimplifIA Backend - Cloud Functions
 * Point d'entrée principal des fonctions Cloud avec Firestore Triggers
 */

import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
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
 * Créé automatiquement par le ChatAgent après confirmation de l'utilisateur
 */
export const onProcessCreated = onDocumentCreated(
  "processes/{processId}",
  async (event) => {
    const processId = event.params?.processId as string;
    const processData = event.data?.data();
    const snap = event.data;

    if (!processData || !snap) return;

    try {
      console.log(`Nouveau processus créé : ${processId}`);
      console.log(`Utilisateur : ${processData.userId}`);
      console.log(`Titre : ${processData.title}`);

      // Validation des données requises
      if (!processData.sessionId || !processData.userId) {
        console.error(
          "ERREUR: Processus créé sans sessionId ou userId",
          { processId, sessionId: processData.sessionId, userId: processData.userId }
        );
        throw new Error(
          `Processus ${processId} mal formé (manque sessionId ou userId)`
        );
      }

      // 1. Log de création
      await db.collection("activity_logs").add({
        processId: processId,
        type: "info",
        message: "🎯 Processus créé avec succès",
        details: `Démarche: ${processData.title}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Mettre le processus en "running" (step 0 déjà completed par ChatAgent)
      await snap.ref.update({
        status: "running",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Processus ${processId} initialisé et en cours`);

      // ============================================
      // TODO JOUR 2-4: Lancer le workflow automatique
      // ============================================
      // Ici, on lancera plus tard :
      // - Navigator (connexion au site)
      // - FormFiller (remplissage formulaire)
      // - Validator (validation données)
    } catch (error) {
      console.error(
        `❌ Erreur initialisation processus ${processId}:`,
        error
      );

      await db.collection("activity_logs").add({
        processId: processId,
        type: "error",
        message: "❌ Erreur d'initialisation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
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

// NOTE: createProcess() a été supprimé car le ChatAgent crée
// automatiquement les processus après validation de l'utilisateur.
// Plus besoin d'appel manuel depuis le frontend !


