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
const getArchiveCollection = () => collection(db, 'users', getDeviceId(), 'archive');
const getStateDoc = () => doc(db, 'users', getDeviceId(), 'state', 'current');

// ============================================
// Smart Naming & Importance Detection
// ============================================

// Hindi government doc type keywords
const DOC_TYPE_KEYWORDS: Record<string, string[]> = {
  'पत्र': ['प्रति', 'महोदय', 'विषय', 'सेवा में', 'भवदीय', 'आपका', 'कार्यालय'],
  'आदेश': ['आदेश', 'निर्देश', 'अनुपालन', 'तुरंत', 'आदेशित'],
  'नोटिस': ['सूचना', 'नोटिस', 'अधिसूचना', 'सार्वजनिक'],
  'प्रतिवेदन': ['प्रतिवेदन', 'रिपोर्ट', 'निरीक्षण', 'प्रगति'],
  'टिप्पण': ['टिप्पणी', 'नोटशीट', 'अनुशंसा', 'विचारार्थ'],
  'अनुस्मारक': ['अनुस्मारक', 'स्मरण', 'पुनः', 'शीघ्र'],
  'आवेदन': ['आवेदन', 'निवेदन', 'प्रार्थना', 'कृपया'],
};

const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  'DRDA': ['drda', 'जिला ग्रामीण', 'ग्रामीण विकास एजेंसी'],
  'Social Audit': ['social audit', 'सामाजिक अंकेक्षण', 'सोशल ऑडिट'],
  'नगर पालिका': ['नगर पालिका', 'नगरपालिका', 'municipal'],
  'पंचायत': ['पंचायत', 'ग्राम पंचायत', 'ग्राम सभा'],
  'Block Office': ['block', 'खंड', 'विकासखंड'],
  'तहसील': ['तहसील', 'tehsil'],
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<!-- page-break -->/g, ' ')
    .trim();
}

function countWords(text: string): number {
  const plain = stripHtml(text);
  if (!plain) return 0;
  // Count both Hindi and English words
  return plain.split(/[\s\n\r]+/).filter(w => w.length > 0).length;
}

function detectDocType(text: string): string {
  const plain = stripHtml(text).toLowerCase();
  for (const [type, keywords] of Object.entries(DOC_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (plain.includes(kw.toLowerCase())) return type;
    }
  }
  return 'दस्तावेज़';
}

function detectDepartment(text: string): string {
  const plain = stripHtml(text).toLowerCase();
  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (plain.includes(kw.toLowerCase())) return dept;
    }
  }
  return '';
}

function extractKeywords(text: string): string {
  const plain = stripHtml(text);
  // Take first meaningful chunk (skip very short tokens)
  const words = plain.split(/[\s\n\r]+/).filter(w => w.length > 2);
  const snippet = words.slice(0, 8).join(' ');
  return snippet.length > 40 ? snippet.substring(0, 40) + '…' : snippet;
}

function generateSmartName(content: string, type?: string): string {
  if (type === 'spreadsheet') {
    const plain = stripHtml(content);
    const snippet = plain.substring(0, 30).trim();
    const dateStr = new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `स्प्रेडशीट${snippet ? ' - ' + snippet : ''} - ${dateStr}`;
  }

  const docType = detectDocType(content);
  const dept = detectDepartment(content);
  const keywords = extractKeywords(content);
  const dateStr = new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  let name = docType;
  if (dept) name += ` - ${dept}`;
  if (keywords && keywords !== docType) name += ` - ${keywords}`;
  name += ` - ${dateStr}`;

  return name;
}

function detectImportance(content: string, type?: string): 'low' | 'medium' | 'high' {
  const wc = countWords(content);
  if (type === 'spreadsheet') {
    // Spreadsheets with any data are at least medium importance
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.some((s: { celldata?: unknown[] }) => s.celldata && (s.celldata as unknown[]).length > 0)) return 'high';
    } catch { /* not JSON, check word count */ }
    return wc > 10 ? 'medium' : 'low';
  }
  if (wc > 100) return 'high';
  if (wc > 50) return 'medium';
  return 'low';
}

