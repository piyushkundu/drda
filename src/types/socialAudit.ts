// ============================================================================
// TypeScript Definitions for Social Audit Baghpat System
// Supports KrutiDev 010 and Unicode (Mangal), Sansodhan Tracking, and NSAP Reports
// ============================================================================

export type AuditBlock = 'Baghpat' | 'Baraut';

export type AuditStatus = 'scheduled' | 'in_progress' | 'completed' | 'amended' | 'postponed';

export type PanchayatNirnayStatus = 'captured' | 'pending' | 'not_captured';

export interface AmendmentDetails {
  originalDate: string;
  modifiedDate: string;
  reason?: string;
  previousBRP?: string;
  newBRP?: string;
}

export interface SocialAuditRecord {
  id: string;
  block: AuditBlock;
  blockHindi: string;
  blockKrutiDev: string;
  sno: number;
  gpNameRaw: string;
  gpNameUnicode: string;
  gpNameKrutiDev: string;
  startDate: string;
  meetingDate: string;
  originalMeetingDate?: string;
  isAmended: boolean;
  amendmentDetails?: AmendmentDetails;
  supervisorOfficerRaw: string;
  supervisorOfficerUnicode: string;
  supervisorOfficerKrutiDev: string;
  brpRaw: string;
  brpName: string;
  brpPhone: string;
  brpUnicode: string;
  brpKrutiDev: string;
  teamMembersRaw: string;
  teamMembersUnicode: string;
  teamMembersKrutiDev: string;
  venueRaw: string;
  venueUnicode: string;
  venueKrutiDev: string;
  timeRaw: string;
  timeUnicode: string;
  timeKrutiDev: string;
  schemeRaw: string;
  schemeUnicode: string;
  schemeKrutiDev: string;
  hasNSAP: boolean;
  hasMGNREGA: boolean;
  hasPMAYG: boolean;
  status: AuditStatus;
  notes?: string;
  completedDate?: string;
  // Panchayat Nirnay App (R 9.6.2) Tracking
  panchayatNirnayStatus?: PanchayatNirnayStatus;
  isMappedInPanchayatNirnay?: boolean;
  panchayatNirnayCapturedDate?: string;
  panchayatNirnayNotes?: string;
}

export interface BlockSabhaRecord {
  id: string;
  block: AuditBlock;
  blockHindi: string;
  blockKrutiDev: string;
  date: string;
  venueUnicode: string;
  venueKrutiDev: string;
  timeUnicode: string;
  timeKrutiDev: string;
  description: string;
}

export interface NSAPReportRow {
  sno: number;
  districtHindi: string;
  districtKrutiDev: string;
  blockHindi: string;
  blockKrutiDev: string;
  totalProposedFY: number;
  proposedUpToDate: number;
  completedUpToDate: number;
  amendedOrCancelled: number;
  totalAmendedInFY: number;
  amendedGramPanchayatsList: SocialAuditRecord[];
  gramPanchayatsList: SocialAuditRecord[];
}

export interface NSAPReportSummary {
  asOfDate: string;
  asOfDateFormatted: string;
  rows: NSAPReportRow[];
  totals: {
    totalProposedFY: number;
    proposedUpToDate: number;
    completedUpToDate: number;
    amendedOrCancelled: number;
    totalAmendedInFY: number;
  };
  allAmendedNSAP: SocialAuditRecord[];
  allAmendedOverall: SocialAuditRecord[];
}

export type FontViewMode = 'unicode' | 'krutidev' | 'dual';
