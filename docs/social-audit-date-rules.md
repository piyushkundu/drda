# सोशल ऑडिट में तारीख और सम्पन्न स्थिति

7 नवम्बर 2026 को लागू नियम:

- पहले से उपयोग हो रही 7 नवम्बर 2026 तक की historical progress बरकरार है। यह सीमा `LEGACY_COMPLETION_THROUGH` में स्पष्ट है; हर दिन आगे नहीं बढ़ती।
- इस सीमा के बाद की बैठक तभी सम्पन्न गिनी जाती है जब उसका status उपयोगकर्ता ने `completed` किया हो। नियत तारीख बीतना पर्याप्त नहीं है।
- संशोधित बैठक में नई effective meeting date लागू होती है।
- Future reporting date से actual progress वास्तविक IST तारीख के आगे नहीं जाती। भविष्य की बैठक को पहले से completed mark करना भी client/store में रोका जाता है; existing server check भी बना रहता है।
- Future view से manually completion/cancellation करने पर दर्ज तारीख वास्तविक तारीख से आगे नहीं लिखी जाती।
- प्रस्तावित roster का count चयनित reporting date के अनुसार ही चलता है। इसलिए future view में proposed और completed counts अलग हो सकते हैं।
- MIS, पंचायत निर्णय और NSAP की recorded work dates भी वास्तविक तारीख तक सीमित रहती हैं।
- पुरानी date पर edit warning और Cancel protection जारी हैं।

ये गणना के नियम हैं। Existing official records को migrate या overwrite नहीं किया गया है।

Verification: `node scripts/test_social_audit_asof.cjs`। यह Firebase और browser storage को mock करके dashboard card, Excel export, future-date gating और cancelled edits की जाँच करता है।
