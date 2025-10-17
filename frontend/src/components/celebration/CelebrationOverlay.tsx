import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Box, Typography, Paper, Fade, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationOverlayProps {
  isVisible: boolean;
  onComplete?: () => void;
  message?: string;
}

const celebrationMessages = [
  "🎉 Mission accomplie avec brio !",
  "✨ Vous êtes une star !",
  "🚀 Objectif atteint !",
  "💫 Félicitations !",
  "🎊 Mission réussie !",
  "⭐ Excellent travail !",
  "🏆 Victoire !",
  "🎯 Bullseye ! Mission complète !",
];

const encouragingQuotes = [
  "\"L'administratif n'est plus un casse-tête !\"",
  "\"SimplifIA : Votre super-pouvoir administratif\"",
  "\"Gain de temps : +2.5 heures économisées\"",
  "\"Zéro stress administratif\"",
];

export const CelebrationOverlay = ({ isVisible, onComplete, message }: CelebrationOverlayProps) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [randomMessage] = useState(() => 
    message || celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]
  );
  const [randomQuote] = useState(() => 
    encouragingQuotes[Math.floor(Math.random() * encouragingQuotes.length)]
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-hide après 8 secondes
  useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {/* Confetti */}
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
          gravity={0.3}
          colors={['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#FF6D00', '#673AB7']}
        />

        {/* Message de célébration animé */}
        <Fade in={isVisible} timeout={800}>
          <Box
            sx={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Paper
                elevation={24}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 4,
                  minWidth: 300,
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: 2,
                    ease: 'easeInOut',
                  }}
                >
                  <Typography variant="h3" component="div" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>
                    {randomMessage}
                  </Typography>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Typography variant="h6" sx={{ fontStyle: 'italic', opacity: 0.9 }}>
                    {randomQuote}
                  </Typography>
                </motion.div>
              </Paper>
            </motion.div>
          </Box>
        </Fade>

        {/* Icônes flottantes animées */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {['🎉', '🎊', '✨', '🌟', '⭐', '💫', '🎯', '🏆'].map((emoji, index) => (
            <motion.div
              key={index}
              initial={{
                x: Math.random() * windowSize.width,
                y: -50,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                y: windowSize.height + 50,
                scale: [0, 1.5, 1],
                rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: index * 0.2,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                fontSize: '3rem',
                left: 0,
                top: 0,
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </Box>

        {/* Stats animées */}
        <Fade in={isVisible} timeout={1200}>
          <Box
            sx={{
              position: 'absolute',
              bottom: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Paper
                elevation={12}
                sx={{
                  p: 3,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                }}
              >
                <Stack direction="row" spacing={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      100%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Complété
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      +2.5h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Temps économisé
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="secondary.main">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Erreurs
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </motion.div>
          </Box>
        </Fade>
      </Box>
    </AnimatePresence>
  );
};
