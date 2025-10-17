import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useAppStore } from '../../stores/useAppStore';
import { AnimatedNumber } from '../common/AnimatedNumber';

export const DashboardHeader = () => {
  const { currentProcess } = useAppStore();

  // Afficher un placeholder si pas de processus
  if (!currentProcess) {
    return (
      <Box sx={{ mb: 3, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="h5" color="text.secondary">
          Aucune mission en cours
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Démarrez une conversation pour commencer une mission.
        </Typography>
      </Box>
    );
  }

  const completedSteps = currentProcess.steps.filter(s => s.status === 'completed').length;
  const totalSteps = currentProcess.steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          mb: 2 
        }}>
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Mission : {currentProcess.title}
          </Typography>
          
          <Chip
            label={
              <>
                <AnimatedNumber value={completedSteps} />
                /
                <AnimatedNumber value={totalSteps} />
                {' '}étapes
              </>
            }
            color="primary"
            size="medium"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' }, 
              px: 1, 
              py: { xs: 2, sm: 2.5 } 
            }}
          />
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: { xs: 8, sm: 10 },
            borderRadius: 5,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          }}
          aria-label={`Progression de la mission : ${progress.toFixed(0)}%`}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />

        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            mt: 1, 
            display: 'block',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
        >
          <AnimatedNumber value={progress} decimals={0} suffix="% complété" />
        </Typography>
      </Box>
    </motion.div>
  );
};