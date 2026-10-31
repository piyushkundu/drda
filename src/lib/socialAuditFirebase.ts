import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { SocialAuditRecord, NSAPGramPanchayatData } from '@/types/socialAudit';

export const SOCIAL_AUDIT_DOC_ID = 'baghpat-2026-27';

export interface SocialAuditFirestoreDoc {
  records: SocialAuditRecord[];
  nsapRecords: NSAPGramPanchayatData[];
  asOfDate: string;
  isLiveSync?: boolean;
  updatedAt: string;
  updatedBy?: string;
  version: number;
}

/**
 * Sanitizes object so Firestore never rejects `undefined` values.
 * Replaces `undefined` with `null`.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
}

const getDocRef = () => doc(db, 'socialAudit', SOCIAL_AUDIT_DOC_ID);

/**
 * Loads the current Social Audit dataset from Firebase Firestore.
 */
export async function loadSocialAuditFromFirestore(): Promise<SocialAuditFirestoreDoc | null> {
  if (typeof window === 'undefined') return null;
  try {
    const docRef = getDocRef();
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SocialAuditFirestoreDoc;
    }
    return null;
  } catch (err) {
    console.error('Failed to load social audit data from Firebase:', err);
    return null;
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
let pendingData: {
  records: SocialAuditRecord[];
  nsapRecords: NSAPGramPanchayatData[];
  asOfDate: string;
  isLiveSync?: boolean;
} | null = null;

/**
 * Saves Social Audit records and NSAP records to Firebase Firestore.
 * Automatically debounced by 500ms so rapid edits don't spam the database.
 */
export async function saveSocialAuditToFirestore(
  records: SocialAuditRecord[],
  nsapRecords: NSAPGramPanchayatData[],
  asOfDate: string,
  isLiveSync: boolean = true,
  immediate: boolean = false
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  pendingData = { records, nsapRecords, asOfDate, isLiveSync };

  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  const doSave = async (): Promise<boolean> => {
    if (!pendingData) return false;
    const toSave = pendingData;
    pendingData = null;

    try {
      const docRef = getDocRef();
      const payload: SocialAuditFirestoreDoc = {
        records: toSave.records,
        nsapRecords: toSave.nsapRecords,
        asOfDate: toSave.asOfDate,
        isLiveSync: toSave.isLiveSync,
        updatedAt: new Date().toISOString(),
        updatedBy: typeof window !== 'undefined' ? (window.navigator?.userAgent?.substring(0, 80) || 'web') : 'web',
        version: Date.now()
      };

      const cleanPayload = sanitizeForFirestore(payload);
      await setDoc(docRef, cleanPayload);
      return true;
    } catch (err) {
      console.error('Failed to save social audit data to Firebase:', err);
      return false;
    }
  };

  if (immediate) {
    return await doSave();
  }

  return new Promise((resolve) => {
    saveTimeout = setTimeout(async () => {
      const res = await doSave();
      resolve(res);
    }, 500);
  });
}

/**
 * Subscribes to real-time updates from Firebase Firestore.
 * Whenever any browser or device updates the data, onUpdate is called.
 */
export function subscribeToSocialAuditFirestore(
  onUpdate: (data: SocialAuditFirestoreDoc) => void,
  onError?: (err: unknown) => void
): Unsubscribe | null {
  if (typeof window === 'undefined') return null;

  try {
    const docRef = getDocRef();
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SocialAuditFirestoreDoc;
          onUpdate(data);
        }
      },
      (err) => {
        console.warn('Social Audit Firebase snapshot listener error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error('Failed to subscribe to Firebase Firestore:', err);
    return null;
  }
}

