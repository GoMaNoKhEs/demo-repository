import React, { useState } from 'react';
import {
  Fab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Alert,
  TextField
} from '@mui/material';
import {
  PanTool as PanToolIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface ManualTakeoverButtonProps {
  adminUrl?: string;
  processId?: string;
  onTakeover?: () => void;
}

const ManualTakeoverButton: React.FC<ManualTakeoverButtonProps> = ({
  adminUrl = 'https://admin.gouv.fr',
  processId,
  onTakeover
}) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  const handleClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    // Appeler le callback si fourni
    if (onTakeover) {
      onTakeover();
    }

    // Log de la reprise manuelle - processId: {processId}, reason: {reason}

    // Ouvrir l'URL d'administration dans un nouvel onglet
    const url = processId 
      ? `${adminUrl}?process=${processId}`
      : adminUrl;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Fermer le dialog
    setConfirmDialogOpen(false);
    setReason('');
  };

  const handleCancel = () => {
    setConfirmDialogOpen(false);
    setReason('');
  };

  return (
    <>
      {/* Bouton flottant fixe en bas à droite */}
      <AnimatePresence>
        <Tooltip 
          title="Reprendre le contrôle manuellement"
          placement="left"
          arrow
        >
          <Fab
            component={motion.div}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            color="primary"
            aria-label="reprise manuelle"
            onClick={handleClick}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1050, // Plus haut que le bouton démo (1000)
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            <PanToolIcon />
          </Fab>
        </Tooltip>
      </AnimatePresence>

      {/* Dialog de confirmation */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: motion.div,
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { duration: 0.2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PanToolIcon color="primary" />
          <Typography variant="h6" component="div">
            Reprendre le contrôle manuellement
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Information */}
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2" gutterBottom>
                Vous allez être redirigé vers l'interface d'administration où vous pourrez 
                effectuer les démarches manuellement.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                L'agent SimplifIA sera mis en pause pendant cette période.
              </Typography>
            </Alert>

            {/* URL de destination */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                URL de redirection :
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <OpenInNewIcon fontSize="small" color="action" />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all'
                  }}
                >
                  {processId ? `${adminUrl}?process=${processId}` : adminUrl}
                </Typography>
              </Box>
            </Box>

            {/* Raison de la reprise (optionnel) */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Raison de la reprise (optionnel) :
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Ex: Je préfère remplir ce formulaire moi-même..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                variant="outlined"
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Cette information sera enregistrée dans l'historique de la mission.
              </Typography>
            </Box>

            {/* Avertissement */}
            <Alert severity="warning" variant="outlined">
              <Typography variant="caption">
                ⚠️ Vous pourrez revenir sur le tableau de bord SimplifIA à tout moment 
                pour reprendre l'assistance automatique.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCancel}
            variant="outlined"
            color="inherit"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            startIcon={<OpenInNewIcon />}
          >
            Ouvrir l'administration
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManualTakeoverButton;
