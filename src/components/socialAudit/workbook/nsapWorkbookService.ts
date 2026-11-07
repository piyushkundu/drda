// ============================================================================
// NSAP Official Social Audit Workbook Service
// Generates FortuneSheet Data for Summary Sheet + 88 GP Sheets
// Handles dynamic recalculation, data synchronization, and text formatting
// ============================================================================

import { 
  SocialAuditRecord, 
  NSAPGramPanchayatData, 
  NSAPBeneficiaryRecord
} from '@/types/socialAudit';
import { unicodeToKrutiDev } from '@/lib/fontConversion/unicodeToKrutiDev';
import { krutiDevToUnicode } from '@/lib/fontConversion/krutiDevToUnicode';
import { normalizeKrutiDevText } from '@/lib/fontConversion/normalizeKrutiDev';
import { processSmartCellText, classifyText } from '@/lib/fontConversion/smartTextPipeline';
import { getNSAPVerification, NSAP_REVIEW_REQUIRED } from '@/lib/nsapVerification';
import { 
  NSAP_COLUMN_DEFS, 
  STANDARD_HEADER_MERGES, 
  STANDARD_ROW_HEIGHTS,
  DEFAULT_FONT_NAME,
  DEFAULT_FONT_SIZE
} from './nsapWorkbookTemplate';

export interface BuildWorkbookParams {
  records: SocialAuditRecord[];
  nsapRecords: NSAPGramPanchayatData[];
  fontMode: 'krutidev' | 'unicode';
  activeSheetIndex?: number;
}

/**
 * Creates FortuneSheet cell object with exact styles
 */
function createCell(
  value: any,
  options: {
    fontName?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    bg?: string;
    color?: string;
    ht?: 0 | 1 | 2; // 0 center, 1 left, 2 right
    vt?: 0 | 1 | 2; // 0 middle, 1 top, 2 bottom
    tb?: 0 | 1 | 2; // 2 wrap
    isText?: boolean;
  } = {}
) {
  const isText = options.isText ?? (typeof value === 'string');
  const strVal = value !== null && value !== undefined ? String(value) : '';
  const numVal = !isText && !isNaN(Number(value)) && value !== '' ? Number(value) : undefined;

  return {
    v: numVal !== undefined ? numVal : strVal,
    m: strVal,
    ct: isText ? { fa: '@', t: 's' } : { fa: 'General', t: 'n' },
    ff: options.fontName || DEFAULT_FONT_NAME,
    fs: options.fontSize || DEFAULT_FONT_SIZE,
    bl: options.bold ? 1 : 0,
    it: options.italic ? 1 : 0,
    bg: options.bg,
    fc: options.color,
    ht: options.ht !== undefined ? options.ht : (typeof value === 'number' ? 0 : 1),
    vt: options.vt !== undefined ? options.vt : 0,
    tb: options.tb !== undefined ? options.tb : 2
  };
}

/**
 * Universal text formatter for FortuneSheet cells:
 * Ensures Kruti Dev ASCII text is always used when fontMode === 'krutidev',
 * and Devanagari Unicode is always used when fontMode === 'unicode'.
 */
export function formatHindiCellText(
  fontMode: 'krutidev' | 'unicode',
  unicodeText?: string,
  krutiText?: string
): string {
  const u = unicodeText?.trim() || '';
  const k = krutiText ? normalizeKrutiDevText(krutiText.trim()) : '';

  if (fontMode === 'krutidev') {
    if (k) return k;
    if (u) {
      return processSmartCellText({ text: u, targetFontMode: 'krutidev' }).value;
    }
    return '';
  } else {
    if (u) {
      return processSmartCellText({ text: u, targetFontMode: 'unicode' }).value;
    }
    if (k) {
      return processSmartCellText({ text: k, targetFontMode: 'unicode' }).value;
    }
    return '';
  }
}

/**
 * Generates official headers for Rows 1..4 (0-based) for a sheet
 */
