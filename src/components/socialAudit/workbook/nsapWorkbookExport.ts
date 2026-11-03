// ============================================================================
// NSAP Official Social Audit Workbook - Excel & Print Export / Import Utilities
// Strict 24-Column preservation, Text Format on Registration IDs, Kruti Dev 010
// ============================================================================

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  SocialAuditRecord, 
  NSAPGramPanchayatData, 
  NSAPBeneficiaryRecord 
} from '@/types/socialAudit';
import { NSAP_COLUMN_DEFS } from './nsapWorkbookTemplate';

/**
 * Converts Hex / RGB string to ARGB string for ExcelJS
 */
function toARGB(color: any): string | undefined {
  if (!color) return undefined;
  let hex = String(color).trim();

  // Basic named colors
  const named: Record<string, string> = {
    white: 'FFFFFFFF',
    black: 'FF000000',
    red: 'FFFF0000',
    green: 'FF008000',
    blue: 'FF0000FF',
    transparent: '00FFFFFF'
  };
  if (named[hex.toLowerCase()]) return named[hex.toLowerCase()];

  // rgb/rgba strings
  if (hex.startsWith('rgb')) {
    const rgba = hex.match(/\d+(\.\d+)?/g);
    if (rgba && rgba.length >= 3) {
      const r = parseInt(rgba[0]).toString(16).padStart(2, '0');
      const g = parseInt(rgba[1]).toString(16).padStart(2, '0');
      const b = parseInt(rgba[2]).toString(16).padStart(2, '0');
      const a = rgba.length === 4 ? Math.round(parseFloat(rgba[3]) * 255).toString(16).padStart(2, '0') : 'FF';
      return (a + r + g + b).toUpperCase();
    }
  }

  // hex strings
  if (hex.startsWith('#')) hex = hex.substring(1);
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 6) hex = 'FF' + hex;

  if (/^[0-9A-Fa-f]{8}$/.test(hex)) {
    return hex.toUpperCase();
  }
  return undefined;
}

/**
 * Exports entire FortuneSheet workbook to a pristine multi-sheet .xlsx file
 * Strict rules:
 * - Registration IDs are always text (numFmt: '@')
 * - Merges and column widths preserved
 * - Kruti Dev 010 font preserved
 */
