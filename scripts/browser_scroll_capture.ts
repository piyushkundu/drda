import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\3a8f3a7f-da0e-4472-bf67-776f7c0239be';

async function runScrollAndCapture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050 });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

    // Click NSAP workbook tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('NSAP एक्सेल वर्कबुक'));
      if (btn) btn.click();
    });

    await page.waitForSelector('.workbook-krutidev, .workbook-unicode', { timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    // Jump to Sheet 1 (अ0 शाहपुर पदड़ा)
    await page.evaluate(() => {
      const select = document.querySelector('select') as HTMLSelectElement | null;
      if (select) {
        select.value = '1';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll horizontally to columns N..U (scrollLeft ~ 800px)
    await page.evaluate(() => {
      const scrollbarX = document.querySelector('.luckysheet-scrollbar-x') as HTMLElement | null;
      if (scrollbarX) {
        scrollbarX.scrollLeft = 900;
        scrollbarX.dispatchEvent(new Event('scroll'));
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Screenshot Unicode view of Ineligible / Deceased columns
    const unicodeColumnsShot = path.join(ARTIFACT_DIR, 'browser_real_beneficiaries_unicode.png');
    await page.screenshot({ path: unicodeColumnsShot, fullPage: false });
    console.log('📸 Beneficiaries Unicode screenshot saved:', unicodeColumnsShot);

    // Now switch to Kruti Dev 010 Mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('कृतिदेव 010'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Jump to Sheet 1 again after remount
    await page.evaluate(() => {
      const select = document.querySelector('select') as HTMLSelectElement | null;
      if (select) {
        select.value = '1';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll horizontally to columns N..U in Kruti Dev mode
    await page.evaluate(() => {
      const scrollbarX = document.querySelector('.luckysheet-scrollbar-x') as HTMLElement | null;
      if (scrollbarX) {
        scrollbarX.scrollLeft = 900;
        scrollbarX.dispatchEvent(new Event('scroll'));
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    const krutiColumnsShot = path.join(ARTIFACT_DIR, 'browser_real_beneficiaries_krutidev.png');
    await page.screenshot({ path: krutiColumnsShot, fullPage: false });
    console.log('📸 Beneficiaries Kruti Dev screenshot saved:', krutiColumnsShot);

  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

runScrollAndCapture();
