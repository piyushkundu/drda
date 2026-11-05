import { jsPDF } from 'jspdf';
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import { unicodeToKrutiDev } from '../src/lib/fontConversion/unicodeToKrutiDev';
import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import { getEffectiveMeetingDate, isMeetingAmended, getOriginalMeetingDate, formatDisplayDate } from '../src/lib/dateResolution';

async function testRevisedDateRendering() {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const fontBase64 = fs.readFileSync('public/fonts/KrutiDev010.ttf').toString('base64');
  doc.addFileToVFS('KrutiDev010.ttf', fontBase64);
  doc.addFont('KrutiDev010.ttf', 'KrutiDev010', 'normal');

  const startX = 10;
  const colWidth = 28;
  const rowHeight = 15;

  // Draw two sample cells:
  // Cell 1: Non-revised meeting date
  const y1 = 20;
  doc.rect(startX, y1, colWidth, rowHeight, 'S');
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(29, 78, 216); // Blue
  doc.text('12/09/2026', startX + colWidth / 2, y1 + rowHeight / 2 + 1, { align: 'center' });

  // Cell 2: Revised meeting date
  const y2 = 40;
  // Fill background with Amber-100
  doc.setFillColor(254, 243, 199);
  doc.rect(startX, y2, colWidth, rowHeight, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(startX, y2, colWidth, rowHeight, 'S');

  const centerX = startX + colWidth / 2;
  const newDate = '10/11/2026';
  const oldDate = '16/10/2026';
  const labelKruti = unicodeToKrutiDev('पुरानी तिथि निरस्त'); // iqjkuh frfFk fujLr

  // 1. New Date (Bold, Amber/Dark, Prominent)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.text(newDate, centerX, y2 + 4.2, { align: 'center' });

  // 2. Old Date (Red-600, with Strikethrough)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 38, 38); // Red-600
  const oldDateY = y2 + 8.2;
  doc.text(oldDate, centerX, oldDateY, { align: 'center' });

  // Strikethrough line through old date
  const oldDateWidth = doc.getTextWidth(oldDate);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.35);
  doc.line(centerX - oldDateWidth / 2 - 0.5, oldDateY - 0.8, centerX + oldDateWidth / 2 + 0.5, oldDateY - 0.8);

  // 3. Label "पुरानी तिथि निरस्त" in Kruti Dev font (6.5pt, Red-700)
  doc.setFont('KrutiDev010', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(185, 28, 28); // Red-700
  doc.text(labelKruti, centerX, y2 + 12.2, { align: 'center' });

  const buf = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync('test_revised_date.pdf', buf);

  // Render to image
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 400, deviceScaleFactor: 2 });
  const pdfBytes = buf.toString('base64');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>body { margin: 0; background: #fff; }</style>
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
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              return page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            });
          }).then(() => { window.DONE = true; });
        </script>
      </body>
    </html>
  `);
  await page.waitForFunction('window.DONE === true', { timeout: 10000 });
  await page.screenshot({ path: 'test_revised_date_rendered.png', clip: { x: 10, y: 30, width: 250, height: 350 } });
  await browser.close();
  console.log('Saved test_revised_date_rendered.png');
}

testRevisedDateRendering().catch(console.error);
