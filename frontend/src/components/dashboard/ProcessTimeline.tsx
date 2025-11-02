import { Box, Typography, LinearProgress, Chip, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  Error as ErrorIcon,
  Autorenew as InProgressIcon,
} from '@mui/icons-material';
import type { ProcessStep } from '../../types';
import { celebrateSuccess } from '../../utils/confetti';

interface ProcessTimelineProps {
  steps: ProcessStep[];
  currentStepIndex: number;
}

export const ProcessTimeline = ({ steps, currentStepIndex }: ProcessTimelineProps) => {
  // Ref pour suivre si le confetti a déjà été déclenché
  const confettiTriggered = useRef(false);

  // 🔥 FIX : Normaliser les steps (peut être Array OU Object)
  const normalizedSteps: ProcessStep[] = (() => {
    if (!steps) return [];
    
    // Si c'est déjà un array, retourner tel quel
    if (Array.isArray(steps)) {
      return steps;
    }
    
    // Si c'est un objet {"0": {...}, "1": {...}}, convertir en array
    if (typeof steps === 'object') {
      const stepsArray = Object.entries(steps as Record<string, any>).map(([key, value]) => ({
        ...value,
        id: key,
        order: parseInt(key, 10),
      }));
      return stepsArray;
    }
    
    return [];
  })();

  // 🔥 FIX : Vérifier que steps est un tableau avant d'appeler .every()
  const allStepsCompleted = normalizedSteps.length > 0 && normalizedSteps.every(step => step.status === 'completed');

  // Déclencher le confetti quand toutes les étapes sont complétées (une seule fois)
  useEffect(() => {
    if (allStepsCompleted && !confettiTriggered.current) {
      confettiTriggered.current = true;
      // Petit délai pour l'effet
      setTimeout(() => {
        celebrateSuccess();
      }, 300);
    }
    // Reset si les étapes changent (nouveau processus)
    if (!allStepsCompleted) {
      confettiTriggered.current = false;
    }
  }, [allStepsCompleted]);

  /**
   * Retourne une description détaillée de l'étape pour le tooltip
   */
  const getStepTooltip = (stepName: string, status: string): string => {
    const tooltips: Record<string, string> = {
      'Analyse et collecte': '🤖 L\'assistant SimplifIA collecte vos informations via conversation naturelle. Il identifie votre besoin et rassemble les données nécessaires.',
      'Collecte des informations': '🤖 L\'assistant SimplifIA collecte vos informations via conversation naturelle. Il identifie votre besoin et rassemble les données nécessaires.',
      'Validation des données': '🔍 Vérification automatique de vos données : formats (email, téléphone), cohérence (dates, montants) et règles métier (éligibilité APL, RSA, etc.)',
      'Navigation et soumission': '🌐 SimplifIA se connecte au site administratif (CAF, ANTS, etc.), remplit automatiquement le formulaire et soumet votre demande.',
      'Soumission': '🌐 SimplifIA se connecte au site administratif (CAF, ANTS, etc.), remplit automatiquement le formulaire et soumet votre demande.',
      'Confirmation': '✅ Récupération du numéro de dossier et confirmation de la soumission. Vous recevrez les prochaines étapes par email.',
    };

    const defaultTooltip = `${stepName} - ${status === 'completed' ? '✅ Complété' : status === 'in-progress' ? '⏳ En cours' : '⏸️ En attente'}`;
    return tooltips[stepName] || defaultTooltip;
  };

  const getStepIcon = (step: ProcessStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckIcon sx={{ color: 'success.main', fontSize: 28 }} />;
      case 'in-progress':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <InProgressIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          </motion.div>
        );
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 28 }} />;
      case 'pending':
      default:
        return <PendingIcon sx={{ color: 'action.disabled', fontSize: 28 }} />;
    }
  };

  const getStepColor = (step: ProcessStep) => {
    switch (step.status) {
      case 'completed':
        return 'success.main';
      case 'in-progress':
        return 'primary.main';
      case 'error':
        return 'error.main';
      case 'pending':
      default:
        return 'action.disabled';
    }
  };

  // ✅ FIX: Fonction helper pour convertir n'importe quel timestamp en millisecondes
  const getTimestamp = (timestamp: any): number => {
    if (!timestamp) return Date.now();
    
    // Si c'est déjà un objet Date
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    
    // Si c'est un Firestore Timestamp avec toDate()
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().getTime();
    }
    
    // Si c'est un objet Firestore Timestamp brut {seconds, nanoseconds}
    if (timestamp.seconds !== undefined) {
      return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1000000);
    }
    
    // Si c'est un nombre (timestamp Unix)
    if (typeof timestamp === 'number') {
      return timestamp;
    }
    
    // Fallback: now
    return Date.now();
  };

  const getDuration = (step: ProcessStep) => {
    if (!step.startedAt) return null;
    
    const startTime = getTimestamp(step.startedAt);
    const endTime = step.completedAt ? getTimestamp(step.completedAt) : Date.now();
    
    const duration = Math.floor((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  // 🔥 FIX : Utiliser normalizedSteps au lieu de steps
  const sortedSteps = [...normalizedSteps].sort((a, b) => a.order - b.order);
  

  return (
    <Box sx={{ position: 'relative', py: 2 }}>
      {sortedSteps.map((step, index) => {
        const isActive = step.status === 'in-progress';
        const isCompleted = step.status === 'completed';
        const hasError = step.status === 'error';
        const showProgressBar = index < sortedSteps.length - 1;
        const progressValue = isCompleted ? 100 : isActive ? 50 : 0;

        return (
          <Box key={step.id}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  position: 'relative',
                  pb: showProgressBar ? 3 : 0,
                }}
              >
                {/* Icône avec Tooltip explicatif */}
                <Tooltip 
                  title={getStepTooltip(step.name, step.status)}
                  arrow
                  placement="left"
                  enterDelay={300}
                  leaveDelay={200}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: isActive ? 'primary.lighter' : 'background.paper',
                      border: 2,
                      borderColor: getStepColor(step),
                      transition: 'all 0.3s',
                      cursor: 'help',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: 3,
                      },
                    }}
                  >
                    {getStepIcon(step)}
                  </Box>
                </Tooltip>

                {/* Contenu */}
                <Box
                  sx={{
                    flexGrow: 1,
                    pt: 0.5,
                    minWidth: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={isActive ? 'bold' : 'medium'}
                      sx={{
                        color: hasError ? 'error.main' : 'text.primary',
                        flexGrow: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {step.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {getDuration(step) && (
                        <Chip
                          label={getDuration(step)}
                          size="small"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      
                      {step.status === 'completed' && (
                        <Chip
                          label="✓"
                          size="small"
                          color="success"
                          sx={{ height: 20, minWidth: 24, '& .MuiChip-label': { px: 0.5 } }}
                        />
                      )}
                      
                      {step.status === 'in-progress' && (
                        <Chip
                          label="En cours"
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Box>

                  {hasError && step.errorMessage && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        wordWrap: 'break-word',
                      }}
                    >
                      ⚠️ {step.errorMessage}
                    </Typography>
                  )}
                </Box>

                {/* Barre de progression entre les étapes */}
                {showProgressBar && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 23,
                      top: 48,
                      width: 2,
                      height: 'calc(100% - 24px)',
                      zIndex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'divider',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ height: '0%' }}
                        animate={{ height: `${progressValue}%` }}
                        transition={{ duration: 0.5 }}
                        style={{
                          width: '100%',
                          backgroundColor: isCompleted
                            ? 'var(--mui-palette-success-main)'
                            : isActive
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-action-disabled)',
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </motion.div>
          </Box>
        );
      })}

      {/* Progression globale */}
      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            Progression globale
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentStepIndex + 1} / {steps.length} étapes
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={((currentStepIndex + 1) / steps.length) * 100}
          sx={{
            height: 8,
            borderRadius: 1,
            backgroundColor: 'action.hover',
          }}
        />
      </Box>
    </Box>
  );
};
