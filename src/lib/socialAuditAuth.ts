/**
 * Social Audit Baghpat - Central Authentication & Authorization Module
 * 
 * Provides verified administrative role checking and permission enforcement
 * for Central Edit Mode and Meeting Completion Locks.
 */

export type SocialAuditRole = 'ddo' | 'admin' | 'brp' | 'viewer';

export interface SocialAuditUser {
  id: string;
  name: string;
  role: SocialAuditRole;
  designation: string;
  department: string;
  isAuthenticated: boolean;
}

// Default Administrative Profile (DDO DRDA Baghpat)
export const DEFAULT_DDO_USER: SocialAuditUser = {
  id: 'ddo-baghpat-01',
  name: 'जिला विकास अधिकारी',
  role: 'ddo',
  designation: 'जिला विकास अधिकारी (DDO)',
  department: 'DRDA बागपत, उत्तर प्रदेश',
  isAuthenticated: true
};

// Roles that are permitted to enable Edit Mode and mutate official data
export const AUTHORIZED_EDIT_ROLES: SocialAuditRole[] = ['ddo', 'admin'];

/**
 * Checks whether a user has permission to enable Central Edit Mode.
 */
export function canUserEnableEditMode(user: SocialAuditUser | null | undefined): { allowed: boolean; reason?: string } {
  if (!user || !user.isAuthenticated) {
    return {
      allowed: false,
      reason: 'उपयोगकर्ता प्रमाणीकृत नहीं है। संपादन मोड केवल अधिकृत प्रशासनिक लॉगिन पर ही उपलब्ध है।'
    };
  }

  if (!AUTHORIZED_EDIT_ROLES.includes(user.role)) {
    return {
      allowed: false,
      reason: `आपकी भूमिका (${user.designation}) केवल पठन (Read-Only) हेतु अधिकृत है। डेटा संपादन के लिए DDO अथवा Admin विशेषाधिकार आवश्यक हैं।`
    };
  }

  return { allowed: true };
}

/**
 * Validates whether a meeting can be marked as completed based on date rules.
 * 
 * Rule 1: Current Date < Scheduled Meeting Date => BLOCKED
 * Rule 2: Current Date >= Scheduled Meeting Date => ALLOWED
 * Rule 3: Amended meeting => Uses latest scheduled meeting date
 * Rule 4: Missing or invalid date => BLOCKED
 */
export function validateMeetingCompletionDate(
  scheduledMeetingDate: string | undefined | null,
  currentAuthoritativeDate: string
): { canComplete: boolean; errorCode?: string; errorMessage?: string } {
  if (!scheduledMeetingDate || scheduledMeetingDate.trim() === '') {
    return {
      canComplete: false,
      errorCode: 'MISSING_DATE',
      errorMessage: 'ग्राम पंचायत की बैठक तिथि निर्धारित नहीं है। कृपया पहले रोस्टर में वैध तिथि दर्ज करें।'
    };
  }

  // ISO Date validation YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(scheduledMeetingDate)) {
    return {
      canComplete: false,
      errorCode: 'INVALID_DATE_FORMAT',
      errorMessage: `अमान्य तिथि प्रारूप (${scheduledMeetingDate})। तिथि YYYY-MM-DD प्रारूप में होनी चाहिए।`
    };
  }

  // Compare in India Standard Time
  // E.g. "2026-11-05" > "2026-11-01" -> future meeting
  if (currentAuthoritativeDate < scheduledMeetingDate) {
    return {
      canComplete: false,
      errorCode: 'FUTURE_MEETING_DATE',
      errorMessage: 'इस ग्राम पंचायत की सोशल ऑडिट बैठक की निर्धारित तिथि अभी नहीं आई है। निर्धारित तिथि से पहले बैठक को सम्पन्न नहीं किया जा सकता।'
    };
  }

  return { canComplete: true };
}

