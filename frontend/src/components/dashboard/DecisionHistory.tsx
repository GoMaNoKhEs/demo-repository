import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton,
  Collapse,
  Alert,
  Divider,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Undo as UndoIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface Decision {
  id: string;
  timestamp: Date;
  actionTitle: string;
  actionDescription: string;
  userChoice: 'authorized' | 'cancelled';
  riskLevel: 'high' | 'medium' | 'low';
  consequences: string[];
  canRevert: boolean;
  revertedAt?: Date;
  context?: {
    processId: string;
    stepNumber: number;
    url?: string;
  };
}

interface DecisionHistoryProps {
  decisions: Decision[];
  onRevert?: (decisionId: string) => void;
}

const DecisionItem: React.FC<{
  decision: Decision;
  onRevert?: (decisionId: string) => void;
}> = ({ decision, onRevert }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    if (decision.revertedAt) {
      return <UndoIcon sx={{ color: 'warning.main' }} />;
    }
    return decision.userChoice === 'authorized' 
      ? <CheckCircleIcon sx={{ color: 'success.main' }} />
      : <CancelIcon sx={{ color: 'error.main' }} />;
  };

  const getStatusColor = () => {
    if (decision.revertedAt) return 'warning';
    return decision.userChoice === 'authorized' ? 'success' : 'error';
  };

  const getStatusLabel = () => {
    if (decision.revertedAt) return 'Annulée';
    return decision.userChoice === 'authorized' ? 'Autorisée' : 'Refusée';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        '&:last-child': { mb: 0 },
        borderLeft: 4,
        borderLeftColor: `${getStatusColor()}.main`
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Icon */}
        <Box sx={{ mt: 0.5 }}>
          {getStatusIcon()}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          {/* Title and status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {decision.actionTitle}
            </Typography>
            <Chip
              label={getStatusLabel()}
              size="small"
              color={getStatusColor()}
              sx={{ height: 20 }}
            />
            <Chip
              label={decision.riskLevel === 'high' ? 'Risque Élevé' : decision.riskLevel === 'medium' ? 'Risque Moyen' : 'Risque Faible'}
              size="small"
              color={getRiskColor(decision.riskLevel)}
              variant="outlined"
              sx={{ height: 20 }}
            />
          </Box>

          {/* Timestamp */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {formatDate(decision.timestamp)}
            {decision.context?.stepNumber && ` • Étape ${decision.context.stepNumber}`}
          </Typography>

          {/* Description */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {decision.actionDescription}
          </Typography>

          {/* Revert info */}
          {decision.revertedAt && (
            <Alert severity="warning" icon={<UndoIcon />} sx={{ py: 0.5, mb: 1 }}>
              <Typography variant="caption">
                Annulée le {formatDate(decision.revertedAt)}
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {/* Revert button */}
          {decision.canRevert && !decision.revertedAt && decision.userChoice === 'authorized' && (
            <Tooltip title="Annuler cette décision">
              <IconButton
                size="small"
                color="warning"
                onClick={() => onRevert?.(decision.id)}
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Expand button */}
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1.5}>
          {/* Consequences */}
          <Box>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom>
              Conséquences :
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {decision.consequences.map((consequence, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <WarningIcon sx={{ fontSize: 14, color: 'text.secondary', mt: 0.2 }} />
                  <Typography variant="caption" color="text.secondary">
                    {consequence}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* URL if available */}
          {decision.context?.url && (
            <Box>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom>
                URL concernée :
              </Typography>
              <Box
                sx={{
                  p: 1,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  mt: 0.5
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all'
                  }}
                >
                  {decision.context.url}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
};

const DecisionHistory: React.FC<DecisionHistoryProps> = ({ 
  decisions, 
  onRevert 
}) => {
  if (decisions.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Aucune décision critique n'a encore été prise
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Les décisions importantes apparaîtront ici
        </Typography>
      </Paper>
    );
  }

  // Statistiques
  const authorizedCount = decisions.filter(d => d.userChoice === 'authorized' && !d.revertedAt).length;
  const cancelledCount = decisions.filter(d => d.userChoice === 'cancelled').length;
  const revertedCount = decisions.filter(d => d.revertedAt).length;

  return (
    <Box>
      {/* Header avec statistiques */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Historique des Décisions Critiques
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${authorizedCount} autorisée${authorizedCount > 1 ? 's' : ''}`}
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            label={`${cancelledCount} refusée${cancelledCount > 1 ? 's' : ''}`}
            size="small"
            color="error"
            variant="outlined"
          />
          {revertedCount > 0 && (
            <Chip
              label={`${revertedCount} annulée${revertedCount > 1 ? 's' : ''}`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Liste des décisions */}
      <Stack spacing={0}>
        {decisions
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .map((decision) => (
            <DecisionItem
              key={decision.id}
              decision={decision}
              onRevert={onRevert}
            />
          ))}
      </Stack>
    </Box>
  );
};

export default DecisionHistory;
