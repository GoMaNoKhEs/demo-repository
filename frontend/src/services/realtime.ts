import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Process, ActivityLog, ChatMessage } from '../types';

/**
 * S'abonner aux mises à jour d'un processus en temps réel
 * @param sessionId - ID de la session utilisateur
 * @param userId - ID de l'utilisateur authentifié
 * @param callback - Fonction appelée quand le processus est mis à jour
 * @param onError - Fonction appelée en cas d'erreur
 * @returns Fonction de désabonnement
 */
export const subscribeToProcess = (
  sessionId: string,
  userId: string,
  callback: (process: Process) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  console.log('[Realtime] 🔍 Subscribing to process for:', { sessionId, userId });

  const q = query(
    collection(db, 'processes'),
    where('sessionId', '==', sessionId),
    where('userId', '==', userId)  // CRITICAL: Filtrer par userId pour respecter les règles Firestore
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        console.log('[Realtime] ℹ️ No process found yet for session:', sessionId);
        return;
      }

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('[Realtime] 📄 Process data received:', {
          id: doc.id,
          userId: data.userId,
          sessionId: data.sessionId,
          status: data.status
        });
        
        const process: Process = {
          id: doc.id,
          ...data,
          // Gérer les timestamps qui peuvent être null avec serverTimestamp
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
        } as Process;
        
        console.log('[Realtime] ✅ Process updated:', process.id, process.status);
        callback(process);
      });
    },
    (error) => {
      console.error('[Realtime] ❌ ERREUR subscribing to process:', {
        message: error.message,
        code: (error as any).code,
        sessionId
      });
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
  console.log('[Realtime] Subscribing to activity logs for process:', processId);

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
      
      console.log('[Realtime] Activity logs updated:', logs.length, 'logs');
      callback(logs);
    },
    (error) => {
      console.error('[Realtime] Error subscribing to activity logs:', error);
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
  console.log('[Realtime] Subscribing to messages for session:', sessionId);

  const q = query(
    collection(db, 'messages'),
    where('sessionId', '==', sessionId),
    orderBy('timestamp', 'asc')
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
      
      console.log('[Realtime] Messages updated:', messages.length, 'messages');
      callback(messages);
    },
    (error) => {
      console.error('[Realtime] Error subscribing to messages:', error);
      onError?.(error);
    }
  );
};
