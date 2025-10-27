import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';

/**
 * Session stockée dans localStorage
 */
export interface StoredSession {
  id: string;
  userId: string;
  title: string; // Auto-généré depuis le 1er message ou "Nouvelle conversation"
  createdAt: string; // ISO date
  lastMessageAt: string; // ISO date
  messageCount: number;
}

/**
 * Hook pour gérer les sessions de chat multi-conversations
 * 
 * Fonctionnalités :
 * - Génère un nouveau sessionId unique à chaque nouvelle conversation
 * - Persiste les sessions dans localStorage avec titre auto-généré
 * - Permet de charger une ancienne conversation
 * - Nettoie automatiquement les anciennes sessions (> 30 jours)
 */
export const useSessionManager = (userId?: string) => {
  const { clearChatMessages } = useAppStore();
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  // Clé localStorage pour cet utilisateur
  const storageKey = userId ? `simplifia-sessions-${userId}` : 'simplifia-sessions-demo';

  /**
   * Génère un nouveau sessionId unique
   */
  const generateSessionId = useCallback((): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const prefix = userId ? `session-${userId}` : 'demo-session';
    return `${prefix}-${timestamp}-${random}`;
  }, [userId]);

  /**
   * Charge les sessions depuis localStorage
   */
  const loadSessions = useCallback((): StoredSession[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];

      const allSessions: StoredSession[] = JSON.parse(stored);

      // Nettoyer sessions > 30 jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const validSessions = allSessions.filter(session => {
        const lastMessage = new Date(session.lastMessageAt);
        return lastMessage > thirtyDaysAgo;
      });

      // Trier par date (plus récent d'abord)
      validSessions.sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      return validSessions;
    } catch (error) {
      console.error('[SessionManager] Error loading sessions:', error);
      return [];
    }
  }, [storageKey]);

  /**
   * Sauvegarde les sessions dans localStorage
   */
  const saveSessions = useCallback((sessionsToSave: StoredSession[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error('[SessionManager] Error saving sessions:', error);
    }
  }, [storageKey]);

  /**
   * Crée une nouvelle session
   */
  const createNewSession = useCallback((): string => {
    const newSessionId = generateSessionId();
    const now = new Date().toISOString();

    const newSession: StoredSession = {
      id: newSessionId,
      userId: userId || 'demo',
      title: 'Nouvelle conversation',
      createdAt: now,
      lastMessageAt: now,
      messageCount: 0,
    };

    // Ajouter aux sessions existantes
    const currentSessions = loadSessions();
    const updatedSessions = [newSession, ...currentSessions];
    saveSessions(updatedSessions);
    setSessions(updatedSessions);

    // Vider le chat actuel
    clearChatMessages();
    setCurrentSessionId(newSessionId);

    console.log('[SessionManager] New session created:', newSessionId);
    return newSessionId;
  }, [generateSessionId, userId, loadSessions, saveSessions, clearChatMessages]);

  /**
   * Met à jour une session existante (titre, dernier message)
   */
  const updateSession = useCallback((
    sessionId: string, 
    updates: Partial<Pick<StoredSession, 'title' | 'lastMessageAt' | 'messageCount'>>
  ) => {
    const currentSessions = loadSessions();
    const updatedSessions = currentSessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, ...updates };
      }
      return session;
    });
    saveSessions(updatedSessions);
    setSessions(updatedSessions);
  }, [loadSessions, saveSessions]);

  /**
   * Charge une session existante
   */
  const loadSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    clearChatMessages(); // Vider le chat actuel avant de charger
    console.log('[SessionManager] Loading session:', sessionId);
    // Note: subscribeToMessages se rechargera automatiquement avec le nouveau sessionId
  }, [clearChatMessages]);

  /**
   * Supprime une session
   */
  const deleteSession = useCallback((sessionId: string) => {
    const currentSessions = loadSessions();
    const updatedSessions = currentSessions.filter(s => s.id !== sessionId);
    saveSessions(updatedSessions);
    setSessions(updatedSessions);

    // Si c'est la session actuelle, créer une nouvelle
    if (sessionId === currentSessionId) {
      createNewSession();
    }
  }, [loadSessions, saveSessions, currentSessionId, createNewSession]);

  /**
   * Génère un titre à partir du premier message utilisateur
   */
  const generateTitleFromMessage = useCallback((message: string): string => {
    // Prendre les 40 premiers caractères
    const truncated = message.substring(0, 40);
    return truncated.length < message.length ? `${truncated}...` : truncated;
  }, []);

  /**
   * Met à jour le titre si c'est le premier message
   */
  const updateTitleIfNeeded = useCallback((sessionId: string, firstMessage: string) => {
    const currentSessions = loadSessions();
    const session = currentSessions.find(s => s.id === sessionId);
    
    if (session && session.title === 'Nouvelle conversation' && session.messageCount === 0) {
      const newTitle = generateTitleFromMessage(firstMessage);
      updateSession(sessionId, { 
        title: newTitle,
        lastMessageAt: new Date().toISOString(),
        messageCount: 1,
      });
    }
  }, [loadSessions, generateTitleFromMessage, updateSession]);

  /**
   * Initialisation : charger ou créer session
   */
  useEffect(() => {
    // ⚠️ IMPORTANT : Ne s'exécute que si userId est défini
    if (!userId) {
      console.log('[SessionManager] ⏳ Waiting for userId...');
      return;
    }

    const existingSessions = loadSessions();
    setSessions(existingSessions);

    // Si aucune session active, créer une nouvelle
    if (!currentSessionId) {
      // 🔥 FIX TEMPORAIRE : Toujours créer une NOUVELLE session (pour debug)
      // TODO: Restaurer la logique de chargement d'ancienne session plus tard
      console.log('[SessionManager] Creating NEW session (ignoring existing sessions for now)');
      
      const newId = generateSessionId();
      const now = new Date().toISOString();
      const newSession: StoredSession = {
        id: newId,
        userId: userId || 'demo',
        title: 'Nouvelle conversation',
        createdAt: now,
        lastMessageAt: now,
        messageCount: 0,
      };
      saveSessions([newSession]);
      setSessions([newSession]);
      setCurrentSessionId(newId);
      
      console.log('[SessionManager] ✅ New session created:', newId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // 🔥 CHANGEMENT : Dépendance sur userId au lieu de []

  return {
    currentSessionId,
    sessions,
    createNewSession,
    loadSession,
    deleteSession,
    updateSession,
    updateTitleIfNeeded,
  };
};