function buildHeaderCells(
  titleText: string,
  fontMode: 'krutidev' | 'unicode',
  fontName: string
) {
  const celldata: any[] = [];

  // Row 1: Title (A2:X2 merged)
  celldata.push({
    r: 1,
    c: 0,
    v: createCell(titleText, {
      fontName,
      fontSize: 12,
      bold: true,
      ht: 0,
      vt: 0,
      bg: '#f8fafc',
      tb: 2
    })
  });

  // Row 2: Main Headers
  NSAP_COLUMN_DEFS.forEach((col) => {
    const text = fontMode === 'krutidev' ? col.headerKrutiDev : col.headerUnicode;
    celldata.push({
      r: 2,
      c: col.colIndex,
      v: createCell(text, {
        fontName,
        fontSize: 10,
        bold: true,
        bg: col.bgGroupColor || '#f1f5f9',
        ht: 0,
        vt: 0,
        tb: 2
      })
    });
  });

  // Row 3: Sub-Headers (for multi-column categories)
  NSAP_COLUMN_DEFS.forEach((col) => {
    const text = fontMode === 'krutidev' 
      ? (col.subHeaderKrutiDev || col.headerKrutiDev) 
      : (col.subHeaderUnicode || col.headerUnicode);

    celldata.push({
      r: 3,
      c: col.colIndex,
      v: createCell(text, {
        fontName,
        fontSize: 9,
        bold: true,
        bg: col.bgGroupColor || '#f1f5f9',
        ht: 0,
        vt: 0,
        tb: 2
      })
    });
  });

  // Row 4: Column numbering (1..24)
  NSAP_COLUMN_DEFS.forEach((col) => {
    celldata.push({
      r: 4,
      c: col.colIndex,
      v: createCell(col.colNumber, {
        fontName: 'Arial',
        fontSize: 9,
        bold: true,
        bg: '#f1f5f9',
        ht: 0,
        vt: 0,
        isText: false
      })
    });
  });

  return celldata;
}

/**
 * Builds Column widths map
 */
function buildColumnLen() {
  const columnlen: Record<string, number> = {};
  NSAP_COLUMN_DEFS.forEach((col) => {
    columnlen[col.colIndex.toString()] = col.width;
  });
  return columnlen;
}

/**
 * Builds the Summary Sheet (सभी ग्राम पंचायत / सारांश) containing the 47 NSAP GPs
 */
