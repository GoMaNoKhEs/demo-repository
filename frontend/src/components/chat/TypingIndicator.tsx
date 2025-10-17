import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export const TypingIndicator = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        maxWidth: 'fit-content',
        boxShadow: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: index * 0.2,
              ease: 'easeInOut',
            }}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#666',
            }}
          />
        ))}
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: '0.875rem',
          color: 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        SimplifIA réfléchit...
      </Box>
    </Box>
  );
};
