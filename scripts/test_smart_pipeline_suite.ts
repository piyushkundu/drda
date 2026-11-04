import { 
  processSmartCellText, 
  classifyText, 
  isNumericOrIdOrDate, 
  isEnglishText, 
  isKrutiDevEncoded,
  isDevanagariUnicode 
} from '../src/lib/fontConversion/smartTextPipeline';
import { normalizeKrutiDevText } from '../src/lib/fontConversion/normalizeKrutiDev';
import { unicodeToKrutiDev } from '../src/lib/fontConversion/unicodeToKrutiDev';
import { krutiDevToUnicode } from '../src/lib/fontConversion/krutiDevToUnicode';

interface TestCase {
  id: number;
  description: string;
  input: string;
  mode: 'krutidev' | 'unicode';
  colIndex?: number;
  clipboardFont?: string;
  expectedValue: string;
  expectedFont: string;
  expectedClass: string;
}

const testCases: TestCase[] = [
  {
    id: 1,
    description: 'Existing Kruti Dev text "jkeiky" in Kruti Dev mode -> preserved verbatim',
    input: 'jkeiky',
    mode: 'krutidev',
    expectedValue: 'jkeiky',
    expectedFont: 'Kruti Dev 010',
    expectedClass: 'krutidev-encoded'
  },
  {
    id: 2,
    description: 'Existing Kruti Dev text "fo\'kky" with single quote/sha in Kruti Dev mode -> preserved verbatim',
    input: "fo'kky",
    mode: 'krutidev',
    expectedValue: "fo'kky",
    expectedFont: 'Kruti Dev 010',
    expectedClass: 'krutidev-encoded'
  },
  {
    id: 3,
    description: 'Unicode Hindi "रामपाल" in Kruti Dev mode -> converted once to "jkeiky"',
    input: 'रामपाल',
    mode: 'krutidev',
    expectedValue: 'jkeiky',
    expectedFont: 'Kruti Dev 010',
    expectedClass: 'unicode-hindi'
  },
  {
    id: 4,
    description: 'Unicode Hindi "रामपाल" in Unicode mode -> preserved as "रामपाल" in Mangal',
    input: 'रामपाल',
    mode: 'unicode',
    expectedValue: 'रामपाल',
    expectedFont: 'Mangal',
    expectedClass: 'unicode-hindi'
  },
  {
    id: 5,
    description: 'Registration ID "31651001327" in Kruti Dev mode -> preserved as exact text in Arial',
    input: '31651001327',
    mode: 'krutidev',
    expectedValue: '31651001327',
    expectedFont: 'Arial',
    expectedClass: 'numeric-or-id'
  },
  {
    id: 6,
    description: 'Date "12/09/2026" in Kruti Dev mode -> preserved without slash corruption in Arial',
    input: '12/09/2026',
    mode: 'krutidev',
    expectedValue: '12/09/2026',
    expectedFont: 'Arial',
    expectedClass: 'numeric-or-id'
  },
  {
    id: 7,
    description: 'English word "Village" in Kruti Dev mode -> preserved without conversion in Arial',
    input: 'Village',
    mode: 'krutidev',
    expectedValue: 'Village',
    expectedFont: 'Arial',
    expectedClass: 'english'
  },
  {
    id: 8,
    description: 'Mixed Hindi & separator "राधेश्याम / लख्खु" in Kruti Dev mode -> safely converted preserving separator',
    input: 'राधेश्याम / लख्खु',
    mode: 'krutidev',
    expectedValue: unicodeToKrutiDev('राधेश्याम / लख्खु'),
    expectedFont: 'Kruti Dev 010',
    expectedClass: 'mixed'
  },
  {
    id: 9,
    description: 'Existing Kruti Dev text with slash "jkèks\';ke / y[[kq" -> slash preserved without mutation',
    input: "jkèks';ke / y[[kq",
    mode: 'krutidev',
    expectedValue: "jkèks';ke / y[[kq",
    expectedFont: 'Kruti Dev 010',
    expectedClass: 'krutidev-encoded'
  },
  {
    id: 10,
    description: 'Existing Kruti Dev text with dot "cqfUn;k." -> dot preserved without mutation',
    input: 'cqfUn;k.',
    mode: 'krutidev',
    expectedValue: 'cqfUn;k.',
    expectedFont: 'Kruti Dev 010',
    expectedClass: 'krutidev-encoded'
  },
  {
    id: 11,
    description: 'Kruti Dev text with @ separator "èkeZiky @ekepUn" -> @ preserved without corruption',
    input: 'èkeZiky @ekepUn',
    mode: 'krutidev',
    expectedValue: 'èkeZiky @ekepUn',
    expectedFont: 'Kruti Dev 010',
    expectedClass: 'krutidev-encoded'
  },
  {
    id: 12,
    description: 'Currency amount "₹5000.00" -> numeric in Arial',
    input: '₹5000.00',
    mode: 'krutidev',
    expectedValue: '₹5000.00',
    expectedFont: 'Arial',
    expectedClass: 'numeric-or-id'
  }
];

