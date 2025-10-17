import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Fade,
  Backdrop,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  target: string; // Selector CSS ou ID
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '.dashboard-header',
    title: '👋 Bienvenue sur SimplifIA !',
    content: 'Voici votre tableau de bord. Suivez la progression de votre mission en temps réel.',
    placement: 'bottom',
  },
  {
    target: '.process-timeline',
    title: '📋 Timeline de Mission',
    content: 'Chaque étape de votre mission est listée ici. Cliquez pour voir les détails.',
    placement: 'right',
  },
  {
    target: '.activity-tabs',
    title: '📊 Onglets d\'Activité',
    content: 'Explorez le Journal, l\'Historique des Décisions et les Statistiques détaillées.',
    placement: 'bottom',
  },
  {
    target: '.chat-interface',
    title: '💬 Chat avec l\'Agent IA',
    content: 'Posez vos questions à l\'agent IA. Il vous guide et vous assiste tout au long du processus.',
    placement: 'left',
  },
  {
    target: '.theme-toggle',
    title: '🌓 Mode Sombre',
    content: 'Changez entre le mode clair et sombre selon vos préférences !',
    placement: 'bottom',
  },
  {
    target: '.pdf-export-button',
    title: '📥 Export PDF',
    content: 'Téléchargez un rapport complet de votre mission en PDF à tout moment.',
    placement: 'bottom',
  },
];

export const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu le tour
    const hasSeenTour = localStorage.getItem('hasSeenOnboarding');
    
    if (!hasSeenTour) {
      // Attendre 1 seconde après le chargement pour lancer le tour
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isOpen && tourSteps[currentStep]) {
      updatePosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep]);

  const updatePosition = () => {
    const step = tourSteps[currentStep];
    const targetElement = document.querySelector(step.target);

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let top = 0;
      let left = 0;

      switch (step.placement) {
        case 'bottom':
          top = rect.bottom + scrollTop + 20;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'top':
          top = rect.top + scrollTop - 20;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'right':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.right + scrollLeft + 20;
          break;
        case 'left':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.left + scrollLeft - 20;
          break;
        default:
          top = rect.bottom + scrollTop + 20;
          left = rect.left + scrollLeft + rect.width / 2;
      }

      setPosition({ top, left });

      // Scroll vers l'élément
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <>
      {/* Backdrop avec overlay semi-transparent */}
      <Backdrop
        open={isOpen}
        sx={{
          zIndex: 9998,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={handleSkip}
      />

      {/* Spotlight sur l'élément cible */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`spotlight-${currentStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {/* Highlight sur l'élément */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          >
            {/* Le tooltip */}
            <Fade in={isOpen} timeout={300}>
              <Paper
                elevation={8}
                sx={{
                  position: 'absolute',
                  top: position.top,
                  left: position.left,
                  transform: 'translate(-50%, 0)',
                  maxWidth: 400,
                  width: '90%',
                  p: 3,
                  zIndex: 10000,
                  pointerEvents: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                {/* Bouton fermer */}
                <IconButton
                  size="small"
                  onClick={handleClose}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}
                  aria-label="Fermer le tour"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>

                {/* Contenu */}
                <Typography variant="h6" fontWeight="bold" sx={{ pr: 4, mb: 1 }}>
                  {step.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {step.content}
                </Typography>

                {/* Progression */}
                <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                  {tourSteps.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: index <= currentStep ? 'primary.main' : 'grey.300',
                        transition: 'background-color 0.3s',
                      }}
                    />
                  ))}
                </Box>

                {/* Boutons navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    size="small"
                    onClick={handleSkip}
                    sx={{ textTransform: 'none' }}
                  >
                    Passer
                  </Button>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {currentStep > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<BackIcon />}
                        onClick={handleBack}
                        sx={{ textTransform: 'none' }}
                      >
                        Retour
                      </Button>
                    )}
                    
                    <Button
                      variant="contained"
                      size="small"
                      endIcon={!isLastStep ? <NextIcon /> : undefined}
                      onClick={handleNext}
                      sx={{ textTransform: 'none' }}
                    >
                      {isLastStep ? 'Terminer' : 'Suivant'}
                    </Button>
                  </Box>
                </Box>

                {/* Compteur */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                >
                  {currentStep + 1} / {tourSteps.length}
                </Typography>
              </Paper>
            </Fade>
          </Box>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
