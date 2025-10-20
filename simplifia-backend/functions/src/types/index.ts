// general types used in the project
export type UserId = string;
export type ProcessId = string;
export type MessageId = string;

export interface User {
  id: UserId;
  email: string;
  name: string;
}

export interface Process {
  id: ProcessId;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  userId: UserId;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ChatMessage {
  id: MessageId;
  processId: ProcessId;
  content: string;
  role: 'user' | 'assistant';
  timestamp: FirebaseFirestore.Timestamp;
}