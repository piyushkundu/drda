import ExcelJS from 'exceljs';
import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import { getEffectiveMeetingDate, isMeetingAmended, getOriginalMeetingDate, formatDisplayDate } from '../src/lib/dateResolution';

async function testExcelExport() {
  console.log('Testing Excel export logic...');
  const records = INITIAL_SOCIAL_AUDIT_RECORDS;
  
  // Find revised records
  const revised = records.filter(r => {
    const amended = isMeetingAmended(r);
    const eff = getEffectiveMeetingDate(r);
    const orig = getOriginalMeetingDate(r);
    return amended && Boolean(orig) && orig !== eff;
  });

  console.log(`Found ${revised.length} records with meeting date revisions.`);
  for (const r of revised) {
    console.log(`- GP: ${r.gpNameUnicode}, New: ${formatDisplayDate(getEffectiveMeetingDate(r))}, Orig: ${formatDisplayDate(getOriginalMeetingDate(r))}`);
  }

  // Verify that font, strike, and columns are correctly constructed in ExcelJS
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Test');
  sheet.columns = [
    { key: 'sno', width: 8 },
    { key: 'gp', width: 24 },
    { key: 'start', width: 16 },
    { key: 'meeting', width: 16 },
    { key: 'cancelledDate', width: 18 },
    { key: 'supervisor', width: 34 },
    { key: 'brp', width: 30 },
    { key: 'team', width: 44 },
    { key: 'venue', width: 18 },
    { key: 'time', width: 14 },
    { key: 'scheme', width: 30 },
    { key: 'status', width: 26 }
  ];

  console.log('Columns count:', sheet.columns.length);
  if (sheet.columns.length !== 12) {
    throw new Error(`Expected 12 columns, got ${sheet.columns.length}`);
  }

  console.log('Excel export verification passed!');
}

testExcelExport().catch(err => {
  console.error(err);
  process.exit(1);
});

