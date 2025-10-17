import { Button as MuiButton, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { motion } from 'framer-motion';

interface CustomButtonProps extends ButtonProps {
  loading?: boolean;
}

export const Button = ({ loading, children, disabled, ...props }: CustomButtonProps) => {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <MuiButton
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          children
        )}
      </MuiButton>
    </motion.div>
  );
};
