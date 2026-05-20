'use client';

import { create } from 'zustand';
import type { AIModel, AICorrection } from '@/types';

interface AIState {
  selectedModel: AIModel;
  isConnected: boolean;
  isProcessing: boolean;
  suggestions: AICorrection[];
  streamingText: string;
  availableModels: string[];
  isAutoSuggestEnabled: boolean;

  setSelectedModel: (model: AIModel) => void;
  setConnected: (connected: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setSuggestions: (suggestions: AICorrection[]) => void;
  addSuggestion: (suggestion: AICorrection) => void;
  clearSuggestions: () => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (text: string) => void;
  setAvailableModels: (models: string[]) => void;
  setAutoSuggestEnabled: (enabled: boolean) => void;
}

export const useAIStore = create<AIState>((set) => ({
  selectedModel: 'llama-3.3-70b-versatile',
  isConnected: false,
  isProcessing: false,
  suggestions: [],
  streamingText: '',
  availableModels: [],
  isAutoSuggestEnabled: true,

  setSelectedModel: (model) => set({ selectedModel: model }),
  setConnected: (connected) => set({ isConnected: connected }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setSuggestions: (suggestions) => set({ suggestions }),
  addSuggestion: (suggestion) =>
    set((s) => ({ suggestions: [...s.suggestions, suggestion] })),
  clearSuggestions: () => set({ suggestions: [] }),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingText: (text) =>
    set((s) => ({ streamingText: s.streamingText + text })),
  setAvailableModels: (models) => set({ availableModels: models }),
  setAutoSuggestEnabled: (enabled) => set({ isAutoSuggestEnabled: enabled }),
}));
