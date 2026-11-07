// ============================================================================
// TypeScript Definitions for Social Audit Baghpat System
// Supports KrutiDev 010 and Unicode (Mangal), Sansodhan Tracking, and NSAP Reports
// ============================================================================

export type AuditBlock = 'Baghpat' | 'Baraut';

export type AuditStatus = 'scheduled' | 'proposed' | 'in_progress' | 'completed' | 'amended' | 'postponed' | 'cancelled';

export type RescheduleStatus = 'not_required' | 'pending';

export type PanchayatNirnayStatus = 'captured' | 'pending' | 'not_captured';

export type MisAuditStatus = 'fed' | 'pending' | 'not_fed' | 'not_eligible';

export interface CancellationDetails {
  cancelledDate: string; // YYYY-MM-DD
  cancelledAt: string;   // ISO timestamp
  reason: string;
  remarks?: string;
  cancelledBy?: string;
  previousMeetingDate: string;
  previousDate?: string;
  rescheduledDate?: string;
}

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
  completedAt?: string;
  // Lifecycle & Rescheduling Control
  rescheduleStatus?: RescheduleStatus;
  cancellationDetails?: CancellationDetails;
  cancellationHistory?: CancellationDetails[];
  // Panchayat Nirnay App (R 9.6.2) Tracking
  panchayatNirnayStatus?: PanchayatNirnayStatus;
  isMappedInPanchayatNirnay?: boolean;
  panchayatNirnayCapturedDate?: string;
  panchayatNirnayNotes?: string;
  // MIS Audit Feeding (R 9.1.3) Tracking
  misStatus?: MisAuditStatus;
  misFedDate?: string;
  misAuditedCount?: number;
  misNotes?: string;
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

// ============================================================================
// NSAP Detailed Beneficiary & Gram Panchayat Data Types
// Matches the official monthly format from Directorate / image
// "राष्ट्रीय वृद्धावस्था पेंशन योजनान्तर्गत माह अक्टूबर तक सोशल ऑडिट की मासिक प्रगति रिपोर्ट हेतु प्रारूप"
// ============================================================================

export type NSAPBeneficiaryCategory = 'ineligible' | 'deceased' | 'unverified' | 'verified_direct' | 'verified_family' | 'other';

export interface NSAPBeneficiaryRecord {
  id: string;
  category: NSAPBeneficiaryCategory;
  categoryHindi: string;
  nameKrutiDev?: string;
  nameUnicode: string;
  registrationId: string;
  reason?: string;
  deathDate?: string;
  financialIrregularity?: number;
  notes?: string;
}

export interface NSAPGramPanchayatData {
  id: string;
  sno: number;
  rosterRecordId?: string;
  gpNameKrutiDev: string;
  gpNameUnicode: string;
  block: AuditBlock;
  meetingDate: string;
  totalBeneficiaries: number;
  verifiedDirect: number;
  verifiedFamily: number;
  verifiedTotal: number;
  unverifiedReason?: string;
  unverifiedCount?: number;
  financialIrregularityAmount?: number;
  irregularityNotes?: string;
  responsiblePersons?: string;
  otherNotes?: string;
  beneficiaries: NSAPBeneficiaryRecord[];
  recordedDate?: string;
}

// ============================================================================
// Activity Log & Audit Trail Definitions (Feature 5)
// ============================================================================

export type ActivityModule = 'gp' | 'meeting' | 'nirnay' | 'mis' | 'nsap' | 'brp' | 'system';

export type ActivityActionType = 'create' | 'update' | 'status_change' | 'delete' | 'sync';

export interface SocialAuditActivityLog {
  id: string;
  module: ActivityModule;
  recordId: string;
  gpName: string;
  block?: AuditBlock;
  actionType: ActivityActionType;
  actionLabel: string;
  userId?: string;
  userName: string;
  timestamp: string; // ISO date-time string
  details: string;
  previousValue?: string;
  newValue?: string;
}

// ============================================================================
// Report Center Definitions (Feature 4)
// ============================================================================

export type ReportType = 
  | 'district_summary'     // A. District Summary Report
  | 'block_wise'           // B. Block-wise Report
  | 'gp_master'            // C. Gram Panchayat Master Register
  | 'brp_wise'             // D. BRP-wise Report
  | 'meeting_progress'     // E. Meeting Report
  | 'panchayat_nirnay'     // F. Panchayat Nirnay Report
  | 'mis_feeding'          // G. MIS Audit Feeding Report
  | 'nsap_beneficiary'     // H. NSAP Beneficiary Report
  | 'nsap_social_audit'    // I. NSAP Social Audit Report
  | 'monthly_mpr'
  | 'all_status'
  | 'pending_actions'
  | 'scheme_wise'
  | 'brp_detail'
  | 'vrp_wise'
  | 'vrp_detail'
  | 'nsap_quality';

export type MonthlyReportSection = 'pmay' | 'mgnrega' | 'nsap' | 'nfbs';
export interface MonthlyReportDraft {
  values: Record<string, number | null>;
  completeThrough: Partial<Record<MonthlyReportSection, string>>;
  updatedAt: string;
  updatedBy?: string;
}

export interface ReportFilterState {
  financialYear: string;
  block: 'all' | AuditBlock;
  brp: string;
  scheme: 'all' | 'nsap' | 'mgnrega' | 'pmayg';
  status: 'all' | AuditStatus | 'upcoming' | 'overdue';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

// ============================================================================
// Village Resource Persons (VRP) & Team Members Definitions
// ============================================================================

export type VRPTeamCode = 'Team A' | 'Team B' | 'Team C';

export interface VRPMember {
  id: string;
  srNo: number;
  empCode: string;
  name: string;
  nameHindi?: string;
  gender: 'Male' | 'Female';
  qualification: string;
  districtName: string;
  mobileNo: string;
  emailAddress?: string;
  dateOfBirth?: string;
  employeeStatus: 'Working' | 'Discontinued';
  aadharStatus: 'Verified' | 'Not Verified';
  assignedBlock?: 'Baghpat' | 'Baraut' | null;
  assignedSubTeam?: VRPTeamCode | null;
  assignedRole?: string;
  assignedDate?: string;
}

