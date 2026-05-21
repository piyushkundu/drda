'use client';

import { create } from 'zustand';
import type { SidebarPanel, RibbonTab } from '@/types';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarPanel: SidebarPanel;
  ribbonTab: RibbonTab;
  theme: 'dark' | 'light';
  showExportDialog: boolean;
  showAIPanel: boolean;
  isMobile: boolean;

  toggleSidebar: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setRibbonTab: (tab: RibbonTab) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setShowExportDialog: (show: boolean) => void;
  setShowAIPanel: (show: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: true,
  sidebarPanel: 'dashboard',
  ribbonTab: 'home',
  theme: 'light',
  showExportDialog: false,
  showAIPanel: false,
  isMobile: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
  setRibbonTab: (tab) => set({ ribbonTab: tab }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setShowExportDialog: (show) => set({ showExportDialog: show }),
  setShowAIPanel: (show) => set({ showAIPanel: show }),
  setIsMobile: (isMobile) => set({ isMobile }),
}));
