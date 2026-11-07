// ============================================================================
// NSAP Official Social Audit Workbook - Excel & Print Export / Import Utilities
// Strict 24-Column preservation, Text Format on Registration IDs, Kruti Dev 010
// ============================================================================

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  SocialAuditRecord, 
  NSAPGramPanchayatData
} from '@/types/socialAudit';
import { NSAP_REVIEW_REQUIRED } from '@/lib/nsapVerification';
import { getCellValue, extractNSAPDataFromWorkbook } from './nsapWorkbookService';
import { matchNSAPWorkbookSheet } from './nsapWorkbookMatching';

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
    workbook.calcProperties.fullCalcOnLoad = true;

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
        const rawVal = cell.v !== undefined ? cell.v : cell.m;

        if (isRegIdCol && rIndex >= 4) {
          // Strictly force text formatting for Registration IDs
          excelCell.numFmt = '@';
          excelCell.value = rawVal !== null && rawVal !== undefined ? String(rawVal).trim() : '';
        } else {
          excelCell.value = rawVal;
        }
        if (cell.f && !isRegIdCol) {
          excelCell.value = { formula: String(cell.f).replace(/^=/, ''), result: rawVal };
        }
        if (cIndex === 7 && rIndex >= 5 && getCellValue(sheetData, rIndex, 2) !== '' && getCellValue(sheetData, rIndex, 5) !== '') {
          const total = Number(getCellValue(sheetData, rIndex, 2));
          const verified = Number(getCellValue(sheetData, rIndex, 5));
          const result = Number.isInteger(total) && Number.isInteger(verified) && verified >= 0 && total >= verified ? total - verified : NSAP_REVIEW_REQUIRED;
          const row = rIndex + 1;
          excelCell.value = { formula: `IF(OR(C${row}<0,F${row}<0,F${row}>C${row}),"जाँच आवश्यक",C${row}-F${row})`, result };
          // A total row must retain per-GP validation instead of hiding invalid rows.
          if (sheetData.id === 'sheet-summary' && sheetData.config?.merge?.[`${rIndex}_0`]?.cs === 2) {
            excelCell.value = { formula: `IF(COUNTIF(H6:H${row - 1},"जाँच आवश्यक")>0,"जाँच आवश्यक",SUM(H6:H${row - 1}))`, result: rawVal };
          }
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

    const importedSheets: Array<{ id: string; row: number; celldata: Array<{ r: number; c: number; v: { v: string | number } }> }> = [];
    const readValue = (value: ExcelJS.CellValue): string | number => {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      if (typeof value === 'object') {
        if ('result' in value) return String(value.result ?? '');
        if ('richText' in value) return value.richText.map(part => part.text).join('');
        if ('text' in value) return String(value.text);
        return '';
      }
      return typeof value === 'number' ? value : String(value);
    };
    workbook.eachSheet(ws => {
      const record = matchNSAPWorkbookSheet(ws.name, records);
      if (!record) return;
      let dataRow = 0;
      for (let row = 1; row <= Math.min(ws.rowCount, 12); row++) {
        if ([1, 2, 3, 4, 5, 6].every((value, column) => Number(readValue(ws.getCell(row, column + 1).value)) === value)) {
          dataRow = row + 1;
          break;
        }
      }
      if (!dataRow) throw new Error(ws.name + ': आधिकारिक स्तम्भ क्रम नहीं मिला।');
      const celldata: Array<{ r: number; c: number; v: { v: string | number } }> = [];
      for (let row = dataRow; row <= ws.rowCount; row++) {
        for (let column = 1; column <= 24; column++) {
          const value = readValue(ws.getCell(row, column).value);
          if (value !== '') celldata.push({ r: 5 + row - dataRow, c: column - 1, v: { v: value } });
        }
      }
      if (!celldata.some(cell => cell.c >= 2)) return;
      importedSheets.push({ id: 'sheet-' + record.id, row: Math.max(60, 6 + ws.rowCount - dataRow), celldata });
    });
    const updatedCount = importedSheets.length;
    if (!updatedCount) throw new Error('कोई पहचानी हुई NSAP ग्राम पंचायत शीट नहीं मिली।');
    const extracted = extractNSAPDataFromWorkbook([{ id: 'sheet-summary' }, ...importedSheets], currentNsapRecords, records);
    return {
      success: true,
      updatedRecords: extracted,
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
  const escapeHtml = (value: unknown) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%; font-size: 9pt;">';

  data.forEach((row: any[], rIdx: number) => {
    if (rIdx === 0) return; // skip row 0 spacer
    tableHtml += '<tr>';
    row.forEach((cell: any, cIdx: number) => {
      if (cIdx >= 24) return;
      const val = getCellValue(sheetData, rIdx, cIdx);
      const bg = cell?.bg ? `background-color: ${cell.bg};` : '';
      const bold = cell?.bl ? 'font-weight: bold;' : '';
      const align = cell?.ht === 0 ? 'text-align: center;' : cell?.ht === 2 ? 'text-align: right;' : 'text-align: left;';
      tableHtml += `<td style="padding: 4px; border: 1px solid #666; ${bg} ${bold} ${align}">${escapeHtml(val)}</td>`;
    });
    tableHtml += '</tr>';
  });
  tableHtml += '</table>';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: landscape; margin: 8mm; }
          body { font-family: ${fontMode === 'krutidev' ? "'Kruti Dev 010', sans-serif" : "'Noto Sans Devanagari', sans-serif"}; margin: 0; padding: 10px; }
          h2 { text-align: center; margin-bottom: 8px; font-size: 13pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #444; padding: 3px 5px; font-size: 8.5pt; word-break: break-word; }
        </style>
      </head>
      <body>
        <h2>${escapeHtml(title)}</h2>
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