export function buildSummarySheet(
  records: SocialAuditRecord[],
  nsapRecords: NSAPGramPanchayatData[],
  fontMode: 'krutidev' | 'unicode'
) {
  const fontName = fontMode === 'krutidev' ? 'Kruti Dev 010' : 'Mangal';
  const titleText = fontMode === 'krutidev'
    ? 'jk"Vªh; lkekftd lgk;d dk;ZØe (NSAP) }kjk lapkfyr ;kstuk dk uke& o`' + '}koLFkk isa\'ku ;kstuk\ntuin&ckxir  ds 47 xzke iapk;rksa esa ykHkkfFkZ;ksa ds lks\'ky vkfMV dk leLr lkjka\'k'
    : 'राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) द्वारा संचालित योजना का नाम - वृद्धावस्था पेंशन योजना\nजनपद-बागपत के 47 ग्राम पंचायतों में लाभार्थियों के सोशल ऑडिट का समस्त सारांश';

  const celldata = buildHeaderCells(titleText, fontMode, fontName);
  const merges: Record<string, any> = { ...STANDARD_HEADER_MERGES };

  // Map NSAP data by GP name or rosterRecordId
  const nsapMap = new Map<string, NSAPGramPanchayatData>();
  nsapRecords.forEach((item) => {
    if (item.rosterRecordId) nsapMap.set(item.rosterRecordId, item);
    if (item.gpNameUnicode) nsapMap.set(item.gpNameUnicode.trim(), item);
    if (item.gpNameKrutiDev) nsapMap.set(item.gpNameKrutiDev.trim(), item);
  });

  // Keep running sums for total row
  let grandTotalBeneficiaries = 0;
  let grandVerifiedDirect = 0;
  let grandVerifiedFamily = 0;
  let grandVerifiedTotal = 0;
  let grandUnverified = 0;
  let hasInvalidVerification = false;
  let grandNotReceived = 0;
  let grandIneligible = 0;
  let grandDeceased = 0;
  let grandIrregularity = 0;

  // Row 5.. (5 + records.length - 1)
  records.forEach((record, idx) => {
    const r = 5 + idx;
    const nsapData = nsapMap.get(record.id) || 
                     nsapMap.get(record.gpNameUnicode.trim()) || 
                     nsapMap.get(record.gpNameKrutiDev.trim());

    const inelCount = nsapData?.beneficiaries?.filter(b => b.category === 'ineligible').length || 0;
    const decCount = nsapData?.beneficiaries?.filter(b => b.category === 'deceased').length || 0;
    const verification = nsapData ? getNSAPVerification(nsapData) : undefined;
    const unverCount = verification?.unverified ?? 0;
    if (verification && !verification.valid) hasInvalidVerification = true;
    const notRecvCount = nsapData?.beneficiaries?.filter(b => b.category === 'other').length || 0;

    const totalBens = nsapData?.totalBeneficiaries || 0;
    const verDirect = nsapData?.verifiedDirect || 0;
    const verFamily = nsapData?.verifiedFamily || 0;
    const verTotal = nsapData?.verifiedTotal ?? (verDirect + verFamily);
    const irregAmount = nsapData?.financialIrregularityAmount || 0;

    grandTotalBeneficiaries += totalBens;
    grandVerifiedDirect += verDirect;
    grandVerifiedFamily += verFamily;
    grandVerifiedTotal += verTotal;
    grandUnverified += unverCount;
    grandNotReceived += notRecvCount;
    grandIneligible += inelCount;
    grandDeceased += decCount;
    grandIrregularity += irregAmount;

    const gpName = formatHindiCellText(fontMode, record.gpNameUnicode, record.gpNameKrutiDev);
    const unverReason = formatHindiCellText(fontMode, nsapData?.unverifiedReason);
    const irregNotes = nsapData?.financialIrregularityAmount || formatHindiCellText(fontMode, nsapData?.irregularityNotes);
    const respPersons = formatHindiCellText(fontMode, nsapData?.responsiblePersons);
    const otherNotes = formatHindiCellText(fontMode, nsapData?.otherNotes);

    // Col 0: S.No (1 to 47)
    celldata.push({ r, c: 0, v: createCell(idx + 1, { fontName: 'Arial', ht: 0 }) });
    // Col 1: GP Name
    celldata.push({ r, c: 1, v: createCell(gpName, { fontName, ht: 1 }) });
    // Col 2: Total Beneficiaries
    celldata.push({ r, c: 2, v: createCell(nsapData ? totalBens : '', { fontName: 'Arial', ht: 0, isText: false }) });
    // Col 3: Direct verified
    celldata.push({ r, c: 3, v: createCell(nsapData ? verDirect : '', { fontName: 'Arial', ht: 0, isText: false }) });
    // Col 4: Family verified
    celldata.push({ r, c: 4, v: createCell(nsapData ? verFamily : '', { fontName: 'Arial', ht: 0, isText: false }) });
    // Col 5: Total verified
    celldata.push({ r, c: 5, v: createCell(nsapData ? verTotal : '', { fontName: 'Arial', ht: 0, isText: false }) });
    // Col 6: Reason for non-contact
    celldata.push({ r, c: 6, v: createCell(unverReason, { fontName, ht: 1 }) });
    // Col 7: Unverified count
    celldata.push({ r, c: 7, v: createCell(nsapData ? (verification?.unverified ?? NSAP_REVIEW_REQUIRED) : '', { fontName: 'Arial', ht: 0, isText: verification?.unverified === null, color: verification?.valid === false ? '#be123c' : undefined }) });
    // Col 10: Not received count
    celldata.push({ r, c: 10, v: createCell(notRecvCount || '', { fontName: 'Arial', ht: 0, isText: false }) });
    // Col 13: Ineligible count
    celldata.push({ r, c: 13, v: createCell(inelCount || '', { fontName: 'Arial', ht: 0, isText: false }) });
    // Col 17: Deceased count
    celldata.push({ r, c: 17, v: createCell(decCount || '', { fontName: 'Arial', ht: 0, isText: false }) });
    // Col 21: Financial irregularity
    celldata.push({ r, c: 21, v: createCell(irregNotes || '', { fontName: typeof irregNotes === 'number' ? 'Arial' : fontName, ht: typeof irregNotes === 'number' ? 0 : 1 }) });
    // Col 22: Responsible Person
    celldata.push({ r, c: 22, v: createCell(respPersons, { fontName, ht: 1 }) });
    // Col 23: Other remarks
    celldata.push({ r, c: 23, v: createCell(otherNotes, { fontName, ht: 1 }) });
  });

  // Grand Total Row (Row 5 + records.length)
  const totalRowIndex = 5 + records.length;
  merges[`${totalRowIndex}_0`] = { r: totalRowIndex, c: 0, rs: 1, cs: 2 };

  const totalLabel = fontMode === 'krutidev' ? 'dqy ;ksx ¼47 xzke iapk;r½' : 'कुल योग (47 ग्राम पंचायत)';
  celldata.push({
    r: totalRowIndex,
    c: 0,
    v: createCell(totalLabel, { fontName, bold: true, ht: 0, bg: '#fef08a' })
  });
  celldata.push({
    r: totalRowIndex,
    c: 2,
    v: createCell(grandTotalBeneficiaries, { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: false })
  });
  celldata.push({
    r: totalRowIndex,
    c: 3,
    v: createCell(grandVerifiedDirect, { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: false })
  });
  celldata.push({
    r: totalRowIndex,
    c: 4,
    v: createCell(grandVerifiedFamily, { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: false })
  });
  celldata.push({
    r: totalRowIndex,
    c: 5,
    v: createCell(grandVerifiedTotal, { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: false })
  });
  celldata.push({
    r: totalRowIndex,
    c: 7,
    v: createCell(hasInvalidVerification ? NSAP_REVIEW_REQUIRED : grandUnverified, { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: hasInvalidVerification })
  });
  celldata.push({
    r: totalRowIndex,
    c: 10,
    v: createCell(grandNotReceived, { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: false })
  });
  celldata.push({
    r: totalRowIndex,
    c: 13,
    v: createCell(grandIneligible, { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: false })
  });
  celldata.push({
    r: totalRowIndex,
    c: 17,
    v: createCell(grandDeceased, { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: false })
  });
  celldata.push({
    r: totalRowIndex,
    c: 21,
    v: createCell(grandIrregularity || '', { fontName: 'Arial', bold: true, ht: 0, bg: '#fef08a', isText: false })
  });

  return {
    name: 'सभी ग्राम पंचायत',
    id: 'sheet-summary',
    order: 0,
    row: Math.max(120, totalRowIndex + 15),
    column: 26,
    config: {
      merge: merges,
      columnlen: buildColumnLen(),
      rowlen: {
        ...STANDARD_ROW_HEIGHTS,
        [totalRowIndex.toString()]: 32
      }
    },
    celldata
  };
}

