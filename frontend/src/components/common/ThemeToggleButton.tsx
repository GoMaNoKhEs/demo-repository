import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeMode } from '../../hooks/useThemeMode';

export const ThemeToggleButton = () => {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        aria-label={mode === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
        sx={{
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'rotate(20deg)',
          },
        }}
      >
        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};
