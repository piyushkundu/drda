'use client';

import { useMemo } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { nsapRecordsAsOf, socialAuditRecordAsOf } from '@/lib/socialAuditAsOf';
import { withDerivedNSAPUnverified } from '@/lib/nsapVerification';

/** Shared reporting view; editing actions continue to operate on the original store. */
export function useSocialAuditAsOf() {
  const records = useSocialAuditStore(state => state.records);
  const nsapRecords = useSocialAuditStore(state => state.nsapRecords);
  const asOfDate = useSocialAuditStore(state => state.asOfDate);
  const today = useSocialAuditStore(state => state.liveDelhiDate);
  return useMemo(() => ({
    records: records.map(record => socialAuditRecordAsOf(record, asOfDate, today)),
    nsapRecords: nsapRecordsAsOf(nsapRecords, asOfDate, today).map(withDerivedNSAPUnverified),
  }), [records, nsapRecords, asOfDate, today]);
}
