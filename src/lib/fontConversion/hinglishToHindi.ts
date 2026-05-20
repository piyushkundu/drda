// ============================================
// Hinglish to Hindi (Unicode) Transliteration
// ============================================
// Maps Roman/Hinglish text to Devanagari Unicode

const consonantMap: Record<string, string> = {
  'ksh': 'क्ष', 'gya': 'ज्ञ', 'gny': 'ज्ञ',
  'shh': 'ष', 'shr': 'श्र',
  'kh': 'ख', 'gh': 'घ', 'ch': 'च', 'chh': 'छ',
  'jh': 'झ', 'th': 'थ', 'dh': 'ध', 'ph': 'फ',
  'bh': 'भ', 'sh': 'श', 'ng': 'ं',
  'k': 'क', 'g': 'ग', 'c': 'च', 'j': 'ज',
  't': 'त', 'd': 'द', 'n': 'न', 'p': 'प',
  'f': 'फ', 'b': 'ब', 'm': 'म', 'y': 'य',
  'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
  's': 'स', 'h': 'ह', 'q': 'क़', 'x': 'क्स',
  'z': 'ज़',
};

const vowelMap: Record<string, string> = {
  'aa': 'ा', 'ee': 'ी', 'oo': 'ू', 'ai': 'ै',
  'ei': 'ै', 'au': 'ौ', 'ou': 'ौ',
  'a': 'ा', 'i': 'ि', 'u': 'ु', 'e': 'े', 'o': 'ो',
};

const independentVowelMap: Record<string, string> = {
  'aa': 'आ', 'ee': 'ई', 'oo': 'ऊ', 'ai': 'ऐ',
  'ei': 'ऐ', 'au': 'औ', 'ou': 'औ',
  'a': 'अ', 'i': 'इ', 'u': 'उ', 'e': 'ए', 'o': 'ओ',
};

const vowelKeys = ['aa', 'ee', 'oo', 'ai', 'ei', 'au', 'ou', 'a', 'i', 'u', 'e', 'o'];
const consonantKeys = [
  'ksh', 'gya', 'gny', 'shh', 'shr', 'shr',
  'kh', 'gh', 'chh', 'ch', 'jh', 'th', 'dh', 'ph', 'bh', 'sh', 'ng',
  'k', 'g', 'c', 'j', 't', 'd', 'n', 'p', 'f', 'b', 'm',
  'y', 'r', 'l', 'v', 'w', 's', 'h', 'q', 'x', 'z',
];

export function hinglishToHindi(text: string): string {
  if (!text) return '';

  const words = text.split(/(\s+|[,.;:!?।\-\(\)\[\]{}'"]+)/);
  return words.map(word => {
    if (/^\s+$/.test(word) || /^[,.;:!?।\-\(\)\[\]{}'"]+$/.test(word)) {
      return word;
    }
    return transliterateWord(word.toLowerCase());
  }).join('');
}

function transliterateWord(word: string): string {
  let result = '';
  let i = 0;
  let lastWasConsonant = false;

  while (i < word.length) {
    let matched = false;

    // Try consonants first (longest match)
    for (const key of consonantKeys) {
      if (word.substring(i, i + key.length) === key) {
        if (lastWasConsonant) {
          result += '्'; // Add virama between consecutive consonants
        }
        result += consonantMap[key];
        i += key.length;
        lastWasConsonant = true;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Try vowels
      for (const key of vowelKeys) {
        if (word.substring(i, i + key.length) === key) {
          if (lastWasConsonant) {
            // Add matra (dependent vowel)
            if (key === 'a') {
              // 'a' is inherent, don't add matra
            } else {
              result += vowelMap[key];
            }
          } else {
            // Independent vowel
            result += independentVowelMap[key];
          }
          i += key.length;
          lastWasConsonant = false;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Pass through any unrecognized character
      if (lastWasConsonant && /[^a-z]/.test(word[i])) {
        lastWasConsonant = false;
      }
      result += word[i];
      i++;
      lastWasConsonant = false;
    }
  }

  // If word ends with a consonant, add implicit 'a' (no virama needed in display)
  return result;
}

export default hinglishToHindi;
