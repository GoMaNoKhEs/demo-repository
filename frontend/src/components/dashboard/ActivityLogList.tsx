import { 
  Box, 
  Typography, 
  Chip, 
  Paper, 
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PushPin as PinIcon,
  PushPinOutlined as PinOutlinedIcon,
} from '@mui/icons-material';
import type { ActivityLog } from '../../types';

interface ActivityLogListProps {
  logs: ActivityLog[];
}

export const ActivityLogList = ({ logs }: ActivityLogListProps) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning' | 'info'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Grouper les logs par type
  const groupedLogs = {
    success: logs.filter(log => log.type === 'success'),
    error: logs.filter(log => log.type === 'error'),
    warning: logs.filter(log => log.type === 'warning'),
    info: logs.filter(log => log.type === 'info'),
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

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

  const getBackgroundColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'success':
        return 'rgba(76, 175, 80, 0.08)'; // Vert léger
      case 'error':
        return 'rgba(244, 67, 54, 0.08)'; // Rouge léger
      case 'warning':
        return 'rgba(255, 152, 0, 0.08)'; // Orange léger
      case 'info':
        return 'rgba(33, 150, 243, 0.08)'; // Bleu léger
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
      {/* En-tête avec filtres et toggle auto-scroll */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`Tous (${logs.length})`}
            size="small"
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Succès (${groupedLogs.success.length})`}
            size="small"
            onClick={() => setFilter('success')}
            color={filter === 'success' ? 'success' : 'default'}
            variant={filter === 'success' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Erreurs (${groupedLogs.error.length})`}
            size="small"
            onClick={() => setFilter('error')}
            color={filter === 'error' ? 'error' : 'default'}
            variant={filter === 'error' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Avertissements (${groupedLogs.warning.length})`}
            size="small"
            onClick={() => setFilter('warning')}
            color={filter === 'warning' ? 'warning' : 'default'}
            variant={filter === 'warning' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Info (${groupedLogs.info.length})`}
            size="small"
            onClick={() => setFilter('info')}
            color={filter === 'info' ? 'info' : 'default'}
            variant={filter === 'info' ? 'filled' : 'outlined'}
          />
        </Box>
        
        {/* Toggle Auto-scroll */}
        <Tooltip title={autoScroll ? "Auto-scroll activé" : "Auto-scroll désactivé"}>
          <IconButton 
            size="small" 
            onClick={() => setAutoScroll(!autoScroll)}
            color={autoScroll ? "primary" : "default"}
          >
            {autoScroll ? <PinIcon /> : <PinOutlinedIcon />}
          </IconButton>
        </Tooltip>
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
            {filteredLogs.map((log, index) => {
              const isExpanded = expandedLogs.has(log.id);
              const hasDetails = log.details != null && 
                typeof log.details === 'object' && 
                Object.keys(log.details).length > 0;
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderLeft: 3,
                      borderColor: 
                        log.type === 'success' ? 'success.main' :
                        log.type === 'error' ? 'error.main' :
                        log.type === 'warning' ? 'warning.main' :
                        'info.main',
                      backgroundColor: getBackgroundColor(log.type),
                      transition: 'all 0.2s',
                      cursor: hasDetails ? 'pointer' : 'default',
                      '&:hover': {
                        backgroundColor: log.type === 'success' ? 'rgba(76, 175, 80, 0.12)' :
                          log.type === 'error' ? 'rgba(244, 67, 54, 0.12)' :
                          log.type === 'warning' ? 'rgba(255, 152, 0, 0.12)' :
                          'rgba(33, 150, 243, 0.12)',
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => hasDetails && toggleLogExpansion(log.id)}
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
                        
                        {/* Détails expandables */}
                        {hasDetails && (
                          <Collapse in={isExpanded}>
                            <Box 
                              sx={{ 
                                mt: 1.5, 
                                p: 1.5, 
                                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                borderRadius: 1,
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                Détails :
                              </Typography>
                              <pre style={{ 
                                margin: 0, 
                                whiteSpace: 'pre-wrap', 
                                wordBreak: 'break-word',
                                fontSize: '0.7rem',
                              }}>
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </Box>
                          </Collapse>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
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
                        {hasDetails && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.65rem',
                              fontStyle: 'italic',
                            }}
                          >
                            {isExpanded ? '▲ Masquer' : '▼ Détails'}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
          </>
        )}
        <div ref={logsEndRef} />
      </Box>
    </Box>
  );
};
