const { unicodeToKrutiDev } = require('./src/lib/fontConversion/unicodeToKrutiDev.ts');
const { hinglishToHindi } = require('./src/lib/fontConversion/hinglishToHindi.ts');
const { krutiDevToUnicode } = require('./src/lib/fontConversion/krutiDevToUnicode.ts');

console.log("mukhya ->", hinglishToHindi("mukhya"));
console.log("vriddhi ->", hinglishToHindi("vriddhi"));

console.log("मुख्य ->", unicodeToKrutiDev("मुख्य"));
console.log("वृद्धि ->", unicodeToKrutiDev("वृद्धि"));

console.log("eq[; ->", krutiDevToUnicode("eq[;"));
console.log("o`f) ->", krutiDevToUnicode("o`f)"));
