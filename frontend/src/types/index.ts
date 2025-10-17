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
  details?: unknown;
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