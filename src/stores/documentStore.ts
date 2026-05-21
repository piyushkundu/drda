'use client';

import { create } from 'zustand';
import type { Document } from '@/types';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';

// ============================================
// Device ID helper (since there is no login yet)
// ============================================
function getDeviceId() {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('page-hindi-device-id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('page-hindi-device-id', deviceId);
  }
  return deviceId;
}

// ============================================
// Firebase helpers
// ============================================
const getDocsCollection = () => collection(db, 'users', getDeviceId(), 'documents');
const getStateDoc = () => doc(db, 'users', getDeviceId(), 'state', 'current');

async function saveToFirebase(pages: string[], currentDoc: Document | null) {
  if (typeof window === 'undefined') return;
  try {
    // 1. Save current state (pages + active doc) so it reloads on refresh
    await setDoc(getStateDoc(), { 
      pages, 
      currentDocument: currentDoc 
    });

    // 2. Also save it as a "recent document" in the documents collection
    if (currentDoc) {
      const docRef = doc(getDocsCollection(), currentDoc.id);
      // Only save if there's actual content
      const hasContent = pages.some(p => p.replace(/<[^>]*>/g, '').trim().length > 0);
      if (hasContent) {
        await setDoc(docRef, {
          ...currentDoc,
          content: pages.join('<!-- page-break -->'),
          updatedAt: new Date().toISOString() // Force update timestamp
        });
      }
    }
  } catch (err) {
    console.error('Failed to save to Firebase:', err);
  }
}

async function loadStateFromFirebase(): Promise<{ pages: string[]; currentDocument: Document | null } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const snap = await getDoc(getStateDoc());
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.pages) && data.pages.length > 0) {
        return { pages: data.pages, currentDocument: data.currentDocument };
      }
    }
  } catch (err) {
    console.error('Failed to load state from Firebase:', err);
  }
  return null;
}

async function loadRecentFromFirebase(): Promise<Document[]> {
  if (typeof window === 'undefined') return [];
  try {
    const q = query(getDocsCollection(), orderBy('updatedAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    const docs: Document[] = [];
    snap.forEach(d => {
      docs.push(d.data() as Document);
    });
    return docs;
  } catch (err) {
    console.error('Failed to load recent from Firebase:', err);
    return [];
  }
}

async function deleteFromFirebase(id: string) {
  if (typeof window === 'undefined') return;
  try {
    await deleteDoc(doc(getDocsCollection(), id));
  } catch (err) {
    console.error('Failed to delete from Firebase:', err);
  }
}

// ============================================
// Store
// ============================================
interface DocumentState {
  currentDocument: Document | null;
  documents: Document[];
  recentDocuments: Document[];
  isDirty: boolean;
  isAutoSaving: boolean;
  searchQuery: string;
  isHydrated: boolean;

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
  hydrateFromStorage: () => Promise<void>;
  loadRecentDocument: (doc: Document) => void;
  deleteRecentDocument: (id: string) => void;

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
  isHydrated: false,
  pages: ['<p></p>'],
  activePageIndex: 0,
  zoom: 100,

  hydrateFromStorage: async () => {
    if (get().isHydrated) return; // Prevent double hydration
    const savedState = await loadStateFromFirebase();
    const recent = await loadRecentFromFirebase();
    
    if (savedState) {
      set({
        pages: savedState.pages,
        currentDocument: savedState.currentDocument,
        recentDocuments: recent,
        isHydrated: true,
        isDirty: false,
      });
    } else {
      set({ recentDocuments: recent, isHydrated: true });
    }
  },

  setCurrentDocument: (doc) => set({ currentDocument: doc, isDirty: false }),

  updateContent: (content) => {
    const s = get();
    const newPages = [...s.pages];
    newPages[s.activePageIndex] = content;
    
    const newDoc = s.currentDocument
      ? { ...s.currentDocument, content, updatedAt: new Date().toISOString() }
      : {
          id: `doc_${Date.now()}`,
          title: 'बिना शीर्षक दस्तावेज़',
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isAutoSaved: true,
        };

    set({
      currentDocument: newDoc,
      pages: newPages,
      isDirty: true,
    });

    // Fire and forget save to Firebase
    saveToFirebase(newPages, newDoc).then(async () => {
      // Background refresh of recent documents list
      const updatedRecent = await loadRecentFromFirebase();
      set({ recentDocuments: updatedRecent });
    });
  },

  updateTitle: (title) => {
    const s = get();
    if (!s.currentDocument) return;
    
    const newDoc = { ...s.currentDocument, title, updatedAt: new Date().toISOString() };
    set({ currentDocument: newDoc, isDirty: true });
    
    saveToFirebase(s.pages, newDoc).then(async () => {
      const updatedRecent = await loadRecentFromFirebase();
      set({ recentDocuments: updatedRecent });
    });
  },

  setDocuments: (docs) => set({ documents: docs }),
  setRecentDocuments: (docs) => set({ recentDocuments: docs }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setAutoSaving: (saving) => set({ isAutoSaving: saving }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  newDocument: () => {
    const s = get();
    // Only save the old document to Firebase if it had actual content
    saveToFirebase(s.pages, s.currentDocument).then(async () => {
      const newDoc: Document = {
        id: `doc_${Date.now()}`,
        title: 'नया दस्तावेज़',
        content: '<p></p>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAutoSaved: false,
      };
      const newPages = ['<p></p>'];
      
      set({
        currentDocument: newDoc,
        pages: newPages,
        activePageIndex: 0,
        isDirty: false,
      });

      // Save the new blank state
      await saveToFirebase(newPages, newDoc);
      const recent = await loadRecentFromFirebase();
      set({ recentDocuments: recent });
    });
  },

  loadRecentDocument: (doc: Document) => {
    const s = get();
    saveToFirebase(s.pages, s.currentDocument).then(async () => {
      const pages = doc.content.split('<!-- page-break -->').filter(p => p.trim());
      if (pages.length === 0) pages.push('<p></p>');
      
      set({
        currentDocument: doc,
        pages,
        activePageIndex: 0,
        isDirty: false,
      });
      
      await saveToFirebase(pages, doc);
      const recent = await loadRecentFromFirebase();
      set({ recentDocuments: recent });
    });
  },

  deleteRecentDocument: (id: string) => {
    deleteFromFirebase(id).then(async () => {
      const recent = await loadRecentFromFirebase();
      set({ recentDocuments: recent });
    });
  },

  addPage: () => {
    const s = get();
    const newPages = [...s.pages, '<p></p>'];
    set({ pages: newPages, activePageIndex: newPages.length - 1, isDirty: true });
    saveToFirebase(newPages, s.currentDocument);
  },

  insertPageAfter: (index, content) => {
    const s = get();
    const newPages = [...s.pages];
    newPages.splice(index + 1, 0, content || '<p></p>');
    set({ pages: newPages, activePageIndex: index + 1, isDirty: true });
    saveToFirebase(newPages, s.currentDocument);
  },

  removePage: (index) => {
    const s = get();
    if (s.pages.length <= 1) return;
    const newPages = s.pages.filter((_, i) => i !== index);
    set({
      pages: newPages,
      activePageIndex: Math.min(s.activePageIndex, newPages.length - 1),
    });
    saveToFirebase(newPages, s.currentDocument);
  },

  updatePage: (index, content) => {
    const s = get();
    const newPages = [...s.pages];
    newPages[index] = content;
    set({ pages: newPages, isDirty: true });
    saveToFirebase(newPages, s.currentDocument);
  },

  setActivePageIndex: (index) => set({ activePageIndex: index }),

  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(zoom, 500)) }),
}));
