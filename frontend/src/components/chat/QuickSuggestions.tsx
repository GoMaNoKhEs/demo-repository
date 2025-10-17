import { Chip, Stack, Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const suggestions = [
  { 
    icon: '🎯', 
    text: 'Je viens d\'avoir un bébé', 
    value: 'new_baby',
    description: 'Déclaration de naissance, allocations, CAF'
  },
  { 
    icon: '🏠', 
    text: 'Je déménage', 
    value: 'moving',
    description: 'Changement d\'adresse, courrier, services'
  },
  { 
    icon: '💼', 
    text: 'Je change d\'emploi', 
    value: 'job_change',
    description: 'Pôle Emploi, mutuelle, prévoyance'
  },
  { 
    icon: '🎓', 
    text: 'Je reprends mes études', 
    value: 'studies',
    description: 'Bourses, logement, CAF étudiant'
  },
  { 
    icon: '💍', 
    text: 'Je me marie', 
    value: 'marriage',
    description: 'État civil, nom, régime matrimonial'
  },
  { 
    icon: '🚗', 
    text: 'J\'achète une voiture', 
    value: 'car',
    description: 'Carte grise, assurance, contrôle technique'
  },
];

interface QuickSuggestionsProps {
  onSelect: (value: string, text: string) => void;
  visible?: boolean;
}

export const QuickSuggestions = ({ onSelect, visible = true }: QuickSuggestionsProps) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const handleSelect = (value: string, text: string) => {
    setSelectedValue(value);
    setTimeout(() => {
      onSelect(value, text);
    }, 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ mb: 1, display: 'block', fontWeight: 500 }}
            >
              💡 Suggestions rapides pour démarrer :
            </Typography>
            
            <Stack 
              direction="row" 
              spacing={1} 
              flexWrap="wrap" 
              gap={1}
              sx={{ mb: 1 }}
            >
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Chip
                    icon={<span style={{ fontSize: '1.2rem' }}>{suggestion.icon}</span>}
                    label={suggestion.text}
                    onClick={() => handleSelect(suggestion.value, suggestion.text)}
                    clickable
                    color={selectedValue === suggestion.value ? 'primary' : 'default'}
                    sx={{
                      py: 2.5,
                      px: 1,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                      '& .MuiChip-icon': {
                        fontSize: '1.2rem',
                        ml: 1,
                      },
                    }}
                  />
                </motion.div>
              ))}
            </Stack>

            <Typography 
              variant="caption" 
              color="text.disabled" 
              sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}
            >
              Ou décrivez votre situation dans le chat ci-dessous 👇
            </Typography>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