/**
 * Builds an individual Gram Panchayat Worksheet (Sheets 1..88)
 */
export function buildGPSheet(
  record: SocialAuditRecord,
  nsapData: NSAPGramPanchayatData | undefined,
  fontMode: 'krutidev' | 'unicode',
  sheetOrder: number
) {
  const fontName = fontMode === 'krutidev' ? 'Kruti Dev 010' : 'Mangal';
  const blockName = fontMode === 'krutidev' 
    ? (record.block === 'Baghpat' ? 'ckxir' : 'cM+kSr')
    : (record.block === 'Baghpat' ? 'बागपत' : 'बड़ौत');

  const titleText = fontMode === 'krutidev'
    ? 'jk"Vªh; lkekftd lgk;d dk;ZØe (NSAP) }kjk lapkfyr ;kstuk dk uke& o`' + '}koLFkk isa\'ku ;kstuk\ntuin&ckxir  ds fodkl [k.M& ' + blockName + ' esa ykHkkfFkZ;ksa ds lks\'ky vkfMV dk lkjka\'k'
    : `राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) द्वारा संचालित योजना का नाम - वृद्धावस्था पेंशन योजना\nजनपद-बागपत के विकास खण्ड - ${record.blockHindi} में लाभार्थियों के सोशल ऑडिट का सारांश`;

  const celldata = buildHeaderCells(titleText, fontMode, fontName);
  const merges: Record<string, any> = { ...STANDARD_HEADER_MERGES };

  const gpName = formatHindiCellText(fontMode, record.gpNameUnicode, record.gpNameKrutiDev);
  const unverReason = formatHindiCellText(fontMode, nsapData?.unverifiedReason);
  const irregNotes = nsapData?.financialIrregularityAmount || formatHindiCellText(fontMode, nsapData?.irregularityNotes);
  const respPersons = formatHindiCellText(fontMode, nsapData?.responsiblePersons);
  const otherNotes = formatHindiCellText(fontMode, nsapData?.otherNotes);

  // Segregate beneficiaries
  const beneficiaries = nsapData?.beneficiaries || [];
  const inel = beneficiaries.filter(b => b.category === 'ineligible');
  const dec = beneficiaries.filter(b => b.category === 'deceased');
  const unver = beneficiaries.filter(b => b.category === 'unverified');
  const notRecv = beneficiaries.filter(b => b.category === 'other');

  const maxBenRows = Math.max(1, inel.length, dec.length, unver.length, notRecv.length);
  const rowCountToRender = Math.max(maxBenRows, 15); // Ensure at least 15 blank editable rows

  // Merge GP Name and S.No across all beneficiary rows (Rows 5 to 5 + maxBenRows - 1)
  if (maxBenRows > 1) {
    merges['5_0'] = { r: 5, c: 0, rs: maxBenRows, cs: 1 };
    merges['5_1'] = { r: 5, c: 1, rs: maxBenRows, cs: 1 };
    merges['5_2'] = { r: 5, c: 2, rs: maxBenRows, cs: 1 };
    merges['5_3'] = { r: 5, c: 3, rs: maxBenRows, cs: 1 };
    merges['5_4'] = { r: 5, c: 4, rs: maxBenRows, cs: 1 };
    merges['5_5'] = { r: 5, c: 5, rs: maxBenRows, cs: 1 };
    merges['5_6'] = { r: 5, c: 6, rs: maxBenRows, cs: 1 };
    merges['5_21'] = { r: 5, c: 21, rs: maxBenRows, cs: 1 };
    merges['5_22'] = { r: 5, c: 22, rs: maxBenRows, cs: 1 };
    merges['5_23'] = { r: 5, c: 23, rs: maxBenRows, cs: 1 };
  }

  // Row 5: Master GP Statistics
  celldata.push({ r: 5, c: 0, v: createCell(record.sno, { fontName: 'Arial', ht: 0, vt: 0 }) });
  celldata.push({ r: 5, c: 1, v: createCell(gpName, { fontName, ht: 1, vt: 0, bold: true }) });
  celldata.push({ r: 5, c: 2, v: createCell(nsapData?.totalBeneficiaries ?? '', { fontName: 'Arial', ht: 0, vt: 0, isText: false }) });
  celldata.push({ r: 5, c: 3, v: createCell(nsapData?.verifiedDirect ?? '', { fontName: 'Arial', ht: 0, vt: 0, isText: false }) });
  celldata.push({ r: 5, c: 4, v: createCell(nsapData?.verifiedFamily ?? '', { fontName: 'Arial', ht: 0, vt: 0, isText: false }) });
  celldata.push({ r: 5, c: 5, v: createCell(nsapData?.verifiedTotal ?? '', { fontName: 'Arial', ht: 0, vt: 0, isText: false }) });
  celldata.push({ r: 5, c: 6, v: createCell(unverReason, { fontName, ht: 1, vt: 0 }) });
  const verification = nsapData ? getNSAPVerification(nsapData) : undefined;
  celldata.push({ r: 5, c: 7, v: {
    ...createCell(nsapData ? (verification?.unverified ?? NSAP_REVIEW_REQUIRED) : '', { fontName: 'Arial', ht: 0, bold: true, bg: '#fff7ed', color: verification?.valid === false ? '#be123c' : '#9a3412', isText: verification?.unverified === null }),
    ...(nsapData ? { f: '=IF(OR(C6<0,F6<0,F6>C6),"जाँच आवश्यक",C6-F6)' } : {}),
  } });

  // Irregularities & Remarks (Row 5)
  celldata.push({ r: 5, c: 21, v: createCell(irregNotes || '', { fontName: typeof irregNotes === 'number' ? 'Arial' : fontName, ht: typeof irregNotes === 'number' ? 0 : 1, vt: 0 }) });
  celldata.push({ r: 5, c: 22, v: createCell(respPersons, { fontName, ht: 1, vt: 0 }) });
  celldata.push({ r: 5, c: 23, v: createCell(otherNotes, { fontName, ht: 1, vt: 0 }) });

  // Render individual beneficiary rows (Row 5 to 5 + rowCountToRender - 1)
  for (let i = 0; i < rowCountToRender; i++) {
    const r = 5 + i;

    // 1. Unverified (Cols 7, 8, 9)
    if (unver[i]) {
      const b = unver[i];
      const bName = formatHindiCellText(fontMode, b.nameUnicode, b.nameKrutiDev);
      celldata.push({ r, c: 8, v: createCell(bName, { fontName, ht: 1 }) });
      celldata.push({ r, c: 9, v: createCell(b.registrationId, { fontName: 'Arial', ht: 0, isText: true }) });
    }

    // 2. Benefit not received (Cols 10, 11, 12)
    if (notRecv[i]) {
      const b = notRecv[i];
      const bName = formatHindiCellText(fontMode, b.nameUnicode, b.nameKrutiDev);
      celldata.push({ r, c: 10, v: createCell(i + 1, { fontName: 'Arial', ht: 0 }) });
      celldata.push({ r, c: 11, v: createCell(bName, { fontName, ht: 1 }) });
      celldata.push({ r, c: 12, v: createCell(b.registrationId, { fontName: 'Arial', ht: 0, isText: true }) });
    }

    // 3. Ineligible (Cols 13, 14, 15, 16)
    if (inel[i]) {
      const b = inel[i];
      const bName = formatHindiCellText(fontMode, b.nameUnicode, b.nameKrutiDev);
      const bReason = formatHindiCellText(fontMode, b.reason || 'लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं');
      celldata.push({ r, c: 13, v: createCell(i + 1, { fontName: 'Arial', ht: 0 }) });
      celldata.push({ r, c: 14, v: createCell(bName, { fontName, ht: 1 }) });
      celldata.push({ r, c: 15, v: createCell(b.registrationId, { fontName: 'Arial', ht: 0, isText: true }) });
      celldata.push({ r, c: 16, v: createCell(bReason, { fontName, ht: 1 }) });
    }

    // 4. Deceased (Cols 17, 18, 19, 20)
    if (dec[i]) {
      const b = dec[i];
      const bName = formatHindiCellText(fontMode, b.nameUnicode, b.nameKrutiDev);
      const rawDateOrReason = b.deathDate || b.reason || 'मृत्यु';
      const processedCol20 = processSmartCellText({
        text: rawDateOrReason,
        targetFontMode: fontMode,
        colIndex: 20
      });
      celldata.push({ r, c: 17, v: createCell(i + 1, { fontName: 'Arial', ht: 0 }) });
      celldata.push({ r, c: 18, v: createCell(bName, { fontName, ht: 1 }) });
      celldata.push({ r, c: 19, v: createCell(b.registrationId, { fontName: 'Arial', ht: 0, isText: true }) });
      celldata.push({
        r,
        c: 20,
        v: createCell(processedCol20.value, {
          fontName: processedCol20.fontName,
          fontSize: processedCol20.fontSize,
          ht: processedCol20.classification === 'numeric-or-id' ? 0 : 1
        })
      });
    }
  }

  // Safe sheet name: remove illegal excel chars [: \ / ? * [ ]]
  const safeName = `${record.sno}. ${record.gpNameUnicode.trim()}`.replace(/[\\/?*:[\]]/g, '').slice(0, 31);

  return {
    name: safeName,
    id: `sheet-${record.id}`,
    order: sheetOrder,
    row: Math.max(60, 5 + rowCountToRender + 10),
    column: 26,
    config: {
      merge: merges,
      columnlen: buildColumnLen(),
      rowlen: {
        ...STANDARD_ROW_HEIGHTS
      }
    },
    celldata
  };
}

