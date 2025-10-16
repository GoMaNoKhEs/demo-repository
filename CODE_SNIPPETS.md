# 🚀 Quick Start Code Snippets - SimplifIA Frontend

Ce document contient tous les snippets de code prêts à copier-coller pour démarrer rapidement.

---

## 📦 Configuration Initiale

### 1. Configuration du Thème Material UI

**Fichier** : `src/theme/index.ts`

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4', // Bleu Google
      light: '#669DF6',
      dark: '#1967D2',
    },
    secondary: {
      main: '#34A853', // Vert confiance
      light: '#5BB974',
      dark: '#0D652D',
    },
    error: {
      main: '#EA4335',
    },
    warning: {
      main: '#FBBC04',
    },
    success: {
      main: '#0F9D58',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none', // Pas de UPPERCASE
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});
```

### 2. Configuration Firebase

**Fichier** : `src/config/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();

// Activer la persistence offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});
```

**Fichier** : `.env.local`

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Types TypeScript

**Fichier** : `src/types/index.ts`

```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface ProcessStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  order: number;
}

export interface Process {
  id: string;
  userId: string;
  sessionId: string;
  title: string;
  description: string;
  status: 'created' | 'running' | 'paused' | 'completed' | 'failed';
  steps: ProcessStep[];
  currentStepIndex: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ActivityLog {
  id: string;
  processId: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    actionId?: string;
    stepId?: string;
  };
}

export interface CriticalDecision {
  id: string;
  processId: string;
  stepId: string;
  question: string;
  description: string;
  options: {
    label: string;
    value: string;
    isIrreversible: boolean;
  }[];
  timestamp: Date;
  resolved: boolean;
  userChoice?: string;
}
```

### 4. Store Zustand Global

**Fichier** : `src/stores/useAppStore.ts`

```typescript
import { create } from 'zustand';
import { User, Process, ActivityLog, ChatMessage } from '../types';

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Current Process
  currentProcess: Process | null;
  setCurrentProcess: (process: Process | null) => void;
  
  // Activity Logs
  activityLogs: ActivityLog[];
  addActivityLog: (log: ActivityLog) => void;
  clearActivityLogs: () => void;
  
  // Chat Messages
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  
  isAgentThinking: boolean;
  setAgentThinking: (thinking: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),
  
  // Current Process
  currentProcess: null,
  setCurrentProcess: (process) => set({ currentProcess: process }),
  
  // Activity Logs
  activityLogs: [],
  addActivityLog: (log) => set((state) => ({
    activityLogs: [...state.activityLogs, log]
  })),
  clearActivityLogs: () => set({ activityLogs: [] }),
  
  // Chat Messages
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  clearChatMessages: () => set({ chatMessages: [] }),
  
  // UI State
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  isAgentThinking: false,
  setAgentThinking: (thinking) => set({ isAgentThinking: thinking }),
}));
```

### 5. Service Temps Réel Firestore

**Fichier** : `src/services/realtime.ts`

```typescript
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Process, ActivityLog } from '../types';

export const subscribeToProcess = (
  sessionId: string,
  callback: (process: Process) => void
) => {
  const q = query(
    collection(db, 'processes'),
    where('sessionId', '==', sessionId)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
      } as Process);
    });
  });
};

export const subscribeToActivityLogs = (
  processId: string,
  callback: (logs: ActivityLog[]) => void
) => {
  const q = query(
    collection(db, 'activity_logs'),
    where('processId', '==', processId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as ActivityLog));
    
    callback(logs);
  });
};
```

---

## 🎨 Composants Réutilisables

### Button Personnalisé

**Fichier** : `src/components/common/Button.tsx`

```typescript
import { Button as MuiButton, ButtonProps, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

interface CustomButtonProps extends ButtonProps {
  loading?: boolean;
}

export const Button = ({ loading, children, disabled, ...props }: CustomButtonProps) => {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <MuiButton
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          children
        )}
      </MuiButton>
    </motion.div>
  );
};
```

### Card Personnalisée

**Fichier** : `src/components/common/Card.tsx`

```typescript
import { Card as MuiCard, CardProps } from '@mui/material';
import { motion } from 'framer-motion';

