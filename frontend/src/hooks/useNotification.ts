import { useState, useCallback } from 'react';
import type { AlertColor } from '@mui/material';

export interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

/**
 * Hook personnalisé pour gérer les notifications Snackbar
 * 
 * Utilisation:
 * const { notification, showNotification, hideNotification } = useNotification();
 * 
 * showNotification('Opération réussie !', 'success');
 * showNotification('Erreur de validation', 'error');
 */
export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = useCallback((message: string, severity: AlertColor = 'info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
};
