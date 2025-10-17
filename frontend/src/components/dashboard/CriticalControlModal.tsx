import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import {
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface CriticalAction {
  id: string;
  title: string;
  description: string;
  url?: string;
  formData?: Record<string, unknown>;
  riskLevel: 'high' | 'medium' | 'low';
  consequences: string[];
  isReversible: boolean;
}

interface CriticalControlModalProps {
  open: boolean;
  action: CriticalAction | null;
  onCancel: () => void;
  onAuthorize: () => void;
  onPreview?: () => void;
}

const CriticalControlModal: React.FC<CriticalControlModalProps> = ({
  open,
  action,
  onCancel,
  onAuthorize,
  onPreview
}) => {
  if (!action) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Risque Élevé';
      case 'medium': return 'Risque Moyen';
      case 'low': return 'Risque Faible';
      default: return 'Risque Inconnu';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.2 }
      }}
    >
      {/* Header avec icône d'avertissement */}
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        pb: 1
      }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'error.light',
            color: 'error.contrastText'
          }}
        >
          <WarningIcon sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            ⚠️ DÉCISION CRITIQUE REQUISE
          </Typography>
          <Typography variant="caption" color="text.secondary">
            L'agent nécessite votre autorisation pour continuer
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Badge de niveau de risque */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={getRiskLabel(action.riskLevel)}
              color={getRiskColor(action.riskLevel)}
              size="small"
            />
            {!action.isReversible && (
              <Chip
                label="Action Irréversible"
                color="error"
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          {/* Description de l'action */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              L'agent souhaite effectuer l'action suivante :
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
              {action.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {action.description}
            </Typography>
          </Paper>

          {/* URL de l'action si disponible */}
          {action.url && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                URL cible :
              </Typography>
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {action.url}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Données du formulaire si disponibles */}
          {action.formData && Object.keys(action.formData).length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Données à soumettre :
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Stack spacing={0.5}>
                  {Object.entries(action.formData).map(([key, value]) => (
                    <Box key={key} sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                        {key}:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {String(value)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          )}

          <Divider />

          {/* Conséquences */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              ⚠️ Conséquences de cette action :
            </Typography>
            <Stack spacing={1}>
              {action.consequences.map((consequence, index) => (
                <Alert 
                  key={index} 
                  severity={action.riskLevel === 'high' ? 'error' : 'warning'}
                  icon={false}
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="body2">
                    • {consequence}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>

          {/* Message d'avertissement si irréversible */}
          {!action.isReversible && (
            <Alert severity="error" variant="filled">
              <Typography variant="body2" fontWeight="bold">
                ⚠️ Cette action est IRRÉVERSIBLE
              </Typography>
              <Typography variant="caption">
                Une fois autorisée, vous ne pourrez pas annuler cette opération.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {/* Bouton Annuler */}
        <Button
          onClick={onCancel}
          variant="outlined"
          color="inherit"
          startIcon={<CancelIcon />}
          size="large"
        >
          Annuler
        </Button>

        {/* Bouton Voir le formulaire (optionnel) */}
        {onPreview && action.url && (
          <Button
            onClick={onPreview}
            variant="outlined"
            color="info"
            startIcon={<VisibilityIcon />}
            size="large"
          >
            Voir le formulaire
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Bouton Autoriser */}
        <Button
          onClick={onAuthorize}
          variant="contained"
          color={action.riskLevel === 'high' ? 'error' : 'primary'}
          startIcon={<CheckCircleIcon />}
          size="large"
          sx={{ minWidth: 140 }}
        >
          Autoriser
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CriticalControlModal;
