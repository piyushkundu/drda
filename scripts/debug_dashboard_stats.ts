/**
 * Dashboard Statistics Bug Investigation Script
 * 
 * Reproduces the exact bugs reported by user:
 * 1. asOfDate = 2026-10-31 → shows 2 संशोधित सम्पन्न (should be 1)
 * 2. asOfDate = 2026-10-08 → shows 38 सम्पन्न (should be ≤ 30 मूल), 1 संशोधित (should be 0)
 */
import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import { getEffectiveMeetingDate, isMeetingAmended, getOriginalMeetingDate } from '../src/lib/dateResolution';

const records = INITIAL_SOCIAL_AUDIT_RECORDS;

function analyzeForDate(asOfDate: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ANALYSIS FOR asOfDate = ${asOfDate}`);
  console.log(`${'='.repeat(80)}`);

  // --- CURRENT BUGGY LOGIC (from ExecutiveDashboardTab.tsx lines 143-191) ---
  
  // Completed: r.meetingDate <= asOfDate || r.status === 'completed'
  const completedRecords_BUGGY = records.filter(r => r.meetingDate <= asOfDate || r.status === 'completed');
  
  // Amended
  const amendedRecords = records.filter(r => r.isAmended);
  const amendedCompleted_BUGGY = amendedRecords.filter(r => r.meetingDate <= asOfDate || r.status === 'completed');

  // Original proposed up to date
  const originalProposed = records.filter(r => {
    const origDate = (r.isAmended && (r.originalMeetingDate || r.amendmentDetails?.originalDate))
      ? (r.originalMeetingDate || r.amendmentDetails?.originalDate)!
      : r.meetingDate;
    return origDate <= asOfDate;
  });

  console.log(`\n--- BUGGY LOGIC RESULTS ---`);
  console.log(`completedRecords (BUGGY): ${completedRecords_BUGGY.length}`);
  console.log(`originalProposedUpToDate: ${originalProposed.length}`);
  console.log(`amendedRecords: ${amendedRecords.length}`);
  console.log(`amendedCompleted (BUGGY): ${amendedCompleted_BUGGY.length}`);

  // --- CORRECT LOGIC ---
  
  // For "completed by asOfDate", we need to use the EFFECTIVE meeting date, not r.meetingDate
  // Also, r.status === 'completed' alone should NOT bypass the date check
  // A meeting is "सम्पन्न by asOfDate" ONLY if its effective meeting date <= asOfDate
  const completedRecords_CORRECT = records.filter(r => {
    const effDate = getEffectiveMeetingDate(r);
    return effDate <= asOfDate;
  });

  // For amended, need to check if any amendment even existed before asOfDate
  // An amended meeting is "सम्पन्न by asOfDate" only if its NEW (effective) date <= asOfDate
  const amendedCompleted_CORRECT = amendedRecords.filter(r => {
    const effDate = getEffectiveMeetingDate(r);
    return effDate <= asOfDate;
  });

  console.log(`\n--- CORRECT LOGIC RESULTS ---`);
  console.log(`completedRecords (CORRECT using effectiveDate): ${completedRecords_CORRECT.length}`);
  console.log(`amendedCompleted (CORRECT using effectiveDate): ${amendedCompleted_CORRECT.length}`);

  // Show detailed breakdown
  console.log(`\n--- DETAILED: Amended Records ---`);
  amendedRecords.forEach(r => {
    const effDate = getEffectiveMeetingDate(r);
    const origDate = getOriginalMeetingDate(r);
    const buggyIncluded = r.meetingDate <= asOfDate || r.status === 'completed';
    const correctIncluded = effDate <= asOfDate;
    console.log(`  GP: ${r.gpNameUnicode}`);
    console.log(`    meetingDate field: ${r.meetingDate}`);
    console.log(`    effectiveDate:     ${effDate}`);
    console.log(`    originalDate:      ${origDate || 'N/A'}`);
    console.log(`    status:            ${r.status}`);
    console.log(`    isAmended:         ${r.isAmended}`);
    console.log(`    BUGGY included:    ${buggyIncluded}`);
    console.log(`    CORRECT included:  ${correctIncluded}`);
    console.log('');
  });

  // Show records where buggy != correct
  console.log(`\n--- DISCREPANCIES (records counted differently) ---`);
  const discrepancies = records.filter(r => {
    const effDate = getEffectiveMeetingDate(r);
    const buggy = r.meetingDate <= asOfDate || r.status === 'completed';
    const correct = effDate <= asOfDate;
    return buggy !== correct;
  });
  
  if (discrepancies.length === 0) {
    console.log('  (none found)');
  } else {
    discrepancies.forEach(r => {
      const effDate = getEffectiveMeetingDate(r);
      console.log(`  GP: ${r.gpNameUnicode}, meetingDate: ${r.meetingDate}, effectiveDate: ${effDate}, status: ${r.status}, isAmended: ${r.isAmended}`);
    });
  }

  // Count records where meetingDate <= asOfDate (the "मूल रोस्टर" count)
  const scheduledByDate = records.filter(r => r.meetingDate <= asOfDate);
  console.log(`\n--- SUMMARY ---`);
  console.log(`Records with meetingDate <= ${asOfDate}: ${scheduledByDate.length}`);
  console.log(`Records with effectiveDate <= ${asOfDate}: ${completedRecords_CORRECT.length}`);
  console.log(`Bug difference: ${completedRecords_BUGGY.length - completedRecords_CORRECT.length} extra records shown as completed`);
}

// Check what meetingDate vs effectiveDate looks like for ALL records
console.log(`\n--- ALL RECORDS: meetingDate vs effectiveDate comparison ---`);
let mismatchCount = 0;
records.forEach(r => {
  const eff = getEffectiveMeetingDate(r);
  if (r.meetingDate !== eff) {
    mismatchCount++;
    console.log(`MISMATCH: ${r.gpNameUnicode} — meetingDate=${r.meetingDate}, effectiveDate=${eff}, isAmended=${r.isAmended}, originalMeetingDate=${r.originalMeetingDate || 'N/A'}, modifiedDate=${r.amendmentDetails?.modifiedDate || 'N/A'}`);
  }
});
console.log(`Total mismatches: ${mismatchCount} / ${records.length}`);

analyzeForDate('2026-10-31');
analyzeForDate('2026-10-08');

