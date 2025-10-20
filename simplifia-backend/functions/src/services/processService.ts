/**
 * Service de gestion des processus juridiques
 */

import * as admin from 'firebase-admin';
import {Process, ProcessId, UserId} from '../types';

const db = admin.firestore();

/**
 * Créer un nouveau processus
 */
export const createProcess = async (
  userId: UserId,
  title: string,
  description?: string
): Promise<ProcessId> => {
  try {
    const processData = {
      userId,
      title,
      description: description || '',
      status: 'active',
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('processes').add(processData);

    console.log(` Processus créé avec succès : ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du processus:', error);
    throw new Error('Impossible de créer le processus');
  }
};

/**
 * Récupérer un processus par son ID
 */
export const getProcess = async (
  processId: ProcessId
): Promise<Process | null> => {
  try {
    const doc = await db.collection('processes').doc(processId).get();

    if (!doc.exists) {
      console.warn(`Processus non trouvé : ${processId}`);
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Process;
  } catch (error) {
    console.error('Erreur lors de la récupération du processus:', error);
    throw new Error('Impossible de récupérer le processus');
  }
};

/**
 * Récupérer tous les processus d'un utilisateur
 */
export const getUserProcesses = async (
  userId: UserId
): Promise<Process[]> => {
  try {
    const snapshot = await db
      .collection('processes')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const processes: Process[] = [];
    snapshot.forEach((doc) => {
      processes.push({
        id: doc.id,
        ...doc.data(),
      } as Process);
    });

    console.log(`${processes.length} processus trouvés pour l'utilisateur ${userId}`);
    return processes;
  } catch (error) {
    console.error(' Erreur lors de la récupération des processus:', error);
    throw new Error('Impossible de récupérer les processus');
  }
};

/**
 * Mettre à jour un processus
 */
export const updateProcess = async (
  processId: ProcessId,
  updates: Partial<Process>
): Promise<void> => {
  try {
    await db.collection('processes').doc(processId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Processus mis à jour : ${processId}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du processus:', error);
    throw new Error('Impossible de mettre à jour le processus');
  }
};

/**
 * Supprimer un processus
 */
export const deleteProcess = async (
  processId: ProcessId
): Promise<void> => {
  try {
    await db.collection('processes').doc(processId).delete();

    console.log(`Processus supprimé : ${processId}`);
  } catch (error) {
    console.error('Erreur lors de la suppression du processus:', error);
    throw new Error('Impossible de supprimer le processus');
  }
};

