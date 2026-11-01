import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  SocialAuditRecord, FontViewMode, AuditBlock, AuditStatus, 
  PanchayatNirnayStatus, MisAuditStatus, NSAPGramPanchayatData, NSAPBeneficiaryRecord,
  SocialAuditActivityLog
} from '@/types/socialAudit';
import { INITIAL_SOCIAL_AUDIT_RECORDS, BLOCK_SABHA_RECORDS, DISTRICT_META } from '@/data/socialAuditInitialData';
import { INITIAL_NSAP_DATA_RECORDS } from '@/data/nsapDataInitial';
import { INITIAL_ACTIVITY_LOGS } from '@/data/initialActivityLogs';
import { getDelhiDateString, getDelhiTimeString, fetchOnlineDelhiTime } from '@/lib/delhiTime';
import { NirnaySyncPayload } from '@/lib/nirnaySyncBookmarklet';
import { MisSyncPayload } from '@/lib/misSyncBookmarklet';
import { 
  loadSocialAuditFromFirestore, 
  saveSocialAuditToFirestore, 
  subscribeToSocialAuditFirestore,
  SocialAuditFirestoreDoc 
} from '@/lib/socialAuditFirebase';

export type SocialAuditTab = 
  | 'upcoming' 
  | 'dashboard' 
  | 'calendar' 
  | 'nirnay' 
  | 'mis-feeding' 
  | 'nsap-data' 
  | 'nsap-report' 
  | 'roster' 
  | 'reports' 
  | 'activity-log' 
  | 'overview';

export type FirebaseSyncStatus = 'synced' | 'syncing' | 'error' | 'loading' | 'offline';

interface SocialAuditState {
  records: SocialAuditRecord[];
  nsapRecords: NSAPGramPanchayatData[];
  activityLogs: SocialAuditActivityLog[];
  fontViewMode: FontViewMode;
  selectedBlock: 'all' | AuditBlock;
  selectedBRP: string; // 'all' or BRP phone / name
  selectedScheme: 'all' | 'nsap' | 'mgnrega' | 'pmayg';
  selectedStatus: 'all' | AuditStatus | 'upcoming' | 'overdue';
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
  selectedGPForProfile: SocialAuditRecord | null;
  isGlobalSearchOpen: boolean;

  // Firebase Real-time Cloud Sync
  firebaseSyncStatus: FirebaseSyncStatus;
  firebaseLastSyncedAt: string | null;
  initFirebaseSync: () => Promise<void>;
  forceSyncToFirebase: () => Promise<boolean>;

  // Actions
  setFontViewMode: (mode: FontViewMode) => void;
  setSelectedBlock: (block: 'all' | AuditBlock) => void;
  setSelectedBRP: (brp: string) => void;
  resetSelectedBRP: () => void;
  setSelectedScheme: (scheme: 'all' | 'nsap' | 'mgnrega' | 'pmayg') => void;
  setSelectedStatus: (status: 'all' | AuditStatus | 'upcoming' | 'overdue') => void;
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
  openGPProfile: (record: SocialAuditRecord) => void;
  closeGPProfile: () => void;
  setIsGlobalSearchOpen: (open: boolean) => void;
  logActivity: (log: Omit<SocialAuditActivityLog, 'id' | 'timestamp'>) => void;

