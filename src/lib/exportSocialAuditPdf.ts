/**
 * Professional PDF Export Engine for Social Audit Calendar.
 * Supports:
 * 1. Filter-wise Calendar PDF (exact active filters)
 * 2. Dedicated BRP-wise Calendar PDF
 * 3. Team Member-wise Calendar PDF
 * 4. Kruti Dev 010 (size 10) font support with clean English dates/numbers
 * 5. Unicode / Mangal fallback mode
 */

import { jsPDF } from 'jspdf';
import { SocialAuditRecord, FontViewMode } from '@/types/socialAudit';
import {
  getEffectiveMeetingDate,
  isMeetingAmended,
  getOriginalMeetingDate,
  formatDisplayDate,
  isMeetingCompletedEffective
} from '@/lib/dateResolution';
import { unicodeToKrutiDev } from '@/lib/fontConversion/unicodeToKrutiDev';

let _cachedKrutiFont: string | null = null;

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

  const primaryFont = isKruti ? 'KrutiDev010' : 'Helvetica';
  const numFont = 'Helvetica';

  const startX = 10;
  const totalWidth = 277;
  const pageHeight = 210;
  const bottomMargin = 16;
  const lineHeight = 3.8;

  // Title text
  const title = isKruti
    ? "lks'ky vkfMV dys.Mj foRrh; o\"kZ 2026-27 tuin ckxir"
    : "Social Audit Calendar FY 2026-27 District Baghpat (UP)";

  const subtitle = isKruti
    ? `lkekftd vads{k.k lHkk,a  |  dqy fjdkMZ% ${records.length}  |  fnukad% ${formatDisplayDate(new Date().toISOString().slice(0, 10))}`
    : `Social Audit Sabha Calendar | Total Records: ${records.length} | Date: ${formatDisplayDate(new Date().toISOString().slice(0, 10))}`;

  // Column definitions (Total 277mm)
  const cols = [
    { key: 'sno', headerKruti: 'Ø0 la0', headerUni: 'S.No', width: 12, align: 'center' },
    { key: 'gp', headerKruti: 'xzke iapk;r dk uke', headerUni: 'Gram Panchayat', width: 32, align: 'left' },
    { key: 'block', headerKruti: 'fodkl [k.M', headerUni: 'Block', width: 20, align: 'center' },
    { key: 'start', headerKruti: 'çkjEHk fnukad', headerUni: 'Start Date', width: 22, align: 'center' },
    { key: 'meeting', headerKruti: 'cSBd fnukad', headerUni: 'Meeting Date', width: 24, align: 'center' },
    { key: 'brp', headerKruti: 'ch0vkj0ih0 dk uke', headerUni: 'BRP Name', width: 34, align: 'left' },
    { key: 'team', headerKruti: 'Vhe lnL;ks dk uke', headerUni: 'Team Members', width: 50, align: 'left' },
    { key: 'supervisor', headerKruti: 'i;Zos{kd vf/kdkjh', headerUni: 'Supervisor Officer', width: 33, align: 'left' },
    { key: 'scheme', headerKruti: ';kstuk dk uke', headerUni: 'Scheme', width: 28, align: 'left' },
    { key: 'status', headerKruti: 'fLFkfr', headerUni: 'Status', width: 22, align: 'center' }
  ];

  function drawPageHeader(y: number): number {
    // Document Title
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 148, y, { align: 'center' });

    // Subtitle & Filter summary
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 148, y + 5.5, { align: 'center' });

    if (options.appliedFiltersSummary) {
      doc.setFont(numFont, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(options.appliedFiltersSummary, 148, y + 9.5, { align: 'center' });
    }

    const tableStartY = options.appliedFiltersSummary ? y + 13 : y + 9;

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
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('No matching social audit records found for the applied filters.', 148, curY + 20, { align: 'center' });
  } else {
    records.forEach((r, idx) => {
      const effDate = getEffectiveMeetingDate(r);
      const amended = isMeetingAmended(r);
      const origDate = getOriginalMeetingDate(r);
      const isComp = isMeetingCompletedEffective(r, options.asOfDate || '2026-10-30');

      const blockText = isKruti
        ? (r.block === 'Baghpat' ? 'ckxir' : 'cM+kSr')
        : (r.block === 'Baghpat' ? 'Baghpat' : 'Baraut');

      const meetingDateText = amended && origDate
        ? `${formatDisplayDate(effDate)}\n(${formatDisplayDate(origDate)})`
        : formatDisplayDate(effDate);

      let statusText = '';
      if (amended) {
        statusText = isKruti ? "la'kksf/kr" : 'Amended';
      } else if (isComp) {
        statusText = isKruti ? 'lEiUu' : 'Completed';
      } else {
        statusText = isKruti ? 'çLrkfor' : 'Scheduled';
      }

      const gpText = isKruti ? (r.gpNameKrutiDev || unicodeToKrutiDev(r.gpNameUnicode)) : r.gpNameUnicode;
      const brpText = isKruti ? (r.brpKrutiDev || unicodeToKrutiDev(r.brpUnicode)) : r.brpUnicode;
      const teamText = isKruti ? (r.teamMembersKrutiDev || unicodeToKrutiDev(r.teamMembersUnicode)) : r.teamMembersUnicode;
      const supervisorText = isKruti ? (r.supervisorOfficerKrutiDev || unicodeToKrutiDev(r.supervisorOfficerUnicode)) : r.supervisorOfficerUnicode;
      const schemeText = isKruti ? (r.schemeKrutiDev || unicodeToKrutiDev(r.schemeUnicode)) : r.schemeUnicode;

      const cellValues = [
        String(idx + 1),
        gpText || '',
        blockText,
        formatDisplayDate(r.startDate),
        meetingDateText,
        brpText || '',
        teamText || '',
        supervisorText || '',
        schemeText || '',
        statusText
      ];

      // Measure column lines
      const colLines = cellValues.map((val, i) => {
        const useNum = (i === 0 || i === 3 || i === 4);
        doc.setFont(useNum ? numFont : primaryFont, 'normal');
        doc.setFontSize(8);
        return doc.splitTextToSize(val, cols[i].width - 2);
      });

      const maxLines = Math.max(...colLines.map((l) => l.length), 1);
      const rowHeight = Math.max(maxLines * lineHeight + 2.5, 6.2);

      // Page boundary check
      if (curY + rowHeight > pageHeight - bottomMargin) {
        doc.addPage();
        curY = drawPageHeader(12);
      }

      // Fill background
      if (amended) {
        doc.setFillColor(254, 243, 199); // Amber-100 for amended records
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
        const lines = colLines[i];
        const isNumericCol = (i === 0 || i === 3 || i === 4);
        doc.setFont(isNumericCol ? numFont : primaryFont, 'normal');
        doc.setFontSize(8);

        if (amended && (i === 4 || i === 9)) {
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

    const leftSigTitle = isKruti ? 'ftyk fodkl vf/kdkjh' : 'District Development Officer';
    const leftSigDist = isKruti ? 'tuin ckxir' : 'District Baghpat';
    const rightSigTitle = isKruti ? 'eq[; fodkl vf/kdkjh' : 'Chief Development Officer';
    const rightSigDist = isKruti ? 'tuin ckxir' : 'District Baghpat';

    doc.text(leftSigTitle, startX + 25, curY, { align: 'center' });
    doc.text(leftSigDist, startX + 25, curY + 4.5, { align: 'center' });

    doc.text(rightSigTitle, startX + totalWidth - 25, curY, { align: 'center' });
    doc.text(rightSigDist, startX + totalWidth - 25, curY + 4.5, { align: 'center' });
  }

  // Footer for each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    doc.text('Social Audit Baghpat Portal - Official Copy', startX, pageHeight - 6);
    doc.text(`Page ${p} of ${totalPages}`, 148, pageHeight - 6, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, startX + totalWidth, pageHeight - 6, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

/**
 * Dedicated BRP-wise Calendar PDF generator.
 * Generates an individualized monthly calendar for the selected BRP.
 */
export async function exportBRPCalendarPDF(
  allRecords: SocialAuditRecord[],
  brpIdentifier: string,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const fontMode = options.fontMode || 'krutidev';
  const isKruti = fontMode === 'krutidev';

  // Filter only records for this BRP
  const brpRecords = allRecords.filter((r) => {
    const phone = r.brpPhone?.trim() || '';
    const name = r.brpName?.trim() || '';
    const unicode = r.brpUnicode?.trim() || '';
    return phone === brpIdentifier || name.includes(brpIdentifier) || unicode.includes(brpIdentifier);
  });

  // Sort by canonical effective date
  brpRecords.sort((a, b) => getEffectiveMeetingDate(a).localeCompare(getEffectiveMeetingDate(b)));

  const brpDisplayName = options.brpName || brpRecords[0]?.brpName || brpIdentifier;
  const brpPhone = options.brpPhone || brpRecords[0]?.brpPhone || '';
  const blockName = brpRecords[0]?.block === 'Baraut' ? (isKruti ? 'cM+kSr' : 'Baraut') : (isKruti ? 'ckxir' : 'Baghpat');

  const customFilterSummary = isKruti
    ? `ch0vkj0ih0% ${options.brpName ? unicodeToKrutiDev(options.brpName) : (brpRecords[0]?.brpKrutiDev || brpIdentifier)} ${brpPhone ? `(${brpPhone})` : ''}  |  fodkl [k.M% ${blockName}  |  dqy vkcafVr xzke iapk;rs% ${brpRecords.length}`
    : `BRP: ${brpDisplayName} ${brpPhone ? `(${brpPhone})` : ''} | Block: ${blockName} | Total Assigned GPs: ${brpRecords.length}`;

  return exportCalendarPDF(brpRecords, {
    ...options,
    fontMode,
    reportTitle: isKruti
      ? `ch0vkj0ih0 lkekftd vads{k.k dys.Mj & ${options.brpName ? unicodeToKrutiDev(options.brpName) : (brpRecords[0]?.brpKrutiDev || brpIdentifier)}`
      : `BRP Social Audit Calendar - ${brpDisplayName}`,
    appliedFiltersSummary: customFilterSummary
  });
}

