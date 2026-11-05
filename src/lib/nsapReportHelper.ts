import { SocialAuditRecord, NSAPReportSummary, NSAPReportRow } from '@/types/socialAudit';
import { getEffectiveMeetingDate } from './dateResolution';

/**
 * Calculates official NSAP (National Social Assistance Programme) Social Audit
 * Progress report metrics strictly from social audit records and cut-off asOfDate.
 * Reused identically across NSAPReportTab and ExecutiveDashboardTab.
 */
export function calculateNSAPReportSummary(records: SocialAuditRecord[], asOfDate: string): NSAPReportSummary {
  const nsapRecords = records.filter((r) => r.hasNSAP);

  const computeBlock = (
    blockName: 'Baghpat' | 'Baraut',
    sno: number,
    distHi: string,
    distKr: string,
    blkHi: string,
    blkKr: string
  ): NSAPReportRow => {
    const blockAll = nsapRecords.filter((r) => r.block === blockName);

    // Proposed up to asOfDate:
    // Includes records whose original meeting date <= asOfDate OR whose effective meeting date <= asOfDate
    const proposedUpTo = blockAll.filter((r) => {
      const origDate = r.amendmentDetails?.originalDate || r.originalMeetingDate || getEffectiveMeetingDate(r);
      const effDate = getEffectiveMeetingDate(r);
      return origDate <= asOfDate || effDate <= asOfDate;
    });

    // Amended up to asOfDate:
    const amendedUpTo = proposedUpTo.filter((r) => r.isAmended);

    // Completed up to asOfDate:
    // Strictly date-bounded: effective meeting date MUST be on or before asOfDate.
    // A meeting scheduled in the future relative to asOfDate can NEVER be considered completed.
    const completedUpTo = proposedUpTo.filter((r) => {
      const effDate = getEffectiveMeetingDate(r);
      return effDate <= asOfDate;
    });

    // All amended in the whole session for this block
    const allAmendedInBlock = blockAll.filter((r) => r.isAmended);

    return {
      sno,
      districtHindi: distHi,
      districtKrutiDev: distKr,
      blockHindi: blkHi,
      blockKrutiDev: blkKr,
      totalProposedFY: blockAll.length,
      proposedUpToDate: proposedUpTo.length,
      completedUpToDate: completedUpTo.length,
      amendedOrCancelled: amendedUpTo.length,
      totalAmendedInFY: allAmendedInBlock.length,
      amendedGramPanchayatsList: allAmendedInBlock,
      gramPanchayatsList: proposedUpTo
    };
  };

  const row1 = computeBlock('Baghpat', 1, 'बागपत', 'ckxir', 'बागपत', 'ckxir');
  const row2 = computeBlock('Baraut', 2, 'बागपत', 'ckxir', 'बड़ौत', 'cM+kSr');

  const rows = [row1, row2];

  const totals = {
    totalProposedFY: row1.totalProposedFY + row2.totalProposedFY,
    proposedUpToDate: row1.proposedUpToDate + row2.proposedUpToDate,
    completedUpToDate: row1.completedUpToDate + row2.completedUpToDate,
    amendedOrCancelled: row1.amendedOrCancelled + row2.amendedOrCancelled,
    totalAmendedInFY: row1.totalAmendedInFY + row2.totalAmendedInFY
  };

  const allAmendedNSAP = records.filter((r) => r.hasNSAP && r.isAmended);
  const allAmendedOverall = records.filter((r) => r.isAmended);

  const formatDateHiShort = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}.${m}.${y}`;
    } catch {
      return dStr;
    }
  };

  return {
    asOfDate,
    asOfDateFormatted: formatDateHiShort(asOfDate),
    rows,
    totals,
    allAmendedNSAP,
    allAmendedOverall
  };
}

