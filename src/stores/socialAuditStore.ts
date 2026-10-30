import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SocialAuditRecord, FontViewMode, AuditBlock, AuditStatus, PanchayatNirnayStatus } from '@/types/socialAudit';
import { INITIAL_SOCIAL_AUDIT_RECORDS, BLOCK_SABHA_RECORDS, DISTRICT_META } from '@/data/socialAuditInitialData';
import { getDelhiDateString, getDelhiTimeString, fetchOnlineDelhiTime } from '@/lib/delhiTime';

export type SocialAuditTab = 'upcoming' | 'dashboard' | 'calendar' | 'nirnay' | 'nsap-report' | 'roster' | 'overview';

interface SocialAuditState {
  records: SocialAuditRecord[];
  fontViewMode: FontViewMode;
  selectedBlock: 'all' | AuditBlock;
  selectedScheme: 'all' | 'nsap' | 'mgnrega' | 'pmayg';
  selectedStatus: 'all' | AuditStatus | 'upcoming';
  searchQuery: string;
  isEditMode: boolean;
  asOfDate: string; // YYYY-MM-DD used for NSAP reports and upcoming calculations
  isLiveSync: boolean; // Whether date automatically syncs with live Delhi date
  liveDelhiTime: string; // Real-time ticking Delhi time string e.g. "12:15:30 AM"
  liveDelhiDate: string; // Today's Delhi date e.g. "2026-10-30"
  lastOnlineSyncTime: number | null;
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
  setLiveSync: (enabled: boolean) => void;
  tickDelhiClock: () => void;
  syncWithDelhiTime: (forceDate?: boolean) => Promise<void>;
  setActiveTab: (tab: SocialAuditTab) => void;
  openEditModal: (record: SocialAuditRecord) => void;
  closeEditModal: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;

  // Record CRUD & Nirnay App Confirmation
  updateRecord: (id: string, updates: Partial<SocialAuditRecord>) => void;
  updatePanchayatNirnayStatus: (id: string, status: PanchayatNirnayStatus, notes?: string) => void;
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
      // Default to live current Delhi (IST) date
      asOfDate: getDelhiDateString(),
      isLiveSync: true,
      liveDelhiTime: getDelhiTimeString(),
      liveDelhiDate: getDelhiDateString(),
      lastOnlineSyncTime: null,
      activeTab: 'upcoming',
      selectedRecordForEdit: null,
      isAddModalOpen: false,

      setFontViewMode: (mode) => set({ fontViewMode: mode }),
      setSelectedBlock: (block) => set({ selectedBlock: block }),
      setSelectedScheme: (scheme) => set({ selectedScheme: scheme }),
      setSelectedStatus: (status) => set({ selectedStatus: status }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setIsEditMode: (isEdit) => set({ isEditMode: isEdit }),

      setAsOfDate: (date) => {
        const liveDate = getDelhiDateString();
        set({
          asOfDate: date,
          isLiveSync: date === liveDate
        });
      },

      setLiveSync: (enabled) => {
        if (enabled) {
          const liveDate = getDelhiDateString();
          const liveTime = getDelhiTimeString();
          set({
            isLiveSync: true,
            asOfDate: liveDate,
            liveDelhiDate: liveDate,
            liveDelhiTime: liveTime
          });
        } else {
          set({ isLiveSync: false });
        }
      },

      tickDelhiClock: () => {
        const now = new Date();
        const currentLiveTime = getDelhiTimeString(now);
        const currentLiveDate = getDelhiDateString(now);

        set((state) => {
          const updates: Partial<SocialAuditState> = {
            liveDelhiTime: currentLiveTime,
            liveDelhiDate: currentLiveDate
          };
          // If live sync is enabled and date rolled over (e.g. midnight passed)
          if (state.isLiveSync && state.asOfDate !== currentLiveDate) {
            updates.asOfDate = currentLiveDate;
          }
          return updates;
        });
      },

      syncWithDelhiTime: async (forceDate = false) => {
        try {
          const data = await fetchOnlineDelhiTime();
          set((state) => {
            const updates: Partial<SocialAuditState> = {
              liveDelhiDate: data.date,
              liveDelhiTime: data.time,
              lastOnlineSyncTime: data.timestamp
            };
            if (state.isLiveSync || forceDate) {
              updates.asOfDate = data.date;
              updates.isLiveSync = true;
            }
            return updates;
          });
        } catch (err) {
          console.warn('Failed to sync online Delhi time', err);
        }
      },

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

      updatePanchayatNirnayStatus: (id, status, notes) => {
        set((state) => ({
          records: state.records.map((r) => {
            if (r.id === id) {
              return {
                ...r,
                panchayatNirnayStatus: status,
                panchayatNirnayCapturedDate: status === 'captured' ? (r.panchayatNirnayCapturedDate || getDelhiDateString()) : undefined,
                panchayatNirnayNotes: notes !== undefined ? notes : r.panchayatNirnayNotes
              };
            }
            return r;
          })
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
        isLiveSync: state.isLiveSync,
        asOfDate: state.asOfDate,
        activeTab: state.activeTab
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If live sync is true (default) or undefined, ensure asOfDate is synced to today's Delhi date
          if (state.isLiveSync === undefined || state.isLiveSync === true) {
            const today = getDelhiDateString();
            state.asOfDate = today;
            state.liveDelhiDate = today;
            state.isLiveSync = true;
          }
          state.liveDelhiTime = getDelhiTimeString();

          // Sync Panchayat Nirnay baseline status and migrate past meetings
          if (state.records && Array.isArray(state.records)) {
            const baselineMap = new Map(INITIAL_SOCIAL_AUDIT_RECORDS.map(r => [r.id, r]));
            const capturedIds = new Set([
              'baghpat-24', 'baghpat-25', 'baghpat-26', 'baghpat-28', 'baghpat-29', 'baghpat-30',
              'baraut-1', 'baraut-2', 'baraut-17'
            ]);
            let hasChanges = false;
            const updatedRecords = state.records.map(r => {
              const base = baselineMap.get(r.id);
              // Ensure verified 9 records are captured
              if (capturedIds.has(r.id) && r.panchayatNirnayStatus !== 'captured') {
                hasChanges = true;
                return {
                  ...r,
                  panchayatNirnayStatus: 'captured' as PanchayatNirnayStatus,
                  panchayatNirnayCapturedDate: r.panchayatNirnayCapturedDate || r.meetingDate,
                  isMappedInPanchayatNirnay: true
                };
              }
              // Past meetings up to 2026-10-30 cannot be captured retroactively -> mark not_captured
              if (!capturedIds.has(r.id) && r.meetingDate <= '2026-10-30' && r.panchayatNirnayStatus === 'pending') {
                hasChanges = true;
                return {
                  ...r,
                  panchayatNirnayStatus: 'not_captured' as PanchayatNirnayStatus
                };
              }
              // If status is completely missing, pull from baseline
              if (r.panchayatNirnayStatus === undefined && base) {
                hasChanges = true;
                return {
                  ...r,
                  panchayatNirnayStatus: base.panchayatNirnayStatus,
                  isMappedInPanchayatNirnay: base.isMappedInPanchayatNirnay,
                  panchayatNirnayCapturedDate: base.panchayatNirnayCapturedDate
                };
              }
              return r;
            });
            if (hasChanges) {
              state.records = updatedRecords;
            }
          }
        }
      }
    }
  )
);
