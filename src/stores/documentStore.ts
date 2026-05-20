'use client';

import { create } from 'zustand';
import type { Document } from '@/types';

interface DocumentState {
  currentDocument: Document | null;
  documents: Document[];
  recentDocuments: Document[];
  isDirty: boolean;
  isAutoSaving: boolean;
  searchQuery: string;

  // Multi-page support
  pages: string[];
  activePageIndex: number;
  zoom: number;

  setCurrentDocument: (doc: Document | null) => void;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  setDocuments: (docs: Document[]) => void;
  setRecentDocuments: (docs: Document[]) => void;
  setDirty: (dirty: boolean) => void;
  setAutoSaving: (saving: boolean) => void;
  setSearchQuery: (query: string) => void;
  newDocument: () => void;

  // Page actions
  addPage: () => void;
  insertPageAfter: (index: number, content: string) => void;
  removePage: (index: number) => void;
  updatePage: (index: number, content: string) => void;
  setActivePageIndex: (index: number) => void;
  setZoom: (zoom: number) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  currentDocument: null,
  documents: [],
  recentDocuments: [],
  isDirty: false,
  isAutoSaving: false,
  searchQuery: '',
  pages: ['<p></p>'],
  activePageIndex: 0,
  zoom: 100,

  setCurrentDocument: (doc) => set({ currentDocument: doc, isDirty: false }),
  updateContent: (content) =>
    set((s) => {
      const newPages = [...s.pages];
      newPages[s.activePageIndex] = content;
      return {
        currentDocument: s.currentDocument
          ? { ...s.currentDocument, content, updatedAt: new Date().toISOString() }
          : null,
        pages: newPages,
        isDirty: true,
      };
    }),
  updateTitle: (title) =>
    set((s) => ({
      currentDocument: s.currentDocument
        ? { ...s.currentDocument, title }
        : null,
      isDirty: true,
    })),
  setDocuments: (docs) => set({ documents: docs }),
  setRecentDocuments: (docs) => set({ recentDocuments: docs }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setAutoSaving: (saving) => set({ isAutoSaving: saving }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  newDocument: () =>
    set({
      currentDocument: {
        id: '',
        title: 'नया दस्तावेज़',
        content: '<p></p>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAutoSaved: false,
      },
      pages: ['<p></p>'],
      activePageIndex: 0,
      isDirty: false,
    }),

  addPage: () =>
    set((s) => {
      const newPages = [...s.pages, '<p></p>'];
      return { pages: newPages, activePageIndex: newPages.length - 1, isDirty: true };
    }),

  insertPageAfter: (index, content) =>
    set((s) => {
      const newPages = [...s.pages];
      newPages.splice(index + 1, 0, content || '<p></p>');
      return { pages: newPages, activePageIndex: index + 1, isDirty: true };
    }),

  removePage: (index) =>
    set((s) => {
      if (s.pages.length <= 1) return s; // Keep at least one page
      const newPages = s.pages.filter((_, i) => i !== index);
      return {
        pages: newPages,
        activePageIndex: Math.min(s.activePageIndex, newPages.length - 1),
      };
    }),

  updatePage: (index, content) =>
    set((s) => {
      const newPages = [...s.pages];
      newPages[index] = content;
      return { pages: newPages, isDirty: true };
    }),

  setActivePageIndex: (index) => set({ activePageIndex: index }),
  
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(zoom, 500)) }),
}));
