import { Box, Avatar, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { SmartToy, Person } from '@mui/icons-material';
import type { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isThinking?: boolean;
}

export const MessageBubble = ({ message, isThinking }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {message.content}
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          gap: 1,
        }}
      >
        {!isUser && (
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SmartToy />
          </Avatar>
        )}

        <Paper
          elevation={1}
          sx={{
            p: 2,
            maxWidth: '70%',
            backgroundColor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'white' : 'text.primary',
          }}
        >
          {isThinking ? (
            // Animation de typing pour l'agent qui réfléchit
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
              </motion.div>
            </Box>
          ) : (
            <>
              <Typography variant="body1">
                {message.content}
              </Typography>
              {message.timestamp && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7,
                  }}
                >
                  {(() => {
                    try {
                      const ts = message.timestamp as any;
                      // Timestamp peut être: Date, string ISO, Firestore Timestamp, ou objet sérialisé
                      if (ts instanceof Date) {
                        return ts.toLocaleTimeString();
                      }
                      if (typeof ts === 'string') {
                        return new Date(ts).toLocaleTimeString();
                      }
                      if (ts?.seconds) {
                        // Firestore Timestamp sérialisé {seconds, nanoseconds}
                        return new Date(ts.seconds * 1000).toLocaleTimeString();
                      }
                      if (ts?.toDate) {
                        // Firestore Timestamp avec méthode toDate
                        return ts.toDate().toLocaleTimeString();
                      }
                      return '';
                    } catch {
                      return '';
                    }
                  })()}
                </Typography>
              )}
            </>
          )}
        </Paper>

        {isUser && (
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <Person />
          </Avatar>
        )}
      </Box>
    </motion.div>
  );
};