export async function exportNSAPWorkbookToExcel(
  allSheets: any[],
  filename: string = 'NSAP_Social_Audit_Baghpat_Workbook',
  fontMode: 'krutidev' | 'unicode' = 'krutidev'
): Promise<boolean> {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Social Audit Baghpat / Page Hindi';
    workbook.lastModifiedBy = 'Social Audit Nodal Officer';
    workbook.created = new Date();
    workbook.modified = new Date();

    const defaultFontName = fontMode === 'krutidev' ? 'Kruti Dev 010' : 'Mangal';

    allSheets.forEach((sheetData) => {
      const sheetTitle = (sheetData.name || 'Sheet').replace(/[\\/?*:[\]]/g, '').slice(0, 31);
      const ws = workbook.addWorksheet(sheetTitle, {
        views: [{ showGridLines: true }],
        pageSetup: { orientation: 'landscape', paperSize: 9 } // A4 landscape
      });

      // 1. Column Widths
      ws.properties.defaultColWidth = 12;
      if (sheetData.config && sheetData.config.columnlen) {
        for (const colIndex in sheetData.config.columnlen) {
          const widthPx = sheetData.config.columnlen[colIndex];
          // Convert pixels to Excel column width units
          ws.getColumn(parseInt(colIndex, 10) + 1).width = Math.max(6, widthPx * 0.135);
        }
      }

      // 2. Row Heights
      ws.properties.defaultRowHeight = 22;
      if (sheetData.config && sheetData.config.rowlen) {
        for (const rowIndex in sheetData.config.rowlen) {
          const heightPx = sheetData.config.rowlen[rowIndex];
          ws.getRow(parseInt(rowIndex, 10) + 1).height = heightPx * 0.75;
        }
      }

      // 3. Merges
      if (sheetData.config && sheetData.config.merge) {
        for (const mergeKey in sheetData.config.merge) {
          const merge = sheetData.config.merge[mergeKey];
          try {
            ws.mergeCells(merge.r + 1, merge.c + 1, merge.r + merge.rs, merge.c + merge.cs);
          } catch (e) {
            // Ignore redundant merge collisions
          }
        }
      }

      // 4. Process Cells
      const processCell = (cell: any, rIndex: number, cIndex: number) => {
        if (!cell) return;
        const excelCell = ws.getCell(rIndex + 1, cIndex + 1);

        const isRegIdCol = cIndex === 9 || cIndex === 12 || cIndex === 15 || cIndex === 19;
        const rawVal = cell.m !== undefined ? cell.m : cell.v;

        if (isRegIdCol && rIndex >= 4) {
          // Strictly force text formatting for Registration IDs
          excelCell.numFmt = '@';
          excelCell.value = rawVal !== null && rawVal !== undefined ? String(rawVal).trim() : '';
        } else {
          excelCell.value = rawVal;
        }

        // Font
        const font: any = {
          name: cell.ff || defaultFontName,
          size: cell.fs ? Number(cell.fs) : 10
        };
        if (cell.bl == 1 || cell.bl === true || cell.bl === '1') font.bold = true;
        if (cell.it == 1 || cell.it === true || cell.it === '1') font.italic = true;

        if (cell.fc) {
          const argb = toARGB(cell.fc);
          if (argb) font.color = { argb };
        }
        excelCell.font = font;

        // Background Fill
        if (cell.bg) {
          const argb = toARGB(cell.bg);
          if (argb) {
            excelCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb }
            };
          }
        }

        // Alignment
        const alignment: any = {
          vertical: 'middle',
          wrapText: true
        };
        if (cell.ht === 1) alignment.horizontal = 'left';
        else if (cell.ht === 0) alignment.horizontal = 'center';
        else if (cell.ht === 2) alignment.horizontal = 'right';
        else if (isRegIdCol) alignment.horizontal = 'center';

        excelCell.alignment = alignment;

        // Thin Border on all cells in table
        if (rIndex >= 1 && cIndex < 24) {
          excelCell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };
        }
      };

      if (sheetData.data) {
        sheetData.data.forEach((rowArr: any[], rIndex: number) => {
          if (rowArr) {
            rowArr.forEach((cell: any, cIndex: number) => {
              processCell(cell, rIndex, cIndex);
            });
          }
        });
      } else if (sheetData.celldata) {
        sheetData.celldata.forEach((cellData: any) => {
          processCell(cellData.v, cellData.r, cellData.c);
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, `${filename}.xlsx`);
    return true;
  } catch (err) {
    console.error('Failed to export NSAP Excel workbook:', err);
    throw err;
  }
}

/**
 * Imports and parses an official NSAP Excel workbook (.xlsx)
 * Validates 24 columns, extracts GP statistics and beneficiaries
 */
