import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\3a8f3a7f-da0e-4472-bf67-776f7c0239be';

async function runBrowserTests() {
  console.log('🚀 Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1600,1050'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050 });

  try {
    console.log('🌐 Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for sidebar to render
    await page.waitForSelector('nav, aside', { timeout: 15000 });
    console.log('✅ Sidebar loaded');

    // Find and click the button with text "NSAP एक्सेल वर्कबुक"
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('NSAP एक्सेल वर्कबुक'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log('✅ Clicked "NSAP एक्सेल वर्कबुक" sidebar button');
    } else {
      console.error('❌ Could not find "NSAP एक्सेल वर्कबुक" button');
    }

    // Wait for the workbook container to mount
    console.log('⏳ Waiting for workbook container (.workbook-krutidev, .workbook-unicode)...');
    await page.waitForSelector('.workbook-krutidev, .workbook-unicode', { timeout: 20000 });
    console.log('✅ Workbook container is mounted!');

    // Wait for canvas or luckysheet
    console.log('⏳ Waiting for canvas / luckysheet to render...');
    await page.waitForSelector('canvas, #luckysheet', { timeout: 20000 });
    console.log('✅ FortuneSheet canvas and Luckysheet loaded!');

    // Wait 2.5 seconds for complete sheet rendering and fonts
    await new Promise((r) => setTimeout(r, 2500));

    // Capture screenshot of Initial State (Kruti Dev Mode on Summary Sheet)
    const initScreenshot = path.join(ARTIFACT_DIR, 'browser_real_1_summary_krutidev.png');
    await page.screenshot({ path: initScreenshot, fullPage: false });
    console.log('📸 Screenshot 1 saved (Summary Sheet):', initScreenshot);

    // ── Test Step 1: Switch to GP Sheet 1 (अ0 शाहपुर पदड़ा) ──
    console.log('\n--- STEP 1: Select Sheet 1 (अ0 शाहपुर पदड़ा) ---');
    await page.evaluate(() => {
      const select = document.querySelector('select') as HTMLSelectElement | null;
      if (select) {
        select.value = '1';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    const gpScreenshot = path.join(ARTIFACT_DIR, 'browser_real_2_gp1_krutidev.png');
    await page.screenshot({ path: gpScreenshot, fullPage: false });
    console.log('📸 Screenshot 2 saved (GP 1 Kruti Dev):', gpScreenshot);

    // ── Test Step 2: Verify Cell Values in FortuneSheet Instance ──
    console.log('\n--- STEP 2: Inspect Cell Values & Font Encodings ---');
    const cellInspection = await page.evaluate(() => {
      // Look for text in Luckysheet table cells or canvas
      const luckysheet = (window as any).luckysheet;
      const file = luckysheet?.getluckysheetfile?.();
      
      const sheetName = file?.[1]?.name || 'Unknown';
      const cellDataCount = file?.[1]?.celldata?.length || 0;

      // Sample first 5 beneficiary names in Sheet 1
      const sampleNames: any[] = [];
      if (file?.[1]?.celldata) {
        file[1].celldata.forEach((c: any) => {
          // Columns 14 (Ineligible Name) or 18 (Deceased Name)
          if ((c.c === 14 || c.c === 18) && c.r >= 5 && sampleNames.length < 10) {
            sampleNames.push({
              r: c.r,
              c: c.c,
              v: c.v?.v,
              m: c.v?.m,
              ff: c.v?.ff,
              fs: c.v?.fs
            });
          }
        });
      }

      return {
        hasLuckysheetGlobal: Boolean(luckysheet),
        sheetName,
        cellDataCount,
        sampleNames
      };
    });

    console.log('Cell inspection result:', JSON.stringify(cellInspection, null, 2));

    // ── Test Step 3: Switch to Unicode Mode ──
    console.log('\n--- STEP 3: Switch to Unicode Mode ---');
    const switchedToUnicode = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('मंगल / यूनिकोड'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked "मंगल / यूनिकोड":', switchedToUnicode);
    await new Promise((r) => setTimeout(r, 2000));

    const unicodeScreenshot = path.join(ARTIFACT_DIR, 'browser_real_3_gp1_unicode.png');
    await page.screenshot({ path: unicodeScreenshot, fullPage: false });
    console.log('📸 Screenshot 3 saved (GP 1 Unicode Mode):', unicodeScreenshot);

    // Inspect cells in Unicode Mode
    const unicodeInspection = await page.evaluate(() => {
      const luckysheet = (window as any).luckysheet;
      const file = luckysheet?.getluckysheetfile?.();
      const sampleNames: any[] = [];
      if (file?.[1]?.celldata) {
        file[1].celldata.forEach((c: any) => {
          if ((c.c === 14 || c.c === 18) && c.r >= 5 && sampleNames.length < 10) {
            sampleNames.push({
              r: c.r,
              c: c.c,
              v: c.v?.v,
              m: c.v?.m,
              ff: c.v?.ff,
              fs: c.v?.fs
            });
          }
        });
      }
      return { sampleNames };
    });
    console.log('Unicode Mode cell samples:', JSON.stringify(unicodeInspection, null, 2));

    // ── Test Step 4: Switch Back to Kruti Dev Mode ──
    console.log('\n--- STEP 4: Switch Back to Kruti Dev Mode ---');
    const switchedToKruti = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('कृतिदेव 010'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked "कृतिदेव 010":', switchedToKruti);
    await new Promise((r) => setTimeout(r, 2000));

    const krutiBackScreenshot = path.join(ARTIFACT_DIR, 'browser_real_4_gp1_krutidev_restored.png');
    await page.screenshot({ path: krutiBackScreenshot, fullPage: false });
    console.log('📸 Screenshot 4 saved (GP 1 Kruti Dev Restored):', krutiBackScreenshot);

    console.log('\n🎉 ALL REAL BROWSER TESTS EXECUTED AND SCREENSHOTS CAPTURED!');
  } catch (err: any) {
    console.error('❌ Browser test failed with error:', err.message);
  } finally {
    await browser.close();
    console.log('Browser session closed.');
  }
}

runBrowserTests();
