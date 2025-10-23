// Types aligned with frontend interfaces
export type UserId = string;
export type ProcessId = string;
export type MessageId = string;

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface ProcessStep {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "error";
  startedAt?: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  errorMessage?: string;
  order: number;
}

export interface Process {
  id: string;
  userId: string;
  sessionId: string;
  title: string;
  description: string;
  status: "created" | "running" | "paused" | "completed" | "failed";
  steps: ProcessStep[];
  currentStepIndex: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
}

export interface ActivityLog {
  id: string;
  processId: string;
  timestamp: FirebaseFirestore.Timestamp;
  type: "info" | "success" | "warning" | "error";
  message: string;
  details?: unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: FirebaseFirestore.Timestamp;
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
  timestamp: FirebaseFirestore.Timestamp;
  resolved: boolean;
  userChoice?: string;
}
