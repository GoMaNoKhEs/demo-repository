import { Box, Paper, Typography, Button, IconButton, Stack, Slider, Chip, Tooltip } from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Pause as PauseIcon, 
  Stop as StopIcon,
  Speed as SpeedIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import { useDemoSimulation } from '../../hooks/useDemoSimulation';

interface DemoModeControlsProps {
  onStart: () => void;
  onStop: () => void;
  isActive: boolean;
}

export const DemoModeControls = ({ onStart, onStop, isActive }: DemoModeControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [progress, setProgress] = useState(0);
  
  // État pour rendre le panel draggable
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Hook de simulation qui gère toute la logique de démo
  const { resetDemo } = useDemoSimulation({
    isActive,
    isPlaying,
    speed,
    onProgressUpdate: (newProgress) => setProgress(newProgress),
    onComplete: () => setIsPlaying(false),
  });
  
  // Gestionnaires de drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStart]);

  const handlePlay = () => {
    if (!isActive) {
      onStart();
      setProgress(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setProgress(0);
    resetDemo(); // Réinitialiser la simulation
    onStop();
  };

  if (!isActive) {
    return (
      <Box sx={{ position: 'fixed', bottom: 24, left: 24, zIndex: 1000 }}> {/* En bas à GAUCHE pour ne pas gêner le chat ni le bouton de prise de contrôle */}
        <Tooltip title="Activer le mode démonstration automatique">
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayIcon />}
            onClick={handlePlay}
            sx={{
              bgcolor: 'secondary.main',
              color: 'white',
              '&:hover': { bgcolor: 'secondary.dark' },
              boxShadow: 4,
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 'bold',
            }}
          >
            Mode Démo
          </Button>
        </Tooltip>
      </Box>
    );
  }

  return (
    <>
      {/* Bannière Mode Démo en haut */}
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          bgcolor: 'warning.main',
          color: 'white',
          py: 1,
          px: 3,
          textAlign: 'center',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
          <Chip
            label="🎬 MODE DÉMONSTRATION"
            size="small"
            sx={{
              bgcolor: 'rgba(0,0,0,0.2)',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Typography variant="body2" fontWeight="medium">
            Simulation automatique de l'agent IA • Progression : {Math.round(progress)}%
          </Typography>
        </Stack>
      </Paper>

      {/* Contrôles flottants - DRAGGABLE */}
      <Paper
        ref={panelRef}
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: position.y === 0 ? 24 : 'auto',
          right: position.y === 0 ? 24 : 'auto',
          top: position.y !== 0 ? position.y : 'auto',
          left: position.x !== 0 ? position.x : 'auto',
          transform: position.y === 0 ? 'none' : `translate(${position.x}px, ${position.y}px)`,
          zIndex: 1100,
          p: 3,
          borderRadius: 3,
          minWidth: 320,
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
          bgcolor: 'background.paper',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <Stack spacing={2.5}>
          {/* Header avec indicateur de drag */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <DragIcon fontSize="small" color="action" sx={{ cursor: 'grab' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                🎮 Contrôles Démo
              </Typography>
            </Stack>
            <Chip
              label={`${Math.round(progress)}%`}
              size="small"
              color={progress === 100 ? 'success' : 'primary'}
            />
          </Stack>

          {/* Boutons Play/Pause/Stop */}
          <Stack direction="row" spacing={1.5} justifyContent="center">
            {!isPlaying ? (
              <Tooltip title="Démarrer la simulation">
                <IconButton
                  onClick={handlePlay}
                  sx={{
                    bgcolor: 'success.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'success.dark' },
                    width: 56,
                    height: 56,
                  }}
                >
                  <PlayIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Mettre en pause">
                <IconButton
                  onClick={handlePause}
                  sx={{
                    bgcolor: 'warning.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'warning.dark' },
                    width: 56,
                    height: 56,
                  }}
                >
                  <PauseIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Arrêter et réinitialiser">
              <IconButton
                onClick={handleStop}
                sx={{
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' },
                  width: 56,
                  height: 56,
                }}
              >
                <StopIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Contrôle de vitesse */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <SpeedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight="medium">
                Vitesse : {speed}x
              </Typography>
            </Stack>
            <Slider
              value={speed}
              onChange={(_, value) => setSpeed(value as number)}
              min={0.5}
              max={3}
              step={0.5}
              marks={[
                { value: 0.5, label: '0.5x' },
                { value: 1, label: '1x' },
                { value: 2, label: '2x' },
                { value: 3, label: '3x' },
              ]}
              valueLabelDisplay="auto"
              size="small"
              sx={{
                '& .MuiSlider-markLabel': {
                  fontSize: '0.7rem',
                },
              }}
            />
          </Box>

          {/* Barre de progression */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Progression de la simulation
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 1,
                overflow: 'hidden',
                mt: 0.5,
              }}
            >
              <Box
                sx={{
                  width: `${progress}%`,
                  height: '100%',
                  bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                  transition: 'width 0.2s, background-color 0.3s',
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>
    </>
  );
};
