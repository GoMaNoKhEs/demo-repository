import { create } from 'zustand';
import type { User, Process, ActivityLog, ChatMessage } from '../types';

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
  setActivityLogs: (logs: ActivityLog[]) => void;
  clearActivityLogs: () => void;
  
  // Chat Messages
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
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
  setActivityLogs: (logs) => set({ activityLogs: logs }),
  clearActivityLogs: () => set({ activityLogs: [] }),
  
  // Chat Messages
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  setChatMessages: (messages: ChatMessage[]) => set({ chatMessages: messages }),
  clearChatMessages: () => set({ chatMessages: [] }),
  
  // UI State
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  isAgentThinking: false,
  setAgentThinking: (thinking) => set({ isAgentThinking: thinking }),
}));