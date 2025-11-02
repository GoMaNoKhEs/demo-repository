import { Box, Typography, Button, Container, Card, CardContent, Stack, Paper, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  SmartToy,
  Timeline,
  Security,
  Speed,
  AutoAwesome,
  CheckCircle,
  Rocket as RocketIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  ArrowForward as ArrowForwardIcon,
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
              onClick={() => navigate('/login')}
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

      {/* Stats Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: <RocketIcon sx={{ fontSize: 48, color: 'primary.main' }} />, value: '2.5h', label: 'Temps économisé en moyenne' },
              { icon: <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main' }} />, value: '98%', label: 'Taux de réussite' },
              { icon: <TrophyIcon sx={{ fontSize: 48, color: 'warning.main' }} />, value: '100%', label: 'Satisfaction client' },
            ].map((stat, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' }, minWidth: 250 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      backgroundColor: 'white',
                      borderRadius: 3,
                      height: '100%',
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
                      {stat.value}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Paper>
                </motion.div>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip
            label="🎯 Cas d'usage"
            sx={{
              mb: 2,
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
              fontWeight: 'bold',
              backgroundColor: 'primary.main',
              color: 'white',
            }}
          />
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Ce que SimplifIA fait pour vous
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Automatisez vos démarches administratives en toute sérénité
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {[
            {
              title: '🍼 Déclaration de naissance',
              description: 'Mairie, CAF, livret de famille - tout en un seul clic',
              time: '2h → 5min',
            },
            {
              title: '🏠 Changement d\'adresse',
              description: 'Mise à jour automatique auprès de 15+ organismes',
              time: '3h → 10min',
            },
            {
              title: '💼 Changement d\'employeur',
              description: 'Sécurité sociale, mutuelle, impôts - géré pour vous',
              time: '2h → 8min',
            },
            {
              title: '🎓 Inscription universitaire',
              description: 'Dossiers, bourses, logement - parcours simplifié',
              time: '4h → 15min',
            },
          ].map((benefit, index) => (
            <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' }, minWidth: { xs: '100%', sm: 280 } }}>
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {benefit.description}
                    </Typography>
                    <Chip
                      label={benefit.time}
                      size="small"
                      color="success"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 10,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background shapes */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Prêt à simplifier votre vie administrative ?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
              Rejoignez l'aventure SimplifIA et dites adieu aux démarches fastidieuses
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: 'grey.100',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s',
                }}
                onClick={() => navigate('/dashboard')}
              >
                Démarrer une mission
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'white',
                  },
                }}
                onClick={() => navigate('/login')}
              >
                En savoir plus
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: 'grey.900',
          color: 'grey.300',
          py: 6,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
            SimplifIA
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            L'Agent d'IA qui simplifie vos démarches administratives
          </Typography>
          <Typography variant="caption" color="grey.500">
            © 2025 SimplifIA. Powered by Google Cloud & Vertex AI Agent Builder.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip
              label="🇫🇷 Hébergé en France"
              size="small"
              sx={{ mx: 0.5, backgroundColor: 'grey.800', color: 'grey.400' }}
            />
            <Chip
              label="🔒 RGPD Compliant"
              size="small"
              sx={{ mx: 0.5, backgroundColor: 'grey.800', color: 'grey.400' }}
            />
            <Chip
              label="⚡ 100% Automatisé"
              size="small"
              sx={{ mx: 0.5, backgroundColor: 'grey.800', color: 'grey.400' }}
            />
          </Box>
        </Container>
      </Box>
    </Box>
    </AnimatedPage>
  );
};
