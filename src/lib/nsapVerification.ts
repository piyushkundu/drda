import type { NSAPGramPanchayatData } from '@/types/socialAudit';

export const NSAP_REVIEW_REQUIRED = 'जाँच आवश्यक';

/** The recorded verified total is authoritative; a real zero must remain zero. */
export function getNSAPVerification(record: Pick<NSAPGramPanchayatData, 'totalBeneficiaries' | 'verifiedDirect' | 'verifiedFamily' | 'verifiedTotal'>) {
  const total = record.totalBeneficiaries;
  const verified = record.verifiedTotal ?? (record.verifiedDirect + record.verifiedFamily);
  const valid = [total, verified, record.verifiedDirect, record.verifiedFamily].every(n => Number.isInteger(n) && n >= 0) && verified <= total;
  const unverified = valid ? total - verified : null;
  const breakdownMatches = record.verifiedDirect + record.verifiedFamily === verified;
  return { total, verified, unverified, valid, breakdownMatches };
}

export function withDerivedNSAPUnverified(record: NSAPGramPanchayatData): NSAPGramPanchayatData {
  const { unverified } = getNSAPVerification(record);
  return { ...record, unverifiedCount: unverified ?? undefined };
}

/** Unchanged legacy conflicts may be reviewed separately; never accept a new invalid count. */
export function getNSAPWriteError(record: NSAPGramPanchayatData, previous?: NSAPGramPanchayatData): string | undefined {
  const fields = ['totalBeneficiaries', 'verifiedDirect', 'verifiedFamily', 'verifiedTotal'] as const;
  const countsChanged = !previous || fields.some(field => record[field] !== previous[field]);
  if (countsChanged && !getNSAPVerification(record).valid) {
    return `${record.gpNameUnicode}: लाभार्थी संख्याएँ पूर्ण, गैर-ऋणात्मक होनी चाहिए और कुल सत्यापित, कुल लाभार्थियों से अधिक नहीं हो सकते।`;
  }
}

export function sumNSAPUnverified(records: NSAPGramPanchayatData[]): number | null {
  let total = 0;
  for (const record of records) {
    const { unverified } = getNSAPVerification(record);
    if (unverified === null) return null;
    total += unverified;
  }
  return total;
}
