import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  duration?: number;
  onClose: () => void;
}

/**
 * NotificationSnackbar - Composant de notification réutilisable
 * 
 * Utilise Material-UI Snackbar + Alert pour afficher des messages
 * avec animations Framer Motion fluides.
 * 
 * Severities:
 * - success: Opérations réussies (vert)
 * - error: Erreurs critiques (rouge)
 * - warning: Avertissements (orange)
 * - info: Informations (bleu)
 */
export const NotificationSnackbar = ({
  open,
  message,
  severity = 'info',
  duration = 4000,
  onClose,
}: NotificationSnackbarProps) => {
  return (
    <AnimatePresence>
      {open && (
        <Snackbar
          open={open}
          autoHideDuration={duration}
          onClose={onClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ zIndex: 9999 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
          >
            <Alert
              onClose={onClose}
              severity={severity}
              variant="filled"
              sx={{
                width: '100%',
                minWidth: 300,
                boxShadow: 6,
                '& .MuiAlert-icon': {
                  fontSize: 24,
                },
                '& .MuiAlert-message': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              }}
            >
              {message}
            </Alert>
          </motion.div>
        </Snackbar>
      )}
    </AnimatePresence>
  );
};