export const Card = ({ children, ...props }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <MuiCard {...props}>
        {children}
      </MuiCard>
    </motion.div>
  );
};
```

### Status Badge

**Fichier** : `src/components/common/StatusBadge.tsx`

```typescript
import { Chip, ChipProps } from '@mui/material';
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
```

---

## 📱 Composants Principaux

### Layout Principal

**Fichier** : `src/components/layout/MainLayout.tsx`

```typescript
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

const DRAWER_WIDTH = 280;

export const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
        SimplifIA
      </Typography>
      {/* Navigation items */}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            SimplifIA - Agent d'Autonomie Administrative
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
```

### Chat Interface

**Fichier** : `src/components/chat/ChatInterface.tsx`

```typescript
import { Box, TextField, IconButton, Paper } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { useAppStore } from '../../stores/useAppStore';

export const ChatInterface = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chatMessages, addChatMessage, isAgentThinking } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Ajouter le message de l'utilisateur
    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    });

    setInput('');

    // TODO: Envoyer au backend
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.paper',
        borderRadius: 2,
      }}
    >
      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {chatMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isAgentThinking && (
          <MessageBubble
            message={{
              id: 'thinking',
              role: 'agent',
              content: 'L\'agent réfléchit...',
              timestamp: new Date(),
            }}
            isThinking
          />
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          gap: 1,
          borderRadius: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Décrivez votre situation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <Send />
        </IconButton>
      </Paper>
    </Box>
  );
};
```

### Message Bubble

**Fichier** : `src/components/chat/MessageBubble.tsx`

```typescript
import { Box, Avatar, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { SmartToy, Person } from '@mui/icons-material';
import { ChatMessage } from '../../types';

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
          <Typography variant="body1">
            {message.content}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              opacity: 0.7,
            }}
          >
            {message.timestamp.toLocaleTimeString()}
          </Typography>
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
```

### Dashboard Header

**Fichier** : `src/components/dashboard/DashboardHeader.tsx`

```typescript
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useAppStore } from '../../stores/useAppStore';

export const DashboardHeader = () => {
  const { currentProcess } = useAppStore();

  if (!currentProcess) return null;

  const completedSteps = currentProcess.steps.filter(s => s.status === 'completed').length;
  const totalSteps = currentProcess.steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          Mission en cours : {currentProcess.title}
        </Typography>
        
        <Chip
          label={`${completedSteps}/${totalSteps} étapes`}
          color="primary"
          size="large"
        />
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
          },
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {progress.toFixed(0)}% complété
      </Typography>
    </Box>
  );
};
```

---

## 🎯 Données Mockées pour Tests

**Fichier** : `src/mocks/data.ts`

```typescript
import { Process, ActivityLog, ChatMessage } from '../types';

export const mockProcess: Process = {
  id: '1',
  userId: 'user1',
  sessionId: 'session1',
  title: 'Démarches suite à une naissance',
  description: 'Orchestration de 12 démarches administratives pour Marie Dubois',
  status: 'running',
  currentStepIndex: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  steps: [
    {
      id: 'step1',
      name: 'Déclaration de naissance à la mairie',
      status: 'completed',
      order: 1,
      startedAt: new Date(Date.now() - 300000),
      completedAt: new Date(Date.now() - 240000),
    },
    {
      id: 'step2',
      name: 'Demande d\'acte de naissance',
      status: 'completed',
      order: 2,
      startedAt: new Date(Date.now() - 240000),
      completedAt: new Date(Date.now() - 180000),
    },
    {
      id: 'step3',
      name: 'Inscription à la CAF',
      status: 'in-progress',
      order: 3,
      startedAt: new Date(Date.now() - 60000),
    },
    {
      id: 'step4',
      name: 'Déclaration Sécurité Sociale',
      status: 'pending',
      order: 4,
    },
    // ... autres étapes
  ],
};

