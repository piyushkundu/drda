/**
 * Normalizes Kruti Dev 010 ASCII text to prevent common typewriter/Remington keyboard glitches:
 * - Fixes typewriter Remington forward slash '/' mistaken for 'è' (half/full dha - ध/ध्)
 * - Fixes misplaced chhoti-ee matra after anuswara ('cqafUn;k' -> 'cqfUn;k')
 * - Preserves actual separators (e.g. ' @ ' or ' / ' with spaces)
 */
export function normalizeKrutiDevText(text: string): string {
  if (!text) return '';
  let str = text;

  // 1. /k -> èk (ध)
  str = str.replace(/\/k/g, 'èk');
  // 2. / at word start followed by consonant/matra: /keZ -> èkeZ, /kU -> èkU
  str = str.replace(/(^|\s)\/([a-zA-Z~@#$%^&*_+`])/g, '$1è$2');
  // 3. / preceded by letters (fo/k -> foèk, jk/k -> jkèk, es/k -> esèk, cy/k -> cyèk, cq/k -> cqèk)
  str = str.replace(/([a-zA-Z])\/([a-zA-Z])/g, '$1è$2');
  str = str.replace(/([a-zA-Z])\/(\s|$)/g, '$1èk$2');

  // 4. Fix misplaced chhoti-ee matra after anuswar: cqafUn;k -> cqfUn;k
  str = str.replace(/cqafUn;k/g, 'cqfUn;k');
  str = str.replace(/([a-zA-Z])qaf/g, '$1qfa');
  str = str.replace(/([a-zA-Z])af/g, '$1fa');

  return str;
}
