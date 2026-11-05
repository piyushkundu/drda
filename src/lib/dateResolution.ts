/**
 * Canonical Date Resolution and Meeting Amendment Utilities for Social Audit.
 * Single source of truth across Table View, Monthly Calendar,
 * Calendar Filters, PDF Export, and Excel Export.
 */

import { SocialAuditRecord } from '@/types/socialAudit';

/**
 * Returns the single effective meeting date for a Social Audit record.
 * 
 * Rules:
 * 1. If amendmentDetails has a valid YYYY-MM-DD modifiedDate, prefer it as the latest date.
 * 2. If meetingDate is a valid YYYY-MM-DD string, use it.
 * 3. Fallback to originalMeetingDate or meetingDate.
 */
export function getEffectiveMeetingDate(record: {
  meetingDate?: string;
  originalMeetingDate?: string;
  amendmentDetails?: { modifiedDate?: string };
}): string {
  if (
    record.amendmentDetails?.modifiedDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.amendmentDetails.modifiedDate.trim())
  ) {
    return record.amendmentDetails.modifiedDate.trim();
  }
  if (
    record.meetingDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.meetingDate.trim())
  ) {
    return record.meetingDate.trim();
  }
  if (
    record.originalMeetingDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.originalMeetingDate.trim())
  ) {
    return record.originalMeetingDate.trim();
  }
  return record.meetingDate ? record.meetingDate.trim() : '';
}

/**
 * Checks whether a meeting has been amended or rescheduled.
 */
export function isMeetingAmended(record: {
  isAmended?: boolean;
  meetingDate?: string;
  originalMeetingDate?: string;
  amendmentDetails?: { originalDate?: string; modifiedDate?: string };
}): boolean {
  if (record.isAmended) return true;
  if (record.originalMeetingDate && record.meetingDate && record.originalMeetingDate !== record.meetingDate) {
    return true;
  }
  if (
    record.amendmentDetails?.originalDate &&
    record.amendmentDetails?.modifiedDate &&
    record.amendmentDetails.originalDate !== record.amendmentDetails.modifiedDate
  ) {
    return true;
  }
  return false;
}

/**
 * Returns the original meeting date if amended, or undefined.
 */
export function getOriginalMeetingDate(record: {
  isAmended?: boolean;
  meetingDate?: string;
  originalMeetingDate?: string;
  amendmentDetails?: { originalDate?: string };
}): string | undefined {
  if (!isMeetingAmended(record)) return undefined;
  if (record.originalMeetingDate && /^\d{4}-\d{2}-\d{2}$/.test(record.originalMeetingDate.trim())) {
    return record.originalMeetingDate.trim();
  }
  if (
    record.amendmentDetails?.originalDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.amendmentDetails.originalDate.trim())
  ) {
    return record.amendmentDetails.originalDate.trim();
  }
  return undefined;
}

/**
 * Checks if a meeting's canonical effective date is on or before a cutoff date.
 * Single source of truth for date-based completion/roster filtering.
 * A meeting whose effective date is in the future (> cutoffDate) can NEVER be completed as of cutoffDate.
 */
export function isEffectiveDateOnOrBefore(
  record: { meetingDate?: string; originalMeetingDate?: string; amendmentDetails?: { modifiedDate?: string } },
  cutoffDate: string
): boolean {
  const effectiveDate = getEffectiveMeetingDate(record);
  if (!effectiveDate) return false;
  return effectiveDate <= cutoffDate;
}

/**
 * Helper to determine if a meeting is completed based on effective meeting date.
 * Rule: Meeting is completed as of cutoffDate ONLY if its effective meeting date <= cutoffDate.
 * A meeting scheduled in the future relative to cutoffDate can NEVER be considered completed.
 */
export function isMeetingCompletedEffective(
  record: SocialAuditRecord,
  cutoffDate: string
): boolean {
  const effectiveDate = getEffectiveMeetingDate(record);
  if (!effectiveDate) return false;
  return effectiveDate <= cutoffDate;
}

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY.
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return dateStr;
  } catch {
    return dateStr || '';
  }
}