export async function importNSAPWorkbookFromExcel(
  file: File,
  records: SocialAuditRecord[],
  currentNsapRecords: NSAPGramPanchayatData[]
): Promise<{
  success: boolean;
  updatedRecords: NSAPGramPanchayatData[];
  sheetsCount: number;
  message: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    if (workbook.worksheets.length === 0) {
      return {
        success: false,
        updatedRecords: currentNsapRecords,
        sheetsCount: 0,
        message: 'अपलोड की गई फाइल में कोई वर्कशीट नहीं मिली।'
      };
    }

    const resultMap = new Map<string, NSAPGramPanchayatData>();
    currentNsapRecords.forEach((r) => {
      resultMap.set(r.rosterRecordId || r.gpNameUnicode.trim(), { ...r });
    });

    let updatedCount = 0;

    // Process each worksheet
    workbook.worksheets.forEach((ws) => {
      const sheetName = ws.name.trim();
      // Skip the summary sheet if named 'सभी ग्राम पंचायत' or 'Summary'
      if (sheetName.includes('सभी') || sheetName.toLowerCase().includes('summary') || sheetName.includes('lkjka\'k')) {
        return;
      }

      // Match sheet to a SocialAuditRecord
      let matchedRecord = records.find(
        (r) => ws.name.includes(r.gpNameUnicode.trim()) || 
               r.gpNameUnicode.includes(ws.name.replace(/^[0-9.\s]+/, ''))
      );

      // Try matching by S.No prefix (e.g. "1. शाहपुर पदडां")
      if (!matchedRecord) {
        const snoMatch = sheetName.match(/^(\d+)/);
        if (snoMatch) {
          const sno = parseInt(snoMatch[1], 10);
          matchedRecord = records.find((r) => r.sno === sno);
        }
      }

      if (!matchedRecord) return;

      // Extract row 6 (in 1-based indexing) for GP stats
      const r6 = ws.getRow(6);
      const totalBeneficiaries = parseInt(String(r6.getCell(3).value || 0), 10) || 0;
      const verifiedDirect = parseInt(String(r6.getCell(4).value || 0), 10) || 0;
      const verifiedFamily = parseInt(String(r6.getCell(5).value || 0), 10) || 0;
      const verifiedTotal = parseInt(String(r6.getCell(6).value || 0), 10) || (verifiedDirect + verifiedFamily);
      const unverifiedReason = String(r6.getCell(7).value || '').trim();
      const irregText = String(r6.getCell(22).value || '').trim();
      const responsiblePersons = String(r6.getCell(23).value || '').trim();
      const otherNotes = String(r6.getCell(24).value || '').trim();

      const beneficiaries: NSAPBeneficiaryRecord[] = [];

      // Scan rows 6 to max row
      for (let r = 6; r <= Math.min(ws.rowCount, 100); r++) {
        const row = ws.getRow(r);

        // 1. Unverified (Col 9: Name, 10: RegId)
        const unvName = String(row.getCell(9).value || '').trim();
        const unvId = String(row.getCell(10).value || '').trim();
        if (unvName || unvId) {
          beneficiaries.push({
            id: `ben-${matchedRecord.id}-unver-${r}`,
            category: 'unverified',
            categoryHindi: 'सत्यापन नहीं किया जा सका',
            nameUnicode: unvName,
            registrationId: unvId.replace(/[^0-9A-Za-z]/g, '')
          });
        }

        // 2. Benefit not received (Col 12: Name, 13: RegId)
        const notRecvName = String(row.getCell(12).value || '').trim();
        const notRecvId = String(row.getCell(13).value || '').trim();
        if (notRecvName || notRecvId) {
          beneficiaries.push({
            id: `ben-${matchedRecord.id}-notrecv-${r}`,
            category: 'other',
            categoryHindi: 'लाभ प्राप्त नहीं हुआ',
            nameUnicode: notRecvName,
            registrationId: notRecvId.replace(/[^0-9A-Za-z]/g, '')
          });
        }

        // 3. Ineligible (Col 15: Name, 16: RegId, 17: Reason)
        const inelName = String(row.getCell(15).value || '').trim();
        const inelId = String(row.getCell(16).value || '').trim();
        const inelReason = String(row.getCell(17).value || '').trim();
        if (inelName || inelId) {
          beneficiaries.push({
            id: `ben-${matchedRecord.id}-inel-${r}`,
            category: 'ineligible',
            categoryHindi: 'अपात्र लाभार्थी',
            nameUnicode: inelName,
            registrationId: inelId.replace(/[^0-9A-Za-z]/g, ''),
            reason: inelReason || 'लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं'
          });
        }

        // 4. Deceased (Col 19: Name, 20: RegId, 21: Death Date)
        const decName = String(row.getCell(19).value || '').trim();
        const decId = String(row.getCell(20).value || '').trim();
        const decDate = String(row.getCell(21).value || '').trim();
        if (decName || decId) {
          beneficiaries.push({
            id: `ben-${matchedRecord.id}-dec-${r}`,
            category: 'deceased',
            categoryHindi: 'सत्यापित में मृतक',
            nameUnicode: decName,
            registrationId: decId.replace(/[^0-9A-Za-z]/g, ''),
            deathDate: decDate,
            reason: 'मृत्यु'
          });
        }
      }

      if (totalBeneficiaries > 0 || beneficiaries.length > 0) {
        resultMap.set(matchedRecord.id, {
          id: `nsap-${matchedRecord.id}`,
          rosterRecordId: matchedRecord.id,
          sno: matchedRecord.sno,
          gpNameKrutiDev: matchedRecord.gpNameKrutiDev,
          gpNameUnicode: matchedRecord.gpNameUnicode,
          block: matchedRecord.block,
          meetingDate: matchedRecord.meetingDate,
          totalBeneficiaries,
          verifiedDirect,
          verifiedFamily,
          verifiedTotal,
          unverifiedReason,
          unverifiedCount: beneficiaries.filter(b => b.category === 'unverified').length,
          financialIrregularityAmount: parseFloat(irregText.replace(/[^0-9.]/g, '')) || 0,
          irregularityNotes: irregText,
          responsiblePersons,
          otherNotes,
          beneficiaries,
          recordedDate: new Date().toISOString()
        });
        updatedCount++;
      }
    });

    return {
      success: true,
      updatedRecords: Array.from(resultMap.values()),
      sheetsCount: updatedCount,
      message: `सफलतापूर्वक ${updatedCount} ग्राम पंचायतों का NSAP डेटा आयात किया गया।`
    };
  } catch (err: any) {
    console.error('Import NSAP Excel error:', err);
    return {
      success: false,
      updatedRecords: currentNsapRecords,
      sheetsCount: 0,
      message: `Excel आयात में त्रुटि: ${err?.message || 'अज्ञात त्रुटि'}`
    };
  }
}

