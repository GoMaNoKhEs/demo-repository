import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useAppStore } from '../../stores/useAppStore';

export const DashboardHeader = () => {
  const { currentProcess } = useAppStore();

  if (!currentProcess) return null;

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight="bold">
            Mission en cours : {currentProcess.title}
          </Typography>
          
          <Chip
            label={`${completedSteps}/${totalSteps} étapes`}
            color="primary"
            size="medium"
            sx={{ fontSize: '1rem', px: 1, py: 2.5 }}
          />
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
            },
          }}
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {progress.toFixed(0)}% complété
        </Typography>
      </Box>
    </motion.div>
  );
};