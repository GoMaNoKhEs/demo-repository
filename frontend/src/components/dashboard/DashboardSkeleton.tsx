import { Box, Skeleton, Paper } from '@mui/material';
import { LoadingSpinner } from '../common/LoadingSpinner';

/**
 * Skeleton pour le timeline des étapes
 */
const TimelineSkeleton = () => (
  <Box sx={{ p: 2 }}>
    {[1, 2, 3, 4].map((i) => (
      <Box key={i} sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>
    ))}
  </Box>
);

/**
 * Skeleton pour le journal d'activité
 */
const ActivityLogSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} variant="rounded" width={80} height={32} />
      ))}
    </Box>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Box key={i} sx={{ mb: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="30%" height={16} />
        </Box>
      </Box>
    ))}
  </Box>
);

/**
 * Skeleton pour l'interface de chat
 */
const ChatSkeleton = () => (
  <Box sx={{ p: 2 }}>
    {[1, 2, 3].map((i) => (
      <Box
        key={i}
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
        }}
      >
        <Skeleton
          variant="rounded"
          width={i % 2 === 0 ? '60%' : '70%'}
          height={60}
          sx={{ borderRadius: 2 }}
        />
      </Box>
    ))}
    <Skeleton variant="rounded" height={56} sx={{ mt: 2 }} />
  </Box>
);

interface DashboardSkeletonProps {
  /** Si true, affiche un spinner simple au lieu du skeleton détaillé */
  initialLoad?: boolean;
}

/**
 * Skeleton principal du dashboard
 * Affiche pendant le chargement des données
 * - initialLoad=true : Spinner simple (premier chargement)
 * - initialLoad=false : Skeleton détaillé (rafraîchissement)
 */
export const DashboardSkeleton = ({ initialLoad = false }: DashboardSkeletonProps) => {
  // Si c'est le premier chargement, afficher un spinner simple
  if (initialLoad) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <LoadingSpinner 
          message="Connexion au tableau de bord..."
          size="large"
        />
      </Box>
    );
  }

  // Sinon, afficher le skeleton détaillé
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, mb: 1 }} />
        <Skeleton variant="text" width={200} height={24} />
      </Box>

      {/* Layout 3 colonnes skeleton */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 2fr' },
          gap: 2,
          overflow: 'hidden',
        }}
      >
        {/* Timeline skeleton */}
        <Paper
          elevation={2}
          sx={{
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Skeleton variant="text" width={150} height={28} />
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <TimelineSkeleton />
          </Box>
        </Paper>

        {/* Activity log skeleton */}
        <Paper
          elevation={2}
          sx={{
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Skeleton variant="text" width={150} height={28} />
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <ActivityLogSkeleton />
          </Box>
        </Paper>

        {/* Chat skeleton */}
        <Paper
          elevation={2}
          sx={{
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Skeleton variant="text" width={200} height={28} />
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <ChatSkeleton />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