// ============================================
// Firebase CRUD
// ============================================

async function actualSaveToFirebase(pages: string[], currentDoc: Document | null) {
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
        const fullContent = pages.join('<!-- page-break -->');
        const wc = countWords(fullContent);
        const importance = detectImportance(fullContent, currentDoc.type);
        
        await setDoc(docRef, {
          ...currentDoc,
          content: fullContent,
          updatedAt: new Date().toISOString(),
          wordCount: wc,
          importance,
        });

        // 3. Auto-archive if content is useful (medium+ importance)
        if (importance !== 'low') {
          await autoArchiveDocument({
            ...currentDoc,
            content: fullContent,
            wordCount: wc,
            importance,
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to save to Firebase:', err);
  }
}

async function autoArchiveDocument(docData: Document) {
  if (typeof window === 'undefined') return;
  try {
    const smartName = generateSmartName(docData.content, docData.type);
    const archiveRef = doc(getArchiveCollection(), docData.id);
    await setDoc(archiveRef, {
      ...docData,
      isArchived: true,
      archivedAt: new Date().toISOString(),
      autoName: smartName,
    });
  } catch (err) {
    console.error('Failed to auto-archive:', err);
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
let pendingSaveArgs: { pages: string[], currentDoc: Document | null } | null = null;

async function saveToFirebase(pages: string[], currentDoc: Document | null): Promise<void> {
  pendingSaveArgs = { pages, currentDoc };
  if (saveTimeout) clearTimeout(saveTimeout);
  
  return new Promise((resolve) => {
    saveTimeout = setTimeout(async () => {
      if (pendingSaveArgs) {
        const { pages: p, currentDoc: c } = pendingSaveArgs;
        pendingSaveArgs = null;
        await actualSaveToFirebase(p, c);
      }
      resolve();
    }, 1500);
  });
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
      const data = d.data() as Document;
      // Filter out soft-deleted documents from recent view
      if (!data.isDeleted) {
        docs.push(data);
      }
    });
    return docs;
  } catch (err) {
    console.error('Failed to load recent from Firebase:', err);
    return [];
  }
}

async function loadArchivedFromFirebase(): Promise<Document[]> {
  if (typeof window === 'undefined') return [];
  try {
    const q = query(getArchiveCollection(), orderBy('archivedAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const docs: Document[] = [];
    snap.forEach(d => {
      docs.push(d.data() as Document);
    });
    return docs;
  } catch (err) {
    console.error('Failed to load archive from Firebase:', err);
    return [];
  }
}

async function loadTrashFromFirebase(): Promise<Document[]> {
  if (typeof window === 'undefined') return [];
  try {
    const q = query(getDocsCollection(), orderBy('updatedAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const docs: Document[] = [];
    snap.forEach(d => {
      const data = d.data() as Document;
      if (data.isDeleted) {
        docs.push(data);
      }
    });
    return docs;
  } catch (err) {
    console.error('Failed to load trash from Firebase:', err);
    return [];
  }
}

async function softDeleteInFirebase(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(getDocsCollection(), id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Document;
      await setDoc(docRef, {
        ...data,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Failed to soft-delete:', err);
  }
}

async function restoreInFirebase(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(getDocsCollection(), id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Document;
      // Remove delete flags
      const restored = { ...data };
      delete restored.isDeleted;
      delete restored.deletedAt;
      await setDoc(docRef, restored);
    }
  } catch (err) {
    console.error('Failed to restore:', err);
  }
}

async function permanentDeleteFromFirebase(id: string) {
  if (typeof window === 'undefined') return;
  try {
    await deleteDoc(doc(getDocsCollection(), id));
  } catch (err) {
    console.error('Failed to permanently delete from Firebase:', err);
  }
}

async function deleteFromArchive(id: string) {
  if (typeof window === 'undefined') return;
  try {
    await deleteDoc(doc(getArchiveCollection(), id));
  } catch (err) {
    console.error('Failed to delete from archive:', err);
  }
}

async function autoCleanTrash() {
  if (typeof window === 'undefined') return;
  try {
    const q = query(getDocsCollection(), orderBy('updatedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    snap.forEach(async (d) => {
      const data = d.data() as Document;
      if (data.isDeleted && data.deletedAt) {
        const deletedTime = new Date(data.deletedAt).getTime();
        if (now - deletedTime > THIRTY_DAYS) {
          await deleteDoc(doc(getDocsCollection(), data.id));
        }
      }
    });
  } catch (err) {
    console.error('Failed to auto-clean trash:', err);
  }
}

// ============================================
// Store
// ============================================
interface DocumentState {
  currentDocument: Document | null;
  documents: Document[];
  recentDocuments: Document[];
  archivedDocuments: Document[];
  trashDocuments: Document[];
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
  newSpreadsheet: () => void;
  hydrateFromStorage: () => Promise<void>;
  loadRecentDocument: (doc: Document) => void;
  deleteRecentDocument: (id: string) => void;

  // NEW: Archive & Trash actions
  softDeleteDocument: (id: string) => void;
  restoreDocument: (id: string) => void;
  permanentDeleteDocument: (id: string) => void;
  loadArchive: () => Promise<void>;
  loadTrash: () => Promise<void>;
  deleteArchiveDocument: (id: string) => void;
  restoreFromArchive: (doc: Document) => void;

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
  archivedDocuments: [],
  trashDocuments: [],
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

    // Auto-clean old trash on hydration
    autoCleanTrash();
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
        type: 'document',
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

  newSpreadsheet: () => {
    const s = get();
    saveToFirebase(s.pages, s.currentDocument).then(async () => {
      const newDoc: Document = {
        id: `sheet_${Date.now()}`,
        type: 'spreadsheet',
        title: 'नयी स्प्रेडशीट',
        content: JSON.stringify([{ name: 'Sheet1', color: '', status: 1, celldata: [] }]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAutoSaved: false,
      };
      const newPages = [newDoc.content];
      
      set({
        currentDocument: newDoc,
        pages: newPages,
        activePageIndex: 0,
        isDirty: false,
      });

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

  // Legacy — now calls softDeleteDocument for backward compatibility
  deleteRecentDocument: (id: string) => {
    get().softDeleteDocument(id);
  },

  // ============================================
  // NEW: Soft Delete, Restore, Permanent Delete
  // ============================================

  softDeleteDocument: (id: string) => {
    softDeleteInFirebase(id).then(async () => {
      const recent = await loadRecentFromFirebase();
      const trash = await loadTrashFromFirebase();
      set({ recentDocuments: recent, trashDocuments: trash });
    });
  },

  restoreDocument: (id: string) => {
    restoreInFirebase(id).then(async () => {
      const recent = await loadRecentFromFirebase();
      const trash = await loadTrashFromFirebase();
      set({ recentDocuments: recent, trashDocuments: trash });
    });
  },

  permanentDeleteDocument: (id: string) => {
    permanentDeleteFromFirebase(id).then(async () => {
      const trash = await loadTrashFromFirebase();
      set({ trashDocuments: trash });
    });
  },

  loadArchive: async () => {
    const archived = await loadArchivedFromFirebase();
    set({ archivedDocuments: archived });
  },

  loadTrash: async () => {
    const trash = await loadTrashFromFirebase();
    set({ trashDocuments: trash });
  },

  deleteArchiveDocument: (id: string) => {
    deleteFromArchive(id).then(async () => {
      const archived = await loadArchivedFromFirebase();
      set({ archivedDocuments: archived });
    });
  },

  restoreFromArchive: (doc: Document) => {
    // Load the archived doc into the editor
    const pages = doc.content.split('<!-- page-break -->').filter(p => p.trim());
    if (pages.length === 0) pages.push('<p></p>');
    
    const restoredDoc = { ...doc };
    delete restoredDoc.isArchived;
    delete restoredDoc.archivedAt;

    set({
      currentDocument: restoredDoc,
      pages,
      activePageIndex: 0,
      isDirty: false,
    });
    
    saveToFirebase(pages, restoredDoc).then(async () => {
      const recent = await loadRecentFromFirebase();
      set({ recentDocuments: recent });
    });
  },

  // ============================================
  // Page actions (unchanged)
  // ============================================

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
