import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { Google } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      setUser({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      // TODO: Afficher une notification d'erreur
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 6,
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SimplifIA
            </Typography>

            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Votre Agent d'Autonomie Administrative
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Orchestrez vos démarches administratives en toute simplicité avec l'intelligence artificielle.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<Google />}
              onClick={handleGoogleLogin}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                textTransform: 'none',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              Se connecter avec Google
            </Button>

            <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                🔒 Vos données sont protégées et hébergées en Europe (RGPD)
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};
