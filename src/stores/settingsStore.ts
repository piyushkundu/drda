'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, AIModel, ExportFormat } from '@/types';

interface SettingsState extends Settings {
  setTheme: (theme: 'dark' | 'light') => void;
  setDefaultFont: (font: string) => void;
  setDefaultFontSize: (size: number) => void;
  setAIModel: (model: AIModel) => void;
  setAutoCorrect: (enabled: boolean) => void;
  setExportFormat: (format: ExportFormat) => void;
  setLanguage: (lang: 'hi' | 'en') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      defaultFont: 'Noto Sans Devanagari',
      defaultFontSize: 14,
      aiModel: 'llama-3.3-70b-versatile',
      autoCorrect: true,
      exportFormat: 'pdf',
      language: 'hi',

      setTheme: (theme) => set({ theme }),
      setDefaultFont: (font) => set({ defaultFont: font }),
      setDefaultFontSize: (size) => set({ defaultFontSize: size }),
      setAIModel: (model) => set({ aiModel: model }),
      setAutoCorrect: (enabled) => set({ autoCorrect: enabled }),
      setExportFormat: (format) => set({ exportFormat: format }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'page-hindi-settings-v2', // bumped to clear old Ollama model from localStorage
    }
  )
);
