import { Box, Paper, Typography, IconButton, Tooltip, Tabs, Tab, Drawer, AppBar, Toolbar, Accordion, AccordionSummary, AccordionDetails, LinearProgress } from '@mui/material';
import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { 
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ValidationModal } from '../components/dashboard/ValidationModal';
import { ActivityLogList } from '../components/dashboard/ActivityLogList';
import { ProcessTimeline } from '../components/dashboard/ProcessTimeline';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { ConnectionError } from '../components/dashboard/ConnectionError';
import CriticalControlModal, { type CriticalAction } from '../components/dashboard/CriticalControlModal';
import ManualTakeoverButton from '../components/dashboard/ManualTakeoverButton';
import DecisionHistory, { type Decision } from '../components/dashboard/DecisionHistory';
import { ChatInterface } from '../components/chat/ChatInterface';
import { AnimatedPage } from '../components/common/AnimatedPage';
import { ThemeToggleButton } from '../components/common/ThemeToggleButton';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAppStore } from '../stores/useAppStore';
import { useNotifications } from '../hooks/useNotifications';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useKeyboardNavigation, useFocusVisible } from '../hooks/useKeyboardNavigation';
import { mockProcess, mockActivityLogs } from '../mocks/data';
import { subscribeToProcess, subscribeToActivityLogs, subscribeToMessages } from '../services/realtime';

// Lazy load des composants lourds pour optimiser le bundle
const StatsPanel = lazy(() => import('../components/dashboard/StatsPanel').then(m => ({ default: m.StatsPanel })));
const CelebrationOverlay = lazy(() => import('../components/celebration/CelebrationOverlay').then(m => ({ default: m.CelebrationOverlay })));
const DemoModeControls = lazy(() => import('../components/demo/DemoModeControls').then(m => ({ default: m.DemoModeControls })));

