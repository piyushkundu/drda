// ============================================
// Context Pairs & Frequency Data for Auto-Suggestion
// ============================================
// Bigram context pairs: when user types word A, suggest word B
// Frequency scores: higher = more commonly used (used for ranking)

export interface ContextPair {
  trigger: string;   // Word(s) that trigger the suggestion
  next: string[];    // Most likely next words, ordered by probability
}

// ══════════════════════════════════════════════
// Bigram Context Pairs — Government Hindi
// ══════════════════════════════════════════════
export const contextPairs: ContextPair[] = [
  // Letter openings
  { trigger: 'सेवा', next: ['में,', 'में'] },
  { trigger: 'सेवा में', next: ['महोदय,', 'श्रीमान'] },
  { trigger: 'कृपया', next: ['अवगत', 'ध्यान', 'सुनिश्चित', 'उपरोक्त'] },
  { trigger: 'कृपया अवगत', next: ['करने', 'होने', 'कराने'] },
  { trigger: 'कृपया अवगत होने', next: ['का'] },
  { trigger: 'कृपया अवगत होने का', next: ['कष्ट'] },
  { trigger: 'कृपया अवगत होने का कष्ट', next: ['करें।'] },
  { trigger: 'कृपया उपरोक्त', next: ['विषयक', 'विषय'] },
  { trigger: 'अवगत', next: ['कराया', 'कराने', 'करने', 'होने'] },
  { trigger: 'अवगत कराया', next: ['जाता', 'गया'] },
  { trigger: 'अवगत कराया जाता', next: ['है'] },
  { trigger: 'निर्देशित', next: ['किया'] },
  { trigger: 'निर्देशित किया', next: ['जाता'] },
  { trigger: 'निर्देशित किया जाता', next: ['है'] },
  { trigger: 'सविनय', next: ['निवेदन'] },
  { trigger: 'सविनय निवेदन', next: ['है'] },
  { trigger: 'सविनय निवेदन है', next: ['कि'] },
  
  // Action phrases
  { trigger: 'किया', next: ['जाता', 'गया', 'जा', 'जाए', 'जाये'] },
  { trigger: 'किया जाता', next: ['है', 'है।'] },
  { trigger: 'किया गया', next: ['है', 'है।', 'था'] },
  { trigger: 'किया जा', next: ['रहा', 'चुका', 'सकता'] },
  { trigger: 'किया जा रहा', next: ['है', 'है।'] },
  { trigger: 'कराया', next: ['गया', 'जा', 'जाता'] },
  { trigger: 'कराया गया', next: ['है', 'है।'] },
  { trigger: 'कराया जा', next: ['रहा', 'चुका'] },
  { trigger: 'कराया जा रहा', next: ['है', 'है।'] },
  { trigger: 'प्रेषित', next: ['की', 'किया', 'करने'] },
  { trigger: 'प्रेषित की', next: ['जाती'] },
  { trigger: 'प्रेषित की जाती', next: ['है', 'है।'] },
  { trigger: 'प्रेषित किया', next: ['जाता'] },
  { trigger: 'प्रेषित किया जाता', next: ['है', 'है।'] },
  
  // Postposition phrases
  { trigger: 'के', next: ['सम्बन्ध', 'संबंध', 'अंतर्गत', 'तहत', 'माध्यम', 'विषय', 'अनुसार', 'द्वारा', 'लिए', 'लिये', 'क्रम', 'सापेक्ष'] },
  { trigger: 'के सम्बन्ध', next: ['में', 'में।'] },
  { trigger: 'के संबंध', next: ['में', 'में।'] },
  { trigger: 'के अंतर्गत', next: ['कार्यवाही', 'आवंटित', 'स्वीकृत'] },
  { trigger: 'के माध्यम', next: ['से'] },
  { trigger: 'के विषय', next: ['में'] },
  { trigger: 'के अनुसार', next: ['कार्यवाही', 'आवश्यक'] },
  { trigger: 'के क्रम', next: ['में', 'में।'] },
  
  // Complaint phrases
  { trigger: 'शिकायत', next: ['संख्या', 'का', 'की', 'निस्तारण', 'निवारण', 'पंजीकरण', 'प्राप्त'] },
  { trigger: 'शिकायत का', next: ['निस्तारण', 'निवारण'] },
  { trigger: 'शिकायत निस्तारण', next: ['किया', 'कर', 'करने'] },
  { trigger: 'उक्त', next: ['शिकायत', 'विषय', 'संदर्भ', 'के'] },
  { trigger: 'उक्त शिकायत', next: ['की', 'का'] },
  { trigger: 'उक्त शिकायत की', next: ['जाँच', 'जांच'] },
  
  // Closing phrases
  { trigger: 'सलग्न', next: ['जाँच', 'जांच'] },
  { trigger: 'सलग्न जाँच', next: ['आख्या।', 'आख्या'] },
  { trigger: 'सलग्न जांच', next: ['आख्या।', 'आख्या'] },
  { trigger: 'संलग्न:', next: ['ATR', 'प्रतिलिपि'] },
  
  // Pratilipi phrases
  { trigger: 'प्रतिलिपि', next: [':-', ':', 'सूचनार्थ'] },
  { trigger: 'सादर', next: ['सूचनार्थ', 'अवलोकनार्थ'] },
  { trigger: 'सादर सूचनार्थ', next: ['प्रेषित।', 'प्रेषित', 'एवं'] },
  { trigger: 'सादर अवलोकनार्थ', next: ['प्रेषित।', 'प्रेषित', 'एवं'] },
  { trigger: 'सादर अवलोकनार्थ एवं', next: ['सूचनार्थ'] },
  { trigger: 'सादर अवलोकनार्थ एवं सूचनार्थ', next: ['प्रेषित।'] },
  
  // Common sentence starters
  { trigger: 'आपको', next: ['निर्देशित', 'सूचित', 'अवगत'] },
  { trigger: 'आपको निर्देशित', next: ['किया'] },
  { trigger: 'एतद्द्वारा', next: ['सूचित'] },
  { trigger: 'एतद्द्वारा सूचित', next: ['किया'] },
  { trigger: 'एतद्द्वारा सूचित किया', next: ['जाता'] },
  { trigger: 'एतद्द्वारा सूचित किया जाता', next: ['है'] },
  
  // Common verbs
  { trigger: 'करने', next: ['का', 'की', 'के', 'हेतु'] },
  { trigger: 'करने का', next: ['कष्ट', 'निर्देश'] },
  { trigger: 'करने का कष्ट', next: ['करें।', 'करें'] },
  { trigger: 'कार्यवाही', next: ['पूर्ण', 'प्रगति', 'की', 'करें', 'करने', 'सुनिश्चित'] },
  { trigger: 'कार्यवाही पूर्ण', next: ['कर', 'करने'] },
  { trigger: 'कार्यवाही पूर्ण कर', next: ['ली'] },
  { trigger: 'कार्यवाही प्रगति', next: ['पर'] },
  { trigger: 'कार्यवाही प्रगति पर', next: ['है', 'है।'] },
  
  // General queries
  { trigger: 'क्या', next: ['कर', 'हुआ', 'है'] },
  { trigger: 'क्या कर', next: ['रहे', 'रहा', 'रही'] },
  { trigger: 'क्या कर रहे', next: ['हैं', 'हैं।'] },
  { trigger: 'क्या कर रही', next: ['है', 'है।'] },
  { trigger: 'क्या कर रहा', next: ['है', 'है।'] },
  
  // Subject phrases
  { trigger: 'विषय', next: [':', '—'] },
  { trigger: 'संदर्भ', next: [':', '—'] },
  { trigger: 'पत्रांक', next: [':'] },
  { trigger: 'दिनांक', next: [':'] },
  
  // Social audit
  { trigger: 'सामाजिक', next: ['अंकेक्षण', 'सुरक्षा', 'कल्याण', 'न्याय'] },
  { trigger: 'सामाजिक अंकेक्षण', next: ['बैठक', 'दल', 'प्रगति', 'रिपोर्ट'] },
  { trigger: 'सोशल', next: ['ऑडिट'] },
  { trigger: 'सोशल ऑडिट', next: ['टीम', 'प्रगति', 'रिपोर्ट'] },
  
  // Numbers/finance
  { trigger: 'वित्तीय', next: ['वर्ष', 'अनियमितता', 'सहायता'] },
  { trigger: 'वित्तीय वर्ष', next: ['2024-25', '2025-26', '2026-27'] },
  { trigger: 'भुगतान', next: ['किया', 'लम्बित', 'प्रक्रियाधीन'] },
  { trigger: 'भुगतान किया', next: ['जा', 'गया'] },
  { trigger: 'भुगतान किया जा', next: ['चुका'] },
  { trigger: 'भुगतान किया जा चुका', next: ['है', 'है।'] },
  
  // MGNREGA terms
  { trigger: 'मनरेगा', next: ['योजना', 'के', 'अंतर्गत'] },
  { trigger: 'ग्राम', next: ['पंचायत', 'सभा', 'प्रधान', 'सचिव', 'विकास'] },
  { trigger: 'ग्राम पंचायत', next: ['में', 'के', 'की'] },
  { trigger: 'ग्राम सभा', next: ['में', 'की', 'का'] },
  
  // Common connectors
  { trigger: 'अतः', next: ['शिकायत', 'कृपया', 'आपसे', 'उपर्युक्त'] },
  { trigger: 'इसलिए', next: ['आपसे', 'कृपया', 'यह'] },
  { trigger: 'तत्काल', next: ['प्रभाव', 'कार्यवाही', 'निस्तारण'] },
  { trigger: 'तत्काल प्रभाव', next: ['से'] },
  
  // Designations
  { trigger: 'परियोजना', next: ['निदेशक', 'निदेशक,', 'अधिकारी'] },
  { trigger: 'जिला', next: ['ग्राम्य', 'ग्रामीण', 'विकास', 'पंचायत', 'अधिकारी', 'मजिस्ट्रेट'] },
  { trigger: 'जिला ग्राम्य', next: ['विकास'] },
  { trigger: 'जिला ग्राम्य विकास', next: ['अभिकरण'] },
  { trigger: 'जिला विकास', next: ['अधिकारी', 'अधिकारी,'] },
  { trigger: 'मुख्य', next: ['विकास', 'सचिव', 'मंत्री'] },
  { trigger: 'मुख्य विकास', next: ['अधिकारी', 'अधिकारी,'] },
  { trigger: 'खण्ड', next: ['विकास'] },
  { trigger: 'खण्ड विकास', next: ['अधिकारी', 'अधिकारी,'] },
];

