import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 950, deviceScaleFactor: 2 });
  
  const pdfBytes = fs.readFileSync('test_brp_debug.pdf').toString('base64');
  
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
          
          const loadingTask = pdfjsLib.getDocument({ data: pdfData });
          loadingTask.promise.then(function(pdf) {
            return pdf.getPage(1).then(function(page) {
              const scale = 2.0;
              const viewport = page.getViewport({ scale: scale });
              const canvas = document.getElementById('the-canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              const renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              return page.render(renderContext).promise;
            });
          }).then(function() {
            window.RENDERED = true;
          }).catch(function(err) {
            window.ERROR = err.message;
          });
        </script>
      </body>
    </html>
  `);

  await page.waitForFunction('window.RENDERED === true || window.ERROR', { timeout: 15000 });
  const err = await page.evaluate('window.ERROR');
  if (err) console.error('PDF.js render error:', err);

  await page.screenshot({ path: 'test_brp_rendered.png' });
  await browser.close();
  console.log('PDF rendered to test_brp_rendered.png');
}

main().catch(console.error);
