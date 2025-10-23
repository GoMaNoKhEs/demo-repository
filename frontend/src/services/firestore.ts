import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Service pour écrire des données dans Firestore
 * Connecte le frontend au backend via Firestore
 * 
 * ARCHITECTURE:
 * - Frontend envoie des messages via sendChatMessage()
 * - Backend analyse les messages avec IA (Cloud Functions)
 * - Backend crée les processus automatiquement selon l'intention utilisateur
 * - Frontend reçoit et affiche les processus via les services realtime
 */

/**
 * Ajouter un message au chat dans Firestore
 * Déclenche automatiquement le trigger onChatMessageAdded
 */
export const sendChatMessage = async (
  sessionId: string,
  content: string,
  role: 'user' | 'agent' = 'user'
): Promise<string> => {
  try {
    console.log('[FirebaseWriter] Envoi d\'un message:', { sessionId, role, content: content.substring(0, 50) + '...' });
    
    const messageData = {
      sessionId,
      role,
      content,
      timestamp: serverTimestamp(),
      metadata: {
        isTyping: false,
        source: 'frontend-web'
      }
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    
    console.log('✅ Message envoyé avec ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    throw error;
  }
};

/**
 * Ajouter un log d'activité
 */
export const addActivityLog = async (
  processId: string,
  type: 'info' | 'success' | 'warning' | 'error',
  message: string,
  details?: string
): Promise<string> => {
  try {
    console.log('[FirebaseWriter] Ajout d\'un log:', { processId, type, message });
    
    const logData = {
      processId,
      type,
      message,
      details: details || '',
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'activity_logs'), logData);
    
    console.log('✅ Log ajouté avec ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur ajout log:', error);
    throw error;
  }
};