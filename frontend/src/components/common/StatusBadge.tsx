import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  CheckCircle,
  RadioButtonChecked,
  Error,
  HourglassEmpty,
} from '@mui/icons-material';

type Status = 'completed' | 'in-progress' | 'error' | 'pending';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: Status;
}

const statusConfig = {
  completed: {
    label: 'Complété',
    color: 'success' as const,
    icon: <CheckCircle />,
  },
  'in-progress': {
    label: 'En cours',
    color: 'primary' as const,
    icon: <RadioButtonChecked />,
  },
  error: {
    label: 'Erreur',
    color: 'error' as const,
    icon: <Error />,
  },
  pending: {
    label: 'En attente',
    color: 'default' as const,
    icon: <HourglassEmpty />,
  },
};

export const StatusBadge = ({ status, ...props }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon}
      size="small"
      {...props}
    />
  );
};
