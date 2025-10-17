import { useSnackbar, type VariantType } from 'notistack';

export const useNotifications = () => {
  const { enqueueSnackbar } = useSnackbar();

  const notify = (message: string, variant: VariantType = 'default') => {
    enqueueSnackbar(message, { 
      variant,
      autoHideDuration: 5000,
      anchorOrigin: { vertical: 'top', horizontal: 'right' },
    });
  };

  return {
    success: (message: string) => notify(message, 'success'),
    error: (message: string) => notify(message, 'error'),
    warning: (message: string) => notify(message, 'warning'),
    info: (message: string) => notify(message, 'info'),
    default: (message: string) => notify(message, 'default'),
  };
};
