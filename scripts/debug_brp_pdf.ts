import { exportBRPCalendarPDF } from '../src/lib/exportSocialAuditPdf';
import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import path from 'path';

async function main() {
  console.log('Generating BRP Calendar PDF for Rajkumar...');
  const blob = await exportBRPCalendarPDF(INITIAL_SOCIAL_AUDIT_RECORDS, 'राजकुमार', {
    fontMode: 'krutidev',
    brpName: 'राजकुमार',
    brpPhone: '9897691664'
  });
  const buf = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync('test_brp_debug.pdf', buf);
  console.log('Saved test_brp_debug.pdf with size:', buf.length);

  // Now render with Puppeteer to inspect the header
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  const pdfPath = path.resolve('test_brp_debug.pdf').replace(/\\/g, '/');
  await page.goto(`file:///${pdfPath}`);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'test_brp_debug_header.png', clip: { x: 0, y: 0, width: 1400, height: 400 } });
  await browser.close();
  console.log('Screenshot saved to test_brp_debug_header.png');
}

main().catch(console.error);

