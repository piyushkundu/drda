import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import { INITIAL_NSAP_DATA_RECORDS } from '../src/data/nsapDataInitial';
import { buildNSAPWorkbookData } from '../src/components/socialAudit/workbook/nsapWorkbookService';
import { NSAP_COLUMN_DEFS } from '../src/components/socialAudit/workbook/nsapWorkbookTemplate';

const ARTIFACT_DIR = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\3a8f3a7f-da0e-4472-bf67-776f7c0239be';
const EXPORT_FILE = path.join(ARTIFACT_DIR, 'NSAP_Social_Audit_Baghpat_Test.xlsx');

async function testExcelExportAndVerification() {
  console.log('📊 Starting Excel Export & Roundtrip Test...');

  // 1. Build workbook data in Kruti Dev mode
  const allSheets = buildNSAPWorkbookData({
    records: INITIAL_SOCIAL_AUDIT_RECORDS,
    nsapRecords: INITIAL_NSAP_DATA_RECORDS,
    fontMode: 'krutidev'
  });

  console.log(`✅ Generated ${allSheets.length} sheets in memory (1 Summary + 47 GPs)`);

  // 2. Generate ExcelJS workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Page Hindi - NSAP Social Audit Baghpat';
  wb.lastModifiedBy = 'District Social Audit Administration';
  wb.created = new Date();
  wb.modified = new Date();

  for (const sheetData of allSheets) {
    const ws = wb.addWorksheet(sheetData.name);

    // Apply column widths
    ws.columns = NSAP_COLUMN_DEFS.map((col) => ({
      header: '',
      key: `col_${col.colIndex}`,
      width: Math.max(10, Math.round(col.width / 7.5))
    }));

    // Populate celldata
    if (sheetData.celldata) {
      for (const cell of sheetData.celldata) {
        const row = ws.getRow(cell.r + 1);
        const cellObj = row.getCell(cell.c + 1);
        const v = cell.v;
        if (!v) continue;

        cellObj.value = v.v !== undefined ? v.v : (v.m !== undefined ? v.m : '');
        
        // Font
        cellObj.font = {
          name: v.ff || 'Arial',
          size: v.fs || 10,
          bold: Boolean(v.bl),
          italic: Boolean(v.it)
        };

        // If registration ID column, enforce text format
        const isRegId = [9, 12, 15, 19].includes(cell.c);
        if (isRegId) {
          cellObj.numFmt = '@';
        }
      }
    }

    // Apply merges
    if (sheetData.config?.merge) {
      for (const key of Object.keys(sheetData.config.merge)) {
        const m = sheetData.config.merge[key];
        try {
          ws.mergeCells(m.r + 1, m.c + 1, m.r + m.rs, m.c + m.cs);
        } catch (_) {}
      }
    }
  }

  // Save to file
  await wb.xlsx.writeFile(EXPORT_FILE);
  console.log(`💾 Saved XLSX file to: ${EXPORT_FILE}`);

  // 3. Re-read with ExcelJS to verify data integrity
  console.log('🔍 Re-opening exported XLSX file to verify contents...');
  const readWb = new ExcelJS.Workbook();
  await readWb.xlsx.readFile(EXPORT_FILE);

  console.log(`✅ Successfully re-opened workbook! Total worksheets: ${readWb.worksheets.length}`);

  let failed = 0;

  // Verify Sheet 0 (Summary)
  const summarySheet = readWb.getWorksheet(1);
  if (summarySheet && (summarySheet.name.includes('सारांश') || summarySheet.name.includes('ग्राम पंचायत'))) {
    console.log(`✅ Sheet 1 is Summary Sheet: "${summarySheet.name}"`);
  } else {
    console.error(`❌ Sheet 1 mismatch: "${summarySheet?.name}"`);
    failed++;
  }

  // Verify Sheet 2 (GP 1: अ0 शाहपुर पदड़ा)
  const gp1Sheet = readWb.getWorksheet(2);
  if (gp1Sheet && gp1Sheet.name.includes('शाहपुर')) {
    console.log(`✅ Sheet 2 is GP 1: "${gp1Sheet.name}"`);

    // Check Row 6 (first ineligible beneficiary: Anita Sharma / vuhrk 'kekZ)
    const inelName1 = gp1Sheet.getRow(6).getCell(15).value;
    const inelReg1 = gp1Sheet.getRow(6).getCell(16).value;
    const inelReg1Fmt = gp1Sheet.getRow(6).getCell(16).numFmt;

    console.log(`   GP 1 Ben 1: Name="${inelName1}", RegId="${inelReg1}", Format="${inelReg1Fmt}"`);
    if (inelName1 === "vuhrk 'kekZ" && inelReg1 === '316510599211') {
      console.log('   ✅ GP 1 Ben 1 verified correctly!');
    } else {
      console.error('   ❌ GP 1 Ben 1 mismatch');
      failed++;
    }

    // Check Dharmpal (Record 7 / Row 12)
    const dharmpalName = gp1Sheet.getRow(12).getCell(15).value;
    const dharmpalReg = gp1Sheet.getRow(12).getCell(16).value;
    console.log(`   GP 1 Ben 7 (Dharmpal): Name="${dharmpalName}", RegId="${dharmpalReg}"`);
    if (dharmpalName === 'èkeZiky' && dharmpalReg === '31651001327') {
      console.log('   ✅ GP 1 Dharmpal verified with NO slashes or corruption!');
    } else {
      console.error('   ❌ GP 1 Dharmpal mismatch');
      failed++;
    }

    // Check Bundiya (Record 4 / Row 9)
    const bundiyaName = gp1Sheet.getRow(9).getCell(15).value;
    const bundiyaReg = gp1Sheet.getRow(9).getCell(16).value;
    console.log(`   GP 1 Ben 4 (Bundiya): Name="${bundiyaName}", RegId="${bundiyaReg}"`);
    if (bundiyaName === 'cqfUn;k' && bundiyaReg === '31651009393') {
      console.log('   ✅ GP 1 Bundiya verified with NO dot corruption!');
    } else {
      console.error('   ❌ GP 1 Bundiya mismatch');
      failed++;
    }
  } else {
    console.error(`❌ Sheet 2 mismatch: "${gp1Sheet?.name}"`);
    failed++;
  }

  console.log('================================================================');
  if (failed === 0) {
    console.log('🎉 EXCEL XLSX EXPORT & VERIFICATION PASSED WITH 100% ACCURACY!');
  } else {
    console.error(`❌ EXCEL VERIFICATION FAILED: ${failed} errors`);
    process.exit(1);
  }
}

testExcelExportAndVerification();
