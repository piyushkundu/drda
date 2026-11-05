/**
 * Professional PDF Export Engine for Social Audit Calendar.
 * Supports:
 * 1. Filter-wise Calendar PDF (exact active filters)
 * 2. Dedicated BRP-wise Calendar PDF
 * 3. Team Member-wise Calendar PDF
 * 4. Kruti Dev 010 (size 10) font support with clean English dates/numbers
 * 5. Dynamic multi-block calculation (Baghpat एवं Baraut)
 * 6. Prominent revised meeting dates with red strikethrough cancelled dates
 * 7. Unicode / Mangal fallback mode
 */

import { jsPDF } from 'jspdf';
import { SocialAuditRecord } from '@/types/socialAudit';
import {
  getEffectiveMeetingDate,
  isMeetingAmended,
  getOriginalMeetingDate,
  formatDisplayDate,
  isMeetingCompletedEffective
} from '@/lib/dateResolution';
import { unicodeToKrutiDev } from '@/lib/fontConversion/unicodeToKrutiDev';
import { krutiDevToUnicode } from '@/lib/fontConversion/krutiDevToUnicode';

let _cachedKrutiFont: string | null = null;
let _cachedMangalFont: string | null = null;

async function getKrutiDevFontBase64(): Promise<string> {
  if (_cachedKrutiFont) return _cachedKrutiFont;
  if (typeof window === 'undefined') {
    // Node.js test environment
    try {
      const fs = await import('fs');
      _cachedKrutiFont = fs.readFileSync('public/fonts/KrutiDev010.ttf').toString('base64');
      return _cachedKrutiFont;
    } catch {
      return '';
    }
  }

  // Browser environment
  try {
    const res = await fetch('/fonts/KrutiDev010.ttf');
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    _cachedKrutiFont = btoa(binary);
    return _cachedKrutiFont;
  } catch (err) {
    console.error('Failed to load Kruti Dev font for PDF export:', err);
    return '';
  }
}

async function getMangalFontBase64(): Promise<string> {
  if (_cachedMangalFont) return _cachedMangalFont;
  if (typeof window === 'undefined') {
    try {
      const fs = await import('fs');
      _cachedMangalFont = fs.readFileSync('public/fonts/mangal.ttf').toString('base64');
      return _cachedMangalFont;
    } catch {
      return '';
    }
  }

  try {
    const res = await fetch('/fonts/mangal.ttf');
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    _cachedMangalFont = btoa(binary);
    return _cachedMangalFont;
  } catch {
    return '';
  }
}

/**
 * Universal text converter for PDF generation.
 * Handles Unicode -> Kruti Dev (converting colons to visarga %, hyphens to &, slashes to @, and brackets to ¼ ½)
 * Preserves already encoded Kruti Dev strings and clean numbers.
 */
export function toKrutiDevPdfText(text: string): string {
  if (!text) return '';
  // If text has Devanagari Unicode (U+0900 to U+097F), convert it exactly once
  if (/[\u0900-\u097F]/.test(text)) {
    const prepared = text
      .replace(/:/g, 'ः')
      .replace(/\s*\|\s*/g, '   -   ')
      .replace(/\s*–\s*/g, ' - ')
      .replace(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/g, '$1@$2@$3');
    return unicodeToKrutiDev(prepared);
  }
  // If already Kruti Dev ASCII, protect punctuation
  return text
    .replace(/\s*\|\s*/g, '   &   ')
    .replace(/(?<!\d):(?!\d)/g, '%');
}

export interface PDFExportOptions {
  fontMode?: 'krutidev' | 'unicode';
  appliedFiltersSummary?: string;
  reportTitle?: string;
  brpName?: string;
  brpPhone?: string;
  block?: string;
  asOfDate?: string;
}

/**
 * Exports the filtered Social Audit Calendar records to a professional government PDF.
 */