export const DashboardPage = () => {
  const {
    setCurrentProcess,
    currentProcess,
    activityLogs,
    setActivityLogs,
    addActivityLog,
    addChatMessage,
    clearChatMessages,
    chatMessages,
    setChatMessages,
  } = useAppStore();
  
  const notifications = useNotifications();
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // États pour la gestion du temps réel
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [useRealtime] = useState(true); // Mode Firestore activé pour la production
  
  // ID de session basé sur l'utilisateur authentifié
  const sessionId = user ? `session-${user.uid}` : 'demo-session-123';

  // États pour les nouveaux composants Phase 3 DEV2
  const [criticalActionModalOpen, setCriticalActionModalOpen] = useState(false);
  const [pendingCriticalAction, setPendingCriticalAction] = useState<CriticalAction | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [currentTab, setCurrentTab] = useState(0); // 0 = Activity Logs, 1 = Decision History, 2 = Statistics

  // États pour responsive mobile
  const isMobile = useIsMobile();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  
  // États pour accordions du drawer mobile
  const [accordionExpanded, setAccordionExpanded] = useState<string | false>('timeline');

  // États pour toggle des panneaux latéraux
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showCenterPanel, setShowCenterPanel] = useState(true);

  // État pour la célébration
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);

  // État pour le mode démo
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Navigation clavier : Focus visible global
  useFocusVisible();

  // Navigation clavier : Escape pour fermer les drawers et modals
  useKeyboardNavigation({
    onEscape: () => {
      // Fermer drawers mobiles
      if (mobileDrawerOpen) {
        setMobileDrawerOpen(false);
        return;
      }
      if (mobileChatOpen) {
        setMobileChatOpen(false);
        return;
      }
      // Fermer modal validation
      if (validationModalOpen) {
        setValidationModalOpen(false);
        return;
      }
      // Fermer modal critique
      if (criticalActionModalOpen) {
        setCriticalActionModalOpen(false);
        return;
      }
    },
    enabled: true,
  });

  // Mock decisions pour démo
  const mockDecisions: Decision[] = [
    {
      id: 'dec-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // Il y a 2h
      actionTitle: 'Validation de l\'identité',
      actionDescription: 'Soumettre une copie de la carte d\'identité au service d\'état civil',
      userChoice: 'authorized',
      riskLevel: 'low',
      consequences: [
        'Votre document sera transmis de manière sécurisée',
        'Le traitement sera accéléré de 48h',
      ],
      canRevert: false,
      context: {
        processId: '1',
        stepNumber: 2,
        url: 'https://service-public.fr/upload',
      },
    },
    {
      id: 'dec-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // Il y a 30min
      actionTitle: 'Paiement des frais administratifs',
      actionDescription: 'Autoriser le prélèvement de 35€ pour les frais de dossier',
      userChoice: 'authorized',
      riskLevel: 'medium',
      consequences: [
        'Un prélèvement de 35€ sera effectué sur votre compte',
        'Le délai de traitement sera réduit de 5 jours',
      ],
      canRevert: true,
      context: {
        processId: '1',
        stepNumber: 3,
      },
    },
  ];

  // Initialiser les decisions seulement en mode démo
  useEffect(() => {
    if (isDemoMode) {
      setDecisions(mockDecisions);
    } else {
      // Nouveau utilisateur authentifié : pas de décisions à afficher
      setDecisions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]);

  // Fonction pour charger les données mockées
  const loadMockData = useCallback(() => {
    console.log('[Dashboard] 🚀 Loading mock data...');
    console.log('[Dashboard] mockProcess:', mockProcess);
    console.log('[Dashboard] mockActivityLogs:', mockActivityLogs);
    
    setIsLoading(true);
    setConnectionError(null);
    
    // Charger immédiatement puis simuler un petit délai pour le skeleton
    setCurrentProcess(mockProcess);
    setActivityLogs(mockActivityLogs);
    
    setTimeout(() => {
      setIsLoading(false);
      console.log('[Dashboard] ✅ Mock data loaded successfully');
      console.log('[Dashboard] Current process in store:', mockProcess);
      console.log('[Dashboard] Activity logs in store:', mockActivityLogs.length);
    }, 300);
  }, [setCurrentProcess, setActivityLogs]);

  // Fonction pour se connecter au temps réel
  const connectRealtime = useCallback(() => {
    console.log('[Dashboard] Connecting to Firestore realtime...');
    setIsLoading(true);
    setConnectionError(null);

    // S'abonner aux mises à jour du processus
    const unsubscribeProcess = subscribeToProcess(
      sessionId,
      (process) => {
        console.log('[Dashboard] Process received:', process);
        setCurrentProcess(process);
        setIsLoading(false);
        
        // S'abonner aux logs d'activité une fois qu'on a le processId
        if (process.id) {
          const unsubscribeLogs = subscribeToActivityLogs(
            process.id,
            (logs) => {
              console.log('[Dashboard] Activity logs received:', logs.length);
              setActivityLogs(logs);
            },
            (error) => {
              console.error('[Dashboard] Logs subscription error:', error);
              notifications.error('Erreur de chargement des logs');
            }
          );
          
          return unsubscribeLogs;
        }
      },
      (error) => {
        console.error('[Dashboard] Process subscription error:', error);
        setConnectionError(error);
        setIsLoading(false);
      }
    );

    // Cleanup
    return () => {
      console.log('[Dashboard] Unsubscribing from realtime');
      unsubscribeProcess();
    };
  }, [sessionId, setCurrentProcess, setActivityLogs, notifications]);

  // Effet pour gérer le mode (mock vs realtime) - Pour nouveaux utilisateurs
  useEffect(() => {
    if (!useRealtime) {
      // Mode mock : charger les données de démo
      setTimeout(() => {
        setCurrentProcess(mockProcess);
        setActivityLogs(mockActivityLogs);
        setIsLoading(false);
      }, 1000);
    } else if (user) {
      console.log('[Dashboard] User authenticated:', user.email);
      console.log('[Dashboard] Ready for conversation - listening to messages');
      
      // Nouvel utilisateur : écouter les messages en temps réel
      const unsubscribeMessages = subscribeToMessages(
        sessionId,
        (messages) => {
          console.log('[Dashboard] Messages received:', messages.length);
          // Mettre à jour les messages dans le store
          setChatMessages(messages);
        },
        (error) => {
          console.error('[Dashboard] Messages subscription error:', error);
        }
      );
      
      setIsLoading(false);
      
      // Cleanup
      return () => {
        console.log('[Dashboard] Unsubscribing from messages');
        unsubscribeMessages();
      };
    } else {
      console.log('[Dashboard] Waiting for authentication...');
      setIsLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Réagir aux changements d'utilisateur

  // Fermer les drawers mobiles automatiquement quand on resize vers desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileDrawerOpen(false);
      setMobileChatOpen(false);
    }
  }, [isMobile]);

  // 🔌 Gestionnaire pour les demandes de validation de l'agent IA (Production-ready)
  // TODO BACKEND: Connecter à Firebase Realtime Database ou WebSocket
  // Exemple: useEffect(() => {
  //   const unsubscribe = onAgentValidationRequest((request) => {
  //     setValidationModalOpen(true);
  //     // Stocker les détails de la requête (action, raison, etc.)
  //   });
  //   return () => unsubscribe();
  // }, []);

  // 🔌 Gestionnaire pour les actions critiques détectées par l'agent IA (Production-ready)
  // TODO BACKEND: Connecter à Firebase Realtime Database ou WebSocket
  // Exemple: useEffect(() => {
  //   const unsubscribe = onCriticalActionDetected((action) => {
  //     setPendingCriticalAction({
  //       id: action.id,
  //       title: action.title,
  //       description: action.description,
  //       riskLevel: action.riskLevel,
  //       consequences: action.consequences,
  //       isReversible: action.isReversible,
  //       url: action.documentationUrl,
  //     });
  //     setCriticalActionModalOpen(true);
  //   });
  //   return () => unsubscribe();
  // }, []);

  // Écouter l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('[Dashboard] Auth state changed:', currentUser?.email || 'Not authenticated');
      setUser(currentUser);
    });
    
    return unsubscribe;
  }, []);

  // Détecter la completion de la mission pour la célébration
  useEffect(() => {
    if (!currentProcess || hasShownCelebration) return;

    // Vérifier si toutes les étapes sont complétées
    const allStepsCompleted = currentProcess.steps.every(step => step.status === 'completed');
    const isProcessCompleted = currentProcess.status === 'completed' || allStepsCompleted;

    if (isProcessCompleted && !hasShownCelebration) {
      // Attendre 500ms pour laisser l'animation de la dernière étape se terminer
      setTimeout(() => {
        setShowCelebration(true);
        setHasShownCelebration(true);
        
        // Ajouter un message de félicitations dans le chat
        addChatMessage({
          id: `celebration-${Date.now()}`,
          role: 'agent',
          content: '🎉 Félicitations ! Votre mission de déclaration de naissance est maintenant complète. Tous les documents ont été soumis et votre rendez-vous est confirmé. Vous avez économisé environ 2.5 heures de démarches administratives !',
          timestamp: new Date(),
        });
        
        // Log de célébration
        addActivityLog({
          id: `celebration-log-${Date.now()}`,
          processId: currentProcess.id,
          type: 'success',
          message: '🎊 Mission complétée avec succès ! Toutes les étapes ont été finalisées.',
          timestamp: new Date(),
        });
      }, 500);
    }
  }, [currentProcess, hasShownCelebration, addChatMessage, addActivityLog]);

  // Fonction de retry en cas d'erreur
  const handleRetry = () => {
    if (useRealtime) {
      connectRealtime();
    } else {
      loadMockData();
    }
  };

  const handleResetChat = () => {
    clearChatMessages();
    notifications.info('Chat réinitialisé - Les suggestions sont de retour !');
  };

  const handleValidation = () => {
    notifications.success('Action validée avec succès !');
    addActivityLog({
      id: Date.now().toString(),
      processId: currentProcess?.id || mockProcess.id,
      type: 'success',
      message: 'Utilisateur a validé l\'action de l\'agent',
      timestamp: new Date(),
    });
  };

  // Handlers pour les composants Phase 3 DEV2
  const handleAuthorizeCriticalAction = () => {
    if (pendingCriticalAction) {
      notifications.success('Action critique autorisée !');
      
      // Ajouter la décision à l'historique
      const newDecision: Decision = {
        id: `dec-${Date.now()}`,
        timestamp: new Date(),
        actionTitle: pendingCriticalAction.title,
        actionDescription: pendingCriticalAction.description,
        userChoice: 'authorized',
        riskLevel: pendingCriticalAction.riskLevel,
        consequences: pendingCriticalAction.consequences,
        canRevert: pendingCriticalAction.isReversible,
        context: {
          processId: currentProcess?.id || '1',
          stepNumber: currentProcess?.currentStepIndex || 0,
          url: pendingCriticalAction.url,
        },
      };
      
      setDecisions(prev => [newDecision, ...prev]);
      
      // Ajouter un log d'activité
      addActivityLog({
        id: Date.now().toString(),
        processId: currentProcess?.id || mockProcess.id,
        type: 'success',
        message: `Action autorisée : ${pendingCriticalAction.title}`,
        timestamp: new Date(),
      });
    }
    
    setCriticalActionModalOpen(false);
    setPendingCriticalAction(null);
  };

  const handleCancelCriticalAction = () => {
    if (pendingCriticalAction) {
      notifications.info('Action annulée par l\'utilisateur');
      
      // Ajouter la décision à l'historique
      const newDecision: Decision = {
        id: `dec-${Date.now()}`,
        timestamp: new Date(),
        actionTitle: pendingCriticalAction.title,
        actionDescription: pendingCriticalAction.description,
        userChoice: 'cancelled',
        riskLevel: pendingCriticalAction.riskLevel,
        consequences: pendingCriticalAction.consequences,
        canRevert: false,
        context: {
          processId: currentProcess?.id || '1',
          stepNumber: currentProcess?.currentStepIndex || 0,
          url: pendingCriticalAction.url,
        },
      };
      
      setDecisions(prev => [newDecision, ...prev]);
    }
    
    setCriticalActionModalOpen(false);
    setPendingCriticalAction(null);
  };

  const handlePreviewCriticalAction = () => {
    if (pendingCriticalAction?.url) {
      window.open(pendingCriticalAction.url, '_blank', 'noopener,noreferrer');
      notifications.info('Formulaire ouvert dans un nouvel onglet');
    }
  };

  const handleRevertDecision = (decisionId: string) => {
    setDecisions(prev => 
      prev.map(dec => 
        dec.id === decisionId 
          ? { ...dec, revertedAt: new Date() }
          : dec
      )
    );
    notifications.success('Décision annulée avec succès');
    
    addActivityLog({
      id: Date.now().toString(),
      processId: currentProcess?.id || mockProcess.id,
      type: 'warning',
      message: 'Utilisateur a annulé une décision précédente',
      timestamp: new Date(),
    });
  };

  const handleManualTakeover = () => {
    notifications.info('Redirection vers l\'interface d\'administration...');
    
    addActivityLog({
      id: Date.now().toString(),
      processId: currentProcess?.id || mockProcess.id,
      type: 'info',
      message: 'Utilisateur a repris le contrôle manuellement',
      timestamp: new Date(),
    });
  };

  // Afficher le skeleton pendant le chargement
  if (isLoading) {
    return <DashboardSkeleton initialLoad={true} />;
  }

  // Afficher l'erreur si connexion échouée
  if (connectionError) {
    return <ConnectionError error={connectionError} onRetry={handleRetry} />;
  }

  return (
    <AnimatedPage>
      {/* Tour d'onboarding interactif */}
      <OnboardingTour />

      <Box 
        component="main"
        role="main"
        aria-label="Tableau de bord principal SimplifIA"
        sx={{ 
          width: '100vw',
          height: '100vh',
          backgroundColor: 'background.default',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Debug info */}
      {!isLoading && !connectionError && !currentProcess && (
        <Box sx={{ p: 3, bgcolor: 'error.light', color: 'white', borderRadius: 2, m: 2 }}>
          <Typography variant="h6">⚠️ Debug: Aucun processus chargé</Typography>
          <Typography variant="body2">
            useRealtime: {useRealtime.toString()} | 
            activityLogs: {activityLogs.length} logs
          </Typography>
        </Box>
      )}

      {/* Header mobile avec menu hamburger */}
      {isMobile && (
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
            <IconButton
              edge="start"
              color="primary"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" color="primary" fontWeight="bold">
              SimplifIA
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ThemeToggleButton />
              <IconButton
                edge="end"
                color="primary"
                onClick={() => setMobileChatOpen(true)}
                aria-label="Ouvrir le chat"
              >
                <ChatIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Header avec progression (desktop/tablet) */}
      {!isMobile && (
        <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }} className="dashboard-header">
          <DashboardHeader />
        </Box>
      )}

      {/* Drawer mobile pour Timeline + Logs + Decisions */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '85%',
            maxWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header du drawer */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          <Typography variant="h6" fontWeight="bold">Menu</Typography>
          <IconButton onClick={() => setMobileDrawerOpen(false)} aria-label="Fermer le menu">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Contenu scrollable avec accordions */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {/* Accordion 1 : Mission & Progression */}
          <Accordion 
            expanded={accordionExpanded === 'progress'} 
            onChange={(_, isExpanded) => setAccordionExpanded(isExpanded ? 'progress' : false)}
            disableGutters
            elevation={0}
            sx={{ 
              '&:before': { display: 'none' },
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                minHeight: 56,
                '&.Mui-expanded': { minHeight: 56 },
              }}
              aria-controls="accordion-progress-content"
              id="accordion-progress-header"
            >
              <Typography variant="subtitle1" fontWeight="bold">
                📊 Mission & Progression
              </Typography>
            </AccordionSummary>
            <AccordionDetails 
              sx={{ p: 2, pt: 0 }}
              id="accordion-progress-content"
              role="region"
              aria-labelledby="accordion-progress-header"
            >
              <DashboardHeader />
            </AccordionDetails>
          </Accordion>

          {/* Accordion 2 : Étapes du Processus */}
          <Accordion 
            expanded={accordionExpanded === 'timeline'} 
            onChange={(_, isExpanded) => setAccordionExpanded(isExpanded ? 'timeline' : false)}
            disableGutters
            elevation={0}
            sx={{ 
              '&:before': { display: 'none' },
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                minHeight: 56,
                '&.Mui-expanded': { minHeight: 56 },
              }}
              aria-controls="accordion-timeline-content"
              id="accordion-timeline-header"
            >
              <Typography variant="subtitle1" fontWeight="bold">
                🎯 Étapes du Processus
              </Typography>
            </AccordionSummary>
            <AccordionDetails 
              sx={{ p: 2, pt: 0 }}
              id="accordion-timeline-content"
              role="region"
              aria-labelledby="accordion-timeline-header"
            >
              {currentProcess && (
                <ProcessTimeline 
                  steps={currentProcess.steps} 
                  currentStepIndex={currentProcess.currentStepIndex}
                />
              )}
            </AccordionDetails>
          </Accordion>

          {/* Accordion 3 : Activity Logs */}
          <Accordion 
            expanded={accordionExpanded === 'logs'} 
            onChange={(_, isExpanded) => setAccordionExpanded(isExpanded ? 'logs' : false)}
            disableGutters
            elevation={0}
            sx={{ 
              '&:before': { display: 'none' },
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                minHeight: 56,
                '&.Mui-expanded': { minHeight: 56 },
              }}
              aria-controls="accordion-logs-content"
              id="accordion-logs-header"
            >
              <Typography variant="subtitle1" fontWeight="bold">
                📋 Activity Logs
              </Typography>
            </AccordionSummary>
            <AccordionDetails 
              sx={{ p: 2, pt: 0 }}
              id="accordion-logs-content"
              role="region"
              aria-labelledby="accordion-logs-header"
            >
              <ActivityLogList logs={activityLogs} />
            </AccordionDetails>
          </Accordion>

          {/* Accordion 4 : Historique Décisions */}
          <Accordion 
            expanded={accordionExpanded === 'decisions'} 
            onChange={(_, isExpanded) => setAccordionExpanded(isExpanded ? 'decisions' : false)}
            disableGutters
            elevation={0}
            sx={{ 
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                minHeight: 56,
                '&.Mui-expanded': { minHeight: 56 },
              }}
              aria-controls="accordion-decisions-content"
              id="accordion-decisions-header"
            >
              <Typography variant="subtitle1" fontWeight="bold">
                🔍 Historique Décisions
              </Typography>
            </AccordionSummary>
            <AccordionDetails 
              sx={{ p: 2, pt: 0 }}
              id="accordion-decisions-content"
              role="region"
              aria-labelledby="accordion-decisions-header"
            >
              <DecisionHistory
                decisions={decisions}
                onRevert={handleRevertDecision}
              />
            </AccordionDetails>
          </Accordion>
        </Box>
      </Drawer>

      {/* Drawer mobile pour Chat fullscreen */}
      <Drawer
        anchor="right"
        open={mobileChatOpen}
        onClose={() => setMobileChatOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '100%',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header du chat mobile */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold">💬 Agent SimplifIA</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Réinitialiser le chat">
                <IconButton 
                  onClick={handleResetChat}
                  disabled={chatMessages.length === 0}
                  color="primary"
                  size="small"
                  aria-label="Réinitialiser le chat"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setMobileChatOpen(false)} aria-label="Fermer le chat">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Chat interface */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <ChatInterface sessionId={sessionId} />
          </Box>
        </Box>
      </Drawer>

      {/* Écran d'accueil mobile (quand drawers fermés) */}
      {isMobile && (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          gap: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}>
          {/* Logo SimplifIA */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
              SimplifIA
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Votre assistant intelligent
            </Typography>
          </Box>

          {/* Statut mission */}
          {currentProcess && (
            <Paper 
              sx={{ 
                p: 3, 
                width: '100%', 
                maxWidth: 400,
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                color: 'text.primary',
              }}
              elevation={3}
            >
              <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                🎯 Mission en cours
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {currentProcess.title}
              </Typography>
              
              {/* Progress compact */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {currentProcess.steps.filter(s => s.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  / {currentProcess.steps.length} étapes
                </Typography>
              </Box>

              <LinearProgress 
                variant="determinate" 
                value={(currentProcess.steps.filter(s => s.status === 'completed').length / currentProcess.steps.length) * 100}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 2,
                }}
              />

              <Typography variant="caption" color="text.secondary">
                {Math.round((currentProcess.steps.filter(s => s.status === 'completed').length / currentProcess.steps.length) * 100)}% complété
              </Typography>
            </Paper>
          )}

          {/* Boutons d'action */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 400 }}>
            <Paper
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ 
                flex: '1 1 calc(50% - 8px)',
                minWidth: 140,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'rgba(255, 255, 255, 0.95)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              elevation={2}
            >
              <MenuIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Menu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Voir les détails
              </Typography>
            </Paper>

            <Paper
              onClick={() => setMobileChatOpen(true)}
              sx={{ 
                flex: '1 1 calc(50% - 8px)',
                minWidth: 140,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'rgba(255, 255, 255, 0.95)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              elevation={2}
            >
              <ChatIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Chat
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Discuter avec l'agent
              </Typography>
            </Paper>
          </Box>

          {/* Footer info */}
          <Typography variant="caption" sx={{ opacity: 0.8, textAlign: 'center', mt: 'auto' }}>
            Cliquez sur Menu ou Chat pour accéder aux fonctionnalités
          </Typography>
        </Box>
      )}

      {/* Grille principale (tablet + desktop uniquement) */}
      {!isMobile && (
      <Box
        sx={{
          flex: 1,
          px: { xs: 2, md: 3 },
          pb: { xs: 2, md: 3 },
          pt: 2,
          overflow: 'hidden',
        }}
      >
        <PanelGroup 
          direction="horizontal"
          autoSaveId="simplifia-dashboard-panels"
          style={{ height: '100%' }}
        >
          {/* Panneau gauche : Timeline des étapes */}
          {showLeftPanel && (
            <>
              <Panel 
                defaultSize={25}
                minSize={15}
                maxSize={40}
                id="timeline-panel"
                order={1}
              >
                <Box sx={{ height: '100%', pr: 1 }}>
                  <Paper
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        🎯 Étapes du Processus
                      </Typography>
                      <Tooltip title="Masquer le processus">
                        <IconButton
                          size="small"
                          onClick={() => setShowLeftPanel(false)}
                          sx={{ ml: 1 }}
                          aria-label="Masquer le panneau des étapes du processus"
                        >
                          <ChevronLeftIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ flexGrow: 1, overflowY: 'auto' }} className="process-timeline">
                      {currentProcess && (
                        <ProcessTimeline 
                          steps={currentProcess.steps} 
                          currentStepIndex={currentProcess.currentStepIndex}
                        />
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Panel>

              <PanelResizeHandle />
            </>
          )}

          {/* Bouton pour réafficher le panneau gauche quand masqué */}
          {!showLeftPanel && (
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', left: 16, top: '50%', zIndex: 10 }}>
              <Tooltip title="Afficher le processus">
                <IconButton
                  onClick={() => setShowLeftPanel(true)}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    borderRadius: '0 8px 8px 0',
                  }}
                  aria-label="Afficher le panneau des étapes du processus"
                >
                  <ChevronRightIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Panneau central : Activity Logs + Decision History avec Tabs */}
          {showCenterPanel && (
            <>
              <Panel 
                defaultSize={30}
                minSize={20}
                maxSize={50}
                id="logs-panel"
                order={2}
              >
                <Box sx={{ height: '100%', px: 1 }}>
                  <Paper
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Tabs avec bouton de fermeture */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }} className="activity-tabs">
                      <Tabs 
                        value={currentTab} 
                        onChange={(_, newValue) => setCurrentTab(newValue)}
                        sx={{ flex: 1 }}
                        aria-label="Onglets Journal, Décisions et Statistiques"
                        variant="scrollable"
                        scrollButtons="auto"
                      >
                        <Tab label="📋 Journal" aria-label="Afficher le journal d'activité" />
                        <Tab label="⚖️ Décisions" aria-label="Afficher l'historique des décisions" />
                        <Tab label="📊 Statistiques" aria-label="Afficher les statistiques et analyses" />
                      </Tabs>
                      <Tooltip title="Masquer les logs">
                        <IconButton
                          size="small"
                          onClick={() => setShowCenterPanel(false)}
                          sx={{ mr: 1 }}
                          aria-label="Masquer le panneau des logs et décisions"
                        >
                          <ChevronLeftIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Content */}
                    <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                      {currentTab === 0 ? (
                        <ActivityLogList logs={activityLogs} />
                      ) : currentTab === 1 ? (
                        <DecisionHistory 
                          decisions={decisions} 
                          onRevert={handleRevertDecision} 
                        />
                      ) : (
                        <Suspense fallback={<Box sx={{ p: 3 }}><LinearProgress /></Box>}>
                          <StatsPanel />
                        </Suspense>
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Panel>

              <PanelResizeHandle />
            </>
          )}

          {/* Boutons pour réafficher le panneau central quand masqué */}
          {!showCenterPanel && (
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', left: showLeftPanel ? '25%' : 16, top: '50%', zIndex: 10 }}>
              <Tooltip title="Afficher les logs">
                <IconButton
                  onClick={() => setShowCenterPanel(true)}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    borderRadius: '0 8px 8px 0',
                  }}
                  aria-label="Afficher le panneau des logs et décisions"
                >
                  <ChevronRightIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Panneau droit : Chat Interface (toujours visible) */}
          <Panel 
            defaultSize={45}
            minSize={30}
            id="chat-panel"
            order={3}
          >
            <Box sx={{ height: '100%', pl: 1 }}>
              <Paper
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    💬 Conversation avec SimplifIA
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="Réinitialiser le chat pour voir les suggestions">
                      <IconButton 
                        onClick={handleResetChat}
                        disabled={chatMessages.length === 0}
                        color="primary"
                        size="small"
                        aria-label="Réinitialiser le chat"
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Zone de chat */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }} className="chat-interface">
                  <ChatInterface sessionId={sessionId} />
                </Box>
              </Paper>
            </Box>
          </Panel>
        </PanelGroup>
      </Box>
      )}

      {/* Modal de validation */}
      <ValidationModal
        open={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        onValidate={handleValidation}
        actionDescription="L'agent souhaite soumettre le formulaire de déclaration de naissance à l'administration"
        actionType="warning"
        screenshotUrl="https://via.placeholder.com/600x400?text=Capture+d'écran+du+formulaire"
        adminUrl="https://www.service-public.fr"
      />

      {/* Modal de contrôle critique (Phase 3 DEV2) */}
      <CriticalControlModal
        open={criticalActionModalOpen}
        action={pendingCriticalAction}
        onCancel={handleCancelCriticalAction}
        onAuthorize={handleAuthorizeCriticalAction}
        onPreview={handlePreviewCriticalAction}
      />

      {/* Bouton de reprise manuelle (Phase 3 DEV2) */}
      <ManualTakeoverButton
        adminUrl="https://admin.service-public.fr"
        processId={currentProcess?.id}
        onTakeover={handleManualTakeover}
      />

      {/* Célébration Easter Egg (Phase 5 DEV2) */}
      <Suspense fallback={null}>
        <CelebrationOverlay
          isVisible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        />
      </Suspense>

      {/* Mode Démonstration (Phase 5 DEV2) */}
      <Suspense fallback={null}>
        <DemoModeControls
        isActive={isDemoMode}
        onStart={() => {
          setIsDemoMode(true);
          notifications.info('🎬 Mode démonstration activé ! Observez l\'agent en action.');
          
          // Ajouter un log système
          addActivityLog({
            id: `demo-start-${Date.now()}`,
            processId: currentProcess?.id || 'demo',
            timestamp: new Date(),
            type: 'info',
            message: '🎬 Mode démonstration activé - Simulation automatique en cours',
          });
        }}
        onStop={() => {
          setIsDemoMode(false);
          notifications.success('Mode démonstration arrêté');
          
          addActivityLog({
            id: `demo-stop-${Date.now()}`,
            processId: currentProcess?.id || 'demo',
            timestamp: new Date(),
            type: 'info',
            message: '⏹️ Mode démonstration arrêté',
          });
        }}
      />
      </Suspense>
    </Box>
    </AnimatedPage>
  );
};