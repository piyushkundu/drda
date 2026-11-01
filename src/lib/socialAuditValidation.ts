// ============================================================================
// Data Validation Utilities for Social Audit Baghpat
// Indian Mobile numbers, Dates, Required Fields, and Duplicate Detection
// ============================================================================

import { SocialAuditRecord, AuditBlock, NSAPBeneficiaryRecord } from '@/types/socialAudit';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  message?: string;
  matchedRecord?: SocialAuditRecord;
}

/**
 * Validates Indian 10-digit mobile numbers.
 * Supports numbers starting with 6, 7, 8, or 9, optional +91 or 0 prefix.
 */
export function validateIndianMobile(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    return { isValid: true }; // Mobile is often optional unless specified
  }

  // Clean common non-digit chars
  const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');

  // Strip leading 0 or +91 if present
  let normalized = cleanPhone;
  if (normalized.startsWith('+91')) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith('91') && normalized.length === 12) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = normalized.slice(1);
  }

  // Must be exactly 10 digits starting with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(normalized)) {
    return {
      isValid: false,
      error: 'कृपया वैध 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से प्रारंभ)।'
    };
  }

  return { isValid: true };
}

/**
 * Validates date strings in YYYY-MM-DD or DD/MM/YYYY format.
 */
export function validateDateString(dateStr: string): ValidationResult {
  if (!dateStr || !dateStr.trim()) {
    return { isValid: false, error: 'दिनांक दर्ज करना अनिवार्य है।' };
  }

  let y: number, m: number, d: number;
  const trimmed = dateStr.trim();

  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length !== 3) return { isValid: false, error: 'अमान्य दिनांक प्रारूप (YYYY-MM-DD अपेक्षित)' };
    [y, m, d] = parts.map(Number);
  } else if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length !== 3) return { isValid: false, error: 'अमान्य दिनांक प्रारूप (DD/MM/YYYY अपेक्षित)' };
    d = Number(parts[0]);
    m = Number(parts[1]);
    y = Number(parts[2]);
  } else {
    return { isValid: false, error: 'अमान्य दिनांक प्रारूप' };
  }

  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return { isValid: false, error: 'दिनांक में केवल अंक होने चाहिए।' };
  }

  if (m < 1 || m > 12) {
    return { isValid: false, error: 'माह 1 से 12 के बीच होना चाहिए।' };
  }

  if (d < 1 || d > 31) {
    return { isValid: false, error: 'दिन 1 से 31 के बीच होना चाहिए।' };
  }

  // Days in month check
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d > daysInMonth) {
    return { isValid: false, error: `चयनित माह में केवल ${daysInMonth} दिन होते हैं।` };
  }

  // Year check (FY 2026-27 context)
  if (y < 2020 || y > 2035) {
    return { isValid: false, error: 'वर्ष 2020 से 2035 के मध्य होना चाहिए।' };
  }

  return { isValid: true };
}

/**
 * Validates meeting date range against start date.
 * Meeting date cannot be earlier than start date.
 */
export function validateMeetingDateRange(startDate: string, meetingDate: string): ValidationResult {
  const startVal = validateDateString(startDate);
  if (!startVal.isValid) return startVal;

  const meetingVal = validateDateString(meetingDate);
  if (!meetingVal.isValid) return meetingVal;

  if (meetingDate < startDate) {
    return {
      isValid: false,
      error: 'बैठक तिथि प्रारम्भ तिथि से पूर्व की नहीं हो सकती।'
    };
  }

  return { isValid: true };
}

/**
 * Validates required fields for a Social Audit Record.
 */
export function validateSocialAuditRecord(record: Partial<SocialAuditRecord>): FormValidationResult {
  const errors: Record<string, string> = {};

  if (!record.gpNameUnicode?.trim() && !record.gpNameKrutiDev?.trim()) {
    errors.gpName = 'ग्राम पंचायत का नाम दर्ज करना अनिवार्य है।';
  }

  if (!record.block) {
    errors.block = 'विकास खंड (बागपत/बड़ौत) का चयन करना अनिवार्य है।';
  }

  if (!record.meetingDate?.trim()) {
    errors.meetingDate = 'सोशल ऑडिट बैठक तिथि दर्ज करना अनिवार्य है।';
  } else {
    const dateVal = validateDateString(record.meetingDate);
    if (!dateVal.isValid) {
      errors.meetingDate = dateVal.error || 'अमान्य बैठक तिथि';
    }
  }

  if (record.startDate?.trim()) {
    const startVal = validateDateString(record.startDate);
    if (!startVal.isValid) {
      errors.startDate = startVal.error || 'अमान्य प्रारम्भ तिथि';
    } else if (record.meetingDate?.trim() && record.meetingDate < record.startDate) {
      errors.meetingDate = 'बैठक तिथि प्रारम्भ तिथि से पूर्व की नहीं हो सकती।';
    }
  }

  if (record.brpPhone?.trim()) {
    const phoneVal = validateIndianMobile(record.brpPhone);
    if (!phoneVal.isValid) {
      errors.brpPhone = phoneVal.error || 'अमान्य मोबाइल नंबर';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Checks for duplicate Gram Panchayat names within the same block.
 */
export function detectDuplicateGP(
  records: SocialAuditRecord[],
  gpNameUnicode: string,
  block: AuditBlock,
  excludeId?: string
): DuplicateCheckResult {
  if (!gpNameUnicode?.trim()) return { isDuplicate: false };

  const cleanName = gpNameUnicode.trim().toLowerCase().replace(/[\s\.\,\-_]/g, '');

  const match = records.find((r) => {
    if (excludeId && r.id === excludeId) return false;
    if (r.block !== block) return false;
    const rClean = (r.gpNameUnicode || '').trim().toLowerCase().replace(/[\s\.\,\-_]/g, '');
    return rClean === cleanName;
  });

  if (match) {
    return {
      isDuplicate: true,
      message: `विकास खंड ${block === 'Baghpat' ? 'बागपत' : 'बड़ौत'} में ग्राम पंचायत "${match.gpNameUnicode}" (क्र० सं० ${match.sno || '-'}) पहले से दर्ज है।`,
      matchedRecord: match
    };
  }

  return { isDuplicate: false };
}

/**
 * Checks for duplicate NSAP Beneficiary registration ID within a GP.
 */
export function detectDuplicateBeneficiary(
  beneficiaries: NSAPBeneficiaryRecord[],
  registrationId: string,
  excludeId?: string
): { isDuplicate: boolean; message?: string } {
  if (!registrationId?.trim()) return { isDuplicate: false };

  const cleanReg = registrationId.trim().toLowerCase();

  const match = beneficiaries.find(
    (b) => (!excludeId || b.id !== excludeId) && b.registrationId?.trim().toLowerCase() === cleanReg
  );

  if (match) {
    return {
      isDuplicate: true,
      message: `पंजीकरण संख्या "${registrationId}" से लाभार्थी "${match.nameUnicode}" पहले से दर्ज है।`
    };
  }

  return { isDuplicate: false };
}

