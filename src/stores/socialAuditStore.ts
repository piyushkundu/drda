import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  SocialAuditRecord, FontViewMode, AuditBlock, AuditStatus, 
  PanchayatNirnayStatus, MisAuditStatus, NSAPGramPanchayatData, NSAPBeneficiaryRecord,
  SocialAuditActivityLog, VRPMember, VRPTeamCode, CancellationDetails, RescheduleStatus, MonthlyReportDraft
} from '@/types/socialAudit';
import { 
  SocialAuditUser, DEFAULT_DDO_USER, canUserEnableEditMode, 
  validateMeetingCompletionDate 
} from '@/lib/socialAuditAuth';
import { INITIAL_SOCIAL_AUDIT_RECORDS, BLOCK_SABHA_RECORDS, DISTRICT_META } from '@/data/socialAuditInitialData';
import { INITIAL_NSAP_DATA_RECORDS } from '@/data/nsapDataInitial';
import { INITIAL_ACTIVITY_LOGS } from '@/data/initialActivityLogs';
import { INITIAL_VRP_RECORDS } from '@/data/vrpInitialData';
import { normalizeKrutiDevText } from '@/lib/fontConversion/normalizeKrutiDev';
import { getDelhiDateString, getDelhiTimeString, fetchOnlineDelhiTime } from '@/lib/delhiTime';
import { NirnaySyncPayload } from '@/lib/nirnaySyncBookmarklet';
import { MisSyncPayload } from '@/lib/misSyncBookmarklet';
import { extractBRPOptions } from '@/lib/brpHelper';
import { confirmHistoricalEdit, reportingDate } from '@/lib/socialAuditAsOf';
import { getEffectiveMeetingDate, getProgressCutoffDate } from '@/lib/dateResolution';
import { getNSAPWriteError, getNSAPVerification, withDerivedNSAPUnverified } from '@/lib/nsapVerification';
import { getMonthlyReportPeriod, validateMonthlyReportDraft } from '@/lib/socialAuditReports';
import { 
  GlobalDateRange, DEFAULT_DATE_RANGE, 
  shouldResetBRPOnBlockChange 
} from '@/lib/globalFilterHelper';
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
  | 'nsap-workbook'
  | 'roster' 
  | 'reports' 
  | 'activity-log' 
  | 'overview';

export type FirebaseSyncStatus = 'synced' | 'syncing' | 'error' | 'loading' | 'offline';

interface SocialAuditState {
  records: SocialAuditRecord[];
  nsapRecords: NSAPGramPanchayatData[];
  monthlyReportDrafts: Record<string, MonthlyReportDraft>;
  saveMonthlyReportDraft: (month: string, draft: MonthlyReportDraft) => boolean;
  resetMonthlyReportDraft: (month: string) => boolean;
  activityLogs: SocialAuditActivityLog[];
  fontViewMode: FontViewMode;
  selectedBlock: 'all' | AuditBlock;
  selectedBRP: string; // 'all' or BRP phone / name
  selectedTeamMember: string; // 'all' or team member name
  dateRange: GlobalDateRange;
  selectedScheme: 'all' | 'nsap' | 'mgnrega' | 'pmayg';
  selectedStatus: 'all' | AuditStatus | 'upcoming' | 'overdue';
  searchQuery: string;
  isEditMode: boolean;
  hasUnsavedChanges: boolean;
  currentUser: SocialAuditUser;
  selectedRecordForCompletion: SocialAuditRecord | null;
  selectedRecordForCancel: SocialAuditRecord | null;
  selectedRecordForReschedule: SocialAuditRecord | null;
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
  nsapWorkbookTargetId: string | null;

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
  setSelectedTeamMember: (member: string) => void;
  resetSelectedTeamMember: () => void;
  setDateRange: (range: Partial<GlobalDateRange>) => void;
  resetDateRange: () => void;
  resetAllGlobalFilters: () => void;
  setSelectedScheme: (scheme: 'all' | 'nsap' | 'mgnrega' | 'pmayg') => void;
  setSelectedStatus: (status: 'all' | AuditStatus | 'upcoming' | 'overdue') => void;
  setSearchQuery: (query: string) => void;
  setIsEditMode: (isEdit: boolean) => boolean;
  setCurrentUser: (user: SocialAuditUser) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  openCompletionModal: (record: SocialAuditRecord) => void;
  closeCompletionModal: () => void;
  openCancelModal: (record: SocialAuditRecord) => void;
  closeCancelModal: () => void;
  openRescheduleModal: (record: SocialAuditRecord) => void;
  closeRescheduleModal: () => void;
  cancelMeeting: (id: string, reason: string, remarks?: string) => Promise<boolean>;
  rescheduleMeeting: (id: string, newDate: string, newTime?: string, reason?: string) => Promise<boolean>;
  canCompleteMeeting: (record: SocialAuditRecord | null | undefined) => { canComplete: boolean; errorCode?: string; errorMessage?: string };
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
  openNsapWorkbook: (rosterRecordId: string) => void;
  clearNsapWorkbookTarget: () => void;
  logActivity: (log: Omit<SocialAuditActivityLog, 'id' | 'timestamp'>) => void;

