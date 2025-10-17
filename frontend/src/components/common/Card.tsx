import { Card as MuiCard } from '@mui/material';
import type { CardProps } from '@mui/material';
import { motion } from 'framer-motion';

export const Card = ({ children, ...props }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <MuiCard {...props}>
        {children}
      </MuiCard>
    </motion.div>
  );
};