  // Record CRUD, Nirnay App & MIS Feeding Confirmation
  updateRecord: (id: string, updates: Partial<SocialAuditRecord>) => void;
  updatePanchayatNirnayStatus: (id: string, status: PanchayatNirnayStatus, notes?: string) => void;
  syncNirnayFromPayload: (payload: NirnaySyncPayload) => { updatedCount: number; updatedNames: string[]; blockMatched: string };
  updateMisStatus: (id: string, status: MisAuditStatus, notes?: string, fedDate?: string) => void;
  syncMisFromPayload: (payload: MisSyncPayload) => { updatedCount: number; updatedNames: string[]; blockMatched: string };
  addRecord: (record: Omit<SocialAuditRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
  markCompleted: (id: string, isCompleted: boolean) => void;
  resetToBaseline: () => void;

  // NSAP Detailed Beneficiary Data Management Actions
  addNsapRecord: (data: NSAPGramPanchayatData) => void;
  updateNsapRecord: (id: string, updates: Partial<NSAPGramPanchayatData>) => void;
  deleteNsapRecord: (id: string) => void;
  addNsapBeneficiary: (gpId: string, beneficiary: Omit<NSAPBeneficiaryRecord, 'id'>) => void;
  addNsapBeneficiariesBatch: (gpId: string, beneficiaries: Omit<NSAPBeneficiaryRecord, 'id'>[]) => void;
  deleteNsapBeneficiary: (gpId: string, beneficiaryId: string) => void;
}

let _localChangeTimestamp = 0;

/**
 * Triggers a debounced or immediate save to Firebase Firestore
 * and keeps the UI status in sync.
 */
function notifyStoreChange(state: SocialAuditState, immediate = false) {
  if (typeof window === 'undefined') return;
  _localChangeTimestamp = Date.now();
  useSocialAuditStore.setState({ firebaseSyncStatus: 'syncing' });

  saveSocialAuditToFirestore(
    state.records,
    state.nsapRecords,
    state.asOfDate,
    state.isLiveSync,
    immediate,
    state.activityLogs
  ).then((success) => {
    useSocialAuditStore.setState({
      firebaseSyncStatus: success ? 'synced' : 'error',
      firebaseLastSyncedAt: success ? new Date().toLocaleTimeString('hi-IN') : state.firebaseLastSyncedAt
    });
  }).catch((err) => {
    console.error('Firebase auto-save error:', err);
    useSocialAuditStore.setState({ firebaseSyncStatus: 'error' });
  });
}

export const useSocialAuditStore = create<SocialAuditState>()(
  persist(
    (set, get) => ({
      records: INITIAL_SOCIAL_AUDIT_RECORDS,
      nsapRecords: INITIAL_NSAP_DATA_RECORDS,
      activityLogs: INITIAL_ACTIVITY_LOGS,
      fontViewMode: 'unicode',
      selectedBlock: 'all',
      selectedBRP: 'all',
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
      selectedGPForProfile: null,
      isGlobalSearchOpen: false,

      // Firebase Sync State
      firebaseSyncStatus: 'loading',
      firebaseLastSyncedAt: null,

      initFirebaseSync: async () => {
        if (typeof window === 'undefined') return;
        if ((window as any).__socialAuditFirebaseSubscribed) return;
        (window as any).__socialAuditFirebaseSubscribed = true;

        set({ firebaseSyncStatus: 'loading' });

        try {
          // 1. Initial fetch from Firebase Firestore
          const remoteDoc = await loadSocialAuditFromFirestore();

          if (remoteDoc && remoteDoc.records && remoteDoc.records.length > 0) {
            _localChangeTimestamp = remoteDoc.version || Date.now();
            set({
              records: remoteDoc.records,
              nsapRecords: (remoteDoc.nsapRecords && remoteDoc.nsapRecords.length > 0) 
                ? remoteDoc.nsapRecords 
                : get().nsapRecords,
              activityLogs: (remoteDoc.activityLogs && remoteDoc.activityLogs.length > 0)
                ? remoteDoc.activityLogs
                : get().activityLogs,
              firebaseSyncStatus: 'synced',
              firebaseLastSyncedAt: remoteDoc.updatedAt 
                ? new Date(remoteDoc.updatedAt).toLocaleTimeString('hi-IN') 
                : new Date().toLocaleTimeString('hi-IN')
            });
          } else {
            // Document does not exist yet on server: seed current local state to Firestore
            const state = get();
            await saveSocialAuditToFirestore(
              state.records,
              state.nsapRecords,
              state.asOfDate,
              state.isLiveSync,
              true,
              state.activityLogs
            );
            set({
              firebaseSyncStatus: 'synced',
              firebaseLastSyncedAt: new Date().toLocaleTimeString('hi-IN')
            });
          }

          // 2. Subscribe to real-time updates from Firebase Firestore
          subscribeToSocialAuditFirestore((remoteData) => {
            if (!remoteData || !remoteData.records) return;
            // Adopt if remote version is newer than our local mutation timestamp
            if (remoteData.version && remoteData.version > _localChangeTimestamp) {
              _localChangeTimestamp = remoteData.version;
              set({
                records: remoteData.records,
                nsapRecords: (remoteData.nsapRecords && remoteData.nsapRecords.length > 0)
                  ? remoteData.nsapRecords
                  : get().nsapRecords,
                activityLogs: (remoteData.activityLogs && remoteData.activityLogs.length > 0)
                  ? remoteData.activityLogs
                  : get().activityLogs,
                firebaseSyncStatus: 'synced',
                firebaseLastSyncedAt: remoteData.updatedAt 
                  ? new Date(remoteData.updatedAt).toLocaleTimeString('hi-IN') 
                  : new Date().toLocaleTimeString('hi-IN')
              });
            }
          }, (err) => {
            console.warn('Real-time Firebase listener warning:', err);
            set({ firebaseSyncStatus: 'error' });
          });
        } catch (err) {
          console.error('initFirebaseSync error:', err);
          set({ firebaseSyncStatus: 'error' });
        }
      },

      forceSyncToFirebase: async () => {
        const state = get();
        set({ firebaseSyncStatus: 'syncing' });
        const success = await saveSocialAuditToFirestore(
          state.records,
          state.nsapRecords,
          state.asOfDate,
          state.isLiveSync,
          true,
          state.activityLogs
        );
        set({
          firebaseSyncStatus: success ? 'synced' : 'error',
          firebaseLastSyncedAt: success ? new Date().toLocaleTimeString('hi-IN') : state.firebaseLastSyncedAt
        });
        return success;
      },

      setFontViewMode: (mode) => set({ fontViewMode: mode }),
      setSelectedBlock: (block) => set({ selectedBlock: block }),
      setSelectedBRP: (brp) => set({ selectedBRP: brp }),
      resetSelectedBRP: () => set({ selectedBRP: 'all' }),
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
        notifyStoreChange(get());
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
        notifyStoreChange(get());
      },

      tickDelhiClock: () => {
        const state = get();
        const currentClockTime = getDelhiTimeString();
        const currentClockDate = getDelhiDateString();

        const updates: Partial<SocialAuditState> = {
          liveDelhiTime: currentClockTime
        };

        if (state.liveDelhiDate !== currentClockDate) {
          updates.liveDelhiDate = currentClockDate;
          if (state.isLiveSync) {
            updates.asOfDate = currentClockDate;
          }
        }

        set(updates);
      },

      syncWithDelhiTime: async (forceDate = false) => {
        try {
          const onlineInfo = await fetchOnlineDelhiTime();
          const updates: Partial<SocialAuditState> = {
            liveDelhiTime: onlineInfo.time,
            liveDelhiDate: onlineInfo.date,
            lastOnlineSyncTime: Date.now()
          };
          if (forceDate || get().isLiveSync) {
            updates.asOfDate = onlineInfo.date;
          }
          set(updates);
        } catch {
          set({
            liveDelhiTime: getDelhiTimeString(),
            liveDelhiDate: getDelhiDateString(),
            lastOnlineSyncTime: Date.now()
          });
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      openEditModal: (record) => set({ selectedRecordForEdit: record }),
      closeEditModal: () => set({ selectedRecordForEdit: null }),

      openAddModal: () => set({ isAddModalOpen: true }),
      closeAddModal: () => set({ isAddModalOpen: false }),

      openGPProfile: (record) => set({ selectedGPForProfile: record }),
      closeGPProfile: () => set({ selectedGPForProfile: null }),
      setIsGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),

      logActivity: (logData) => {
        const newLog: SocialAuditActivityLog = {
          ...logData,
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString()
        };
        set((state) => ({
          activityLogs: [newLog, ...state.activityLogs].slice(0, 200)
        }));
        notifyStoreChange(get());
      },

      updateRecord: (id, updates) => {
        const current = get().records.find(r => r.id === id);
        const gpName = current?.gpNameUnicode || 'ग्राम पंचायत';
        const block = current?.block || 'Baghpat';

        set((state) => ({
          records: state.records.map((r) => r.id === id ? { ...r, ...updates } : r),
          selectedRecordForEdit: state.selectedRecordForEdit?.id === id 
            ? { ...state.selectedRecordForEdit, ...updates } 
            : state.selectedRecordForEdit,
          selectedGPForProfile: state.selectedGPForProfile?.id === id
            ? { ...state.selectedGPForProfile, ...updates }
            : state.selectedGPForProfile
        }));

        get().logActivity({
          module: 'gp',
          recordId: id,
          gpName,
          block,
          actionType: 'update',
          actionLabel: 'विवरण अद्यतन',
          userName: 'प्रशासनिक अधिकारी',
          details: `${gpName} के अभिलेख में अद्यतन किया गया।`
        });
        notifyStoreChange(get());
      },

      updatePanchayatNirnayStatus: (id, status, notes) => {
        const current = get().records.find(r => r.id === id);
        const gpName = current?.gpNameUnicode || 'ग्राम पंचायत';
        const block = current?.block || 'Baghpat';
        const statusHi = status === 'captured' ? 'अपलोड (Captured)' : status === 'pending' ? 'लंबित (Pending)' : 'अनुपलब्ध';

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
          }),
          selectedGPForProfile: state.selectedGPForProfile?.id === id ? {
            ...state.selectedGPForProfile,
            panchayatNirnayStatus: status,
            panchayatNirnayCapturedDate: status === 'captured' ? (state.selectedGPForProfile.panchayatNirnayCapturedDate || getDelhiDateString()) : undefined,
            panchayatNirnayNotes: notes !== undefined ? notes : state.selectedGPForProfile.panchayatNirnayNotes
          } : state.selectedGPForProfile
        }));

