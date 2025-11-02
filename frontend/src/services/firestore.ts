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
 * 
 * ⚠️ IMPORTANT : L'utilisateur DOIT être authentifié
 */
export const sendChatMessage = async (
  sessionId: string,
  content: string,
  role: 'user' | 'agent' = 'user',
  userId: string  // ✅ OBLIGATOIRE maintenant !
): Promise<string> => {
  try {
    // STRICT : Vérifier que userId est présent
    if (!userId) {
      throw new Error('userId manquant - l\'utilisateur doit être authentifié');
    }

    
    const messageData = {
      sessionId,
      role,
      content,
      userId: userId,  // ✅ Pas de fallback 'anonymous'
      timestamp: serverTimestamp(),
      metadata: {
        isTyping: false,
        source: 'frontend-web'
      }
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur envoi message:', error);
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
    
    const logData = {
      processId,
      type,
      message,
      details: details || '',
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'activity_logs'), logData);
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur ajout log:', error);
    throw error;
  }
};