import { INITIAL_SOCIAL_AUDIT_RECORDS } from "../src/data/socialAuditInitialData";
import { getEffectiveMeetingDate, isEffectiveDateOnOrBefore } from "../src/lib/dateResolution";

async function testWithRecords(records: any[], sourceName: string) {
  console.log(`\n================================================================`);
  console.log(`TESTING WITH ${sourceName} (${records.length} records)`);
  console.log(`================================================================`);

  const testDates = ["2026-10-08", "2026-10-31", "2026-11-05"];

  for (const asOfDate of testDates) {
    console.log(`\n--- asOfDate = ${asOfDate} ---`);

    // 1. Proposed up to date
    const originalProposedUpToDate = records.filter((r: any) => {
      const origDate = (r.isAmended && (r.originalMeetingDate || r.amendmentDetails?.originalDate))
        ? (r.originalMeetingDate || r.amendmentDetails?.originalDate)!
        : getEffectiveMeetingDate(r);
      return origDate <= asOfDate;
    });

    // 2. Completed up to date
    const completedRecords = records.filter((r: any) => isEffectiveDateOnOrBefore(r, asOfDate));
    const upcomingRecords = records.filter((r: any) => !isEffectiveDateOnOrBefore(r, asOfDate));

    // 3. Amended records
    const amendedRecords = records.filter((r: any) => r.isAmended);
    const amendedCompleted = amendedRecords.filter((r: any) => isEffectiveDateOnOrBefore(r, asOfDate));
    const amendedRemaining = amendedRecords.filter((r: any) => !isEffectiveDateOnOrBefore(r, asOfDate));

    // 4. Amended originally due
    const amendedOriginallyDue = amendedRecords.filter((r: any) => {
      const origDate = r.originalMeetingDate || r.amendmentDetails?.originalDate;
      return Boolean(origDate && origDate <= asOfDate);
    });

    const amendedShiftedToFuture = amendedOriginallyDue.filter((r: any) => {
      return !isEffectiveDateOnOrBefore(r, asOfDate);
    });

    console.log(`Card 2 (प्रस्तावित मूल रोस्टर): ${originalProposedUpToDate.length}`);
    console.log(`Card 3 (सम्पन्न बैठकें):        ${completedRecords.length}`);
    console.log(`Card 4 (संशोधित संख्याएं):`);
    console.log(`  - amendedCompletedCount:     ${amendedCompleted.length}`);
    console.log(`  - amendedOriginallyDueCount: ${amendedOriginallyDue.length}`);
    console.log(`  - Display in KPI:            ${amendedCompleted.length} / ${amendedOriginallyDue.length} संशोधित`);
    console.log(`  - Badge in KPI:              ${amendedCompleted.length} सम्पन्न`);
    console.log(`  - Shifted to future:         ${amendedShiftedToFuture.length}`);
    console.log(`  - Remaining:                 ${amendedRemaining.length}`);

    if (asOfDate === "2026-10-08") {
      if (completedRecords.length !== 30) {
        throw new Error(`CRITICAL for 08-Oct: Expected 30 completed records, got ${completedRecords.length}`);
      }
      if (amendedCompleted.length !== 0) {
        throw new Error(`CRITICAL for 08-Oct: Expected 0 amended completed, got ${amendedCompleted.length}`);
      }
    }
    if (asOfDate === "2026-10-31") {
      if (completedRecords.length !== 52) {
        throw new Error(`CRITICAL for 31-Oct: Expected 52 completed records, got ${completedRecords.length}`);
      }
      if (amendedCompleted.length !== 1) {
        throw new Error(`CRITICAL for 31-Oct: Expected 1 amended completed (Khadki), got ${amendedCompleted.length}`);
      }
    }
  }

  console.log(`\n>>> ALL TESTS PASSED FOR ${sourceName}! <<<`);
}

async function main() {
  await testWithRecords(INITIAL_SOCIAL_AUDIT_RECORDS, "INITIAL DATA");
}

main().catch(err => {
  console.error("FAILED:", err);
  process.exit(1);
});