export const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    processId: '1',
    timestamp: new Date(Date.now() - 180000),
    type: 'success',
    message: 'Formulaire de déclaration soumis avec succès',
  },
  {
    id: '2',
    processId: '1',
    timestamp: new Date(Date.now() - 120000),
    type: 'error',
    message: 'Erreur : Format PDF non accepté',
  },
  {
    id: '3',
    processId: '1',
    timestamp: new Date(Date.now() - 90000),
    type: 'info',
    message: 'Conversion PDF → JPG en cours...',
  },
  {
    id: '4',
    processId: '1',
    timestamp: new Date(Date.now() - 60000),
    type: 'success',
    message: 'Document resoumis avec succès',
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'agent',
    content: 'Bonjour ! Je suis SimplifIA, votre assistant administratif. Comment puis-je vous aider ?',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: '2',
    role: 'user',
    content: 'Je viens d\'avoir un bébé et je dois faire toutes les démarches',
    timestamp: new Date(Date.now() - 580000),
  },
  {
    id: '3',
    role: 'agent',
    content: 'Félicitations ! Je vais vous aider à orchestrer toutes les démarches. J\'ai identifié 12 étapes à accomplir. Souhaitez-vous que je commence ?',
    timestamp: new Date(Date.now() - 560000),
  },
];
```

---

## 🚀 App.tsx Complet

**Fichier** : `src/App.tsx`

```typescript
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="dashboard" element={<DashboardPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
```

---

## � Pages Complètes

### Page de Login

**Fichier** : `src/pages/LoginPage.tsx`

```typescript
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { Google } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      setUser({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      // TODO: Afficher une notification d'erreur
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 6,
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SimplifIA
            </Typography>

            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Votre Agent d'Autonomie Administrative
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Orchestrez vos démarches administratives en toute simplicité avec l'intelligence artificielle.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<Google />}
              onClick={handleGoogleLogin}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                textTransform: 'none',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              Se connecter avec Google
            </Button>

            <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                🔒 Vos données sont protégées et hébergées en Europe (RGPD)
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};
```

### Page d'Accueil

**Fichier** : `src/pages/HomePage.tsx`

```typescript
import { Box, Typography, Button, Container, Grid, Card, CardContent } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  SmartToy,
  Timeline,
  Security,
  Speed,
  AutoAwesome,
  CheckCircle,
} from '@mui/icons-material';

const features = [
  {
    icon: <SmartToy fontSize="large" />,
    title: 'Agent Autonome',
    description: 'Raisonnement, planification et exécution automatiques',
  },
  {
    icon: <Timeline fontSize="large" />,
    title: 'Orchestration Intelligente',
    description: 'Gestion de multiples démarches en parallèle',
  },
  {
    icon: <Security fontSize="large" />,
    title: 'Points de Contrôle',
    description: 'Validation éthique sur les décisions critiques',
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'Temps Réel',
    description: 'Suivi live de l\'avancement de vos dossiers',
  },
  {
    icon: <AutoAwesome fontSize="large" />,
    title: 'Auto-Correction',
    description: 'Détection et résolution automatique d\'erreurs',
  },
  {
    icon: <CheckCircle fontSize="large" />,
    title: 'Conformité RGPD',
    description: 'Hébergement Europe, souveraineté des données',
  },
];

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
          color: 'white',
          py: 12,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              SimplifIA
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.95 }}>
              L'Agent d'IA qui simplifie vos démarches administratives
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
              onClick={() => navigate('/dashboard')}
            >
              Démarrer maintenant
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Pourquoi SimplifIA ?
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 6 }}
        >
          Une solution complète pour gérer toutes vos démarches administratives
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Box
                      sx={{
                        color: 'primary.main',
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Prêt à simplifier votre vie administrative ?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
            Rejoignez les utilisateurs qui ont déjà adopté SimplifIA
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              px: 6,
              py: 2,
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
            onClick={() => navigate('/login')}
          >
            Commencer gratuitement
          </Button>
        </Container>
      </Box>
    </Box>
  );
};
```

### Page Dashboard

**Fichier** : `src/pages/DashboardPage.tsx`

```typescript
import { Box, Grid, Paper, Typography } from '@mui/material';
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
    chatMessages,
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
  }, []);

  return (
    <Box>
      {/* Header avec progression */}
      <DashboardHeader />

      {/* Grille principale */}
      <Grid container spacing={3}>
        {/* Colonne gauche : Timeline & Activity Logs */}
        <Grid item xs={12} md={4}>
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
        </Grid>

        {/* Colonne droite : Chat Interface */}
        <Grid item xs={12} md={8}>
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
        </Grid>
      </Grid>
    </Box>
  );
};
```

---

## �📝 Scripts Package.json

**Fichier** : `package.json` (scripts section)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\""
  }
}
```

---

**Tous ces snippets sont prêts à l'emploi ! Copiez-collez et ajustez selon vos besoins. 🚀**