// ══════════════════════════════════════════════
// Context Pair Lookup (efficient)
// ══════════════════════════════════════════════
const contextMap = new Map<string, string[]>();

for (const pair of contextPairs) {
  contextMap.set(pair.trigger, pair.next);
}

/**
 * Get next-word suggestions based on context (bigram/trigram/n-gram)
 * Returns the most likely next words for the given context
 */
export function getContextSuggestions(text: string, limit = 5): string[] {
  if (!text || text.trim() === '') return [];
  
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];
  
  // Try longest match first (5-gram → 4-gram → trigram → bigram → unigram)
  for (let i = Math.min(words.length, 6); i >= 1; i--) {
    const phrase = words.slice(-i).join(' ');
    const suggestions = contextMap.get(phrase);
    if (suggestions && suggestions.length > 0) {
      return suggestions.slice(0, limit);
    }
  }
  
  return [];
}

// ══════════════════════════════════════════════
// Frequency-ranked single-word suggestions
// ══════════════════════════════════════════════
// Higher number = more frequently used (used for sorting)
const wordFrequency: Map<string, number> = new Map([
  // Ultra-high frequency (100+)
  ['है', 200], ['हैं', 190], ['में', 180], ['के', 175], ['की', 170],
  ['का', 165], ['को', 160], ['से', 155], ['पर', 150], ['और', 145],
  ['एवं', 140], ['तथा', 135], ['या', 130], ['कि', 125], ['यह', 120],
  ['वह', 115], ['जो', 110], ['तो', 105], ['भी', 100],
  
  // High frequency (50-99)
  ['किया', 95], ['गया', 93], ['जाता', 91], ['करने', 89],
  ['होने', 87], ['करें', 85], ['अवगत', 83], ['कराया', 81],
  ['निर्देशित', 79], ['सूचित', 77], ['कार्यवाही', 75],
  ['प्रेषित', 73], ['निस्तारण', 71], ['सम्बन्ध', 69],
  ['संबंध', 67], ['विषय', 65], ['अंतर्गत', 63],
  ['अनुसार', 61], ['हेतु', 59], ['कृपया', 57],
  ['सादर', 55], ['संलग्न', 53], ['प्रतिलिपि', 51],
  
  // Medium frequency (20-49)
  ['शिकायत', 48], ['जांच', 46], ['जाँच', 44],
  ['आख्या', 42], ['रिपोर्ट', 40], ['विवरण', 38],
  ['बैठक', 36], ['निर्णय', 34], ['आदेश', 32],
  ['पत्र', 30], ['सूचना', 28], ['योजना', 26],
  ['विकास', 24], ['अधिकारी', 22], ['कर्मचारी', 20],
  
  // Low-medium frequency (10-19)
  ['ग्राम', 18], ['पंचायत', 17], ['जिला', 16],
  ['तहसील', 15], ['ब्लॉक', 14], ['नगर', 13],
  ['बागपत', 12], ['प्रदेश', 11], ['उत्तर', 10],
]);

/**
 * Get the frequency score for a word (higher = more common)
 * Returns 1 for unknown words
 */
export function getWordFrequency(word: string): number {
  return wordFrequency.get(word) || 1;
}
