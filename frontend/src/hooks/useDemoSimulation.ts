import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useNotifications } from './useNotifications';
import type { Process, ProcessStep } from '../types';

interface DemoSimulationOptions {
  isActive: boolean;
  isPlaying: boolean;
  speed: number;
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
}

// Messages de démo pour chaque étape
const DEMO_STEPS_CONTENT = [
  {
    step: 0,
    title: '🔍 Analyse du contexte',
    logs: [
      'Connexion au système de gestion établie',
      'Lecture des informations du dossier',
      'Vérification des documents requis',
      'Identification des prochaines actions nécessaires',
    ],
    chatMessages: [
      'Bonjour ! Je commence l\'analyse de votre demande.',
      'J\'ai trouvé les documents nécessaires dans votre dossier.',
      'Je vais maintenant procéder à la vérification des informations.',
    ],
  },
  {
    step: 1,
    title: '📋 Vérification des documents',
    logs: [
      'Validation du format de la carte d\'identité',
      'Vérification de la date d\'expiration',
      'Contrôle de la qualité de l\'image',
      'Extraction des données biométriques',
    ],
    chatMessages: [
      'Vérification de votre carte d\'identité en cours...',
      'Le document est valide et bien lisible ✓',
      'Extraction des informations réussie.',
    ],
  },
  {
    step: 2,
    title: '✍️ Remplissage automatique',
    logs: [
      'Pré-remplissage du formulaire avec les données extraites',
      'Validation des champs obligatoires',
      'Vérification de la cohérence des informations',
      'Application des règles métier',
    ],
    chatMessages: [
      'Je remplis automatiquement le formulaire avec vos informations.',
      'Tous les champs obligatoires sont complétés.',
      'Voulez-vous que je vérifie les informations avant envoi ?',
    ],
  },
  {
    step: 3,
    title: '🔐 Validation des données',
    logs: [
      'Contrôle de la validité des données personnelles',
      'Vérification de la cohérence avec les documents',
      'Validation des formats (email, téléphone, code postal)',
      'Contrôle anti-fraude effectué',
    ],
    chatMessages: [
      'Validation des informations en cours...',
      'Toutes les données sont conformes aux exigences.',
      'Prêt pour la soumission !',
    ],
  },
  {
    step: 4,
    title: '📤 Soumission du dossier',
    logs: [
      'Préparation du dossier pour soumission',
      'Signature électronique des documents',
      'Envoi sécurisé au service compétent',
      'Réception de l\'accusé de réception',
    ],
    chatMessages: [
      'Envoi de votre dossier au service concerné...',
      'Dossier soumis avec succès ! 🎉',
      'Vous recevrez un email de confirmation sous peu.',
    ],
  },
  {
    step: 5,
    title: '✅ Suivi et confirmation',
    logs: [
      'Enregistrement du numéro de dossier',
      'Configuration des notifications de suivi',
      'Estimation du délai de traitement : 5-7 jours ouvrés',
      'Processus terminé avec succès !',
    ],
    chatMessages: [
      'Votre demande a été enregistrée sous le numéro #2024-ADM-789.',
      'Je surveillerai l\'avancement et vous tiendrai informé.',
      '🎊 Mission accomplie ! Vous avez économisé environ 2.5 heures de démarches.',
    ],
  },
];

