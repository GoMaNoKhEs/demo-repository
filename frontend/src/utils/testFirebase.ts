/**
 * Fonctions de test Firebase
 * Utilisez ces fonctions dans la console du navigateur
 */

import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Test d'écriture dans Firestore
 */
export const testFirestoreWrite = async () => {
  try {
    console.log('🔥 Test d\'écriture Firestore...');
    
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Hello SimplifIA!',
      timestamp: new Date(),
      type: 'test',
    });
    
    console.log('✅ Document créé avec succès! ID:', docRef.id);
    console.log('🔗 Vérifiez dans Firebase Console → Firestore Database → Collection "test"');
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erreur lors de l\'écriture:', error);
    return { success: false, error };
  }
};

/**
 * Test de lecture depuis Firestore
 */
export const testFirestoreRead = async () => {
  try {
    console.log('🔥 Test de lecture Firestore...');
    
    const q = query(collection(db, 'test'), limit(5));
    const querySnapshot = await getDocs(q);
    
    console.log(`✅ ${querySnapshot.size} document(s) trouvé(s)`);
    
    querySnapshot.forEach((doc) => {
      console.log(`📄 Document ${doc.id}:`, doc.data());
    });
    
    return { success: true, count: querySnapshot.size };
  } catch (error) {
    console.error('❌ Erreur lors de la lecture:', error);
    return { success: false, error };
  }
};

/**
 * Test complet Firebase
 */
export const testFirebase = async () => {
  console.log('🚀 Début des tests Firebase...');
  console.log('===============================');
  
  // Test d'écriture
  const writeResult = await testFirestoreWrite();
  
  // Attendre un peu
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test de lecture
  const readResult = await testFirestoreRead();
  
  console.log('===============================');
  console.log('📊 Résumé des tests:');
  console.log('- Écriture:', writeResult.success ? '✅' : '❌');
  console.log('- Lecture:', readResult.success ? '✅' : '❌');
  
  if (writeResult.success && readResult.success) {
    console.log('🎉 Firebase est correctement configuré!');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  return { writeResult, readResult };
};

// Exposer les fonctions globalement pour la console
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).testFirebase = testFirebase;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).testFirestoreWrite = testFirestoreWrite;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).testFirestoreRead = testFirestoreRead;
}
