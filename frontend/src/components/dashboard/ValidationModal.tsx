import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip } from '@mui/material';
import { Warning as WarningIcon, CheckCircle as CheckIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ValidationModalProps {
  open: boolean;
  onClose: () => void;
  onValidate: () => void;
  actionDescription: string;
  actionType?: 'critical' | 'warning' | 'info';
  screenshotUrl?: string;
  adminUrl?: string;
}

export const ValidationModal = ({ 
  open, 
  onClose, 
  onValidate, 
  actionDescription,
  actionType = 'warning',
  screenshotUrl,
  adminUrl
}: ValidationModalProps) => {
  
  const getActionColor = () => {
    switch (actionType) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'warning';
    }
  };

  const getActionLabel = () => {
    switch (actionType) {
      case 'critical': return 'ACTION CRITIQUE';
      case 'warning': return 'VALIDATION REQUISE';
      case 'info': return 'INFORMATION';
      default: return 'VALIDATION REQUISE';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <WarningIcon color={getActionColor()} sx={{ fontSize: 32 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">Validation de l'Agent</Typography>
          <Chip 
            label={getActionLabel()} 
            color={getActionColor()} 
            size="small" 
            sx={{ mt: 0.5 }}
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
          L'agent souhaite effectuer l'action suivante :
        </Typography>
        
        <Box 
          sx={{ 
            p: 2.5, 
            bgcolor: 'grey.50', 
            borderRadius: 2, 
            border: '2px solid',
            borderColor: `${getActionColor()}.main`,
            mb: 2 
          }}
        >
          <Typography variant="body1" fontWeight="bold" color="text.primary">
            {actionDescription}
          </Typography>
        </Box>
        
        {screenshotUrl && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              📸 Aperçu de l'action :
            </Typography>
            <Box
              component="img"
              src={screenshotUrl}
              alt="Aperçu de l'action"
              sx={{
                width: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.300',
                mt: 1,
                boxShadow: 1,
              }}
            />
          </Box>
        )}

        {adminUrl && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="body2" color="info.main" gutterBottom>
              🔗 Vous pouvez vérifier directement sur le site :
            </Typography>
            <Button
              size="small"
              variant="outlined"
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 1 }}
            >
              Ouvrir le site de l'administration
            </Button>
          </Box>
        )}
        
        {actionType === 'critical' && (
          <Box 
            sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'error.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'error.main'
            }}
          >
            <Typography variant="body2" color="error.main" fontWeight="bold">
              ⚠️ ATTENTION : Cette action est irréversible
            </Typography>
            <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
              Vérifiez attentivement avant de valider
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          startIcon={<CancelIcon />}
          sx={{ px: 3 }}
        >
          Annuler
        </Button>
        <Button 
          onClick={() => {
            onValidate();
            onClose();
          }}
          variant="contained" 
          color={actionType === 'critical' ? 'error' : 'primary'}
          startIcon={<CheckIcon />}
          sx={{ px: 3 }}
        >
          Valider l'action
        </Button>
      </DialogActions>
    </Dialog>
  );
};