export async function exportCalendarPDF(
  records: SocialAuditRecord[],
  options: PDFExportOptions = {}
): Promise<Blob> {
  const fontMode = options.fontMode || 'krutidev';
  const isKruti = fontMode === 'krutidev';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const fontBase64 = await getKrutiDevFontBase64();
  if (fontBase64) {
    doc.addFileToVFS('KrutiDev010.ttf', fontBase64);
    doc.addFont('KrutiDev010.ttf', 'KrutiDev010', 'normal');
  }

  let mangalBase64 = '';
  if (!isKruti) {
    mangalBase64 = await getMangalFontBase64();
    if (mangalBase64) {
      doc.addFileToVFS('mangal.ttf', mangalBase64);
      doc.addFont('mangal.ttf', 'Mangal', 'normal');
    }
  }

  const primaryFont = isKruti ? 'KrutiDev010' : (mangalBase64 ? 'Mangal' : 'Helvetica');
  const numFont = 'Helvetica';

  const startX = 10;
  const totalWidth = 277;
  const pageHeight = 210;
  const bottomMargin = 16;
  const lineHeight = 3.8;

  // Title text - Respect custom title (e.g. BRP Calendar) with verified Kruti Dev conversion
  const defaultTitle = isKruti
    ? "lks'ky vkfMV dys.Mj & foRrh; o\"kZ 2026&27 tuin ckxir"
    : "Social Audit Calendar FY 2026-27 District Baghpat (UP)";
  
  const title = options.reportTitle 
    ? (isKruti ? toKrutiDevPdfText(options.reportTitle) : options.reportTitle)
    : defaultTitle;

  const todayFormatted = formatDisplayDate(new Date().toISOString().slice(0, 10));
  const dateForKruti = todayFormatted.replace(/\//g, '@');

  const subtitle = isKruti
    ? `lkekftd vads{k.k lHkk,a   fnukad% ${dateForKruti}   tuin% ckxir ¼m0ç0½`
    : `Social Audit Sabha Calendar | Date: ${todayFormatted} | District: Baghpat (UP)`;

  const filterSummary = options.appliedFiltersSummary
    ? (isKruti ? toKrutiDevPdfText(options.appliedFiltersSummary) : options.appliedFiltersSummary)
    : '';

  // Column definitions (Total 277mm)
  // Adjusted: 'meeting' increased from 24mm to 28mm to cleanly display 3 lines for revised dates
  const cols = [
    { key: 'sno', headerKruti: 'Ø0 la0', headerUni: 'क्र० सं०', width: 12, align: 'center' },
    { key: 'gp', headerKruti: 'xzke iapk;r dk uke', headerUni: 'ग्राम पंचायत', width: 32, align: 'left' },
    { key: 'block', headerKruti: 'fodkl [k.M', headerUni: 'विकास खण्ड', width: 20, align: 'center' },
    { key: 'start', headerKruti: 'çkjEHk fnukad', headerUni: 'प्रारम्भ दिनांक', width: 22, align: 'center' },
    { key: 'meeting', headerKruti: 'cSBd fnukad', headerUni: 'बैठक दिनांक', width: 28, align: 'center' },
    { key: 'brp', headerKruti: 'ch0vkj0ih0 dk uke', headerUni: 'बी०आर०पी०', width: 32, align: 'left' },
    { key: 'team', headerKruti: 'Vhe lnL;ks dk uke', headerUni: 'सोशल ऑडिट टीम सदस्य', width: 48, align: 'left' },
    { key: 'supervisor', headerKruti: 'i;Zos{kd vf/kdkjh', headerUni: 'पर्यवेक्षक अधिकारी', width: 33, align: 'left' },
    { key: 'scheme', headerKruti: ';kstuk dk uke', headerUni: 'योजना', width: 28, align: 'left' },
    { key: 'status', headerKruti: 'fLFkfr', headerUni: 'स्थिति', width: 22, align: 'center' }
  ];

  function drawPageHeader(y: number): number {
    // Document Title
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 148, y, { align: 'center' });

    // Subtitle
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 148, y + 5.5, { align: 'center' });

    // Filter summary / BRP summary card
    // MUST use primaryFont (KrutiDev010) at font size 10 to ensure crisp Hindi rendering without raw ASCII!
    if (filterSummary) {
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(filterSummary, 148, y + 10.5, { align: 'center' });
    }

    const tableStartY = filterSummary ? y + 14 : y + 9;

    // Draw table header bar
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(startX, tableStartY, totalWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9);

    let curX = startX;
    cols.forEach((col) => {
      const headerText = isKruti ? col.headerKruti : col.headerUni;
      const textX = col.align === 'center' ? curX + col.width / 2 : curX + 1.5;
      doc.text(headerText, textX, tableStartY + 5.2, { align: col.align as any });
      curX += col.width;
    });

    return tableStartY + 8;
  }

  let curY = drawPageHeader(12);

  if (records.length === 0) {
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text(
      isKruti ? "p;fur fQYVj ds vuqlkj dksbZ jsdkMZ ugha feykA" : "No matching social audit records found for the applied filters.",
      148,
      curY + 20,
      { align: 'center' }
    );
  } else {
    records.forEach((r, idx) => {
      const effDate = getEffectiveMeetingDate(r);
      const amended = isMeetingAmended(r);
      const origDate = getOriginalMeetingDate(r);
      const isComp = isMeetingCompletedEffective(r, options.asOfDate || '2026-10-30');
      const hasDateRevision = amended && Boolean(origDate) && origDate !== effDate;

      const blockText = isKruti
        ? (r.block === 'Baghpat' ? 'ckxir' : 'cM+kSr')
        : (r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत');

      let statusText = '';
      if (amended) {
        statusText = isKruti ? "la'kksf/kr" : 'संशोधित';
      } else if (isComp) {
        statusText = isKruti ? 'lEiUu' : 'सम्पन्न';
      } else {
        statusText = isKruti ? 'çLrkfor' : 'प्रस्तावित';
      }

      const gpText = isKruti
        ? (r.gpNameKrutiDev || toKrutiDevPdfText(r.gpNameUnicode))
        : (r.gpNameUnicode || (r.gpNameKrutiDev ? krutiDevToUnicode(r.gpNameKrutiDev) : ''));

      const brpText = isKruti
        ? (r.brpKrutiDev || toKrutiDevPdfText(r.brpUnicode || r.brpName))
        : (r.brpUnicode || r.brpName || (r.brpKrutiDev ? krutiDevToUnicode(r.brpKrutiDev) : ''));

      const teamText = isKruti
        ? (r.teamMembersKrutiDev || toKrutiDevPdfText(r.teamMembersUnicode))
        : (r.teamMembersUnicode || (r.teamMembersKrutiDev ? krutiDevToUnicode(r.teamMembersKrutiDev) : ''));

      const supervisorText = isKruti
        ? (r.supervisorOfficerKrutiDev || toKrutiDevPdfText(r.supervisorOfficerUnicode))
        : (r.supervisorOfficerUnicode || (r.supervisorOfficerKrutiDev ? krutiDevToUnicode(r.supervisorOfficerKrutiDev) : ''));

      const schemeText = isKruti
        ? (r.schemeKrutiDev || toKrutiDevPdfText(r.schemeUnicode || ''))
        : (r.schemeUnicode || (r.schemeKrutiDev ? krutiDevToUnicode(r.schemeKrutiDev) : ''));

      // If meeting has a date revision, allocate 3 distinct lines for col 4
      const meetingLines = hasDateRevision
        ? [
            formatDisplayDate(effDate),
            formatDisplayDate(origDate),
            isKruti ? "iqjkuh frfFk fujLr" : "पुरानी तिथि निरस्त"
          ]
        : [formatDisplayDate(effDate)];

      const cellValues = [
        String(idx + 1),
        gpText || '',
        blockText,
        formatDisplayDate(r.startDate),
        meetingLines,
        brpText || '',
        teamText || '',
        supervisorText || '',
        schemeText || '',
        statusText
      ];

      // Measure column lines
      const colLines = cellValues.map((val, i) => {
        if (i === 4) {
          return val as string[];
        }
        const useNum = (i === 0 || i === 3);
        doc.setFont(useNum ? numFont : primaryFont, 'normal');
        doc.setFontSize(8.5);
        return doc.splitTextToSize(val as string, cols[i].width - 2);
      });

      const maxLines = Math.max(...colLines.map((l) => l.length), 1);
      const minRowHeight = hasDateRevision ? 14.5 : 6.2;
      const rowHeight = Math.max(maxLines * lineHeight + 2.5, minRowHeight);

      // Page boundary check
      if (curY + rowHeight > pageHeight - bottomMargin) {
        doc.addPage();
        curY = drawPageHeader(12);
      }

      // Fill background: Amber-100 for amended records, Slate-50 for zebra rows
      if (amended) {
        doc.setFillColor(254, 243, 199); // Amber-100
        doc.rect(startX, curY, totalWidth, rowHeight, 'F');
      } else if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // Slate-50 zebra
        doc.rect(startX, curY, totalWidth, rowHeight, 'F');
      }

      // Draw cell borders and text
      doc.setDrawColor(226, 232, 240);
      let curX = startX;

      cols.forEach((col, i) => {
        doc.rect(curX, curY, col.width, rowHeight, 'S');

        if (i === 4) {
          // Dedicated Meeting Date Cell Renderer
          const centerX = curX + col.width / 2;

          if (hasDateRevision) {
            const effStr = formatDisplayDate(effDate);
            const origStr = formatDisplayDate(origDate);
            const cancelLabel = isKruti ? "iqjkuh frfFk fujLr" : "पुरानी तिथि निरस्त";

            // Vertically center the 3 lines in the cell
            const startMeetingY = curY + (rowHeight - 11.5) / 2 + 3.2;

            // 1. New Active Date (Bold, Amber-900, prominent)
            doc.setFont(numFont, 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(146, 64, 14); // Amber-800
            doc.text(effStr, centerX, startMeetingY, { align: 'center' });

            // 2. Old Cancelled Date (Red-600 with clean strikethrough)
            const oldDateY = startMeetingY + 4.0;
            doc.setFont(numFont, 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(220, 38, 38); // Red-600
            doc.text(origStr, centerX, oldDateY, { align: 'center' });

            const oldWidth = doc.getTextWidth(origStr);
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.35);
            doc.line(
              centerX - oldWidth / 2 - 0.5,
              oldDateY - 0.8,
              centerX + oldWidth / 2 + 0.5,
              oldDateY - 0.8
            );

            // 3. Explicit label "पुरानी तिथि निरस्त" in Kruti Dev font (6.5pt, Red-700)
            const labelY = oldDateY + 3.6;
            doc.setFont(primaryFont, 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(185, 28, 28); // Red-700
            doc.text(cancelLabel, centerX, labelY, { align: 'center' });
          } else {
            // Normal non-revised meeting date
            doc.setFont(numFont, 'normal');
            doc.setFontSize(8.5);
            if (isComp) {
              doc.setTextColor(4, 120, 87);
            } else if (effDate <= (options.asOfDate || '2026-10-30')) {
              doc.setTextColor(190, 18, 60);
            } else {
              doc.setTextColor(29, 78, 216);
            }
            const singleY = curY + rowHeight / 2 + 1.2;
            doc.text(formatDisplayDate(effDate), centerX, singleY, { align: 'center' });
          }
        } else {
          // Standard cell rendering
          const lines = colLines[i];
          const isNumericCol = (i === 0 || i === 3);
          doc.setFont(isNumericCol ? numFont : primaryFont, 'normal');
          doc.setFontSize(8.5);

          if (amended && (i === 9)) {
            doc.setTextColor(180, 83, 9); // Amber-700
          } else if (isComp && i === 9) {
            doc.setTextColor(4, 120, 87); // Emerald-700
          } else {
            doc.setTextColor(15, 23, 42);
          }

          const textY = curY + 3.8;
          if (col.align === 'center') {
            lines.forEach((line: string, lineIdx: number) => {
              doc.text(line, curX + col.width / 2, textY + lineIdx * lineHeight, { align: 'center' });
            });
          } else {
            lines.forEach((line: string, lineIdx: number) => {
              doc.text(line, curX + 1.2, textY + lineIdx * lineHeight);
            });
          }
        }

        curX += col.width;
      });

      curY += rowHeight;
    });

    // Signatures section on the final page
    if (curY + 24 > pageHeight - bottomMargin) {
      doc.addPage();
      curY = 20;
    } else {
      curY += 8;
    }

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const leftSigTitle = isKruti ? 'ftyk fodkl vf/kdkjh' : 'जिला विकास अधिकारी';
    const leftSigDist = isKruti ? 'tuin ckxir' : 'जनपद बागपत';
    const rightSigTitle = isKruti ? 'eq[; fodkl vf/kdkjh' : 'मुख्य विकास अधिकारी';
    const rightSigDist = isKruti ? 'tuin ckxir' : 'जनपद बागपत';

    doc.text(leftSigTitle, startX + 25, curY, { align: 'center' });
    doc.text(leftSigDist, startX + 25, curY + 4.5, { align: 'center' });

    doc.text(rightSigTitle, startX + totalWidth - 25, curY, { align: 'center' });
    doc.text(rightSigDist, startX + totalWidth - 25, curY + 4.5, { align: 'center' });
  }

  // Footer for each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    if (isKruti) {
      doc.text("lks'ky vkfMV tuin ckxir & vkf/kdkfjd çfr", startX, pageHeight - 6);
      doc.text("i`\"B " + p + " @ " + totalPages, 148, pageHeight - 6, { align: 'center' });
      doc.text("fnukad% " + dateForKruti, startX + totalWidth, pageHeight - 6, { align: 'right' });
    } else {
      doc.text('सोशल ऑडिट जनपद बागपत - आधिकारिक प्रति', startX, pageHeight - 6);
      doc.text(`पृष्ठ ${p} / ${totalPages}`, 148, pageHeight - 6, { align: 'center' });
      doc.text(`दिनांक: ${todayFormatted}`, startX + totalWidth, pageHeight - 6, { align: 'right' });
    }
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

/**
 * Dedicated BRP-wise Calendar PDF generator.
 * Generates an individualized monthly calendar for the selected BRP.
 * Accurately computes all distinct development blocks present in the filtered dataset.
 */
export async function exportBRPCalendarPDF(
  allRecords: SocialAuditRecord[],
  brpIdentifier: string,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const fontMode = options.fontMode || 'krutidev';

  // Filter only records for this BRP
  const brpRecords = allRecords.filter((r) => {
    const phone = r.brpPhone?.trim() || '';
    const name = r.brpName?.trim() || '';
    const unicode = r.brpUnicode?.trim() || '';
    return phone === brpIdentifier || name.includes(brpIdentifier) || unicode.includes(brpIdentifier);
  });

  // Sort by canonical effective date
  brpRecords.sort((a, b) => getEffectiveMeetingDate(a).localeCompare(getEffectiveMeetingDate(b)));

  const brpRecord = brpRecords[0];
  const brpDisplayName = options.brpName || brpRecord?.brpUnicode || brpRecord?.brpName || (brpRecord?.brpKrutiDev ? krutiDevToUnicode(brpRecord.brpKrutiDev) : brpIdentifier);
  const brpPhone = options.brpPhone || brpRecord?.brpPhone || '';

  // Calculate distinct blocks from the exact filtered records included in the PDF
  const distinctBlocks = Array.from(new Set(brpRecords.map(r => r.block).filter(Boolean)));
  
  let blockLabelUni = '';
  if (distinctBlocks.includes('Baghpat') && distinctBlocks.includes('Baraut')) {
    blockLabelUni = 'बागपत एवं बड़ौत';
  } else if (distinctBlocks.includes('Baraut')) {
    blockLabelUni = 'बड़ौत';
  } else if (distinctBlocks.includes('Baghpat')) {
    blockLabelUni = 'बागपत';
  } else if (distinctBlocks.length > 0) {
    blockLabelUni = distinctBlocks.join(' एवं ');
  } else {
    blockLabelUni = 'सभी';
  }

  const titleUni = `बी०आर०पी० सोशल ऑडिट कैलेंडर – वित्तीय वर्ष 2026-27`;
  const summaryUni = `बी०आर०पी०: ${brpDisplayName} ${brpPhone ? `(${brpPhone})` : ''}   -   विकास खण्ड: ${blockLabelUni}   -   कुल आवंटित ग्राम पंचायतें: ${brpRecords.length}`;

  return exportCalendarPDF(brpRecords, {
    ...options,
    fontMode,
    reportTitle: titleUni,
    appliedFiltersSummary: summaryUni
  });
}
