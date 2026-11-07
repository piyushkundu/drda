import type { NSAPGramPanchayatData, SocialAuditRecord } from '@/types/socialAudit';
import { getDelhiDateString } from './delhiTime';
import { getProgressCutoffDate } from './dateResolution';

/** Date-only values are work dates. Timestamps are converted to IST before comparison. */
export function reportingDate(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? getDelhiDateString(date) : undefined;
}

export function isHistoricalDate(asOfDate: string, today = getDelhiDateString()): boolean {
  return Boolean(reportingDate(asOfDate) && asOfDate < today);
}

/** Unknown event dates must not become invented historical completions. */
export function isWorkRecordedBy(value: string | undefined, asOfDate: string, today = getDelhiDateString()): boolean {
  const date = reportingDate(value);
  return date ? date <= getProgressCutoffDate(asOfDate, today) : !isHistoricalDate(asOfDate, today);
}

/** A reporting copy only. Never write this projection back to the store. */
export function socialAuditRecordAsOf(record: SocialAuditRecord, asOfDate: string, today = getDelhiDateString()): SocialAuditRecord {
  let view = record;
  const patch = (updates: Partial<SocialAuditRecord>) => { view = { ...view, ...updates }; };
  const cancelledDate = reportingDate(record.cancellationDetails?.cancelledDate) || reportingDate(record.cancellationDetails?.cancelledAt);
  if (record.status === 'cancelled' && cancelledDate && cancelledDate > getProgressCutoffDate(asOfDate, today)) {
    patch({
      status: record.isAmended ? 'amended' : 'scheduled',
      rescheduleStatus: 'not_required',
      cancellationDetails: undefined,
      misStatus: record.misFedDate && isWorkRecordedBy(record.misFedDate, asOfDate, today) ? 'fed' : 'pending',
    });
  }
  if (record.panchayatNirnayStatus === 'captured' && !isWorkRecordedBy(record.panchayatNirnayCapturedDate, asOfDate, today)) {
    patch({ panchayatNirnayStatus: 'pending', panchayatNirnayCapturedDate: undefined });
  }
  if (record.misStatus === 'fed' && !isWorkRecordedBy(record.misFedDate, asOfDate, today)) {
    patch({ misStatus: 'pending', misFedDate: undefined, misAuditedCount: 0 });
  }
  return view;
}

export function nsapRecordsAsOf(records: NSAPGramPanchayatData[], asOfDate: string, today = getDelhiDateString()): NSAPGramPanchayatData[] {
  const cutoffDate = getProgressCutoffDate(asOfDate, today);
  return records.filter(record => {
    // A late data-entry timestamp must not move completed work into a later reporting month.
    const workDate = reportingDate(record.meetingDate) || reportingDate(record.recordedDate);
    return Boolean(workDate && workDate <= cutoffDate);
  });
}

export function confirmHistoricalEdit(asOfDate: string, today = getDelhiDateString()): boolean {
  if (!isHistoricalDate(asOfDate, today)) return true;
  if (typeof window === 'undefined') return false;
  const displayDate = asOfDate.split('-').reverse().join('/');
  return window.confirm(
    `सावधान: आप ${displayDate} तक की पुरानी रिपोर्ट देख रहे हैं।\n\n` +
    'यह बदलाव मूल डेटा में सेव होगा और पुरानी तारीख की रिपोर्ट को भी प्रभावित कर सकता है।\n\n' +
    'क्या आप यह बदलाव करना चाहते हैं? रद्द करने पर डेटा नहीं बदलेगा।'
  );
}
