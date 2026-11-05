import { jsPDF } from 'jspdf';
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import path from 'path';

async function testGlyphs() {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const fontBase64 = fs.readFileSync('public/fonts/KrutiDev010.ttf').toString('base64');
  doc.addFileToVFS('KrutiDev010.ttf', fontBase64);
  doc.addFont('KrutiDev010.ttf', 'KrutiDev010', 'normal');

  doc.setFont('KrutiDev010', 'normal');
  doc.setFontSize(14);
  
  // Test 1: Title with & for hyphen
  doc.text("ch0vkj0ih0 lkekftd vads{k.k dys.Mj & foRrh; o\"kZ 2026&27", 148, 20, { align: 'center' });
  
  // Test 2: BRP line with colon %, parens ¼ ½, slash @, hyphen &
  doc.setFontSize(11);
  doc.text("ch0vkj0ih0% jktdqekj ¼9897691664½   fodkl [k.M% cM+kSr   dqy vkcafVr xzke iapk;rsa% 21", 148, 30, { align: 'center' });
  
  // Test 3: Subtitle with date and slash @
  doc.text("lkekftd vads{k.k lHkk,a   fnukad% 05@11@2026   tuin% ckxir ¼m0ç0½", 148, 40, { align: 'center' });

  // Test 4: Footer with page and slash @
  doc.setFontSize(9);
  doc.text("i`\"B 1 @ 2", 148, 50, { align: 'center' });

  const buf = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync('test_glyphs.pdf', buf);

  // Render to image
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 600, deviceScaleFactor: 2 });
  
  const pdfBytes = buf.toString('base64');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          body { margin: 0; background: #fff; display: flex; justify-content: center; }
          canvas { margin: 20px; border: 1px solid #ccc; }
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

  await page.waitForFunction('window.DONE === true', { timeout: 10000 });
  await page.screenshot({ path: 'test_glyphs.png' });
  await browser.close();
  console.log('Rendered test_glyphs.png successfully');
}

testGlyphs().catch(console.error);

