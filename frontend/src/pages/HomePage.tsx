import { Box, Typography, Button, Container, Card, CardContent } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  SmartToy,
  Timeline,
  Security,
  Speed,
  AutoAwesome,
  CheckCircle,
} from '@mui/icons-material';
import { AnimatedPage } from '../components/common/AnimatedPage';

const features = [
  {
    icon: <SmartToy fontSize="large" />,
    title: 'Agent Autonome',
    description: 'Raisonnement, planification et exécution automatiques',
  },
  {
    icon: <Timeline fontSize="large" />,
    title: 'Orchestration Intelligente',
    description: 'Gestion de multiples démarches en parallèle',
  },
  {
    icon: <Security fontSize="large" />,
    title: 'Points de Contrôle',
    description: 'Validation éthique sur les décisions critiques',
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'Temps Réel',
    description: 'Suivi live de l\'avancement de vos dossiers',
  },
  {
    icon: <AutoAwesome fontSize="large" />,
    title: 'Auto-Correction',
    description: 'Détection et résolution automatique d\'erreurs',
  },
  {
    icon: <CheckCircle fontSize="large" />,
    title: 'Conformité RGPD',
    description: 'Hébergement Europe, souveraineté des données',
  },
];

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <AnimatedPage>
      <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
          color: 'white',
          py: 12,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              SimplifIA
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.95 }}>
              L'Agent d'IA qui simplifie vos démarches administratives
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
              onClick={() => navigate('/dashboard')}
            >
              Démarrer maintenant
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Pourquoi SimplifIA ?
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 6 }}
        >
          Une solution complète pour gérer toutes vos démarches administratives
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 4,
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Prêt à simplifier votre vie administrative ?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
            Rejoignez les utilisateurs qui ont déjà adopté SimplifIA
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              px: 6,
              py: 2,
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
            onClick={() => navigate('/login')}
          >
            Commencer gratuitement
          </Button>
        </Container>
      </Box>
    </Box>
    </AnimatedPage>
  );
};