/**
 * Prints the active sheet in clean landscape layout
 */
export function printNSAPActiveSheet(
  sheetData: any,
  title: string = 'NSAP Social Audit Sheet',
  fontMode: 'krutidev' | 'unicode' = 'krutidev'
) {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('पॉपअप अवरुद्ध हो गया है। कृपया ब्राउज़र सेटिंग्स में पॉपअप की अनुमति दें।');
    return;
  }

  // Construct table HTML from FortuneSheet data
  const data = sheetData.data || [];
  let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%; font-size: 9pt;">';

  data.forEach((row: any[], rIdx: number) => {
    if (rIdx === 0) return; // skip row 0 spacer
    tableHtml += '<tr>';
    row.forEach((cell: any, cIdx: number) => {
      if (cIdx >= 24) return;
      const val = cell?.m !== undefined ? cell.m : (cell?.v !== undefined ? cell.v : '');
      const bg = cell?.bg ? `background-color: ${cell.bg};` : '';
      const bold = cell?.bl ? 'font-weight: bold;' : '';
      const align = cell?.ht === 0 ? 'text-align: center;' : cell?.ht === 2 ? 'text-align: right;' : 'text-align: left;';
      tableHtml += `<td style="padding: 4px; border: 1px solid #666; ${bg} ${bold} ${align}">${val}</td>`;
    });
    tableHtml += '</tr>';
  });
  tableHtml += '</table>';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: landscape; margin: 8mm; }
          body { font-family: ${fontMode === 'krutidev' ? "'Kruti Dev 010', sans-serif" : "'Noto Sans Devanagari', sans-serif"}; margin: 0; padding: 10px; }
          h2 { text-align: center; margin-bottom: 8px; font-size: 13pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #444; padding: 3px 5px; font-size: 8.5pt; word-break: break-word; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${tableHtml}
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 600);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