/**
 * Builds the Complete NSAP District Workbook:
 * - Sheet 0: Summary Sheet (सभी 47 NSAP ग्राम पंचायत)
 * - Sheets 1..47: One sheet per NSAP Gram Panchayat
 */
export function buildNSAPWorkbookData({
  records,
  nsapRecords,
  fontMode,
  activeSheetIndex = 0
}: BuildWorkbookParams) {
  // Only include Gram Panchayats where NSAP is held (hasNSAP === true)
  const nsapGps = records.filter(r => r.hasNSAP);
  const allSheets: any[] = [];

  // Sheet 0: Summary Sheet (47 NSAP Gram Panchayats)
  allSheets.push(buildSummarySheet(nsapGps, nsapRecords, fontMode));

  // Build map of existing NSAP data
  const nsapMap = new Map<string, NSAPGramPanchayatData>();
  nsapRecords.forEach((item) => {
    if (item.rosterRecordId) nsapMap.set(item.rosterRecordId, item);
    if (item.gpNameUnicode) nsapMap.set(item.gpNameUnicode.trim(), item);
    if (item.gpNameKrutiDev) nsapMap.set(item.gpNameKrutiDev.trim(), item);
  });

  // Sheets 1..47: One for every NSAP Gram Panchayat
  nsapGps.forEach((record, idx) => {
    const nsapData = nsapMap.get(record.id) || 
                     nsapMap.get(record.gpNameUnicode.trim()) || 
                     nsapMap.get(record.gpNameKrutiDev.trim());

    allSheets.push(buildGPSheet(record, nsapData, fontMode, idx + 1));
  });

  // Ensure active sheet status is preserved
  allSheets.forEach((s, idx) => {
    s.status = idx === activeSheetIndex ? 1 : 0;
  });

  return allSheets;
}

