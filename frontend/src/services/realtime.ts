import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Process, ActivityLog, ChatMessage } from '../types';

/**
 * S'abonner aux mises à jour d'un processus en temps réel
 * @param sessionId - ID de la session utilisateur
 * @param callback - Fonction appelée quand le processus est mis à jour
 * @param onError - Fonction appelée en cas d'erreur
 * @returns Fonction de désabonnement
 */
export const subscribeToProcess = (
  sessionId: string,
  callback: (process: Process) => void,
  onError?: (error: Error) => void
): Unsubscribe => {

  // Query simple: filtrer uniquement par sessionId
  // Les règles Firestore vérifieront que userId correspond
  const q = query(
    collection(db, 'processes'),
    where('sessionId', '==', sessionId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        return;
      }

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // LOG DÉTAILLÉ DES STEPS
        if (data.steps) {
          // Steps présents
        } else {
          // Pas de steps
        }
        
        // FIX: Convertir les timestamps Firestore imbriqués dans steps
        let steps = data.steps;
        if (steps) {
          if (Array.isArray(steps)) {
            // Format Array: convertir les timestamps de chaque step
            steps = steps.map(step => ({
              ...step,
              startedAt: step.startedAt?.toDate?.() || step.startedAt,
              completedAt: step.completedAt?.toDate?.() || step.completedAt,
            }));
          } else if (typeof steps === 'object') {
            // Format Object (ancien orchestrator): convertir les timestamps de chaque clé
            steps = Object.entries(steps).reduce((acc, [key, value]: [string, unknown]) => {
              const stepValue = value as { startedAt?: { toDate?: () => Date }; completedAt?: { toDate?: () => Date } };
              acc[key] = {
                ...stepValue,
                startedAt: stepValue.startedAt?.toDate?.() || stepValue.startedAt,
                completedAt: stepValue.completedAt?.toDate?.() || stepValue.completedAt,
              };
              return acc;
            }, {} as Record<string, unknown>);
          }
        }
        
        const process: Process = {
          id: doc.id,
          ...data,
          steps: steps, // Utiliser steps avec timestamps convertis
          // Gérer les timestamps qui peuvent être null avec serverTimestamp
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
        } as Process;
        
        callback(process);
      });
    },
    (error) => {
      // Error subscribing to process - handled by onError callback
      onError?.(error);
    }
  );
};

/**
 * S'abonner aux logs d'activité d'un processus en temps réel
 * @param processId - ID du processus
 * @param callback - Fonction appelée quand les logs sont mis à jour
 * @param onError - Fonction appelée en cas d'erreur
 * @returns Fonction de désabonnement
 */
export const subscribeToActivityLogs = (
  processId: string,
  callback: (logs: ActivityLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {

  const q = query(
    collection(db, 'activity_logs'),
    where('processId', '==', processId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Gérer le cas où timestamp est null (serverTimestamp pas encore résolu)
          timestamp: data.timestamp?.toDate() || new Date(),
        } as ActivityLog;
      });
      
      callback(logs);
    },
    (error) => {
      // Error subscribing to activity logs - handled by onError callback
      onError?.(error);
    }
  );
};

/**
 * S'abonner aux messages du chat en temps réel
 * @param sessionId - ID de la session
 * @param callback - Fonction appelée quand les messages sont mis à jour
 * @param onError - Fonction appelée en cas d'erreur
 * @returns Fonction de désabonnement
 */
export const subscribeToMessages = (
  sessionId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {

  // TEMPORAIRE : Sans orderBy pour tester (en attendant que l'index soit créé)
  const q = query(
    collection(db, 'messages'),
    where('sessionId', '==', sessionId)
    // orderBy('timestamp', 'asc')  // Commenté temporairement
  );


  return onSnapshot(
    q,
    (snapshot) => {
      
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Gérer le cas où timestamp est null (serverTimestamp pas encore résolu)
          timestamp: data.timestamp?.toDate() || new Date(),
        } as ChatMessage;
      });
      
      // Trier manuellement en attendant l'index
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      callback(messages);
    },
    (error) => {
      // Error subscribing to messages - handled by onError callback
      onError?.(error);
    }
  );
};
