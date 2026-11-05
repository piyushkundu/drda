import { exportBRPCalendarPDF } from '../src/lib/exportSocialAuditPdf';
import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import path from 'path';

async function verifyBRP(brpTarget: string, brpPhone: string, outPrefix: string) {
  console.log(`Generating BRP PDF for ${brpTarget}...`);
  const blob = await exportBRPCalendarPDF(INITIAL_SOCIAL_AUDIT_RECORDS, brpTarget, {
    fontMode: 'krutidev',
    brpName: brpTarget,
    brpPhone: brpPhone,
    asOfDate: '2026-10-30'
  });
  const buf = Buffer.from(await blob.arrayBuffer());
  const pdfName = `${outPrefix}.pdf`;
  fs.writeFileSync(pdfName, buf);
  console.log(`Saved ${pdfName}: ${buf.length} bytes`);

  // Render to PNG
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
  const imgName = `${outPrefix}_rendered.png`;
  await page.screenshot({ path: imgName });
  await browser.close();
  console.log(`Rendered ${imgName} successfully`);
}

async function main() {
  await verifyBRP('राजकुमार', '9897691664', 'brp_rajkumar_real');
  await verifyBRP('हरिकिशन', '8859660315', 'brp_harikishan_real');
}

main().catch(console.error);

