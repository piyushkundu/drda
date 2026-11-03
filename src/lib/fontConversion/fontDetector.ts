/**
 * Helper to detect whether a string contains Unicode Devanagari characters
 */
export function isDevanagariUnicode(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Helper to detect whether an ASCII string is likely Kruti Dev 010 encoded text.
 * Kruti Dev text consists of ASCII letters and punctuation representing Hindi glyphs
 * (e.g. 'cyohj' for बलवीर, 'osxjkt' for वेगराज, 'pUnk' for चन्दा, 'dk;Z' for कार्य).
 */
export function isLikelyKrutiDev(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // If it already contains Devanagari Unicode code points, it is NOT Kruti Dev ASCII
  if (/[\u0900-\u097F]/.test(trimmed)) return false;

  // Pure digits, registration IDs (e.g. 31651001478), phone numbers, or dates (12/09/2026) are not Kruti text
  if (/^[\d\s\-\/\.,:;]+$/.test(trimmed)) return false;

  // Known English words that appear in the app shouldn't be treated as Kruti Dev
  const commonEnglishWords = new Set(['baghpat', 'baraut', 'male', 'female', 'nsap', 'all', 'true', 'false']);
  if (commonEnglishWords.has(trimmed.toLowerCase())) return false;

  // Typical Kruti Dev signatures (frequently occurring character combinations)
  // 'k' (aa ki matra), 'h' (chhoti ee ki matra), 's' (e ki matra), 'S' (ai ki matra),
  // 'Z' (reph), 'a' (anuswar), 'u' (na), 'r' (ta), 'd' (ka), 'x' (ga), 'j' (ra), etc.
  return /[a-zA-Z~@#$%^&*_+<>?/;'{}[\]]/.test(trimmed);
}
