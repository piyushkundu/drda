const fs = require('fs');
const map = JSON.parse(fs.readFileSync('inverted_map.json'));
const out = `// Auto-generated Unicode to Krutidev Map
export const unicodeToKrutiDevMap: [string, string][] = [
${map.map(x => `  [${JSON.stringify(x[0])}, ${JSON.stringify(x[1])}]`).join(',\n')}
];

export function unicodeToKrutiDev(text: string): string {
  if (!text) return '';
  // Pre-process: Move ि matra before its consonant (reverse of Unicode order)
  let processed = text.replace(/([\u0900-\u097F](?:्[\u0900-\u097F])*)ि/g, 'ि$1');
  let result = '';
  let i = 0;
  while (i < processed.length) {
    let matched = false;
    for (const [uni, kru] of unicodeToKrutiDevMap) {
      if (processed.substring(i, i + uni.length) === uni) {
        result += kru;
        i += uni.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += processed[i];
      i++;
    }
  }
  return result;
}

export default unicodeToKrutiDev;`;

fs.writeFileSync('src/lib/fontConversion/unicodeToKrutiDev.ts', out);