/**
 * Helper to safely extract cell text / value from FortuneSheet
 */
export function getCellValue(sheet: any, r: number, c: number): string {
  if (!sheet) return '';
  if (sheet.data && sheet.data[r] && sheet.data[r][c] !== undefined) {
    const cell = sheet.data[r][c];
    if (cell === null || cell === undefined) return '';
    return String(cell.v !== undefined ? cell.v : (cell.m !== undefined ? cell.m : '')).trim();
  }
  if (sheet.celldata) {
    const found = sheet.celldata.find((cell: any) => cell.r === r && cell.c === c);
    if (found && found.v !== undefined) {
      return String(found.v.v !== undefined ? found.v.v : (found.v.m !== undefined ? found.v.m : '')).trim();
    }
  }
  return '';
}

export function getNSAPSheetRowCount(sheet: { row?: number; data?: unknown[][]; celldata?: { r: number }[] }): number {
  const sparseRows = (sheet.celldata || []).reduce((max, cell) => Math.max(max, cell.r + 1), 0);
  return Math.max(sheet.row || 0, sheet.data?.length || 0, sparseRows);
}

/**
 * Parses and extracts NSAP Beneficiary Records and GP summaries from the FortuneSheet workbook
 */
export function extractNSAPDataFromWorkbook(
  allSheets: any[],
  existingNsapRecords: NSAPGramPanchayatData[],
  records: SocialAuditRecord[]
): NSAPGramPanchayatData[] {
  if (!allSheets || allSheets.length < 2) return existingNsapRecords;

  const nsapGps = records.filter(r => r.hasNSAP);
  const resultMap = new Map<string, NSAPGramPanchayatData>();

  // Initialize with existing data as fallback
  existingNsapRecords.forEach((item) => {
    resultMap.set(item.rosterRecordId || item.gpNameUnicode.trim(), { ...item });
  });

  // Process GP Sheets (skip Sheet 0 Summary)
  for (let sIdx = 1; sIdx < allSheets.length; sIdx++) {
    const sheet = allSheets[sIdx];
    if (!sheet) continue;

    // Identify corresponding SocialAuditRecord from the 47 NSAP GPs
    const record = nsapGps.find(record => sheet.id === `sheet-${record.id}`);
    if (!record) continue;
    const previous = existingNsapRecords.find(item => item.rosterRecordId === record.id || item.id === record.id);

    const totalBeneficiaries = Number(getCellValue(sheet, 5, 2));
    const verifiedDirect = Number(getCellValue(sheet, 5, 3));
    const verifiedFamily = Number(getCellValue(sheet, 5, 4));
    const verifiedTotalText = getCellValue(sheet, 5, 5);
    const verifiedTotal = verifiedTotalText === '' ? verifiedDirect + verifiedFamily : Number(verifiedTotalText);
    const unverifiedReason = getCellValue(sheet, 5, 6);
    const financialIrregText = getCellValue(sheet, 5, 21);
    const financialIrregularityAmount = parseFloat(financialIrregText.replace(/[^0-9.]/g, '')) || 0;
    const responsiblePersons = getCellValue(sheet, 5, 22);
    const otherNotes = getCellValue(sheet, 5, 23);

    // Helper to extract both Unicode and Kruti Dev representations safely
    const parseBenName = (rawName: string): { nameUnicode: string; nameKrutiDev: string } => {
      if (!rawName || typeof rawName !== 'string') return { nameUnicode: '', nameKrutiDev: '' };
      const trimmed = rawName.trim();
      const cls = classifyText(trimmed);
      if (cls === 'krutidev-encoded') {
        return {
          nameKrutiDev: trimmed,
          nameUnicode: krutiDevToUnicode(trimmed)
        };
      } else if (cls === 'unicode-hindi') {
        return {
          nameUnicode: trimmed,
          nameKrutiDev: unicodeToKrutiDev(trimmed)
        };
      }
      return { nameUnicode: trimmed, nameKrutiDev: trimmed };
    };

    const beneficiaries: NSAPBeneficiaryRecord[] = [];
    const maxRowScan = getNSAPSheetRowCount(sheet);

    for (let r = 5; r < maxRowScan; r++) {
      // 1. Unverified (Cols 8: Name, 9: RegId)
      const unverName = getCellValue(sheet, r, 8);
      const unverRegId = getCellValue(sheet, r, 9);
      if (unverName || unverRegId) {
        const parsed = parseBenName(unverName);
        beneficiaries.push({
          id: `ben-${record.id}-unver-${r}`,
          category: 'unverified',
          categoryHindi: 'सत्यापन नहीं किया जा सका',
          nameUnicode: parsed.nameUnicode,
          nameKrutiDev: parsed.nameKrutiDev,
          registrationId: unverRegId
        });
      }

      // 2. Benefit not received (Cols 11: Name, 12: RegId)
      const notRecvName = getCellValue(sheet, r, 11);
      const notRecvRegId = getCellValue(sheet, r, 12);
      if (notRecvName || notRecvRegId) {
        const parsed = parseBenName(notRecvName);
        beneficiaries.push({
          id: `ben-${record.id}-notrecv-${r}`,
          category: 'other',
          categoryHindi: 'लाभ प्राप्त नहीं हुआ',
          nameUnicode: parsed.nameUnicode,
          nameKrutiDev: parsed.nameKrutiDev,
          registrationId: notRecvRegId
        });
      }

      // 3. Ineligible (Cols 14: Name, 15: RegId, 16: Reason)
      const inelName = getCellValue(sheet, r, 14);
      const inelRegId = getCellValue(sheet, r, 15);
      const inelReason = getCellValue(sheet, r, 16);
      if (inelName || inelRegId) {
        const parsed = parseBenName(inelName);
        beneficiaries.push({
          id: `ben-${record.id}-inel-${r}`,
          category: 'ineligible',
          categoryHindi: 'अपात्र लाभार्थी',
          nameUnicode: parsed.nameUnicode,
          nameKrutiDev: parsed.nameKrutiDev,
          registrationId: inelRegId,
          reason: inelReason || 'लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं'
        });
      }

      // 4. Deceased (Cols 18: Name, 19: RegId, 20: DeathDate)
      const decName = getCellValue(sheet, r, 18);
      const decRegId = getCellValue(sheet, r, 19);
      const decDate = getCellValue(sheet, r, 20);
      if (decName || decRegId) {
        const parsed = parseBenName(decName);
        beneficiaries.push({
          id: `ben-${record.id}-dec-${r}`,
          category: 'deceased',
          categoryHindi: 'सत्यापित में मृतक',
          nameUnicode: parsed.nameUnicode,
          nameKrutiDev: parsed.nameKrutiDev,
          registrationId: decRegId,
          deathDate: decDate,
          reason: 'मृत्यु'
        });
      }
    }

    // Only update if there are either beneficiaries or stats
    if (previous || totalBeneficiaries > 0 || beneficiaries.length > 0 || verifiedTotal > 0) {
      const usedBeneficiaryIds = new Set<string>();
      resultMap.set(record.id, {
        ...previous,
        id: previous?.id || `nsap-${record.id}`,
        rosterRecordId: record.id,
        sno: record.sno,
        gpNameKrutiDev: record.gpNameKrutiDev,
        gpNameUnicode: record.gpNameUnicode,
        block: record.block,
        meetingDate: previous?.meetingDate || record.meetingDate,
        totalBeneficiaries,
        verifiedDirect,
        verifiedFamily,
        verifiedTotal,
        unverifiedReason,
        unverifiedCount: getNSAPVerification({ totalBeneficiaries, verifiedDirect, verifiedFamily, verifiedTotal }).unverified ?? undefined,
        financialIrregularityAmount,
        irregularityNotes: financialIrregText,
        responsiblePersons,
        otherNotes,
        beneficiaries: beneficiaries.map(beneficiary => {
          const old = previous?.beneficiaries.find(item => item.category === beneficiary.category && item.registrationId === beneficiary.registrationId && !usedBeneficiaryIds.has(item.id));
          if (!old) return beneficiary;
          usedBeneficiaryIds.add(old.id);
          const sameName = beneficiary.nameUnicode === old.nameUnicode || beneficiary.nameKrutiDev === old.nameKrutiDev;
          return { ...old, ...beneficiary, id: old.id, ...(sameName ? { nameUnicode: old.nameUnicode, nameKrutiDev: old.nameKrutiDev } : {}) };
        }),
        recordedDate: previous?.recordedDate || new Date().toISOString()
      });
    }
  }

  return Array.from(resultMap.values());
}
