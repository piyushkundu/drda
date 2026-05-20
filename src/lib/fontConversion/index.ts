// ============================================
// Unified Font Conversion API
// ============================================

import { krutiDevToUnicode } from './krutiDevToUnicode';
import { unicodeToKrutiDev } from './unicodeToKrutiDev';
import { hinglishToHindi } from './hinglishToHindi';
import type { FontConversionType } from '@/types';

export { krutiDevToUnicode, unicodeToKrutiDev, hinglishToHindi };

export function convertFont(text: string, type: FontConversionType): string {
  switch (type) {
    case 'krutidev-to-unicode':
    case 'krutidev-to-mangal':
      return krutiDevToUnicode(text);

    case 'unicode-to-krutidev':
    case 'mangal-to-krutidev':
      return unicodeToKrutiDev(text);

    case 'hinglish-to-unicode':
      return hinglishToHindi(text);

    case 'hinglish-to-krutidev':
      return unicodeToKrutiDev(hinglishToHindi(text));

    default:
      return text;
  }
}

export const conversionOptions: { value: FontConversionType; label: string; labelHindi: string }[] = [
  { value: 'hinglish-to-unicode', label: 'Hinglish → Unicode Hindi', labelHindi: 'हिंग्लिश → यूनिकोड हिंदी' },
  { value: 'hinglish-to-krutidev', label: 'Hinglish → Kruti Dev 010', labelHindi: 'हिंग्लिश → कृतिदेव 010' },
  { value: 'unicode-to-krutidev', label: 'Unicode → Kruti Dev 010', labelHindi: 'यूनिकोड → कृतिदेव 010' },
  { value: 'krutidev-to-unicode', label: 'Kruti Dev → Unicode', labelHindi: 'कृतिदेव → यूनिकोड' },
  { value: 'mangal-to-krutidev', label: 'Mangal → Kruti Dev', labelHindi: 'मंगल → कृतिदेव' },
  { value: 'krutidev-to-mangal', label: 'Kruti Dev → Mangal', labelHindi: 'कृतिदेव → मंगल' },
];
