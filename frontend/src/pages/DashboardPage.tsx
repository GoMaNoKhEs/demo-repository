import { Box, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ChatInterface } from '../components/chat/ChatInterface';
import { useAppStore } from '../stores/useAppStore';
import { mockProcess, mockActivityLogs, mockChatMessages } from '../mocks/data';

export const DashboardPage = () => {
  const {
    setCurrentProcess,
    activityLogs,
    addActivityLog,
    addChatMessage,
  } = useAppStore();

  // Charger les données mockées au montage
  useEffect(() => {
    setCurrentProcess(mockProcess);
    
    // Ajouter les logs mockés
    mockActivityLogs.forEach((log) => {
      addActivityLog(log);
    });

    // Ajouter les messages mockés
    mockChatMessages.forEach((message) => {
      addChatMessage(message);
    });
  }, [setCurrentProcess, addActivityLog, addChatMessage]);

  return (
    <Box>
      {/* Header avec progression */}
      <DashboardHeader />

      {/* Grille principale */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Colonne gauche : Timeline & Activity Logs */}
        <Box sx={{ flex: { xs: '1', md: '0 0 33%' } }}>
          <Paper
            sx={{
              p: 3,
              height: '70vh',
              overflowY: 'auto',
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📋 Journal d'Activité
            </Typography>

            <Box sx={{ mt: 2 }}>
              {activityLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aucune activité pour le moment
                </Typography>
              ) : (
                activityLogs.map((log) => (
                  <Box
                    key={log.id}
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          mr: 1,
                          backgroundColor:
                            log.type === 'success'
                              ? 'success.main'
                              : log.type === 'error'
                              ? 'error.main'
                              : log.type === 'warning'
                              ? 'warning.main'
                              : 'info.main',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {log.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{log.message}</Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        {/* Colonne droite : Chat Interface */}
        <Box sx={{ flex: { xs: '1', md: '0 0 66%' } }}>
          <Paper
            sx={{
              height: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                💬 Conversation avec SimplifIA
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <ChatInterface />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};