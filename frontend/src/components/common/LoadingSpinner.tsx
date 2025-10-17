import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { SmartToy } from '@mui/icons-material';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Spinner de chargement personnalisé avec le logo SimplifIA
 * Remplace les spinners Material UI génériques
 */
export const LoadingSpinner = ({ 
  message = 'Chargement...', 
  size = 'medium' 
}: LoadingSpinnerProps) => {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80,
  };

  const iconSizeMap = {
    small: 'medium',
    medium: 'large',
    large: 'large',
  } as const;

  const spinnerSize = sizeMap[size];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
      }}
    >
      {/* Spinner avec icône au centre */}
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {/* CircularProgress qui tourne */}
        <CircularProgress
          size={spinnerSize}
          thickness={3}
          sx={{
            color: 'primary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        
        {/* Icône SimplifIA au centre avec animation */}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <SmartToy 
              fontSize={iconSizeMap[size]} 
              sx={{ color: 'primary.main' }} 
            />
          </motion.div>
        </Box>
      </Box>

      {/* Message de chargement */}
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            {message}
          </Typography>
        </motion.div>
      )}
    </Box>
  );
};
