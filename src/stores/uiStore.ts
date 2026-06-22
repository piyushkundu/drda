'use client';

import { create } from 'zustand';
import type { SidebarPanel, RibbonTab } from '@/types';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarPanel: SidebarPanel;
  ribbonTab: RibbonTab;
  ribbonCollapsed: boolean;
  theme: 'dark' | 'light';
  showExportDialog: boolean;
  showAIPanel: boolean;
  isMobile: boolean;
  directCursorMode: boolean;

  toggleSidebar: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setRibbonTab: (tab: RibbonTab) => void;
  toggleRibbon: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setShowExportDialog: (show: boolean) => void;
  setShowAIPanel: (show: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  toggleDirectCursorMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: true,
  sidebarPanel: 'dashboard',
  ribbonTab: 'home',
  ribbonCollapsed: false,
  theme: 'light',
  showExportDialog: false,
  showAIPanel: false,
  isMobile: false,
  directCursorMode: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
  setRibbonTab: (tab) => set({ ribbonTab: tab, ribbonCollapsed: false }),
  toggleRibbon: () => set((s) => ({ ribbonCollapsed: !s.ribbonCollapsed })),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setShowExportDialog: (show) => set({ showExportDialog: show }),
  setShowAIPanel: (show) => set({ showAIPanel: show }),
  setIsMobile: (isMobile) => set({ isMobile }),
  toggleDirectCursorMode: () => set((s) => ({ directCursorMode: !s.directCursorMode })),
}));