  // Record CRUD, Nirnay App & MIS Feeding Confirmation
  updateRecord: (id: string, updates: Partial<SocialAuditRecord>) => boolean;
  updatePanchayatNirnayStatus: (id: string, status: PanchayatNirnayStatus, notes?: string) => boolean;
  syncNirnayFromPayload: (payload: NirnaySyncPayload) => { updatedCount: number; updatedNames: string[]; blockMatched: string };
  updateMisStatus: (id: string, status: MisAuditStatus, notes?: string, fedDate?: string) => boolean;
  syncMisFromPayload: (payload: MisSyncPayload) => { updatedCount: number; updatedNames: string[]; blockMatched: string };
  addRecord: (record: Omit<SocialAuditRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
  markCompleted: (id: string, isCompleted: boolean) => boolean;
  resetToBaseline: () => void;

  // NSAP Detailed Beneficiary Data Management Actions
  setNsapRecords: (records: NSAPGramPanchayatData[]) => boolean;
  addNsapRecord: (data: NSAPGramPanchayatData) => boolean;
  updateNsapRecord: (id: string, updates: Partial<NSAPGramPanchayatData>) => boolean;
  deleteNsapRecord: (id: string) => void;
  addNsapBeneficiary: (gpId: string, beneficiary: Omit<NSAPBeneficiaryRecord, 'id'>) => boolean;
  addNsapBeneficiariesBatch: (gpId: string, beneficiaries: Omit<NSAPBeneficiaryRecord, 'id'>[]) => boolean;
  deleteNsapBeneficiary: (gpId: string, beneficiaryId: string) => void;

  // VRP (Village Resource Person) / Team Management Actions
  vrpMembers: VRPMember[];
  assignVRPMember: (vrpId: string, block: AuditBlock, subTeam?: VRPTeamCode | null, role?: string) => void;
  unassignVRPMember: (vrpId: string) => void;
  addVRPMember: (member: Omit<VRPMember, 'id' | 'srNo'>) => void;
  updateVRPMember: (vrpId: string, updates: Partial<VRPMember>) => void;
  deleteVRPMember: (vrpId: string) => void;
  resetVRPMembersToBaseline: () => void;
}

let _localChangeTimestamp = 0;

/**
 * Triggers a debounced or immediate save to Firebase Firestore
 * and keeps the UI status in sync.
 */
function notifyStoreChange(state: SocialAuditState, immediate = false) {
  if (typeof window === 'undefined') return;
  
  // Security guard: Only persist changes to remote Firestore if Central Edit Mode is enabled
  if (!state.isEditMode) {
    return;
  }

  _localChangeTimestamp = Date.now();
  useSocialAuditStore.setState({ firebaseSyncStatus: 'syncing' });

  saveSocialAuditToFirestore(
    state.records,
    state.nsapRecords,
    state.asOfDate,
    state.isLiveSync,
    immediate,
    state.activityLogs,
    state.vrpMembers,
    state.monthlyReportDrafts
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
      monthlyReportDrafts: {},
      activityLogs: INITIAL_ACTIVITY_LOGS,
      vrpMembers: INITIAL_VRP_RECORDS,
      fontViewMode: 'unicode',
      selectedBlock: 'all',
      selectedBRP: 'all',
      selectedTeamMember: 'all',
      dateRange: DEFAULT_DATE_RANGE,
      selectedScheme: 'all',
      selectedStatus: 'all',
      searchQuery: '',
      isEditMode: false,
      hasUnsavedChanges: false,
      currentUser: DEFAULT_DDO_USER,
      selectedRecordForCompletion: null,
      selectedRecordForCancel: null,
      selectedRecordForReschedule: null,
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
      nsapWorkbookTargetId: null,

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
            const remoteNsap = (remoteDoc.nsapRecords && remoteDoc.nsapRecords.length > 0) 
              ? remoteDoc.nsapRecords 
              : get().nsapRecords;
            const existingIds = new Set(remoteNsap.map((r: any) => r.id));
            const existingRosterIds = new Set(remoteNsap.map((r: any) => r.rosterRecordId).filter(Boolean));
            const missingBase = INITIAL_NSAP_DATA_RECORDS.filter(init => 
              !existingIds.has(init.id) && !existingRosterIds.has(init.rosterRecordId)
            );
            const mergedNsap = missingBase.length > 0 ? [...remoteNsap, ...missingBase] : remoteNsap;

            set({
              records: remoteDoc.records,
              nsapRecords: mergedNsap,
              monthlyReportDrafts: remoteDoc.monthlyReportDrafts ?? get().monthlyReportDrafts,
              activityLogs: (remoteDoc.activityLogs && remoteDoc.activityLogs.length > 0)
                ? remoteDoc.activityLogs
                : get().activityLogs,
              vrpMembers: (remoteDoc.vrpMembers && remoteDoc.vrpMembers.length > 0)
                ? remoteDoc.vrpMembers
                : get().vrpMembers,
              firebaseSyncStatus: 'synced',
              firebaseLastSyncedAt: remoteDoc.updatedAt 
                ? new Date(remoteDoc.updatedAt).toLocaleTimeString('hi-IN') 
                : new Date().toLocaleTimeString('hi-IN')
            });

            if (missingBase.length > 0) {
              const currentState = get();
              saveSocialAuditToFirestore(
                currentState.records,
                mergedNsap,
                currentState.asOfDate,
                currentState.isLiveSync,
                true,
                currentState.activityLogs,
                currentState.vrpMembers,
                currentState.monthlyReportDrafts
              ).catch((e) => console.warn('Auto-persisting merged NSAP baseline records failed:', e));
            }
          } else {
            // Document does not exist yet on server: seed current local state to Firestore
            const state = get();
            await saveSocialAuditToFirestore(
              state.records,
              state.nsapRecords,
              state.asOfDate,
              state.isLiveSync,
              true,
              state.activityLogs,
              state.vrpMembers,
              state.monthlyReportDrafts
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
              const remoteNsap = (remoteData.nsapRecords && remoteData.nsapRecords.length > 0)
                ? remoteData.nsapRecords
                : get().nsapRecords;
              const existingIds = new Set(remoteNsap.map((r: any) => r.id));
              const existingRosterIds = new Set(remoteNsap.map((r: any) => r.rosterRecordId).filter(Boolean));
              const missingBase = INITIAL_NSAP_DATA_RECORDS.filter(init => 
                !existingIds.has(init.id) && !existingRosterIds.has(init.rosterRecordId)
              );
              const mergedNsap = missingBase.length > 0 ? [...remoteNsap, ...missingBase] : remoteNsap;

              set({
                records: remoteData.records,
                nsapRecords: mergedNsap,
                monthlyReportDrafts: remoteData.monthlyReportDrafts ?? get().monthlyReportDrafts,
                activityLogs: (remoteData.activityLogs && remoteData.activityLogs.length > 0)
                  ? remoteData.activityLogs
                  : get().activityLogs,
                vrpMembers: (remoteData.vrpMembers && remoteData.vrpMembers.length > 0)
                  ? remoteData.vrpMembers
                  : get().vrpMembers,
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
        if (!confirmHistoricalEdit(get().asOfDate)) return false;
        const state = get();
        set({ firebaseSyncStatus: 'syncing' });
        const success = await saveSocialAuditToFirestore(
          state.records,
          state.nsapRecords,
          state.asOfDate,
          state.isLiveSync,
          true,
          state.activityLogs,
          state.vrpMembers,
          state.monthlyReportDrafts
        );
        set({
          firebaseSyncStatus: success ? 'synced' : 'error',
          firebaseLastSyncedAt: success ? new Date().toLocaleTimeString('hi-IN') : state.firebaseLastSyncedAt
        });
        return success;
      },

      setFontViewMode: (mode) => set({ fontViewMode: mode }),
      setSelectedBlock: (block) => {
        const state = get();
        const brpOptions = extractBRPOptions(state.records);
        const mustResetBRP = shouldResetBRPOnBlockChange(state.selectedBRP, block, brpOptions);
        set({
          selectedBlock: block,
          selectedBRP: mustResetBRP ? 'all' : state.selectedBRP,
        });
      },
      setSelectedBRP: (brp) => set({ selectedBRP: brp }),
      resetSelectedBRP: () => set({ selectedBRP: 'all' }),
      setSelectedTeamMember: (member) => set({ selectedTeamMember: member }),
      resetSelectedTeamMember: () => set({ selectedTeamMember: 'all' }),
      setDateRange: (range) =>
        set((prev) => ({
          dateRange: { ...prev.dateRange, ...range },
        })),
      resetDateRange: () => set({ dateRange: DEFAULT_DATE_RANGE }),
      resetAllGlobalFilters: () =>
        set({
          selectedBRP: 'all',
          selectedTeamMember: 'all',
          selectedBlock: 'all',
          dateRange: DEFAULT_DATE_RANGE,
          selectedScheme: 'all',
          selectedStatus: 'all',
          searchQuery: '',
        }),
      setSelectedScheme: (scheme) => set({ selectedScheme: scheme }),
      setSelectedStatus: (status) => set({ selectedStatus: status }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCurrentUser: (user) => {
        set({ currentUser: user });
        if (!user.isAuthenticated || !['ddo', 'admin'].includes(user.role)) {
          set({ isEditMode: false });
        }
      },

      setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

      setIsEditMode: (isEdit: boolean) => {
        if (isEdit) {
          const authCheck = canUserEnableEditMode(get().currentUser);
          if (!authCheck.allowed) {
            if (typeof window !== 'undefined') {
              alert(authCheck.reason || 'अनधिकृत: केवल अधिकृत प्रशासनिक अधिकारी ही संपादन मोड चालू कर सकते हैं।');
            }
            return false;
          }
          set({ isEditMode: true });
          return true;
        } else {
          // Exiting Edit Mode: check for unsaved changes
          if (get().hasUnsavedChanges) {
            if (typeof window !== 'undefined') {
              const confirmExit = window.confirm(
                'आपके कुछ बदलाव अभी सेव नहीं हुए हैं। Edit Mode बंद करने पर ये बदलाव खो सकते हैं। क्या आप जारी रखना चाहते हैं?'
              );
              if (!confirmExit) {
                return false;
              }
            }
          }
          set({ 
            isEditMode: false, 
            hasUnsavedChanges: false,
            selectedRecordForCompletion: null,
            selectedRecordForEdit: null,
            isAddModalOpen: false
          });
          return true;
        }
      },

      canCompleteMeeting: (record) => {
        return validateMeetingCompletionDate(record ? getEffectiveMeetingDate(record) : undefined, getProgressCutoffDate(get().asOfDate));
      },

      openCompletionModal: (record) => {
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: बैठक सम्पन्न करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return;
        }
        const check = get().canCompleteMeeting(record);
        if (!check.canComplete) {
          if (typeof window !== 'undefined') {
            alert(check.errorMessage || 'इस ग्राम पंचायत की सोशल ऑडिट बैठक की निर्धारित तिथि अभी नहीं आई है। निर्धारित तिथि से पहले बैठक को सम्पन्न नहीं किया जा सकता।');
          }
          return;
        }
        set({ selectedRecordForCompletion: record });
      },

      closeCompletionModal: () => set({ selectedRecordForCompletion: null }),

      openCancelModal: (record: SocialAuditRecord) => {
        set({ selectedRecordForCancel: record });
      },

      closeCancelModal: () => set({ selectedRecordForCancel: null }),

      openRescheduleModal: (record: SocialAuditRecord) => {
        set({ selectedRecordForReschedule: record });
      },

      closeRescheduleModal: () => set({ selectedRecordForReschedule: null }),

      setAsOfDate: (date) => {
        if (!reportingDate(date) || date.length !== 10) return;
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
      openNsapWorkbook: (rosterRecordId) => {
        if (get().records.some(record => record.id === rosterRecordId && record.hasNSAP)) {
          set({ nsapWorkbookTargetId: rosterRecordId, activeTab: 'nsap-workbook' });
        }
      },
      clearNsapWorkbookTarget: () => set({ nsapWorkbookTargetId: null }),

      openEditModal: (record) => set({ selectedRecordForEdit: get().records.find(r => r.id === record.id) || record }),
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
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: अभिलेख में संपादन करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

        const current = get().records.find(r => r.id === id);
        if (updates.status === 'completed') {
          const validation = get().canCompleteMeeting(current ? { ...current, ...updates } : undefined);
          if (!validation.canComplete) {
            if (typeof window !== 'undefined') alert(validation.errorMessage);
            return false;
          }
          updates = {
            ...updates,
            completedDate: updates.completedDate || current?.completedDate || getProgressCutoffDate(get().asOfDate),
            completedAt: updates.completedAt || current?.completedAt || new Date().toISOString(),
          };
        }
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
          userName: get().currentUser.name || 'प्रशासनिक अधिकारी',
          details: `${gpName} के अभिलेख में अद्यतन किया गया।`
        });
        notifyStoreChange(get());
        return true;
      },

      updatePanchayatNirnayStatus: (id, status, notes) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: पंचायत निर्णय स्थिति बदलने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

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
          userName: get().currentUser.name || 'पंचायत निर्णय नोडल',
          details: `${gpName}: पंचायत निर्णय स्थिति "${statusHi}" की गई।`,
          newValue: statusHi
        });
        notifyStoreChange(get());
        return true;
      },

      addRecord: (recordData) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: नया रोस्टर रिकॉर्ड जोड़ने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return;
        }

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
          userName: get().currentUser.name || 'प्रशासनिक अधिकारी',
          details: `नवीन ग्राम पंचायत "${newRecord.gpNameUnicode}" (${newRecord.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}) रोस्टर में जोड़ी गई।`
        });
        notifyStoreChange(get());
      },

      deleteRecord: (id) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: रिकॉर्ड हटाने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return;
        }

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
          userName: get().currentUser.name || 'प्रशासनिक अधिकारी',
          details: `ग्राम पंचायत "${gpName}" का अभिलेख हटाया गया।`
        });
        notifyStoreChange(get());
      },

      markCompleted: (id, isCompleted) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: बैठक स्थिति बदलने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

        const current = get().records.find(r => r.id === id);
        if (!current) return false;

        // Strict Date-based lock check for marking completion
        if (isCompleted) {
          const dateValidation = get().canCompleteMeeting(current);
          if (!dateValidation.canComplete) {
            if (typeof window !== 'undefined') {
              alert(dateValidation.errorMessage || 'इस ग्राम पंचायत की सोशल ऑडिट बैठक की निर्धारित तिथि अभी नहीं आई है। निर्धारित तिथि से पहले बैठक को सम्पन्न नहीं किया जा सकता।');
            }
            return false;
          }
        }

        const gpName = current.gpNameUnicode || 'ग्राम पंचायत';
        const block = current.block || 'Baghpat';

        set((state) => ({
          records: state.records.map((r) => {
            if (r.id === id) {
              return {
                ...r,
                status: isCompleted ? 'completed' : (r.isAmended ? 'amended' : 'scheduled'),
                completedDate: isCompleted ? (r.completedDate || getProgressCutoffDate(state.asOfDate)) : undefined,
                completedAt: isCompleted ? (r.completedAt || new Date().toISOString()) : undefined,
                rescheduleStatus: 'not_required',
                // Strict rule: MIS status becomes pending only upon explicit completion (if not already fed)
                misStatus: isCompleted ? (r.misStatus === 'fed' ? 'fed' : 'pending') : 'not_eligible'
              };
            }
            return r;
          }),
          selectedGPForProfile: state.selectedGPForProfile?.id === id ? {
            ...state.selectedGPForProfile,
            status: isCompleted ? 'completed' : (state.selectedGPForProfile.isAmended ? 'amended' : 'scheduled'),
            completedDate: isCompleted ? (state.selectedGPForProfile.completedDate || getProgressCutoffDate(state.asOfDate)) : undefined,
            completedAt: isCompleted ? (state.selectedGPForProfile.completedAt || new Date().toISOString()) : undefined,
            rescheduleStatus: 'not_required',
            misStatus: isCompleted ? (state.selectedGPForProfile.misStatus === 'fed' ? 'fed' : 'pending') : 'not_eligible'
          } : state.selectedGPForProfile
        }));

        get().logActivity({
          module: 'meeting',
          recordId: id,
          gpName,
          block,
          actionType: 'status_change',
          actionLabel: isCompleted ? 'बैठक सम्पन्न चिन्हित' : 'बैठक पुनः प्रस्तावित',
          userName: get().currentUser.name || 'नोडल अधिकारी',
          details: `${gpName} की सोशल ऑडिट बैठक को "${isCompleted ? 'सम्पन्न' : 'प्रस्तावित'}" के रूप में चिन्हित किया गया।`,
          newValue: isCompleted ? 'सम्पन्न' : 'प्रस्तावित'
        });
        notifyStoreChange(get());
        return true;
      },

      cancelMeeting: async (id: string, reason: string, remarks?: string): Promise<boolean> => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: बैठक निरस्त करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

        const state = get();
        const current = state.records.find((r) => r.id === id);
        if (!current) return false;

        const cancellationDetail: CancellationDetails = {
          cancelledDate: getProgressCutoffDate(state.asOfDate),
          cancelledAt: new Date().toISOString(),
          reason,
          remarks: remarks || '',
          cancelledBy: state.currentUser.name || 'नोडल अधिकारी',
          previousMeetingDate: current.meetingDate
        };

        const existingHistory = current.cancellationHistory || [];
        const newHistory = [...existingHistory, cancellationDetail];

        const gpName = current.gpNameUnicode || 'ग्राम पंचायत';
        const block = current.block || 'Baghpat';

        set((state) => ({
          records: state.records.map((r) => {
            if (r.id === id) {
              return {
                ...r,
                status: 'cancelled',
                rescheduleStatus: 'pending',
                misStatus: 'not_eligible', // Cancelled meetings are NEVER eligible for MIS Pending!
                cancellationDetails: cancellationDetail,
                cancellationHistory: newHistory,
                completedDate: undefined,
                completedAt: undefined
              };
            }
            return r;
          }),
          selectedGPForProfile: state.selectedGPForProfile?.id === id ? {
            ...state.selectedGPForProfile,
            status: 'cancelled',
            rescheduleStatus: 'pending',
            misStatus: 'not_eligible',
            cancellationDetails: cancellationDetail,
            cancellationHistory: newHistory,
            completedDate: undefined,
            completedAt: undefined
          } : state.selectedGPForProfile,
          selectedRecordForCancel: null
        }));

        get().logActivity({
          module: 'meeting',
          recordId: id,
          gpName,
          block,
          actionType: 'status_change',
          actionLabel: 'बैठक निरस्त',
          userName: get().currentUser.name || 'नोडल अधिकारी',
          details: `${gpName} की सोशल ऑडिट बैठक निरस्त की गई। कारण: ${reason} ${remarks ? `(${remarks})` : ''}`,
          newValue: 'निरस्त'
        });

        notifyStoreChange(get());
        return true;
      },

      rescheduleMeeting: async (id: string, newDate: string, newTime?: string, reason?: string): Promise<boolean> => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: बैठक पुनर्निर्धारित करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

        const state = get();
        const current = state.records.find((r) => r.id === id);
        if (!current) return false;

        const prevDate = current.meetingDate;
        const origDate = current.originalMeetingDate || current.amendmentDetails?.originalDate || prevDate;

        const gpName = current.gpNameUnicode || 'ग्राम पंचायत';
        const block = current.block || 'Baghpat';

        // Update cancellation history with rescheduled date on the last cancellation if present
        const updatedHistory = (current.cancellationHistory || []).map((c, idx, arr) => {
          if (idx === arr.length - 1 && !c.rescheduledDate) {
            return { ...c, rescheduledDate: newDate };
          }
          return c;
        });

        set((state) => ({
          records: state.records.map((r) => {
            if (r.id === id) {
              return {
                ...r,
                meetingDate: newDate,
                originalMeetingDate: origDate,
                timeUnicode: newTime ? `${newTime} बजे` : r.timeUnicode,
                isAmended: true,
                amendmentDetails: {
                  originalDate: origDate,
                  modifiedDate: newDate,
                  reason: reason || 'पुनर्निर्धारित रोस्टर'
                },
                status: 'scheduled', // Back to proposed/scheduled
                rescheduleStatus: 'not_required',
                misStatus: 'not_eligible', // Never MIS pending before completion
                cancellationHistory: updatedHistory,
                completedDate: undefined,
                completedAt: undefined
              };
            }
            return r;
          }),
          selectedGPForProfile: state.selectedGPForProfile?.id === id ? {
            ...state.selectedGPForProfile,
            meetingDate: newDate,
            originalMeetingDate: origDate,
            timeUnicode: newTime ? `${newTime} बजे` : state.selectedGPForProfile.timeUnicode,
            isAmended: true,
            amendmentDetails: {
              originalDate: origDate,
              modifiedDate: newDate,
              reason: reason || 'पुनर्निर्धारित रोस्टर'
            },
            status: 'scheduled',
            rescheduleStatus: 'not_required',
            misStatus: 'not_eligible',
            cancellationHistory: updatedHistory,
            completedDate: undefined,
            completedAt: undefined
          } : state.selectedGPForProfile,
          selectedRecordForReschedule: null
        }));

        get().logActivity({
          module: 'meeting',
          recordId: id,
          gpName,
          block,
          actionType: 'status_change',
          actionLabel: 'बैठक पुनर्निर्धारित',
          userName: get().currentUser.name || 'नोडल अधिकारी',
          details: `${gpName} की सोशल ऑडिट बैठक को नई तिथि ${newDate} पर पुनर्निर्धारित किया गया।`,
          newValue: `पुनर्निर्धारित: ${newDate}`
        });

        notifyStoreChange(get());
        return true;
      },

      syncNirnayFromPayload: (payload: NirnaySyncPayload) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return { updatedCount: 0, updatedNames: [], blockMatched: '' };
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: पंचायत निर्णय डेटा सिंक करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return { updatedCount: 0, updatedNames: [], blockMatched: '' };
        }

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
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: MIS फीडिंग स्थिति बदलने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

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
        return true;
      },

      syncMisFromPayload: (payload: MisSyncPayload) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return { updatedCount: 0, updatedNames: [], blockMatched: '' };
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: MIS फीडिंग डेटा सिंक करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return { updatedCount: 0, updatedNames: [], blockMatched: '' };
        }

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
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: कैलेंडर रीसेट करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return;
        }

        if (typeof window !== 'undefined' && window.confirm('क्या आप सोशल ऑडिट कैलेंडर को मूल आधिकारिक डेटा पर रीसेट करना चाहते हैं?')) {
          set({ 
            records: INITIAL_SOCIAL_AUDIT_RECORDS,
            nsapRecords: INITIAL_NSAP_DATA_RECORDS
          });
          notifyStoreChange(get(), true);
        }
      },

      saveMonthlyReportDraft: (month, draft) => {
        const state = get();
        if (!state.isEditMode) return false;
        const cutoff = getProgressCutoffDate(state.asOfDate);
        const error = validateMonthlyReportDraft(month, draft, cutoff);
        if (error) { if (typeof window !== 'undefined') alert(error); return false; }
        const period = getMonthlyReportPeriod(month, cutoff);
        if (!confirmHistoricalEdit(period.cutoff)) return false;
        const saved: MonthlyReportDraft = { values: { ...draft.values }, completeThrough: { ...draft.completeThrough }, updatedAt: new Date().toISOString(), updatedBy: state.currentUser.name };
        set({ monthlyReportDrafts: { ...state.monthlyReportDrafts, [month]: saved } });
        get().logActivity({ module: 'system', recordId: `mpr-${month}`, gpName: 'मासिक प्रगति रिपोर्ट', actionType: 'update', actionLabel: 'मासिक रिपोर्ट संशोधन', userName: state.currentUser.name, details: `${month} की रिपोर्ट के ${Object.keys(draft.values).length} मैनुअल खाने एवं पूर्णता तिथियाँ सुरक्षित की गईं।` });
        notifyStoreChange(get(), true);
        return true;
      },
      resetMonthlyReportDraft: (month) => {
        const state = get();
        if (!state.isEditMode) return false;
        let period;
        try { period = getMonthlyReportPeriod(month, getProgressCutoffDate(state.asOfDate)); } catch { return false; }
        if (!confirmHistoricalEdit(period.cutoff)) return false;
        // Keep an explicit empty month so Firestore merge also resets remote values.
        set({ monthlyReportDrafts: { ...state.monthlyReportDrafts, [month]: { values: {}, completeThrough: {}, updatedAt: new Date().toISOString(), updatedBy: state.currentUser.name } } });
        get().logActivity({ module: 'system', recordId: `mpr-${month}`, gpName: 'मासिक प्रगति रिपोर्ट', actionType: 'update', actionLabel: 'मासिक रिपोर्ट मूल आँकड़े बहाल', userName: state.currentUser.name, details: `${month} के मैनुअल संशोधन हटाए गए। मूल पंचायत रिकॉर्ड यथावत हैं।` });
        notifyStoreChange(get(), true);
        return true;
      },

      // NSAP Detailed Beneficiary Actions
      setNsapRecords: (newRecords: NSAPGramPanchayatData[]) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: NSAP डेटा अद्यतन करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

        const error = newRecords.map(record => getNSAPWriteError(record, get().nsapRecords.find(previous =>
          previous.id === record.id || Boolean(record.rosterRecordId && previous.rosterRecordId === record.rosterRecordId)
        ))).find(Boolean);
        if (error) {
          if (typeof window !== 'undefined') alert(error);
          return false;
        }
        set({ nsapRecords: newRecords.map(withDerivedNSAPUnverified) });
        get().logActivity({
          module: 'nsap',
          recordId: 'nsap-workbook-batch',
          gpName: 'सम्पूर्ण जनपद',
          actionType: 'update',
          actionLabel: 'NSAP वर्कबुक डेटा सिंक',
          userName: get().currentUser.name || 'प्रशासनिक अधिकारी',
          details: `NSAP एक्सेल वर्कबुक से ${newRecords.length} ग्राम पंचायतों का डेटा अद्यतन किया गया।`
        });
        notifyStoreChange(get(), true);
        return true;
      },

      addNsapRecord: (data: NSAPGramPanchayatData) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: NSAP डेटा जोड़ने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

        const error = getNSAPWriteError(data);
        if (error) {
          if (typeof window !== 'undefined') alert(error);
          return false;
        }
        set((state) => ({
          nsapRecords: [withDerivedNSAPUnverified(data), ...state.nsapRecords.filter(r => r.gpNameUnicode !== data.gpNameUnicode)]
        }));
        notifyStoreChange(get());
        return true;
      },

      updateNsapRecord: (id: string, updates: Partial<NSAPGramPanchayatData>) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: NSAP डेटा संपादित करने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

        const current = get().nsapRecords.find(record => record.id === id);
        if (!current) return false;
        const updated = { ...current, ...updates };
        const error = getNSAPWriteError(updated, current);
        if (error) {
          if (typeof window !== 'undefined') alert(error);
          return false;
        }
        set((state) => ({
          nsapRecords: state.nsapRecords.map(r => r.id === id ? withDerivedNSAPUnverified(updated) : r)
        }));
        notifyStoreChange(get());
        return true;
      },

      deleteNsapRecord: (id: string) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: NSAP डेटा हटाने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return;
        }

        set((state) => ({
          nsapRecords: state.nsapRecords.filter(r => r.id !== id)
        }));
        notifyStoreChange(get());
      },

      addNsapBeneficiary: (gpId: string, beneficiary: Omit<NSAPBeneficiaryRecord, 'id'>) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: लाभार्थी जोड़ने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

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
              unverifiedCount: getNSAPVerification(r).unverified ?? undefined,
            } : r)
          };
        });
        notifyStoreChange(get());
        return true;
      },

      addNsapBeneficiariesBatch: (gpId: string, beneficiaries: Omit<NSAPBeneficiaryRecord, 'id'>[]) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return false;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: बैच लाभार्थी जोड़ने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return false;
        }

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
              unverifiedCount: getNSAPVerification(r).unverified ?? undefined,
            } : r)
          };
        });
        notifyStoreChange(get(), true);
        return true;
      },

      deleteNsapBeneficiary: (gpId: string, beneficiaryId: string) => {
        if (get().isEditMode && !confirmHistoricalEdit(get().asOfDate)) return;
        if (!get().isEditMode) {
          if (typeof window !== 'undefined') {
            alert('त्रुटि: लाभार्थी हटाने के लिए कृपया पहले Header से Edit Mode ON करें।');
          }
          return;
        }

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
              unverifiedCount: getNSAPVerification(r).unverified ?? undefined,
            } : r)
          };
        });
        notifyStoreChange(get());
      },

      assignVRPMember: (vrpId: string, block: AuditBlock, subTeam?: VRPTeamCode | null, role?: string) => {
        if (!get().isEditMode || !confirmHistoricalEdit(get().asOfDate)) return;
        set((state) => {
          const target = state.vrpMembers.find((m) => m.id === vrpId);
          const blockHindi = block === 'Baghpat' ? 'बागपत' : 'बड़ौत';
          const subTeamName = subTeam || target?.assignedSubTeam || 'Team A';
          const updated = state.vrpMembers.map((m) =>
            m.id === vrpId
              ? {
                  ...m,
                  assignedBlock: block,
                  assignedSubTeam: subTeamName,
                  assignedRole: role || m.assignedRole || 'सक्रिय VRP सदस्य',
                  assignedDate: getDelhiDateString(),
                }
              : m
          );

          const newLogs: SocialAuditActivityLog[] = target
            ? [
                {
                  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  module: 'brp',
                  recordId: vrpId,
                  gpName: target.nameHindi || target.name,
                  block: block,
                  actionType: 'update',
                  actionLabel: 'VRP टीम आवंटन',
                  userName: state.currentUser.name,
                  userId: state.currentUser.id,
                  timestamp: new Date().toISOString(),
                  details: `VRP सदस्य को ${blockHindi} विकास खंड की सक्रिय ${subTeamName} में शामिल किया गया।`,
                  previousValue: target.assignedBlock ? `${target.assignedBlock === 'Baghpat' ? 'बागपत' : 'बड़ौत'} (${target.assignedSubTeam || 'टीम'})` : 'रिज़र्व पूल',
                  newValue: `${blockHindi} (${subTeamName})`,
                },
                ...state.activityLogs,
              ]
            : state.activityLogs;

          const newState = { ...state, vrpMembers: updated, activityLogs: newLogs, hasUnsavedChanges: true };
          notifyStoreChange(newState);
          return newState;
        });
      },

      unassignVRPMember: (vrpId: string) => {
        if (!get().isEditMode || !confirmHistoricalEdit(get().asOfDate)) return;
        set((state) => {
          const target = state.vrpMembers.find((m) => m.id === vrpId);
          const prevBlockHindi = target?.assignedBlock === 'Baghpat' ? 'बागपत' : target?.assignedBlock === 'Baraut' ? 'बड़ौत' : 'सक्रिय टीम';
          const prevSubTeam = target?.assignedSubTeam ? ` (${target.assignedSubTeam})` : '';
          const updated = state.vrpMembers.map((m) =>
            m.id === vrpId
              ? {
                  ...m,
                  assignedBlock: null,
                  assignedSubTeam: null,
                  assignedRole: undefined,
                  assignedDate: undefined,
                }
              : m
          );

          const newLogs: SocialAuditActivityLog[] = target
            ? [
                {
                  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  module: 'brp',
                  recordId: vrpId,
                  gpName: target.nameHindi || target.name,
                  actionType: 'update',
                  actionLabel: 'VRP टीम से विमुक्ति',
                  userName: state.currentUser.name,
                  userId: state.currentUser.id,
                  timestamp: new Date().toISOString(),
                  details: `VRP सदस्य को ${prevBlockHindi}${prevSubTeam} से हटाकर रिज़र्व पूल में वापस भेजा गया।`,
                  previousValue: `${prevBlockHindi}${prevSubTeam}`,
                  newValue: 'रिज़र्व पूल',
                },
                ...state.activityLogs,
              ]
            : state.activityLogs;

          const newState = { ...state, vrpMembers: updated, activityLogs: newLogs, hasUnsavedChanges: true };
          notifyStoreChange(newState);
          return newState;
        });
      },

      addVRPMember: (memberData) => {
        if (!get().isEditMode || !confirmHistoricalEdit(get().asOfDate)) return;
        set((state) => {
          const maxSrNo = state.vrpMembers.reduce((max, m) => Math.max(max, m.srNo || 0), 0);
          const newId = `vrp-${memberData.empCode || Date.now()}`;
          const newMember: VRPMember = {
            ...memberData,
            id: newId,
            srNo: maxSrNo + 1,
          };
          const updated = [newMember, ...state.vrpMembers];

          const newLogs: SocialAuditActivityLog[] = [
            {
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              module: 'brp',
              recordId: newId,
              gpName: newMember.nameHindi || newMember.name,
              block: (newMember.assignedBlock === 'Baghpat' || newMember.assignedBlock === 'Baraut') ? newMember.assignedBlock : undefined,
              actionType: 'create',
              actionLabel: 'नया VRP पंजीकरण',
              userName: state.currentUser.name,
              userId: state.currentUser.id,
              timestamp: new Date().toISOString(),
              details: `नया VRP सदस्य रोस्टर में पंजीकृत किया गया: ${newMember.empCode} - ${newMember.name} (${newMember.mobileNo})`,
            },
            ...state.activityLogs,
          ];

          const newState = { ...state, vrpMembers: updated, activityLogs: newLogs, hasUnsavedChanges: true };
          notifyStoreChange(newState, true);
          return newState;
        });
      },

      updateVRPMember: (vrpId, updates) => {
        if (!get().isEditMode || !confirmHistoricalEdit(get().asOfDate)) return;
        set((state) => {
          const target = state.vrpMembers.find((m) => m.id === vrpId);
          const updated = state.vrpMembers.map((m) =>
            m.id === vrpId ? { ...m, ...updates } : m
          );

          const newLogs: SocialAuditActivityLog[] = target
            ? [
                {
                  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  module: 'brp',
                  recordId: vrpId,
                  gpName: target.nameHindi || target.name,
                  actionType: 'update',
                  actionLabel: 'VRP विवरण संशोधन',
                  userName: state.currentUser.name,
                  userId: state.currentUser.id,
                  timestamp: new Date().toISOString(),
                  details: `VRP सदस्य विवरण संशोधित किया गया (${target.empCode})`,
                },
                ...state.activityLogs,
              ]
            : state.activityLogs;

          const newState = { ...state, vrpMembers: updated, activityLogs: newLogs, hasUnsavedChanges: true };
          notifyStoreChange(newState);
          return newState;
        });
      },

      deleteVRPMember: (vrpId) => {
        if (!get().isEditMode || !confirmHistoricalEdit(get().asOfDate)) return;
        set((state) => {
          const target = state.vrpMembers.find((m) => m.id === vrpId);
          const updated = state.vrpMembers.filter((m) => m.id !== vrpId);

          const newLogs: SocialAuditActivityLog[] = target
            ? [
                {
                  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  module: 'brp',
                  recordId: vrpId,
                  gpName: target.nameHindi || target.name,
                  actionType: 'delete',
                  actionLabel: 'VRP विलोपन',
                  userName: state.currentUser.name,
                  userId: state.currentUser.id,
                  timestamp: new Date().toISOString(),
                  details: `VRP सदस्य को रोस्टर से हटाया गया: ${target.empCode} (${target.name})`,
                },
                ...state.activityLogs,
              ]
            : state.activityLogs;

          const newState = { ...state, vrpMembers: updated, activityLogs: newLogs, hasUnsavedChanges: true };
          notifyStoreChange(newState, true);
          return newState;
        });
      },

      resetVRPMembersToBaseline: () => {
        if (!get().isEditMode || !confirmHistoricalEdit(get().asOfDate)) return;
        set((state) => {
          const newState = { ...state, vrpMembers: INITIAL_VRP_RECORDS, hasUnsavedChanges: true };
          notifyStoreChange(newState, true);
          return newState;
        });
      }
    }),
    {
      name: 'social-audit-baghpat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        records: state.records,
        nsapRecords: state.nsapRecords,
        monthlyReportDrafts: state.monthlyReportDrafts,
        activityLogs: state.activityLogs,
        vrpMembers: state.vrpMembers,
        fontViewMode: state.fontViewMode,
        isLiveSync: state.isLiveSync,
        asOfDate: state.asOfDate,
        activeTab: state.activeTab,
        selectedBRP: state.selectedBRP
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // ALWAYS enforce Edit Mode starts OFF on rehydrate / page refresh / session start
          state.isEditMode = false;
          state.selectedRecordForCompletion = null;
          state.hasUnsavedChanges = false;
          if (!state.monthlyReportDrafts) state.monthlyReportDrafts = {};

          // Rehydrate activity logs if missing
          if (!state.activityLogs || !Array.isArray(state.activityLogs) || state.activityLogs.length === 0) {
            state.activityLogs = INITIAL_ACTIVITY_LOGS;
          }
          // Rehydrate NSAP data records if missing in local storage, or merge missing baseline records
          if (!state.nsapRecords || !Array.isArray(state.nsapRecords) || state.nsapRecords.length === 0) {
            state.nsapRecords = INITIAL_NSAP_DATA_RECORDS;
          } else {
            // Merge any missing baseline records from INITIAL_NSAP_DATA_RECORDS
            const existingIds = new Set(state.nsapRecords.map(r => r.id));
            const existingRosterIds = new Set(state.nsapRecords.map(r => r.rosterRecordId).filter(Boolean));
            const missingBaseline = INITIAL_NSAP_DATA_RECORDS.filter(init =>
              !existingIds.has(init.id) && !existingRosterIds.has(init.rosterRecordId)
            );

            // Attach rosterRecordId, correct block, and sanitize beneficiary names against typing glitches
            const updatedExisting = state.nsapRecords.map(r => {
              const baseMatch = INITIAL_NSAP_DATA_RECORDS.find(init => init.id === r.id || (r.rosterRecordId && init.rosterRecordId === r.rosterRecordId));
              if (baseMatch) {
                const sanitizedBens = (r.beneficiaries && r.beneficiaries.length > 0)
                  ? r.beneficiaries.map(b => {
                      const baseBen = baseMatch.beneficiaries?.find(bb => bb.id === b.id);
                      if (baseBen) {
                        return {
                          ...b,
                          nameUnicode: baseBen.nameUnicode,
                          nameKrutiDev: baseBen.nameKrutiDev
                        };
                      }
                      return {
                        ...b,
                        nameKrutiDev: normalizeKrutiDevText(b.nameKrutiDev || '')
                      };
                    })
                  : baseMatch.beneficiaries;

                return {
                  ...r,
                  rosterRecordId: r.rosterRecordId || baseMatch.rosterRecordId,
                  block: baseMatch.block,
                  meetingDate: baseMatch.meetingDate,
                  beneficiaries: sanitizedBens
                };
              }
              return r;
            });
            state.nsapRecords = [...updatedExisting, ...missingBaseline];
          }

          // Rehydrate VRP members if missing in local storage or merge baseline
          if (!state.vrpMembers || !Array.isArray(state.vrpMembers) || state.vrpMembers.length === 0) {
            state.vrpMembers = INITIAL_VRP_RECORDS;
          } else {
            const baseMap = new Map(INITIAL_VRP_RECORDS.map(m => [m.id, m]));
            // Ensure assignedSubTeam is populated for active members from baseline
            const updatedMembers = state.vrpMembers.map(m => {
              const base = baseMap.get(m.id);
              if (base && !m.assignedSubTeam && m.assignedBlock && base.assignedSubTeam) {
                return { ...m, assignedSubTeam: base.assignedSubTeam };
              }
              return m;
            });
            if (updatedMembers.length < INITIAL_VRP_RECORDS.length) {
              const existingVrpIds = new Set(updatedMembers.map(m => m.id));
              const missingVrps = INITIAL_VRP_RECORDS.filter(m => !existingVrpIds.has(m.id));
              state.vrpMembers = [...updatedMembers, ...missingVrps];
            } else {
              state.vrpMembers = updatedMembers;
            }
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
