import { create } from 'zustand';
import type { PodcastResponse } from '@/services/ai.service';

export type Role = 'user' | 'assistant';

export interface ChatItem {
  role: Role;
  content: string;
  isQuiz: boolean;
}

interface AiState {
  isOpen: boolean;
  isMinimized: boolean;
  sessionId: string | null;
  messages: ChatItem[];
  uploadedFiles: string[];
  isLoading: boolean;
  isUploading: boolean;
  isGeneratingPodcast: boolean;
  podcastData: PodcastResponse | null;
  isPlayingAudio: boolean;

  // Actions
  setOpen: (isOpen: boolean) => void;
  setMinimized: (isMinimized: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  setMessages: (messages: ChatItem[]) => void;
  addMessage: (message: ChatItem) => void;
  clearMessages: () => void;
  setUploadedFiles: (files: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsUploading: (uploading: boolean) => void;
  setIsGeneratingPodcast: (generating: boolean) => void;
  setPodcastData: (data: PodcastResponse | null) => void;
  setIsPlayingAudio: (playing: boolean) => void;
  resetSession: () => void;
}

export const useAiStore = create<AiState>((set) => ({
  isOpen: false,
  isMinimized: false,
  sessionId: null,
  messages: [],
  uploadedFiles: [],
  isLoading: false,
  isUploading: false,
  isGeneratingPodcast: false,
  podcastData: null,
  isPlayingAudio: false,

  setOpen: (isOpen) => set({ isOpen }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  setSessionId: (sessionId) => set({ sessionId }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setUploadedFiles: (uploadedFiles) => set({ uploadedFiles }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setIsGeneratingPodcast: (isGeneratingPodcast) => set({ isGeneratingPodcast }),
  setPodcastData: (podcastData) => set({ podcastData }),
  setIsPlayingAudio: (isPlayingAudio) => set({ isPlayingAudio }),

  resetSession: () =>
    set({
      sessionId: null,
      messages: [],
      uploadedFiles: [],
      isLoading: false,
      isUploading: false,
      isGeneratingPodcast: false,
      podcastData: null,
      isPlayingAudio: false,
    }),
}));
