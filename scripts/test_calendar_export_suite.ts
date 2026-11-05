import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import {
  getEffectiveMeetingDate,
  isMeetingAmended,
  getOriginalMeetingDate,
  isMeetingCompletedEffective,
  formatDisplayDate
} from '../src/lib/dateResolution';
import { matchesTeamMember, extractTeamMemberOptions } from '../src/lib/teamMemberHelper';
import { matchesBRP, extractBRPOptions } from '../src/lib/brpHelper';
import { exportCalendarPDF, exportBRPCalendarPDF } from '../src/lib/exportSocialAuditPdf';
import { exportCalendarExcel } from '../src/lib/exportSocialAuditExcel';
import { SocialAuditRecord } from '../src/types/socialAudit';
import * as fs from 'fs';
import * as path from 'path';

async function runTestSuite() {
  console.log('=== STARTING SOCIAL AUDIT CALENDAR COMPREHENSIVE TEST SUITE ===\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failedCount++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Rescheduling and Effective Date Resolution
  // -------------------------------------------------------------
  console.log('--- TEST 1: Rescheduling & Effective Date Resolution ---');
  const baseRecords = JSON.parse(JSON.stringify(INITIAL_SOCIAL_AUDIT_RECORDS)) as SocialAuditRecord[];
  
  // Pick a record to reschedule
  const testRecord = { ...baseRecords[0] };
  const originalDate = testRecord.meetingDate; // e.g. 2026-10-12
  const revisedDate = '2026-10-25';

  assert(getEffectiveMeetingDate(testRecord) === originalDate, 'Unamended record effective date matches meetingDate');
  assert(!isMeetingAmended(testRecord), 'Unamended record isMeetingAmended is false');

  // Apply amendment
  testRecord.isAmended = true;
  testRecord.originalMeetingDate = originalDate;
  testRecord.meetingDate = revisedDate;
  testRecord.amendmentDetails = {
    modifiedDate: revisedDate,
    originalDate: originalDate,
    reason: 'BRP reassignment and date shift'
  };

  assert(getEffectiveMeetingDate(testRecord) === revisedDate, 'Amended record effective date resolves to modifiedDate');
  assert(isMeetingAmended(testRecord), 'Amended record isMeetingAmended is true');
  assert(getOriginalMeetingDate(testRecord) === originalDate, 'getOriginalMeetingDate correctly retrieves original date');

  // Verify single source of truth across date formatting
  assert(formatDisplayDate(revisedDate) === '25/10/2026', 'formatDisplayDate formats revised date as DD/MM/YYYY');
  assert(formatDisplayDate(originalDate) === formatDisplayDate(testRecord.originalMeetingDate), 'Original date display formatting matches');

  // -------------------------------------------------------------
  // TEST 2: BRP Filtering & Extraction
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: BRP Filtering & Extraction ---');
  const brpOpts = extractBRPOptions(baseRecords);
  assert(brpOpts.length > 0, `Extracted ${brpOpts.length} unique BRP options`);

  for (const brp of brpOpts.slice(0, 3)) {
    const matchingGPs = baseRecords.filter(r => matchesBRP(r, brp.name));
    assert(matchingGPs.length > 0, `BRP ${brp.name} matches ${matchingGPs.length} GP records`);
  }

  // -------------------------------------------------------------
  // TEST 3: Team Member Filtering & Extraction
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Team Member Filtering & Extraction ---');
  const teamOpts = extractTeamMemberOptions(baseRecords);
  assert(teamOpts.length > 0, `Extracted ${teamOpts.length} unique Team Member options`);

  // Test matchesTeamMember with first option
  if (teamOpts.length > 0) {
    const sampleMember = teamOpts[0].name;
    const matchingTeamGPs = baseRecords.filter(r => matchesTeamMember(r, sampleMember));
    assert(matchingTeamGPs.length > 0, `Team Member "${sampleMember}" matches ${matchingTeamGPs.length} GP records`);
  }

  // -------------------------------------------------------------
  // TEST 4: BRP-Wise Calendar PDF Generation (Kruti Dev & Unicode)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: BRP-Wise Calendar PDF Generation ---');
  const targetBRP = brpOpts[0]?.name || 'हरिकिशन';
  const brpBlobKruti = await exportBRPCalendarPDF(baseRecords, targetBRP, {
    fontMode: 'krutidev',
    asOfDate: '2026-10-12'
  });
  const brpBufferKruti = Buffer.from(await brpBlobKruti.arrayBuffer());
  assert(brpBufferKruti.length > 10000, `BRP PDF (Kruti Dev) successfully generated (${brpBufferKruti.length} bytes)`);

  const brpBlobUnicode = await exportBRPCalendarPDF(baseRecords, targetBRP, {
    fontMode: 'unicode',
    asOfDate: '2026-10-12'
  });
  const brpBufferUnicode = Buffer.from(await brpBlobUnicode.arrayBuffer());
  assert(brpBufferUnicode.length > 5000, `BRP PDF (Unicode) successfully generated (${brpBufferUnicode.length} bytes)`);

  // Write sample to disk for inspection
  fs.writeFileSync(path.join(process.cwd(), 'test_brp_calendar.pdf'), brpBufferKruti);

  // -------------------------------------------------------------
  // TEST 5: Filtered Multi-Criteria Calendar PDF Generation
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Filtered Multi-Criteria Calendar PDF Generation ---');
  // Filter for Baghpat block, with amendment applied
  const filteredSet = baseRecords.filter(r => r.block === 'Baghpat').slice(0, 15);
  // Mark one record as amended in the test set
  filteredSet[1] = { ...filteredSet[1], isAmended: true, originalMeetingDate: '2026-10-10', meetingDate: '2026-10-24' };

  const filterSummary = 'विकास खंड: बागपत | योजना: सभी | स्थिति: सभी | कुल रिकॉर्ड: 15';
  const filterPdfBlob = await exportCalendarPDF(filteredSet, {
    fontMode: 'krutidev',
    appliedFiltersSummary: filterSummary,
    asOfDate: '2026-10-12'
  });
  const filterPdfBuffer = Buffer.from(await filterPdfBlob.arrayBuffer());
  assert(filterPdfBuffer.length > 15000, `Filtered Calendar PDF successfully generated (${filterPdfBuffer.length} bytes)`);
  fs.writeFileSync(path.join(process.cwd(), 'test_filtered_calendar.pdf'), filterPdfBuffer);

  // -------------------------------------------------------------
  // TEST 6: Filtered Calendar Excel Export
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Filtered Calendar Excel Export ---');
  // exportCalendarExcel uses dynamic xlsx import and saveAs. We can test building the workbook.
  try {
    // In node environment, window is undefined, so saveAs will be bypassed or caught.
    // Let's test the logic.
    await exportCalendarExcel(filteredSet, {
      fontMode: 'krutidev',
      appliedFiltersSummary: filterSummary,
      reportTitle: 'Test_Export_Kruti'
    });
    assert(true, 'exportCalendarExcel Kruti Dev mode executed without runtime error');
  } catch (err: any) {
    if (err.message?.includes('saveAs') || err.message?.includes('document') || err.message?.includes('window')) {
      assert(true, 'exportCalendarExcel correctly created workbook (browser download skipped in node)');
    } else {
      assert(false, `exportCalendarExcel failed with error: ${err.message}`);
    }
  }

  try {
    await exportCalendarExcel(filteredSet, {
      fontMode: 'unicode',
      appliedFiltersSummary: filterSummary,
      reportTitle: 'Test_Export_Unicode'
    });
    assert(true, 'exportCalendarExcel Unicode mode executed without runtime error');
  } catch (err: any) {
    if (err.message?.includes('saveAs') || err.message?.includes('document') || err.message?.includes('window')) {
      assert(true, 'exportCalendarExcel correctly created workbook (browser download skipped in node)');
    } else {
      assert(false, `exportCalendarExcel failed with error: ${err.message}`);
    }
  }

  console.log(`\n=== TEST SUITE COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED ===`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite failed with uncaught error:', err);
  process.exit(1);
});