export const useDemoSimulation = ({
  isActive,
  isPlaying,
  speed,
  onProgressUpdate,
  onComplete,
}: DemoSimulationOptions) => {
  const { setCurrentProcess, addActivityLog, addChatMessage, setAgentThinking } = useAppStore();
  const notifications = useNotifications();
  const currentStepRef = useRef(0);
  const progressRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  const initializeDemoProcess = () => {
    const demoProcess: Process = {
      id: 'demo-process-' + Date.now(),
      userId: 'demo-user',
      sessionId: 'demo-session-' + Date.now(),
      title: 'Demande d\'extrait d\'acte de naissance',
      description: 'Simulation automatique d\'une demande administrative',
      status: 'running',
      currentStepIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [
        { id: 's1', name: 'Analyse du contexte', status: 'in-progress', order: 0 },
        { id: 's2', name: 'Vérification des documents', status: 'pending', order: 1 },
        { id: 's3', name: 'Remplissage automatique', status: 'pending', order: 2 },
        { id: 's4', name: 'Validation des données', status: 'pending', order: 3 },
        { id: 's5', name: 'Soumission du dossier', status: 'pending', order: 4 },
        { id: 's6', name: 'Suivi et confirmation', status: 'pending', order: 5 },
      ],
    };

    setCurrentProcess(demoProcess);

    // Premier log et message
    addActivityLog({
      id: `demo-log-init-${Date.now()}`,
      processId: demoProcess.id,
      timestamp: new Date(),
      type: 'info',
      message: '🎬 Mode démonstration activé - Simulation automatique en cours',
    });

    addChatMessage({
      id: `demo-chat-init-${Date.now()}`,
      role: 'system',
      content: '🎬 Mode démonstration activé. Je vais simuler le traitement complet d\'une demande administrative.',
      timestamp: new Date(),
    });
  };

  const simulateStepActivity = (stepIndex: number) => {
    const stepContent = DEMO_STEPS_CONTENT[stepIndex];
    if (!stepContent) return;

    const { currentProcess } = useAppStore.getState();
    if (!currentProcess) return;

    // Mettre à jour le statut de l'étape précédente en "completed"
    if (stepIndex > 0) {
      const updatedSteps = [...currentProcess.steps];
      updatedSteps[stepIndex - 1].status = 'completed';
      updatedSteps[stepIndex].status = 'in-progress';

      setCurrentProcess({
        ...currentProcess,
        steps: updatedSteps,
        currentStepIndex: stepIndex,
        updatedAt: new Date(),
      });
    }

    // Ajouter les logs de cette étape
    stepContent.logs.forEach((logMessage, index) => {
      setTimeout(() => {
        addActivityLog({
          id: `demo-log-${stepIndex}-${index}-${Date.now()}`,
          processId: currentProcess.id,
          timestamp: new Date(),
          type: 'success',
          message: logMessage,
        });
      }, index * 800 / speed); // Espacer les logs
    });

    // Ajouter les messages chat de cette étape
    stepContent.chatMessages.forEach((chatContent, index) => {
      setTimeout(() => {
        addChatMessage({
          id: `demo-chat-${stepIndex}-${index}-${Date.now()}`,
          role: 'agent',
          content: chatContent,
          timestamp: new Date(),
        });
      }, (index + 1) * 1500 / speed); // Espacer les messages
    });

    // Notification pour chaque nouvelle étape
    setTimeout(() => {
      notifications.info(stepContent.title);
    }, 500);
  };

  const completeDemoProcess = () => {
    const { currentProcess } = useAppStore.getState();
    if (!currentProcess) return;

    // Marquer toutes les étapes comme complétées
    const completedSteps: ProcessStep[] = currentProcess.steps.map((step) => ({
      ...step,
      status: 'completed',
    }));

    setCurrentProcess({
      ...currentProcess,
      status: 'completed',
      steps: completedSteps,
      currentStepIndex: currentProcess.steps.length - 1,
      updatedAt: new Date(),
      completedAt: new Date(),
    });

    // Log final
    addActivityLog({
      id: `demo-log-complete-${Date.now()}`,
      processId: currentProcess.id,
      timestamp: new Date(),
      type: 'success',
      message: '✅ Simulation terminée - Mission accomplie !',
    });

    // Message final
    addChatMessage({
      id: `demo-chat-complete-${Date.now()}`,
      role: 'agent',
      content: '🎊 La simulation est terminée ! En conditions réelles, vous auriez économisé environ 2.5 heures de démarches administratives.',
      timestamp: new Date(),
    });

    // Notification finale
    notifications.success('🎉 Simulation terminée avec succès !');
  };

  // Effet principal pour gérer la simulation
  useEffect(() => {
    if (!isActive || !isPlaying) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAgentThinking(false);
      return;
    }

    // Initialiser le processus de démo au démarrage
    if (progressRef.current === 0 && currentStepRef.current === 0) {
      initializeDemoProcess();
    }

    setAgentThinking(true);

    // Simuler la progression
    intervalRef.current = window.setInterval(() => {
      progressRef.current += 0.5 * speed;
      
      if (progressRef.current >= 100) {
        progressRef.current = 100;
        onProgressUpdate(100);
        completeDemoProcess();
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setAgentThinking(false);
        onComplete();
        return;
      }

      onProgressUpdate(progressRef.current);

      // Déterminer l'étape actuelle basée sur la progression
      const targetStep = Math.floor((progressRef.current / 100) * 6);
      
      if (targetStep > currentStepRef.current && targetStep < 6) {
        currentStepRef.current = targetStep;
        simulateStepActivity(targetStep);
      }
    }, 200);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAgentThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPlaying, speed]);

  const resetDemo = () => {
    currentStepRef.current = 0;
    progressRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setAgentThinking(false);
  };

  return { resetDemo };
};
