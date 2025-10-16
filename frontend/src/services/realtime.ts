import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Process, ActivityLog } from '../types';

export const subscribeToProcess = (
  sessionId: string,
  callback: (process: Process) => void
) => {
  const q = query(
    collection(db, 'processes'),
    where('sessionId', '==', sessionId)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
      } as Process);
    });
  });
};

export const subscribeToActivityLogs = (
  processId: string,
  callback: (logs: ActivityLog[]) => void
) => {
  const q = query(
    collection(db, 'activity_logs'),
    where('processId', '==', processId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as ActivityLog));
    
    callback(logs);
  });
};
