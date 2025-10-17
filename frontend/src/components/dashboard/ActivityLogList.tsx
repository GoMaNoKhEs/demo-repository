import { Box, Typography, Chip, Paper } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { ActivityLog } from '../../types';

interface ActivityLogListProps {
  logs: ActivityLog[];
}

export const ActivityLogList = ({ logs }: ActivityLogListProps) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning' | 'info'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  // Debug pour vérifier le filtrage
  useEffect(() => {
    console.log('🔍 Filtre actuel:', filter);
    console.log('📊 Nombre de logs total:', logs.length);
    console.log('📊 Nombre de logs filtrés:', filteredLogs.length);
    console.log('📋 Types de logs disponibles:', logs.map(l => l.type));
  }, [filter, logs, filteredLogs]);

  const getIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'success':
        return <SuccessIcon sx={{ fontSize: 18, color: 'success.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />;
      case 'info':
        return <InfoIcon sx={{ fontSize: 18, color: 'info.main' }} />;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filtres */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label="Tous"
          size="small"
          onClick={() => setFilter('all')}
          color={filter === 'all' ? 'primary' : 'default'}
          variant={filter === 'all' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Succès"
          size="small"
          onClick={() => setFilter('success')}
          color={filter === 'success' ? 'success' : 'default'}
          variant={filter === 'success' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Erreurs"
          size="small"
          onClick={() => setFilter('error')}
          color={filter === 'error' ? 'error' : 'default'}
          variant={filter === 'error' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Avertissements"
          size="small"
          onClick={() => setFilter('warning')}
          color={filter === 'warning' ? 'warning' : 'default'}
          variant={filter === 'warning' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Info"
          size="small"
          onClick={() => setFilter('info')}
          color={filter === 'info' ? 'info' : 'default'}
          variant={filter === 'info' ? 'filled' : 'outlined'}
        />
      </Box>

      {/* Liste des logs */}
      <Box 
        key={filter}
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
        }}
      >
        {filteredLogs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
            Aucune activité {filter !== 'all' ? `de type "${filter}"` : ''} pour le moment
          </Typography>
        ) : (
          <>
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderLeft: 3,
                    borderColor: 
                      log.type === 'success' ? 'success.main' :
                      log.type === 'error' ? 'error.main' :
                      log.type === 'warning' ? 'warning.main' :
                      'info.main',
                    backgroundColor: 'background.default',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ mt: 0.2 }}>
                      {getIcon(log.type)}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {log.message}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        fontSize: '0.7rem',
                      }}
                    >
                      {formatTime(log.timestamp)}
                    </Typography>
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </>
        )}
        <div ref={logsEndRef} />
      </Box>
    </Box>
  );
};