let failed = 0;
console.log('================================================================');
console.log('🧪 RUNNING NSAP KRUTI DEV 010 SMART PASTE SUITE (12 CORE CASES)');
console.log('================================================================\n');

for (const tc of testCases) {
  const result = processSmartCellText({
    text: tc.input,
    targetFontMode: tc.mode,
    colIndex: tc.colIndex,
    clipboardFont: tc.clipboardFont
  });

  const valMatch = result.value === tc.expectedValue;
  const fontMatch = result.fontName === tc.expectedFont;
  const classMatch = result.classification === tc.expectedClass;

  if (valMatch && fontMatch && classMatch) {
    console.log(`✅ [Pass] Case ${tc.id}: ${tc.description}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] Case ${tc.id}: ${tc.description}`);
    console.error(`   Expected: value="${tc.expectedValue}", font="${tc.expectedFont}", class="${tc.expectedClass}"`);
    console.error(`   Actual:   value="${result.value}", font="${result.fontName}", class="${result.classification}"`);
  }
}

console.log('\n================================================================');
console.log('🧪 TESTING DOUBLE CONVERSION PREVENTION (Idempotency)');
console.log('================================================================');

const idempotencyItems = ['jkeiky', 'fo\'kky', 'èkeZiky', '31651001327', '12/09/2026', 'Village'];
for (const item of idempotencyItems) {
  const step1 = processSmartCellText({ text: item, targetFontMode: 'krutidev' });
  const step2 = processSmartCellText({ text: step1.value, targetFontMode: 'krutidev' });
  const step3 = processSmartCellText({ text: step2.value, targetFontMode: 'krutidev' });

  if (step1.value === step2.value && step2.value === step3.value && step1.fontName === step3.fontName) {
    console.log(`✅ [Pass] Idempotent: "${item}" remained "${step3.value}" across 3 consecutive cycles (Font: ${step3.fontName})`);
  } else {
    failed++;
    console.error(`❌ [FAIL] Idempotency failed for "${item}": step1="${step1.value}", step2="${step2.value}", step3="${step3.value}"`);
  }
}

console.log('\n================================================================');
console.log('🧪 TESTING NON-DESTRUCTIVE NORMALIZER (normalizeKrutiDevText)');
console.log('================================================================');

const normalizerTests = [
  { input: '12/09/2026', expected: '12/09/2026', desc: 'Date with slashes' },
  { input: "jkèks';ke / y[[kq", expected: "jkèks';ke / y[[kq", desc: 'Kruti Dev text with relation slash' },
  { input: 'S/O', expected: 'S/O', desc: 'S/O abbreviation' },
  { input: 'cqfUn;k.', expected: 'cqfUn;k.', desc: 'Text with dot' },
  { input: 'staff', expected: 'staff', desc: 'English word with af' },
  { input: 'safe', expected: 'safe', desc: 'English word with af' },
  { input: 'jkeiky', expected: 'jkeiky', desc: 'Standard Kruti Dev name' }
];

for (const nt of normalizerTests) {
  const res = normalizeKrutiDevText(nt.input);
  if (res === nt.expected) {
    console.log(`✅ [Pass] Normalizer: ${nt.desc} preserved exactly`);
  } else {
    failed++;
    console.error(`❌ [FAIL] Normalizer: ${nt.desc}`);
    console.error(`   Expected: "${nt.expected}", Actual: "${res}"`);
  }
}

console.log('\n================================================================');
console.log('🧪 TESTING MULTI-CELL & 24-COLUMN TSV SIMULATED PASTE');
console.log('================================================================');

