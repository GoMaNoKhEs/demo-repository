/**
 * SimplifIA Backend - Cloud Functions
 * Point d'entrée principal des fonctions Cloud avec Firestore Triggers
 */

import * as dotenv from "dotenv";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {validateConfig} from "./utils/config";
import type {EventContext} from "firebase-functions";
import type {QueryDocumentSnapshot} from "firebase-functions/v1/firestore";
import type {Change} from "firebase-functions";

// Charger les variables d'environnement
dotenv.config();

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
export const onProcessCreated = functions.firestore
  .document('processes/{processId}')
  .onCreate(async (snap: QueryDocumentSnapshot, context: EventContext) => {
    const processId = context.params.processId as string;
    const processData = snap.data();

    try {
      console.log(`✅ Nouveau processus créé : ${processId}`);
      console.log(`Utilisateur : ${processData.userId}`);
      console.log(`Titre : ${processData.title}`);

      // 1. Ajouter un log de démarrage
      await db.collection('processes').doc(processId)
        .collection('activity_logs').add({
          processId: processId,
          type: 'info',
          message: 'Processus créé avec succès',
          details: 'Le système analyse votre demande...',
          stepId: 0,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      // 2. Ajouter un message de bienvenue dans le chat
      await db.collection('processes').doc(processId)
        .collection('chat_messages').add({
          processId: processId,
          sender: 'agent',
          content: `Bonjour ! Je suis votre assistant SimplifIA. J'ai bien reçu votre demande concernant "${processData.title}". Je vais analyser votre situation et vous guider à travers les étapes nécessaires.`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            isTyping: false,
          },
        });

      // 3. Démarrer l'étape 0 (Analyse initiale)
      await snap.ref.update({
        status: 'in-progress',
        currentStep: 0,
        'steps.0.status': 'in-progress',
        'steps.0.startedAt': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. TODO : Analyser avec Vertex AI
      // const analysis = await vertexAIService.analyzeContext(processData.metadata?.userContext);

      // Simuler une analyse (à remplacer par Vertex AI)
      setTimeout(async () => {
        try {
          // Compléter l'étape 0
          await snap.ref.update({
            currentStep: 1,
            progress: 17,
            'steps.0.status': 'completed',
            'steps.0.completedAt': admin.firestore.FieldValue.serverTimestamp(),
            'steps.1.status': 'in-progress',
            'steps.1.startedAt': admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Log de progression
          await db.collection('processes').doc(processId)
            .collection('activity_logs').add({
              processId: processId,
              type: 'success',
              message: 'Analyse initiale terminée',
              details: 'Votre situation a été analysée avec succès',
              stepId: 0,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (error) {
          console.error(`❌ Erreur lors de la simulation:`, error);
        }
      }, 3000);

      console.log(`✅ Processus ${processId} initialisé avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'initialisation du processus ${processId}:`, error);

      // Logger l'erreur
      await db.collection('processes').doc(processId)
        .collection('activity_logs').add({
          processId: processId,
          type: 'error',
          message: 'Erreur lors de l\'initialisation',
          details: error instanceof Error ? error.message : 'Erreur inconnue',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  });

/**
 * Trigger : Quand un processus est mis à jour
 * Surveille les changements d'étapes et de statut
 */
export const onProcessUpdated = functions.firestore
  .document('processes/{processId}')
  .onUpdate(async (change: Change<QueryDocumentSnapshot>, context: EventContext) => {
    const processId = context.params.processId as string;
    const before = change.before.data();
    const after = change.after.data();

    try {
      // Détecter si le processus est complété
      if (before.status !== 'completed' && after.status === 'completed') {
        console.log(`🎉 Processus ${processId} complété !`);

        // Ajouter un message de félicitations
        await db.collection('processes').doc(processId)
          .collection('chat_messages').add({
            processId: processId,
            sender: 'agent',
            content: '🎉 Félicitations ! Votre démarche est complète. Tous les documents ont été traités avec succès.',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              isTyping: false,
            },
          });

        // Log final
        await db.collection('processes').doc(processId)
          .collection('activity_logs').add({
            processId: processId,
            type: 'success',
            message: 'Processus complété avec succès',
            details: 'Toutes les étapes ont été finalisées',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      // Détecter changement d'étape
      if (before.currentStep !== after.currentStep) {
        console.log(`📊 Processus ${processId} - Étape ${before.currentStep} → ${after.currentStep}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour du processus ${processId}:`, error);
    }
  });

// ============================================
// FIRESTORE TRIGGERS - CHAT MESSAGES
// ============================================

/**
 * Trigger : Quand un message utilisateur est ajouté
 * Répondre automatiquement avec l'agent IA
 */
export const onChatMessageAdded = functions.firestore
  .document('processes/{processId}/chat_messages/{messageId}')
  .onCreate(async (snap: QueryDocumentSnapshot, context: EventContext) => {
    const processId = context.params.processId as string;
    const messageData = snap.data();

    try {
      // Ne répondre qu'aux messages de l'utilisateur
      if (messageData.sender !== 'user') {
        return;
      }

      console.log(`💬 Nouveau message user dans processus ${processId}`);
      console.log(`Contenu : ${messageData.content}`);

      // Indicateur "agent est en train d'écrire"
      const typingMessageRef = await db.collection('processes').doc(processId)
        .collection('chat_messages').add({
          processId: processId,
          sender: 'agent',
          content: '...',
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
          await db.collection('processes').doc(processId)
            .collection('chat_messages').add({
              processId: processId,
              sender: 'agent',
              content: `J'ai bien reçu votre message : "${messageData.content}". Je traite votre demande...`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              metadata: {
                isTyping: false,
                suggestedActions: ['Continuer', 'Voir les détails', 'Modifier'],
              },
            });
        } catch (error) {
          console.error(`❌ Erreur lors de la réponse:`, error);
        }
      }, 2000);

      console.log(`✅ Réponse envoyée pour le processus ${processId}`);
    } catch (error) {
      console.error(`❌ Erreur lors du traitement du message dans ${processId}:`, error);
    }
  });

// ============================================
// FIRESTORE TRIGGERS - DECISIONS
// ============================================

/**
 * Trigger : Quand une décision critique est créée
 * Notifier l'utilisateur et attendre son approbation
 */
export const onDecisionCreated = functions.firestore
  .document('processes/{processId}/decisions/{decisionId}')
  .onCreate(async (snap: QueryDocumentSnapshot, context: EventContext) => {
    const processId = context.params.processId as string;
    const decisionId = context.params.decisionId as string;
    const decisionData = snap.data();

    try {
      console.log(`⚠️ Nouvelle décision critique dans processus ${processId}`);
      console.log(`Action : ${decisionData.action}`);
      console.log(`Niveau de risque : ${decisionData.riskLevel}`);

      // Ajouter un message dans le chat pour notifier l'utilisateur
      await db.collection('processes').doc(processId)
        .collection('chat_messages').add({
          processId: processId,
          sender: 'agent',
          content: `⚠️ **Décision importante requise**\n\nAction : ${decisionData.action}\n\nConséquences :\n${decisionData.consequences.map((c: string) => `• ${c}`).join('\n')}\n\nMerci de valider ou rejeter cette action.`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            isTyping: false,
            suggestedActions: ['Approuver', 'Rejeter', 'Voir les détails'],
          },
        });

      // Log de la décision
      await db.collection('processes').doc(processId)
        .collection('activity_logs').add({
          processId: processId,
          type: 'warning',
          message: 'Décision en attente de validation',
          details: `Action : ${decisionData.action}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            action: 'decision_pending',
            documentId: decisionId,
          },
        });

      console.log(`✅ Notification de décision envoyée pour ${processId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la décision ${decisionId}:`, error);
    }
  });

/**
 * Trigger : Quand une décision est approuvée/rejetée
 * Exécuter ou annuler l'action
 */
export const onDecisionUpdated = functions.firestore
  .document('processes/{processId}/decisions/{decisionId}')
  .onUpdate(async (change: Change<QueryDocumentSnapshot>, context: EventContext) => {
    const processId = context.params.processId as string;
    const decisionId = context.params.decisionId as string;
    const before = change.before.data();
    const after = change.after.data();

    try {
      // Détecter si la décision a été approuvée
      if (before.status === 'pending' && after.status === 'approved') {
        console.log(`✅ Décision ${decisionId} approuvée dans processus ${processId}`);

        // TODO : Exécuter l'action approuvée

        // Ajouter un message de confirmation
        await db.collection('processes').doc(processId)
          .collection('chat_messages').add({
            processId: processId,
            sender: 'agent',
            content: `✅ Action approuvée : ${after.action}\n\nJe procède à l'exécution...`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      // Détecter si la décision a été rejetée
      if (before.status === 'pending' && after.status === 'rejected') {
        console.log(`❌ Décision ${decisionId} rejetée dans processus ${processId}`);

        // Ajouter un message de rejet
        await db.collection('processes').doc(processId)
          .collection('chat_messages').add({
            processId: processId,
            sender: 'agent',
            content: `❌ Action rejetée : ${after.action}\n\nJe recherche une alternative...`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour de la décision ${decisionId}:`, error);
    }
  });

// ============================================
// FIRESTORE TRIGGERS - USERS
// ============================================

/**
 * Trigger : Quand un nouvel utilisateur se connecte
 * Créer son profil utilisateur
 */
export const onUserCreated = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  try {
    console.log(`👤 Nouvel utilisateur créé : ${user.uid}`);
    console.log(`Email : ${user.email}`);

    // Créer le document utilisateur dans Firestore
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        theme: 'light',
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
    console.error(`❌ Erreur lors de la création du profil utilisateur:`, error);
  }
});

/**
 * Fonction callable : Mettre à jour lastLoginAt
 */
export const updateLastLogin = functions.https.onCall(async (data, context) => {
  // Vérifier l'authentification
  const uid = context?.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  try {
    await db.collection('users').doc(uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de lastLogin:`, error);
    throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour');
  }
});
