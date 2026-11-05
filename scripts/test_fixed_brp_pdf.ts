import { jsPDF } from 'jspdf';
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import { unicodeToKrutiDev } from '../src/lib/fontConversion/unicodeToKrutiDev';
import { krutiDevToUnicode } from '../src/lib/fontConversion/krutiDevToUnicode';
import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import { getEffectiveMeetingDate, isMeetingAmended, getOriginalMeetingDate, formatDisplayDate, isMeetingCompletedEffective } from '../src/lib/dateResolution';

function toKrutiDevText(text: string): string {
  if (!text) return '';
  // If text has Devanagari Unicode, convert exactly once
  if (/[\u0900-\u097F]/.test(text)) {
    // 1. Replace ASCII colon with Devanagari visarga (which maps to % in Kruti Dev, rendering as :)
    // 2. Replace pipe separators with clean dash
    // 3. Format slashes in dates to @ (which renders as / in Kruti Dev)
    const prepared = text
      .replace(/:/g, 'ः')
      .replace(/\s*\|\s*/g, '   -   ')
      .replace(/\s*–\s*/g, ' - ')
      .replace(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/g, '$1@$2@$3');
    return unicodeToKrutiDev(prepared);
  }
  return text;
}

async function generateTestPdf() {
  const records = INITIAL_SOCIAL_AUDIT_RECORDS.filter(r => (r.brpName || r.brpUnicode || '').includes('राजकुमार'));
  records.sort((a, b) => getEffectiveMeetingDate(a).localeCompare(getEffectiveMeetingDate(b)));

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const fontBase64 = fs.readFileSync('public/fonts/KrutiDev010.ttf').toString('base64');
  doc.addFileToVFS('KrutiDev010.ttf', fontBase64);
  doc.addFont('KrutiDev010.ttf', 'KrutiDev010', 'normal');

  const startX = 10;
  const totalWidth = 277;
  const pageHeight = 210;
  const bottomMargin = 16;
  const lineHeight = 3.8;

  const brpNameUni = 'राजकुमार';
  const brpPhone = '9897691664';
  const blockNameUni = 'बड़ौत';

  // 1. Report Title
  const titleKruti = toKrutiDevText('बी०आर०पी० सोशल ऑडिट कैलेंडर - वित्तीय वर्ष 2026-27');
  
  // 2. Subtitle
  const dateFormatted = formatDisplayDate(new Date().toISOString().slice(0, 10)).replace(/\//g, '@');
  const subtitleKruti = `lkekftd vads{k.k lHkk,a   fnukad% ${dateFormatted}   tuin% ckxir ¼m0ç0½`;

  // 3. BRP Summary Line (Size 10)
  const summaryUni = `बी०आर०पी०: ${brpNameUni} (${brpPhone})   -   विकास खण्ड: ${blockNameUni}   -   कुल आवंटित ग्राम पंचायतें: ${records.length}`;
  const summaryKruti = toKrutiDevText(summaryUni);

  // Column definitions
  const cols = [
    { key: 'sno', headerKruti: 'Ø0 la0', width: 12, align: 'center' },
    { key: 'gp', headerKruti: 'xzke iapk;r dk uke', width: 32, align: 'left' },
    { key: 'block', headerKruti: 'fodkl [k.M', width: 20, align: 'center' },
    { key: 'start', headerKruti: 'çkjEHk fnukad', width: 22, align: 'center' },
    { key: 'meeting', headerKruti: 'cSBd fnukad', width: 24, align: 'center' },
    { key: 'brp', headerKruti: 'ch0vkj0ih0 dk uke', width: 34, align: 'left' },
    { key: 'team', headerKruti: 'Vhe lnL;ks dk uke', width: 50, align: 'left' },
    { key: 'supervisor', headerKruti: 'i;Zos{kd vf/kdkjh', width: 33, align: 'left' },
    { key: 'scheme', headerKruti: ';kstuk dk uke', width: 28, align: 'left' },
    { key: 'status', headerKruti: 'fLFkfr', width: 22, align: 'center' }
  ];

  function drawHeader(y: number): number {
    // Title
    doc.setFont('KrutiDev010', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(titleKruti, 148, y, { align: 'center' });

    // Subtitle
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitleKruti, 148, y + 5.5, { align: 'center' });

    // Summary Line - Kruti Dev 010, Size 10
    doc.setFont('KrutiDev010', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(summaryKruti, 148, y + 10.5, { align: 'center' });

    const tableStartY = y + 14;

    // Table Header Bar
    doc.setFillColor(30, 41, 59);
    doc.rect(startX, tableStartY, totalWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('KrutiDev010', 'normal');
    doc.setFontSize(9);

    let curX = startX;
    cols.forEach(col => {
      const textX = col.align === 'center' ? curX + col.width / 2 : curX + 1.5;
      doc.text(col.headerKruti, textX, tableStartY + 5.2, { align: col.align as any });
      curX += col.width;
    });

    return tableStartY + 8;
  }

  let curY = drawHeader(12);

  // Rows
  records.forEach((r, idx) => {
    const effDate = getEffectiveMeetingDate(r);
    const amended = isMeetingAmended(r);
    const origDate = getOriginalMeetingDate(r);
    const isComp = isMeetingCompletedEffective(r, '2026-10-30');

    const blockText = r.block === 'Baghpat' ? 'ckxir' : 'cM+kSr';
    const meetingDateText = amended && origDate
      ? `${formatDisplayDate(effDate)}\n(${formatDisplayDate(origDate)})`
      : formatDisplayDate(effDate);

    const statusText = amended ? "la'kksf/kr" : (isComp ? 'lEiUu' : 'çLrkfor');

    const cellValues = [
      String(idx + 1),
      r.gpNameKrutiDev || toKrutiDevText(r.gpNameUnicode),
      blockText,
      formatDisplayDate(r.startDate),
      meetingDateText,
      r.brpKrutiDev || toKrutiDevText(r.brpUnicode || r.brpName),
      r.teamMembersKrutiDev || toKrutiDevText(r.teamMembersUnicode),
      r.supervisorOfficerKrutiDev || toKrutiDevText(r.supervisorOfficerUnicode),
      r.schemeKrutiDev || toKrutiDevText(r.schemeUnicode || ''),
      statusText
    ];

    const colLines = cellValues.map((val, i) => {
      const isNumeric = (i === 0 || i === 3 || i === 4);
      doc.setFont(isNumeric ? 'Helvetica' : 'KrutiDev010', 'normal');
      doc.setFontSize(8);
      return doc.splitTextToSize(val, cols[i].width - 2);
    });

    const maxLines = Math.max(...colLines.map(l => l.length), 1);
    const rowHeight = Math.max(maxLines * lineHeight + 2.5, 6.2);

    if (curY + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      curY = drawHeader(12);
    }

    if (amended) {
      doc.setFillColor(254, 243, 199);
      doc.rect(startX, curY, totalWidth, rowHeight, 'F');
    } else if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, curY, totalWidth, rowHeight, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    let curX = startX;
    cols.forEach((col, i) => {
      doc.rect(curX, curY, col.width, rowHeight, 'S');
      const lines = colLines[i];
      const isNumericCol = (i === 0 || i === 3 || i === 4);
      doc.setFont(isNumericCol ? 'Helvetica' : 'KrutiDev010', 'normal');
      doc.setFontSize(8);

      if (amended && (i === 4 || i === 9)) {
        doc.setTextColor(180, 83, 9);
      } else if (isComp && i === 9) {
        doc.setTextColor(4, 120, 87);
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

  // Footer on each page in Kruti Dev
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('KrutiDev010', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    doc.text("lks'ky vkfMV tuin ckxir & vkf/kdkfjd çfr", startX, pageHeight - 6);
    doc.text("i`\"B " + p + " @ " + totalPages, 148, pageHeight - 6, { align: 'center' });
    doc.text("fnukad% " + dateFormatted, startX + totalWidth, pageHeight - 6, { align: 'right' });
  }

  const buf = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync('test_fixed_brp.pdf', buf);
  console.log('Saved test_fixed_brp.pdf:', buf.length);

  // Render to image
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 950, deviceScaleFactor: 2 });
  const pdfBytes = buf.toString('base64');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          body { margin: 0; background: #fff; display: flex; justify-content: center; }
          canvas { box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin: 20px; }
        </style>
      </head>
      <body>
        <canvas id="the-canvas"></canvas>
        <script>
          const pdfData = atob("${pdfBytes}");
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          pdfjsLib.getDocument({ data: pdfData }).promise.then(pdf => {
            return pdf.getPage(1).then(page => {
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.getElementById('the-canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              return page.render({ canvasContext: context, viewport: viewport }).promise;
            });
          }).then(() => { window.DONE = true; });
        </script>
      </body>
    </html>
  `);

  await page.waitForFunction('window.DONE === true', { timeout: 15000 });
  await page.screenshot({ path: 'test_fixed_brp_rendered.png' });
  await browser.close();
  console.log('Rendered test_fixed_brp_rendered.png successfully');
}

generateTestPdf().catch(console.error);
