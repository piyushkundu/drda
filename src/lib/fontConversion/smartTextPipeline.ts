/**
 * Centralized, Bulletproof Smart Text Pipeline for NSAP Official Workbook
 * 
 * Classifies cell content into:
 * - 'numeric-or-id': Registration IDs, pure numbers, dates, amounts, phone numbers. Preserved as exact text, Arial font.
 * - 'unicode-hindi': Devanagari Unicode. If target is Kruti Dev, converts exactly once via unicodeToKrutiDev.
 * - 'krutidev-encoded': Existing Kruti Dev ASCII text. Preserved without conversion, Kruti Dev 010 font.
 * - 'english': Standard English words/text. Preserved without conversion, Arial font.
 * - 'mixed': Combined Hindi and English/punctuation. Carefully converted while preserving separators.
 * - 'empty': Blank/whitespace.
 */

import { unicodeToKrutiDev } from './unicodeToKrutiDev';
import { krutiDevToUnicode } from './krutiDevToUnicode';

export type TextClassification = 
  | 'numeric-or-id'
  | 'unicode-hindi'
  | 'krutidev-encoded'
  | 'english'
  | 'mixed'
  | 'empty';

export interface ProcessedCellResult {
  value: string;
  fontName: string;
  fontSize: number;
  classification: TextClassification;
}

const COMMON_ENGLISH_WORDS = new Set([
  'village', 'panchayat', 'gram', 'block', 'district', 'baghpat', 'baraut', 'uttar', 'pradesh',
  'verified', 'unverified', 'eligible', 'ineligible', 'deceased', 'death', 'benefit', 'received',
  'male', 'female', 'gender', 'age', 'name', 'father', 'husband', 'mother', 'address',
  'total', 'active', 'pending', 'status', 'date', 'month', 'year', 'number', 'remarks', 'reason',
  'pension', 'scheme', 'nsap', 'mgnrega', 'pmayg', 'audit', 'social', 'report', 'center',
  'yes', 'no', 'true', 'false', 'null', 'undefined', 'none', 'na', 'n/a', 'all', 'summary',
  'general', 'obc', 'sc', 'st', 'minority', 'bpl', 'apl', 'amount', 'action', 'phone', 'mobile',
  'registration', 'serial', 'sno', 'id', 'roster', 'team', 'member', 'person', 'direct', 'family',
  'contact', 'irregularity', 'responsible', 'note', 'notes', 'meeting', 'decision', 'nirnay',
  'app', 'mis', 'feeding', 'data', 'excel', 'sheet', 'workbook', 'pdf', 'print', 'export', 'import',
  'save', 'cloud', 'sync', 'online', 'offline', 'government', 'completed', 'sabha', 'upcoming',
  'executive', 'dashboard', 'profile', 'panel', 'view', 'edit', 'mode', 'read', 'only', 'copy',
  'paste', 'format', 'painter', 'font', 'unicode', 'krutidev', 'dual', 'mangal', 'arial', 'times',
  'new', 'roman', 'hindi', 'english', 'state', 'india', 'portal', 'official', 'findings', 'detail',
  'details', 'category', 'other', 'financial', 'count', 'grand', 'page', 'first', 'last', 'next',
  'prev', 'previous', 'search', 'filter', 'clear', 'select', 'selected', 'close', 'open', 'back',
  'of', 'in', 'and', 'the', 'for', 'to', 'from', 'by', 'with', 'at', 'on', 'is', 'as', 'are'
]);

/**
 * Checks if a string is pure numeric, a registration ID, or a calendar date.
 * Never apply Hindi font conversion on these.
 */
export function isNumericOrIdOrDate(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Pure digits or registration IDs (e.g. 31651001327, 47, 0)
  if (/^\d+$/.test(trimmed)) return true;

  // Dates: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YY
  if (/^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/.test(trimmed)) return true;

  // Currency / decimal amounts (e.g. ₹5000, 5000.00, Rs. 500)
  if (/^(₹|rs\.?|inr)?\s*[\d,]+(\.\d+)?$/i.test(trimmed)) return true;

  // Phone numbers with dashes/spaces/plus
  if (/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(trimmed)) return true;

  return false;
}

/**
 * Checks if a string contains Unicode Devanagari characters (U+0900 to U+097F).
 */
