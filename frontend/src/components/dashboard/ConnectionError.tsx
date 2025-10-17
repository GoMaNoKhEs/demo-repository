import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';

interface ConnectionErrorProps {
  /** Message d'erreur à afficher */
  error: Error;
  /** Fonction appelée lors du clic sur "Réessayer" */
  onRetry: () => void;
  /** Titre personnalisé (optionnel) */
  title?: string;
}

/**
 * Composant affiché en cas d'erreur de connexion à Firestore
 * Propose un bouton pour réessayer la connexion
 */
export const ConnectionError = ({ 
  error, 
  onRetry, 
  title = "Erreur de connexion" 
}: ConnectionErrorProps) => {
  // Déterminer le type d'erreur
  const isNetworkError = error.message.includes('network') || 
                         error.message.includes('offline') ||
                         error.message.includes('fetch');
  
  const isPermissionError = error.message.includes('permission') || 
                            error.message.includes('PERMISSION_DENIED');

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 600,
          width: '100%',
          p: 4,
          textAlign: 'center',
        }}
      >
        {/* Icône d'erreur */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          {isNetworkError ? (
            <WifiOffIcon sx={{ fontSize: 80, color: 'error.main' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />
          )}
        </Box>

        {/* Titre */}
        <Typography variant="h5" gutterBottom fontWeight="bold" color="error">
          {title}
        </Typography>

        {/* Message d'erreur spécifique */}
        {isNetworkError && (
          <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Problème de connexion réseau</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Vérifiez votre connexion Internet et réessayez.
            </Typography>
          </Alert>
        )}

        {isPermissionError && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Erreur de permissions</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Vous n'avez pas les droits nécessaires pour accéder à ces données.
              Veuillez contacter l'administrateur.
            </Typography>
          </Alert>
        )}

        {!isNetworkError && !isPermissionError && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Erreur inattendue</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {error.message}
            </Typography>
          </Alert>
        )}

        {/* Description */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Impossible de charger les données en temps réel depuis Firestore.
        </Typography>

        {/* Détails techniques (replié) */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
            mb: 3,
            textAlign: 'left',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            <strong>Détails techniques :</strong>
            <br />
            {error.name}: {error.message}
          </Typography>
        </Box>

        {/* Bouton réessayer */}
        <Button
          variant="contained"
          size="large"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{
            minWidth: 200,
          }}
        >
          Réessayer
        </Button>

        {/* Suggestions */}
        <Box sx={{ mt: 3, textAlign: 'left' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Que faire ?</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
            <li>Vérifiez votre connexion Internet</li>
            <li>Actualisez la page (F5)</li>
            <li>Vérifiez que Firebase est correctement configuré</li>
            {isPermissionError && <li>Contactez l'administrateur pour vérifier vos droits</li>}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
