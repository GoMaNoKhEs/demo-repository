import type { Process, ActivityLog, ChatMessage } from '../types';

export const mockProcess: Process = {
  id: '1',
  userId: 'user1',
  sessionId: 'session1',
  title: 'Démarches suite à une naissance',
  description: 'Orchestration de 12 démarches administratives pour Marie Dubois',
  status: 'running',
  currentStepIndex: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  steps: [
    {
      id: 'step1',
      name: 'Déclaration de naissance à la mairie',
      status: 'completed',
      order: 1,
      startedAt: new Date(Date.now() - 300000),
      completedAt: new Date(Date.now() - 240000),
    },
    {
      id: 'step2',
      name: 'Demande d\'acte de naissance',
      status: 'completed',
      order: 2,
      startedAt: new Date(Date.now() - 240000),
      completedAt: new Date(Date.now() - 180000),
    },
    {
      id: 'step3',
      name: 'Inscription à la CAF',
      status: 'in-progress',
      order: 3,
      startedAt: new Date(Date.now() - 60000),
    },
    {
      id: 'step4',
      name: 'Déclaration Sécurité Sociale',
      status: 'pending',
      order: 4,
    },
    // ... autres étapes
  ],
};

export const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    processId: '1',
    timestamp: new Date(Date.now() - 180000),
    type: 'success',
    message: 'Formulaire de déclaration soumis avec succès',
  },
  {
    id: '2',
    processId: '1',
    timestamp: new Date(Date.now() - 120000),
    type: 'error',
    message: 'Erreur : Format PDF non accepté',
  },
  {
    id: '3',
    processId: '1',
    timestamp: new Date(Date.now() - 90000),
    type: 'info',
    message: 'Conversion PDF → JPG en cours...',
  },
  {
    id: '4',
    processId: '1',
    timestamp: new Date(Date.now() - 60000),
    type: 'success',
    message: 'Document resoumis avec succès',
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'agent',
    content: 'Bonjour ! Je suis SimplifIA, votre assistant administratif. Comment puis-je vous aider ?',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: '2',
    role: 'user',
    content: 'Je viens d\'avoir un bébé et je dois faire toutes les démarches',
    timestamp: new Date(Date.now() - 580000),
  },
  {
    id: '3',
    role: 'agent',
    content: 'Félicitations ! Je vais vous aider à orchestrer toutes les démarches. J\'ai identifié 12 étapes à accomplir. Souhaitez-vous que je commence ?',
    timestamp: new Date(Date.now() - 560000),
  },
];