// Simulated 24-column row from external Excel containing mixed content
const sample24ColRow = [
  '1',                        // Col 0: S.No (numeric)
  'अ0 शाहपुर पदड़ा',           // Col 1: GP Name (Unicode Hindi)
  '120',                      // Col 2: Total Bens (numeric)
  '90',                       // Col 3: Direct verified (numeric)
  '20',                       // Col 4: Family verified (numeric)
  '110',                      // Col 5: Total verified (numeric)
  'लाभार्थी बाहर गए हैं',        // Col 6: Unverified reason (Unicode Hindi)
  '1',                        // Col 7: Unver S.No (numeric)
  'jkeiky',                   // Col 8: Unver Name (Kruti Dev encoded)
  '31651001327',              // Col 9: Unver Reg ID (Numeric/ID)
  '1',                        // Col 10: NotRecv S.No (numeric)
  'fo\'kky',                  // Col 11: NotRecv Name (Kruti Dev encoded)
  '31651009393',              // Col 12: NotRecv Reg ID (Numeric/ID)
  '1',                        // Col 13: Inel S.No (numeric)
  'रामपाल',                    // Col 14: Inel Name (Unicode Hindi)
  '316510614781',             // Col 15: Inel Reg ID (Numeric/ID)
  'लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं', // Col 16: Inel Reason (Unicode Hindi)
  '1',                        // Col 17: Dec S.No (numeric)
  'ckyk',                     // Col 18: Dec Name (Kruti Dev encoded)
  '316510219531',             // Col 19: Dec Reg ID (Numeric/ID)
  '12/09/2026',               // Col 20: Death Date (Date)
  '0.00',                     // Col 21: Irreg amount (numeric)
  'BRP Baghpat',              // Col 22: Resp Persons (English)
  'Verified by Team A'        // Col 23: Other Notes (English)
];

console.log(`Processing simulated 24-column row paste in Kruti Dev mode...`);
const processedRow = sample24ColRow.map((cellText, colIndex) => {
  return processSmartCellText({
    text: cellText,
    targetFontMode: 'krutidev',
    colIndex
  });
});

// Verifications
const assertions = [
  { col: 0, val: '1', font: 'Arial', desc: 'Col 0 S.No is numeric' },
  { col: 1, val: unicodeToKrutiDev('अ0 शाहपुर पदड़ा'), font: 'Kruti Dev 010', desc: 'Col 1 GP Name converted to Kruti Dev' },
  { col: 2, val: '120', font: 'Arial', desc: 'Col 2 Count is numeric' },
  { col: 8, val: 'jkeiky', font: 'Kruti Dev 010', desc: 'Col 8 Existing Kruti Dev name preserved' },
  { col: 9, val: '31651001327', font: 'Arial', desc: 'Col 9 Registration ID preserved text in Arial' },
  { col: 11, val: "fo'kky", font: 'Kruti Dev 010', desc: 'Col 11 Existing Kruti Dev name preserved' },
  { col: 14, val: 'jkeiky', font: 'Kruti Dev 010', desc: 'Col 14 Unicode Hindi name converted to Kruti Dev' },
  { col: 18, val: 'ckyk', font: 'Kruti Dev 010', desc: 'Col 18 Existing Kruti Dev name preserved' },
  { col: 20, val: '12/09/2026', font: 'Arial', desc: 'Col 20 Date preserved with slashes in Arial' },
  { col: 22, val: 'BRP Baghpat', font: 'Arial', desc: 'Col 22 English note preserved in Arial' },
  { col: 23, val: 'Verified by Team A', font: 'Arial', desc: 'Col 23 English note preserved in Arial' }
];

for (const a of assertions) {
  const cell = processedRow[a.col];
  if (cell.value === a.val && cell.fontName === a.font) {
    console.log(`✅ [Pass] 24-Col: ${a.desc} (val: "${cell.value}", font: "${cell.fontName}")`);
  } else {
    failed++;
    console.error(`❌ [FAIL] 24-Col: ${a.desc}`);
    console.error(`   Expected: val="${a.val}", font="${a.font}"`);
    console.error(`   Actual:   val="${cell.value}", font="${cell.fontName}"`);
  }
}

console.log('\n================================================================');
if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (0 failures)');
} else {
  console.error(`❌ TOTAL FAILURES: ${failed}`);
  process.exit(1);
}
console.log('================================================================\n');
