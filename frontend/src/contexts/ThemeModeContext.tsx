import React, { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeModeContext } from './ThemeModeContextDefinition';
import type { ThemeMode } from './ThemeModeContextDefinition';

interface ThemeModeProviderProps {
  children: ReactNode;
}

export const ThemeModeProvider: React.FC<ThemeModeProviderProps> = ({ children }) => {
  // Récupérer le mode depuis localStorage ou utiliser 'light' par défaut
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode === 'dark' || savedMode === 'light') ? savedMode : 'light';
  });

  // Persister le mode dans localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Créer le thème Material-UI basé sur le mode
  const theme: Theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#4285F4', // Google Blue
            light: '#669DF6',
            dark: '#1967D2',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#34A853', // Google Green
            light: '#81C995',
            dark: '#0D652D',
            contrastText: '#FFFFFF',
          },
          error: {
            main: '#EA4335', // Google Red
            light: '#F28B82',
            dark: '#C5221F',
            contrastText: '#FFFFFF',
          },
          warning: {
            main: '#FBBC04', // Google Yellow
            light: '#FDD663',
            dark: '#F29900',
            contrastText: '#000000',
          },
          success: {
            main: '#0F9D58', // Google Green Success
            light: '#57BB8A',
            dark: '#0B8043',
            contrastText: '#FFFFFF',
          },
          info: {
            main: '#4285F4',
            light: '#669DF6',
            dark: '#1967D2',
            contrastText: '#FFFFFF',
          },
          ...(mode === 'light'
            ? {
                // Light mode
                background: {
                  default: '#F5F5F5',
                  paper: '#FFFFFF',
                },
                text: {
                  primary: '#202124',
                  secondary: '#5F6368',
                },
              }
            : {
                // Dark mode
                background: {
                  default: '#121212',
                  paper: '#1E1E1E',
                },
                text: {
                  primary: '#E8EAED',
                  secondary: '#9AA0A6',
                },
              }),
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 500,
            fontSize: '2.5rem',
          },
          h2: {
            fontWeight: 500,
            fontSize: '2rem',
          },
          h3: {
            fontWeight: 500,
            fontSize: '1.75rem',
          },
          h4: {
            fontWeight: 500,
            fontSize: '1.5rem',
          },
          h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
          },
          h6: {
            fontWeight: 500,
            fontSize: '1rem',
          },
          button: {
            textTransform: 'none', // Pas de CAPS par défaut
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '8px 16px',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light' 
                  ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
                  : '0 2px 4px rgba(0,0,0,0.5)',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                fontWeight: 500,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none', // Disable default gradient in dark mode
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light'
                  ? '0 1px 3px rgba(0,0,0,0.12)'
                  : '0 2px 4px rgba(0,0,0,0.5)',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
};
