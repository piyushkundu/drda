// ============================================================
// Hindi Phonetic Keyboard — direct key → Devanagari mapping
// ============================================================
// No buffer needed. State machine tracks last was consonant.

export type PhoneticMode = 'mangal' | 'krutidev';

// Vowels: independent form + matra form (after consonant)
export const VOWEL_MAP: Record<string, { ind: string; matra: string }> = {
  'a': { ind: 'अ',  matra: '' },      // inherent 'a' — no matra
  'A': { ind: 'आ', matra: 'ा' },
  'i': { ind: 'इ',  matra: 'ि' },
  'I': { ind: 'ई',  matra: 'ी' },
  'u': { ind: 'उ',  matra: 'ु' },
  'U': { ind: 'ऊ',  matra: 'ू' },
  'e': { ind: 'ए',  matra: 'े' },
  'E': { ind: 'ऐ',  matra: 'ै' },
  'o': { ind: 'ओ',  matra: 'ो' },
  'O': { ind: 'औ',  matra: 'ौ' },
  'M': { ind: 'ं',  matra: 'ं' },    // anusvara
  'H': { ind: 'ः',  matra: 'ः' },    // visarga
  '^': { ind: 'ँ',  matra: 'ँ' },    // chandrabindu
};

// Consonants (single key)
export const CONSONANT_MAP: Record<string, string> = {
  'k': 'क', 'K': 'ख',  // k → क, K → ख
  'g': 'ग', 'G': 'घ',
  'c': 'च', 'C': 'छ',
  'j': 'ज', 'J': 'झ',
  't': 'त', 'T': 'ट',
  'd': 'द', 'D': 'ड',
  'n': 'न', 'N': 'ण',
  'p': 'प', 'P': 'फ',
  'b': 'ब', 'B': 'भ',
  'm': 'म',
  'y': 'य',
  'r': 'र', 'R': 'ड़',
  'l': 'ल', 'L': 'ळ',
  'v': 'व', 'w': 'व',
  's': 'स', 'S': 'श',
  'h': 'ह',
  'f': 'फ़', 'q': 'क़',
  'z': 'ज़', 'Z': 'ऴ',
  'x': 'क्ष', 'X': 'ज्ञ',
  '@': 'ऋ',
};

// Special characters
export const SPECIAL_MAP: Record<string, string> = {
  '|':  '।',   // purna viram
  '\\': '्',   // halant / virama (manual)
  '~':  '़',   // nukta
  '`':  '॰',   // abbreviation sign
};

// Keys that reset consonant state
const RESET_KEYS = new Set([' ', 'Enter', 'Tab', 'Escape']);

// Keys to pass through completely (numbers, Ctrl combos, etc.)
const PASSTHROUGH_RE = /^[0-9.,;:!?'"()\[\]{}\-_+=<>/%*&#$@]$/;

export class HindiKeyboard {
  lastWasConsonant = false;

  reset() { this.lastWasConsonant = false; }

  /**
   * Process a keydown event.
   * Returns { text } to insert, or null to let the key pass through.
   * deleteCount: how many previously inserted chars to delete before inserting.
   */
  processKey(key: string): { text: string } | null {
    if (key.length !== 1) return null;

    // Ignore pass-through chars
    if (PASSTHROUGH_RE.test(key)) {
      this.lastWasConsonant = false;
      return null;
    }

    // Reset keys
    if (RESET_KEYS.has(key)) {
      this.lastWasConsonant = false;
      return null;
    }

    // Special chars (। etc.)
    if (SPECIAL_MAP[key] !== undefined) {
      this.lastWasConsonant = false;
      return { text: SPECIAL_MAP[key] };
    }

    // Vowel
    const vowel = VOWEL_MAP[key];
    if (vowel !== undefined) {
      const text = this.lastWasConsonant ? vowel.matra : vowel.ind;
      this.lastWasConsonant = false;
      // For inherent 'a' after consonant, nothing to insert — just reset state
      if (this.lastWasConsonant === false && key === 'a' && text === '') {
        return { text: '' }; // handled: consume key, insert nothing
      }
      return text !== '' ? { text } : { text: '' };
    }

    // Consonant
    const consonant = CONSONANT_MAP[key];
    if (consonant !== undefined) {
      let text = consonant;
      if (this.lastWasConsonant) {
        // Conjunct: add virama before new consonant
        text = '्' + consonant;
      }
      this.lastWasConsonant = true;
      return { text };
    }

    // Unknown key — pass through
    this.lastWasConsonant = false;
    return null;
  }
}