        get().logActivity({
          module: 'nirnay',
          recordId: id,
          gpName,
          block,
          actionType: 'status_change',
          actionLabel: 'पंचायत निर्णय स्थिति बदलाव',
          userName: 'पंचायत निर्णय नोडल',
          details: `${gpName}: पंचायत निर्णय स्थिति "${statusHi}" की गई।`,
          newValue: statusHi
        });
        notifyStoreChange(get());
      },

      addRecord: (recordData) => {
        const id = `${recordData.block.toLowerCase()}-${Date.now()}`;
        const newRecord: SocialAuditRecord = {
          ...recordData,
          id,
        };
        set((state) => ({
          records: [newRecord, ...state.records],
          isAddModalOpen: false
        }));

        get().logActivity({
          module: 'gp',
          recordId: id,
          gpName: newRecord.gpNameUnicode,
          block: newRecord.block,
          actionType: 'create',
          actionLabel: 'नवीन ग्राम पंचायत सृजन',
          userName: 'प्रशासनिक अधिकारी',
          details: `नवीन ग्राम पंचायत "${newRecord.gpNameUnicode}" (${newRecord.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}) रोस्टर में जोड़ी गई।`
        });
        notifyStoreChange(get());
      },

      deleteRecord: (id) => {
        const current = get().records.find(r => r.id === id);
        const gpName = current?.gpNameUnicode || 'ग्राम पंचायत';
        const block = current?.block || 'Baghpat';

        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
          selectedRecordForEdit: null,
          selectedGPForProfile: null
        }));

        get().logActivity({
          module: 'gp',
          recordId: id,
          gpName,
          block,
          actionType: 'delete',
          actionLabel: 'अभिलेख विलोपन',
          userName: 'प्रशासनिक अधिकारी',
          details: `ग्राम पंचायत "${gpName}" का अभिलेख हटाया गया।`
        });
        notifyStoreChange(get());
      },

      markCompleted: (id, isCompleted) => {
        const current = get().records.find(r => r.id === id);
        const gpName = current?.gpNameUnicode || 'ग्राम पंचायत';
        const block = current?.block || 'Baghpat';

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
          }),
          selectedGPForProfile: state.selectedGPForProfile?.id === id ? {
            ...state.selectedGPForProfile,
            status: isCompleted ? 'completed' : (state.selectedGPForProfile.isAmended ? 'amended' : 'scheduled'),
            completedDate: isCompleted ? (state.selectedGPForProfile.completedDate || state.asOfDate) : undefined
          } : state.selectedGPForProfile
        }));

        get().logActivity({
          module: 'meeting',
          recordId: id,
          gpName,
          block,
          actionType: 'status_change',
          actionLabel: isCompleted ? 'बैठक सम्पन्न चिन्हित' : 'बैठक पुनः प्रस्तावित',
          userName: 'नोडल अधिकारी',
          details: `${gpName} की सोशल ऑडिट बैठक को "${isCompleted ? 'सम्पन्न' : 'प्रस्तावित'}" के रूप में चिन्हित किया गया।`,
          newValue: isCompleted ? 'सम्पन्न' : 'प्रस्तावित'
        });
        notifyStoreChange(get());
      },

      syncNirnayFromPayload: (payload: NirnaySyncPayload) => {
        const state = get();
        const updatedNames: string[] = [];
        const normalizedBlock = (payload.blockName || '').toUpperCase();

        if (payload.capturedGps && payload.capturedGps.length > 0) {
          const capturedSetBySno = new Set(payload.capturedGps.map(g => g.sno).filter(Boolean));
          const capturedSetByName = new Set(payload.capturedGps.map(g => (g.name || '').toUpperCase().replace(/[^A-Z]/g, '')));

          const updatedRecords = state.records.map(r => {
            const rBlock = r.block.toUpperCase();
            const isTargetBlock = !normalizedBlock || rBlock === normalizedBlock || 
              (normalizedBlock.includes('BAGHPAT') && rBlock === 'BAGHPAT') ||
              (normalizedBlock.includes('BARAUT') && rBlock === 'BARAUT');

            if (!isTargetBlock) return r;

            const snoMatch = r.sno && capturedSetBySno.has(r.sno);
            const nameNorm = (r.gpNameUnicode || '').toUpperCase().replace(/[^A-Z]/g, '');
            const nameMatch = nameNorm && capturedSetByName.has(nameNorm);

            if (snoMatch || nameMatch) {
              if (r.panchayatNirnayStatus !== 'captured') {
                updatedNames.push(r.gpNameUnicode);
                return {
                  ...r,
                  panchayatNirnayStatus: 'captured' as PanchayatNirnayStatus,
                  panchayatNirnayCapturedDate: r.panchayatNirnayCapturedDate || getDelhiDateString(),
                  isMappedInPanchayatNirnay: true
                };
              }
            }
            return r;
          });

          if (updatedNames.length > 0) {
            set({ records: updatedRecords });
            notifyStoreChange(get(), true);
          }
        }

        return {
          updatedCount: updatedNames.length,
          updatedNames,
          blockMatched: payload.blockName || 'जनपद बागपत'
        };
      },

      updateMisStatus: (id: string, status: MisAuditStatus, notes?: string, fedDate?: string) => {
        const current = get().records.find(r => r.id === id);
        const gpName = current?.gpNameUnicode || 'ग्राम पंचायत';
        const block = current?.block || 'Baghpat';
        const statusHi = status === 'fed' ? 'फीडेड (पूर्ण)' : status === 'pending' ? 'लंबित' : 'अनफीडेड';

        set(state => ({
          records: state.records.map(r => {
            if (r.id === id) {
              return {
                ...r,
                misStatus: status,
                misAuditedCount: status === 'fed' ? 1 : 0,
                misFedDate: status === 'fed' ? (fedDate || r.misFedDate || getDelhiDateString()) : undefined,
                misNotes: notes !== undefined ? notes : r.misNotes
              };
            }
            return r;
          }),
          selectedGPForProfile: state.selectedGPForProfile?.id === id ? {
            ...state.selectedGPForProfile,
            misStatus: status,
            misAuditedCount: status === 'fed' ? 1 : 0,
            misFedDate: status === 'fed' ? (fedDate || state.selectedGPForProfile.misFedDate || getDelhiDateString()) : undefined,
            misNotes: notes !== undefined ? notes : state.selectedGPForProfile.misNotes
          } : state.selectedGPForProfile
        }));

        get().logActivity({
          module: 'mis',
          recordId: id,
          gpName,
          block,
          actionType: 'status_change',
          actionLabel: 'MIS फीडिंग स्थिति बदलाव',
          userName: 'MIS फीडिंग नोडल',
          details: `${gpName}: MIS पोर्टल फीडिंग स्थिति "${statusHi}" की गई।`,
          newValue: statusHi
        });
        notifyStoreChange(get());
      },

      syncMisFromPayload: (payload: MisSyncPayload) => {
        const state = get();
        const updatedNames: string[] = [];
        const normalizedBlock = (payload.blockName || '').toUpperCase();

        if (payload.auditedGps && payload.auditedGps.length > 0) {
          const auditedSetBySno = new Set(payload.auditedGps.map(g => g.sno).filter(Boolean));
          const auditedSetByName = new Set(payload.auditedGps.map(g => (g.name || '').toUpperCase().replace(/[^A-Z]/g, '')));

          const updatedRecords = state.records.map(r => {
            const rBlock = r.block.toUpperCase();
            const isTargetBlock = !normalizedBlock || rBlock === normalizedBlock || 
              (normalizedBlock.includes('BAGHPAT') && rBlock === 'BAGHPAT') ||
              (normalizedBlock.includes('BARAUT') && rBlock === 'BARAUT');

            if (!isTargetBlock) return r;

            const snoMatch = r.sno && auditedSetBySno.has(r.sno);
            const nameNorm = (r.gpNameUnicode || '').toUpperCase().replace(/[^A-Z]/g, '');
            const nameMatch = nameNorm && auditedSetByName.has(nameNorm);

            if (snoMatch || nameMatch) {
              if (r.misStatus !== 'fed') {
                updatedNames.push(r.gpNameUnicode);
                return {
                  ...r,
                  misStatus: 'fed' as MisAuditStatus,
                  misAuditedCount: 1,
                  misFedDate: r.misFedDate || getDelhiDateString()
                };
              }
            }
            return r;
          });

          if (updatedNames.length > 0) {
            set({ records: updatedRecords });
            notifyStoreChange(get(), true);
          }
        }

        return {
          updatedCount: updatedNames.length,
          updatedNames,
          blockMatched: payload.blockName || 'जनपद बागपत'
        };
      },

      resetToBaseline: () => {
        if (typeof window !== 'undefined' && window.confirm('क्या आप सोशल ऑडिट कैलेंडर को मूल आधिकारिक डेटा पर रीसेट करना चाहते हैं?')) {
          set({ 
            records: INITIAL_SOCIAL_AUDIT_RECORDS,
            nsapRecords: INITIAL_NSAP_DATA_RECORDS
          });
          notifyStoreChange(get(), true);
        }
      },

      // NSAP Detailed Beneficiary Actions
      addNsapRecord: (data: NSAPGramPanchayatData) => {
        set((state) => ({
          nsapRecords: [data, ...state.nsapRecords.filter(r => r.gpNameUnicode !== data.gpNameUnicode)]
        }));
        notifyStoreChange(get());
      },

      updateNsapRecord: (id: string, updates: Partial<NSAPGramPanchayatData>) => {
        set((state) => ({
          nsapRecords: state.nsapRecords.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
        notifyStoreChange(get());
      },

      deleteNsapRecord: (id: string) => {
        set((state) => ({
          nsapRecords: state.nsapRecords.filter(r => r.id !== id)
        }));
        notifyStoreChange(get());
      },

      addNsapBeneficiary: (gpId: string, beneficiary: Omit<NSAPBeneficiaryRecord, 'id'>) => {
        set((state) => {
          const target = state.nsapRecords.find(r => r.id === gpId);
          if (!target) return state;
          const newBen: NSAPBeneficiaryRecord = {
            ...beneficiary,
            id: `ben-${gpId}-${Date.now()}`
          };
          const updatedBens = [newBen, ...target.beneficiaries];
          return {
            nsapRecords: state.nsapRecords.map(r => r.id === gpId ? {
              ...r,
              beneficiaries: updatedBens,
              ineligibleCount: updatedBens.filter(b => b.category === 'ineligible').length,
              deceasedCount: updatedBens.filter(b => b.category === 'deceased').length,
              unverifiedCount: updatedBens.filter(b => b.category === 'unverified').length,
            } : r)
          };
        });
        notifyStoreChange(get());
      },

      addNsapBeneficiariesBatch: (gpId: string, beneficiaries: Omit<NSAPBeneficiaryRecord, 'id'>[]) => {
        set((state) => {
          const target = state.nsapRecords.find(r => r.id === gpId);
          if (!target || !beneficiaries.length) return state;
          const timestamp = Date.now();
          const newBens: NSAPBeneficiaryRecord[] = beneficiaries.map((b, idx) => ({
            ...b,
            id: `ben-${gpId}-${timestamp}-${idx}`
          }));
          const updatedBens = [...newBens, ...target.beneficiaries];
          return {
            nsapRecords: state.nsapRecords.map(r => r.id === gpId ? {
              ...r,
              beneficiaries: updatedBens,
              ineligibleCount: updatedBens.filter(b => b.category === 'ineligible').length,
              deceasedCount: updatedBens.filter(b => b.category === 'deceased').length,
              unverifiedCount: updatedBens.filter(b => b.category === 'unverified').length,
            } : r)
          };
        });
        notifyStoreChange(get(), true);
      },

      deleteNsapBeneficiary: (gpId: string, beneficiaryId: string) => {
        set((state) => {
          const target = state.nsapRecords.find(r => r.id === gpId);
          if (!target) return state;
          const updatedBens = target.beneficiaries.filter(b => b.id !== beneficiaryId);
          return {
            nsapRecords: state.nsapRecords.map(r => r.id === gpId ? {
              ...r,
              beneficiaries: updatedBens,
              ineligibleCount: updatedBens.filter(b => b.category === 'ineligible').length,
              deceasedCount: updatedBens.filter(b => b.category === 'deceased').length,
              unverifiedCount: updatedBens.filter(b => b.category === 'unverified').length,
            } : r)
          };
        });
        notifyStoreChange(get());
      }
    }),
    {
      name: 'social-audit-baghpat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        records: state.records,
        nsapRecords: state.nsapRecords,
        activityLogs: state.activityLogs,
        fontViewMode: state.fontViewMode,
        isLiveSync: state.isLiveSync,
        asOfDate: state.asOfDate,
        activeTab: state.activeTab,
        selectedBRP: state.selectedBRP
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Rehydrate activity logs if missing
          if (!state.activityLogs || !Array.isArray(state.activityLogs) || state.activityLogs.length === 0) {
            state.activityLogs = INITIAL_ACTIVITY_LOGS;
          }
          // Rehydrate NSAP data records if missing in local storage
          if (!state.nsapRecords || !Array.isArray(state.nsapRecords) || state.nsapRecords.length === 0) {
            state.nsapRecords = INITIAL_NSAP_DATA_RECORDS;
          } else {
            // Attach rosterRecordId and ensure correct block for baseline records
            state.nsapRecords = state.nsapRecords.map(r => {
              const baseMatch = INITIAL_NSAP_DATA_RECORDS.find(init => init.id === r.id);
              if (baseMatch) {
                return {
                  ...r,
                  rosterRecordId: r.rosterRecordId || baseMatch.rosterRecordId,
                  block: baseMatch.block,
                  meetingDate: baseMatch.meetingDate
                };
              }
              return r;
            });
          }

          // If live sync is true (default) or undefined, ensure asOfDate is synced to today's Delhi date
          if (state.isLiveSync === undefined || state.isLiveSync === true) {
            const today = getDelhiDateString();
            state.asOfDate = today;
            state.liveDelhiDate = today;
            state.isLiveSync = true;
          }
          state.liveDelhiTime = getDelhiTimeString();

          // Sync Panchayat Nirnay baseline status if missing
          if (state.records && Array.isArray(state.records)) {
            const baselineMap = new Map(INITIAL_SOCIAL_AUDIT_RECORDS.map(r => [r.id, r]));
            const capturedIds = new Set([
              'baghpat-24', 'baghpat-25', 'baghpat-26', 'baghpat-28', 'baghpat-29', 'baghpat-30',
              'baraut-1', 'baraut-2', 'baraut-17'
            ]);
            
            const updatedRecords = state.records.map(r => {
              const base = baselineMap.get(r.id);
              // Ensure verified 9 records are captured
              if (capturedIds.has(r.id) && r.panchayatNirnayStatus !== 'captured') {
                return {
                  ...r,
                  panchayatNirnayStatus: 'captured' as PanchayatNirnayStatus,
                  panchayatNirnayCapturedDate: r.panchayatNirnayCapturedDate || r.meetingDate,
                  isMappedInPanchayatNirnay: true
                };
              }
              // If status is completely undefined, pull from baseline
              if (r.panchayatNirnayStatus === undefined && base) {
                return {
                  ...r,
                  panchayatNirnayStatus: base.panchayatNirnayStatus,
                  isMappedInPanchayatNirnay: base.isMappedInPanchayatNirnay,
                  panchayatNirnayCapturedDate: base.panchayatNirnayCapturedDate
                };
              }
              return r;
            });

            // Initialize MIS feeding status only if undefined
            const baghpatFedSet = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 30]);
            const barautFedSet = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18]);

            const finalRecords = updatedRecords.map(r => {
              if (r.misStatus === undefined) {
                const isBaghpatFed = r.block === 'Baghpat' && baghpatFedSet.has(r.sno);
                const isBarautFed = r.block === 'Baraut' && barautFedSet.has(r.sno);
                const isFedOfficial = isBaghpatFed || isBarautFed;
                return {
                  ...r,
                  misStatus: (isFedOfficial ? 'fed' : 'pending') as MisAuditStatus,
                  misAuditedCount: isFedOfficial ? 1 : 0,
                  misFedDate: isFedOfficial ? r.meetingDate : undefined
                };
              }
              return r;
            });

            state.records = finalRecords;
          }
        }
      }
    }
  )
);
