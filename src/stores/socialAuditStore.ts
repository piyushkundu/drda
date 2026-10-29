'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SocialAuditRecord, FontViewMode, AuditBlock, AuditStatus } from '@/types/socialAudit';
import { INITIAL_SOCIAL_AUDIT_RECORDS, BLOCK_SABHA_RECORDS, DISTRICT_META } from '@/data/socialAuditInitialData';

export type SocialAuditTab = 'upcoming' | 'dashboard' | 'calendar' | 'nsap-report' | 'roster' | 'overview';

interface SocialAuditState {
  records: SocialAuditRecord[];
  fontViewMode: FontViewMode;
  selectedBlock: 'all' | AuditBlock;
  selectedScheme: 'all' | 'nsap' | 'mgnrega' | 'pmayg';
  selectedStatus: 'all' | AuditStatus | 'upcoming';
  searchQuery: string;
  isEditMode: boolean;
  asOfDate: string; // YYYY-MM-DD used for NSAP reports and upcoming calculations
  activeTab: SocialAuditTab;
  selectedRecordForEdit: SocialAuditRecord | null;
  isAddModalOpen: boolean;

  // Actions
  setFontViewMode: (mode: FontViewMode) => void;
  setSelectedBlock: (block: 'all' | AuditBlock) => void;
  setSelectedScheme: (scheme: 'all' | 'nsap' | 'mgnrega' | 'pmayg') => void;
  setSelectedStatus: (status: 'all' | AuditStatus | 'upcoming') => void;
  setSearchQuery: (query: string) => void;
  setIsEditMode: (isEdit: boolean) => void;
  setAsOfDate: (date: string) => void;
  setActiveTab: (tab: SocialAuditTab) => void;
  openEditModal: (record: SocialAuditRecord) => void;
  closeEditModal: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;

  // Record CRUD
  updateRecord: (id: string, updates: Partial<SocialAuditRecord>) => void;
  addRecord: (record: Omit<SocialAuditRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
  markCompleted: (id: string, isCompleted: boolean) => void;
  resetToBaseline: () => void;
}

export const useSocialAuditStore = create<SocialAuditState>()(
  persist(
    (set, get) => ({
      records: INITIAL_SOCIAL_AUDIT_RECORDS,
      fontViewMode: 'unicode',
      selectedBlock: 'all',
      selectedScheme: 'all',
      selectedStatus: 'all',
      searchQuery: '',
      isEditMode: false,
      // Default reference date is 2026-10-29 (current schedule timeframe)
      asOfDate: '2026-10-29',
      activeTab: 'upcoming',
      selectedRecordForEdit: null,
      isAddModalOpen: false,

      setFontViewMode: (mode) => set({ fontViewMode: mode }),
      setSelectedBlock: (block) => set({ selectedBlock: block }),
      setSelectedScheme: (scheme) => set({ selectedScheme: scheme }),
      setSelectedStatus: (status) => set({ selectedStatus: status }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setIsEditMode: (isEdit) => set({ isEditMode: isEdit }),
      setAsOfDate: (date) => set({ asOfDate: date }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      openEditModal: (record) => set({ selectedRecordForEdit: record }),
      closeEditModal: () => set({ selectedRecordForEdit: null }),
      openAddModal: () => set({ isAddModalOpen: true }),
      closeAddModal: () => set({ isAddModalOpen: false }),

      updateRecord: (id, updates) => {
        set((state) => ({
          records: state.records.map((r) => {
            if (r.id === id) {
              const updated = { ...r, ...updates };
              // If meeting date changed, flag as amended
              if (updates.meetingDate && updates.meetingDate !== r.meetingDate && !r.isAmended) {
                updated.isAmended = true;
                updated.originalMeetingDate = r.originalMeetingDate || r.meetingDate;
                updated.status = 'amended';
                if (!updated.amendmentDetails) {
                  updated.amendmentDetails = {
                    originalDate: r.meetingDate,
                    modifiedDate: updates.meetingDate,
                    reason: updates.notes || 'उपयोगकर्ता द्वारा संशोधित'
                  };
                }
              }
              return updated;
            }
            return r;
          }),
          selectedRecordForEdit: null
        }));
      },

      addRecord: (newRecordData) => {
        set((state) => {
          const newId = `${newRecordData.block.toLowerCase()}-${Date.now()}`;
          const newRecord: SocialAuditRecord = {
            ...newRecordData,
            id: newId
          };
          return {
            records: [...state.records, newRecord],
            isAddModalOpen: false
          };
        });
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
          selectedRecordForEdit: null
        }));
      },

      markCompleted: (id, isCompleted) => {
        set((state) => ({
          records: state.records.map((r) => {
            if (r.id === id) {
              return {
                ...r,
                status: isCompleted ? 'completed' : (r.isAmended ? 'amended' : 'scheduled'),
                completedDate: isCompleted ? (r.completedDate || state.asOfDate) : undefined
              };
            }
            return r;
          })
        }));
      },

      resetToBaseline: () => {
        if (typeof window !== 'undefined' && window.confirm('क्या आप सोशल ऑडिट कैलेंडर को मूल आधिकारिक डेटा पर रीसेट करना चाहते हैं?')) {
          set({ records: INITIAL_SOCIAL_AUDIT_RECORDS });
        }
      }
    }),
    {
      name: 'social-audit-baghpat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        records: state.records,
        fontViewMode: state.fontViewMode,
        asOfDate: state.asOfDate,
        activeTab: state.activeTab
      })
    }
  )
);