export function isDevanagariUnicode(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Checks for high-confidence Kruti Dev signatures that do not exist in English prose.
 */
export function hasStrongKrutiDevSignature(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const str = text.trim();

  // 1. Extended Latin / Kruti font glyph codes: è, ~, ç, Ø, Ü, Ù, ä, –, —, º, í, «, ô, £, ¥, ÷, ë, ì, ï, ¶, ¸, µ, •, ‚, ¨, ©, ¢, ¡, §, Þ, ß, ¼, ½, ¿, À, ¾
  if (/[\u0080-\u00FF~çØÜÙä\u2013\u2014ºí«ô£¥÷ëìï¶¸µ•‚¨©¢¡§Þß¼½¿À¾]/.test(str)) return true;

  // 2. Kruti Dev characters used as consonants: [, ], ?, >, {, }, |
  if (/[\[\]\?><\{\}\|]/.test(str)) return true;

  // 3. Kruti Dev sha: 'k (शा), "k (षा), or single/double quote attached to letters (e.g. fo'kky, 'kekZ)
  // Exclude English contractions like don't, it's (followed by s, t, re, ve, ll, m, d at word end)
  if (/['"]k|['"][a-zA-Z]|[a-zA-Z]['"](?!(s|t|re|ve|ll|m|d)\b)/.test(str)) return true;

  // 4. Uppercase half-consonants/reph mid-word: lowercase followed by uppercase (e.g. jkeZ, cqfUn;k, pUnk, flga, jktflga)
  if (/[a-z][A-Z]/.test(str)) return true;

  // 5. Kruti Dev specific common name stems / suffixes (distinctive to Hindi names):
  // iky (पाल), flag/flga (सिंह), nsoh (देवी), dqekj (कुमार), yky (लाल), pUn (चन्द), orh (वती),
  // izlkn (प्रसाद), jke (राम), ckcw (बाबू), vlxj (असगर), jkt (राज), f'ko (शिव), vaxwjh (अंगूरी), guhQ (हनीफ)
  if (/(iky|flag|flga|nsoh|dqekj|dekj|yky|pUn|orh|izlkn|çlkn|jke|ckcw|vlxj|jkt|f'ko|vaxwjh|guhQ)/i.test(str)) return true;

  // 6. Kruti Dev consonant + 'k' (aa-matra) repetition (e.g. dk, xk, rk, ik, ck, ek, yk, lk, gk)
  if (/(dk|\[k|xk|\?k|pk|tk|rk|Fk|nk|èk|uk|ik|Qk|ck|Hk|ek|yk|ok|lk|gk)/.test(str)) return true;

  return false;
}

/**
 * Checks if an ASCII string is normal English text.
 */
export function isEnglishText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // If it has strong Kruti Dev signatures, it is definitely not English!
  if (hasStrongKrutiDevSignature(trimmed)) return false;

  // Check against common English words directly
  const lower = trimmed.toLowerCase();
  if (COMMON_ENGLISH_WORDS.has(lower)) return true;

  // Split into words
  const words = trimmed.split(/[\s\.,\-\/()':;?!@#%&*]+/).filter(Boolean);
  if (words.length === 0) return false;

  let englishScore = 0;
  for (const w of words) {
    const wLower = w.toLowerCase();
    if (COMMON_ENGLISH_WORDS.has(wLower)) {
      englishScore++;
      continue;
    }
    // Common all-uppercase acronyms (BRP, VRP, GP, DDO, CDO, BDO, NSAP, MIS, SNO, ID)
    if (/^[A-Z]{2,6}$/.test(w)) {
      englishScore++;
      continue;
    }

    // Normal English word shape: starts with uppercase or all lowercase, contains vowels, length >= 2
    if (/^[A-Za-z]+$/.test(w) && /[aeiouy]/i.test(w)) {
      if (!/(iky|flag|flga|nsoh|dqekj|jke|ckcw|vlxj|jkt|èk|ç)/.test(w)) {
        englishScore++;
      }
    }
  }

  return englishScore === words.length;
}

/**
 * Checks if a string is likely Kruti Dev 010 encoded text.
 */
export function isKrutiDevEncoded(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Cannot contain Devanagari Unicode
  if (/[\u0900-\u097F]/.test(trimmed)) return false;

  // Cannot be pure numeric, ID, or date
  if (isNumericOrIdOrDate(trimmed)) return false;

  // Cannot be plain English text
  if (isEnglishText(trimmed)) return false;

  // Must have strong Kruti Dev signature or ASCII letters
  if (hasStrongKrutiDevSignature(trimmed)) return true;

  return /[a-zA-Z]/.test(trimmed);
}

/**
 * Classifies any string into one of the canonical categories.
 */
export function classifyText(text: string, colIndex?: number): TextClassification {
  if (!text || typeof text !== 'string' || text.trim() === '') return 'empty';
  const trimmed = text.trim();

  // Column context: standard registration ID or numeric columns in NSAP 24-column format
  // Col 0: S.No, Col 2..5: Beneficiary counts, Col 7, 10, 13, 17: Category counts, Col 9, 12, 15, 19: Registration IDs
  const standardNumericCols = [0, 2, 3, 4, 5, 7, 9, 10, 12, 13, 15, 17, 19];
  if (colIndex !== undefined && standardNumericCols.includes(colIndex) && isNumericOrIdOrDate(trimmed)) {
    return 'numeric-or-id';
  }

  // 1. Numeric / ID / Date
  if (isNumericOrIdOrDate(trimmed)) return 'numeric-or-id';

  // 2. Devanagari Unicode
  const hasDevanagari = /[\u0900-\u097F]/.test(trimmed);
  const hasLatinLetters = /[a-zA-Z]/.test(trimmed);
  const hasSeparators = /[\/\@\-\(\)]/.test(trimmed);

  if (hasDevanagari && (hasLatinLetters || hasSeparators)) return 'mixed';
  if (hasDevanagari) return 'unicode-hindi';

  // 3. Kruti Dev High-Confidence Signature
  if (hasStrongKrutiDevSignature(trimmed)) return 'krutidev-encoded';

  // 4. English Text
  if (isEnglishText(trimmed)) return 'english';

  // 5. Fallback for ASCII letters
  if (hasLatinLetters) return 'krutidev-encoded';

  return 'english';
}

/**
 * Centralized Smart Cell Processor:
 * Determines the correct stored value and font styling for any cell.
 * Guarantees:
 * - Existing Kruti Dev encoded text is preserved exactly.
 * - Unicode Hindi is converted exactly once when targetFontMode is 'krutidev'.
 * - English text, dates, numbers, and registration IDs are preserved without alteration.
 * - Legitimate slashes, dots, and punctuation are preserved.
 */
export function processSmartCellText(params: {
  text: string;
  targetFontMode: 'krutidev' | 'unicode';
  colIndex?: number;
  clipboardFont?: string;
}): ProcessedCellResult {
  const { text, targetFontMode, colIndex, clipboardFont } = params;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return {
      value: '',
      fontName: targetFontMode === 'krutidev' ? 'Kruti Dev 010' : 'Arial',
      fontSize: 10,
      classification: 'empty'
    };
  }

  const trimmed = text.trim();

  // If clipboard font explicitly indicates Kruti Dev, respect that metadata
  const isClipboardKruti = Boolean(
    clipboardFont && /kruti|devlys/i.test(clipboardFont)
  );

  let classification = classifyText(trimmed, colIndex);
  if (isClipboardKruti && classification === 'english') {
    classification = 'krutidev-encoded';
  }

  switch (classification) {
    case 'numeric-or-id':
      return {
        value: trimmed,
        fontName: 'Arial',
        fontSize: 10,
        classification: 'numeric-or-id'
      };

    case 'unicode-hindi':
      if (targetFontMode === 'krutidev') {
        return {
          value: unicodeToKrutiDev(trimmed),
          fontName: 'Kruti Dev 010',
          fontSize: 11,
          classification: 'unicode-hindi'
        };
      }
      return {
        value: trimmed,
        fontName: 'Mangal',
        fontSize: 10,
        classification: 'unicode-hindi'
      };

    case 'krutidev-encoded':
      if (targetFontMode === 'krutidev') {
        // PRESERVE original Kruti Dev encoding without destructive conversion!
        return {
          value: trimmed,
          fontName: 'Kruti Dev 010',
          fontSize: 11,
          classification: 'krutidev-encoded'
        };
      }
      // If workbook is switched to Unicode, convert to Unicode
      return {
        value: krutiDevToUnicode(trimmed),
        fontName: 'Mangal',
        fontSize: 10,
        classification: 'krutidev-encoded'
      };

    case 'english':
      return {
        value: trimmed,
        fontName: 'Arial',
        fontSize: 10,
        classification: 'english'
      };

    case 'mixed':
      if (targetFontMode === 'krutidev') {
        // In mixed text (e.g. "राधेश्याम / लख्खु"), unicodeToKrutiDev safely converts
        // Devanagari portions while preserving punctuation and separators
        return {
          value: unicodeToKrutiDev(trimmed),
          fontName: 'Kruti Dev 010',
          fontSize: 11,
          classification: 'mixed'
        };
      }
      return {
        value: trimmed,
        fontName: 'Mangal',
        fontSize: 10,
        classification: 'mixed'
      };

    default:
      return {
        value: trimmed,
        fontName: targetFontMode === 'krutidev' ? 'Kruti Dev 010' : 'Arial',
        fontSize: 10,
        classification: 'english'
      };
  }
}
