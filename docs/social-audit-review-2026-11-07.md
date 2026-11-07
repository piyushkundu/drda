# बागपत सोशल ऑडिट परियोजना की जाँच

जाँच दिनांक: 7 नवम्बर 2026, भारतीय समय।

**निष्कर्ष: अभी dashboard, monthly reports और workbook saving को पूरी तरह सही मानना उचित नहीं है।** मूल calendar का मिलान अच्छा है, लेकिन live NSAP data में असंगतियाँ, completion की अलग-अलग परिभाषाएँ, अधूरे report exports और workbook में data खोने/गलत GP से जुड़ने वाले reproducible bugs मिले हैं।

इस जाँच में production source code, original Excel files, browser storage या Firestore records नहीं बदले गए। Firestore के लिए केवल SDK का `getDocFromServer` उपयोग किया। परीक्षणों में अलग in-memory fixtures और mocked persistence उपयोग हुए। परियोजना में पहले से बदली हुई `UpcomingMeetingsImageModal.tsx` को नहीं छुआ गया।

## 1. किन स्रोतों को जाँचा

- Local source: `src/components/socialAudit`, social audit Zustand store, types, validation, date resolution, Firebase persistence और social audit API routes।
- Live Firebase document: `socialAudit/baghpat-2026-27`। पढ़े गए document का `updatedAt`: `2026-11-06T10:29:17.128Z` अर्थात 6 नवम्बर 2026, 15:59:17 IST। यह उस समय का snapshot है, हर भविष्य के बदलाव का प्रमाण नहीं।
- Original workbook: `social audit/Social_Audit_calander 2026.xlsx`, दोनों sheets।
- Original workbook: `social audit/वृद्धावस्था पेंशनपारिवारिक सोशल ऑडिट रिपोर्ट.xlsx`, `Sheet1`।
- Report Center के नौ options का वास्तविक export handler isolated React hooks के साथ चलाया और बने XLSX को memory में दोबारा पढ़ा। यह browser में click/visual verification नहीं है।
- NSAP workbook builder/extractor का unchanged roundtrip, reordered sheets, बड़ी beneficiary list और cleared sheet पर परीक्षण।
- Meeting completion API handler को local process में malformed/unauthenticated requests देकर जाँचा। किसी deployed endpoint पर mutation नहीं भेजी गई।

Live browser interaction, actual PDF pagination, deployed Firestore write rules, restore drill और सभी beneficiaries के मूल signed records से मिलान नहीं हुआ। इसलिए यह हर नाम, registration number या वास्तविक meeting होने का स्वतंत्र प्रमाणन नहीं है।

## 2. जो सही मिला

| जाँच | परिणाम |
|---|---|
| Calendar में GP rows | 88, code baseline में भी 88 |
| Block split | बागपत 44, बड़ौत 44 |
| सभी 88 की मूल meeting/start dates | Original main sheet से baseline में मिलती हैं |
| Non-amended records के raw नाम, BRP, team, supervisor, venue, time, scheme | Original calendar से trim करने के बाद कोई अंतर नहीं मिला |
| Amendment sheet की 10 entries | मूल/नई date, BRP और team baseline से मिलती हैं |
| Original NSAP form, 08-10-2026 | FY प्रस्तावित 47, उस तारीख तक प्रस्तावित 11, सम्पन्न 11, संशोधित/निरस्त 0; helper का परिणाम इस source form से मिलता है |
| Live roster IDs और block के भीतर normalized GP names | जाँचे गए snapshot में duplicate नहीं मिले |
| Live NSAP के 19 GP links | सभी roster से जुड़े हैं, सही block और NSAP scheme से जुड़े हैं |
| Live NSAP meetingDate बनाम roster meetingDate | अभी दोनों में अंतर नहीं; लेकिन date overwrite का bug नीचे देखें |
| TypeScript | `npx tsc --noEmit --incremental false` पास |

Source calendar से match होना actual meeting completion का प्रमाण नहीं है। Original NSAP form का 8 अक्टूबर वाला verified historical aggregate महत्वपूर्ण है; बाद में status cleanup करते समय इस evidence को खोना नहीं चाहिए।

## 3. Live data की वर्तमान स्थिति

| माप | Stored value |
|---|---:|
| कुल roster GP | 88 |
| `scheduled` | 67 |
| `completed` | 11 |
| `amended` | 9 |
| `cancelled` | 1 |
| NSAP roster GP | 47 |
| MGNREGA roster GP | 88 |
| PMAY-G roster GP | 4 |
| NSAP detailed GP | 19 |
| NSAP कुल beneficiaries | 2,600 |
| प्रत्यक्ष सत्यापित | 1,815 |
| परिवार से सत्यापित | 332 |
| Stored कुल सत्यापित | 2,330 |
| दर्ज beneficiary detail rows | 340 |
| अपात्र detail rows | 74 |
| मृतक detail rows | 249 |
| असत्यापित detail rows | 17 |
| MIS `fed` | 50 |
| Nirnay `captured` | 17 |
| VRP members | 135 |
| Stored activity logs | 27 |

340 detail rows को सभी 2,600 beneficiaries की complete nominal list नहीं मानना चाहिए: उपलब्ध detailed records मुख्यतः exceptions/categories के हैं।

यह dataset दो blocks के उपलब्ध roster का है। इसे पूरे जनपद के सभी blocks/GP का पूर्ण master बताने से पहले district coverage की अलग पुष्टि चाहिए।

## 4. Live NSAP में reconciliation आवश्यक

| GP | कुल beneficiaries | प्रत्यक्ष | परिवार | Stored verified total | समस्या |
|---|---:|---:|---:|---:|---|
| फै. निनाना / फैजुल्लापुर निनाना | 201 | 193 | 193 | 386 | Verified total, total beneficiaries से 185 अधिक |
| चौबाली / चौबली | 82 | 0 | 0 | 65 | Direct + family = 0, लेकिन stored verified total 65 |
| गौरीपुरजवाहरनगर | 126 | 0 | 0 | 118 | Direct + family = 0, लेकिन stored verified total 118 |

पूरे dataset में direct + family = **2,147**, जबकि stored verified total = **2,330**। अंतर **183**, जो 65 + 118 है। फै. निनाना में अलग population/count inconsistency भी है। ये inconsistencies baseline और live दोनों में हैं। बिना मूल detailed verification register के सही संख्या तय नहीं की जा सकती। किसी missing breakdown को स्वतः zero मानकर verified totals घटाना भी गलत होगा।

बली में registration ID `31651001478` दो deceased rows में है: `ben-baghpat-5-dec-12` और `ben-baghpat-5-dec-22`। इससे death count एक अधिक हो सकता है। पहले source से तय हो कि duplicate row है या identifier की typing mistake; स्वतः delete नहीं करना चाहिए।

Detailed 19-GP beneficiary source register इन दो inspected original XLSX में नहीं है। Original NSAP XLSX summary form है। इसलिए इन तीन GP की corrections और duplicate की सच्चाई अभी source reconciliation items हैं।

## 5. सबसे जरूरी dashboard समस्या: तारीख बीतना और सम्पन्न होना एक मान लिया गया है

Evidence: `ExecutiveDashboardTab.tsx:149`, `dateResolution.ts:116`, `ReportCenterTab.tsx:57`, `nsapReportHelper.ts:36`।

- Dashboard completed = effective meeting date <= cutoff और status cancelled नहीं। Scheduled या postponed past meeting भी completed हो सकती है।
- उसी dashboard में due pending = वही past record जिसका status completed नहीं। इसलिए एक ही GP completed और pending दोनों में आ सकती है।
- Report Center और NSAP helper में completion के समय cancellation भी uniformly exclude नहीं होती।
- वास्तविक helper में past scheduled और past postponed fixtures दोनों completed बने। Cancelled NSAP fixture भी completed count में आया।

**7 नवम्बर के live snapshot पर** dashboard formula 56 completed गिनता है। Stored status में 11 completed हैं। Dashboard के 56 में से 45 का stored status completed नहीं है। तीन completed records में `completedDate` भी गायब है। इसका अर्थ यह नहीं कि वास्तव में केवल 11 meetings हुईं; इसका अर्थ है कि stored status/evidence और displayed metric reconcile नहीं हैं।

इसी तरह 50 MIS-fed records में 45 का meeting status completed नहीं है। Import/sync ने MIS और meeting lifecycle को अलग रखा है। केवल status बदलकर सभी को completed कर देना या 56 को 11 कर देना, दोनों source evidence के बिना गलत होंगे।

सुधार:

1. Planned date, actual meeting held date और record entry timestamp अलग रखें।
2. `प्रस्तावित`, `सम्पन्न सत्यापित`, `नियत तिथि बीती पर पुष्टि शेष`, `निरस्त`, `पुनर्निर्धारण शेष` स्पष्ट रखें। Categories का overlap न हो।
3. Historical source form से प्रमाणित aggregates को evidence/version सहित रखें। Legacy status backfill अलग reviewed migration हो।
4. एक shared calculation module dashboard, cards, drilldowns, PDF और Excel सब उपयोग करें।

## 6. Monthly reports अभी भरोसेमंद historical reports नहीं हैं

Evidence: `ExecutiveDashboardTab.tsx:165`, `ExecutiveDashboardTab.tsx:176`, `NSAPDataTab.tsx:269`, `NSAPReportTab.tsx:109`।

- Cutoff बदलने पर Nirnay/MIS counts current status से आते हैं; captured/fed date का cutoff consistently लागू नहीं है।
- 31 अक्टूबर report के लिए live snapshot में **3 Nirnay captures और 7 MIS feedings की dates 31 अक्टूबर के बाद** हैं; current-status counts इन्हें भी शामिल कर सकते हैं।
- 8 अक्टूबर चुनने पर 19 recorded NSAP GP में 8 की meeting dates उसके बाद की हैं; beneficiary aggregation सभी recorded GP जोड़ सकती है।
- Workbook extract हर processed GP का `recordedDate` अभी के timestamp से बदलता है। इसे original completion timestamp मानकर historical reports नहीं बन सकतीं।
- Report Center में monthly start/end, financial-year selector या monthly बनाम cumulative selector नहीं है।
- NSAP progress helper FY boundaries filter नहीं करता। अगले FY का synthetic record भी `totalProposedFY` में गिना गया।
- `31 दिसम्बर 2026 (वित्तीय वर्ष पूर्ण)` preset गलत अर्थ देता है। Calendar roster का समाप्त होना financial year समाप्त होना नहीं है।

जरूरी report controls:

| Control | अपेक्षित व्यवहार |
|---|---|
| FY | स्पष्ट शुरुआत और अंत; year बदलने पर पुराना data सुरक्षित |
| महीना | उसी महीने की गतिविधि और माह-अंत तक cumulative गतिविधि अलग |
| Cutoff | सभी relevant event dates पर समान रूप से लागू |
| Block / BRP / scheme | preview, KPI, drilldown, Excel, PDF में एक scope |
| Report state | Draft, verified, approved, revised |
| Archive | Approved monthly report immutable snapshot; correction नई revision |

Monthly operations report में opening pending, नई देय meetings, सम्पन्न, निरस्त, पुनर्निर्धारित, closing pending; Nirnay/MIS के opening pending, इस माह uploads और closing pending; NSAP में इस माह/संचयी GP, total/direct/family/verified/unverified, deceased/ineligible, irregularity और follow-up शामिल हों। सभी fields official template और source definitions से तय हों।

## 7. Report Center के नौ options की वास्तविक स्थिति

Evidence: `ReportCenterTab.tsx:173`, `ReportCenterTab.tsx:214`, `ReportCenterTab.tsx:221`, preview `:448`। Isolated export test में:

| Option | Excel में मिला | कमी |
|---|---|---|
| District summary | 2 block rows + total | Preview में फिर भी 88-GP master table; completion logic गलत |
| Block-wise | 2 block rows + total | Preview अलग report नहीं बनाता |
| GP master | 88 GP rows | Cancelled/not-eligible status ठीक से नहीं दिखते; पूर्ण master के सारे fields नहीं |
| BRP-wise | 5 BRP rows | Export `filteredRecords` के बजाय पूरे `records` से बनता है |
| Meeting progress | GP master जैसा | Separate cancelled/overdue/completion evidence नहीं |
| Panchayat Nirnay | Generic 88-GP table | Nirnay status/date/pendency columns भी नहीं |
| MIS feeding | Generic 88-GP table | MIS-specific fed/date/count/eligibility details नहीं |
| NSAP beneficiary | Generic 88-GP table | Beneficiaries, deceased, ineligible, counts नहीं |
| NSAP social audit monthly | Generic 88-GP table | Official NSAP monthly format नहीं; non-NSAP GP भी आती हैं |

Dedicated NSAP Report tab और 48-sheet NSAP workbook अलग implementations हैं। उनका होना Report Center के इन्हीं नामों वाले broken exports को सही नहीं बनाता।

Report Center में 16 GP / 2,234 beneficiaries और MIS 44/52 जैसी descriptions hardcoded हैं। Live snapshot में detailed NSAP 19 GP / 2,600 beneficiaries और MIS fed 50 हैं। सभी displayed totals current report dataset से आने चाहिए।

`window.print()` से PDF बनाना अपने आप में गलत नहीं, लेकिन report-specific print area, repeated headers, signatures और page breaks चाहिए। अभी final print layout का browser verification नहीं हुआ।

## 8. Workbook में data खोने या गलत GP से जुड़ने वाले bugs

Evidence: `workbook/nsapWorkbookService.ts:597`, `:630`, `:708`, `:720`।

| परीक्षण | परिणाम | असर |
|---|---|---|
| दो GP sheets reorder | GP-A का expected total 111; extraction में 222 | Sheet index से GP mapping; दूसरे GP का data लिख सकता है |
| 110 deceased beneficiary rows | Extraction में 95 बचीं | Row scan 100 तक capped; 15 rows silently छूटती हैं |
| Sheet की values पूरी clear | पुराने total 111 की जगह फिर 111 | Fallback map पुराने record को रखता है; clear persist नहीं होता |
| Baseline workbook खोलकर बिना edit extract | 13 GP meeting dates बदलती हैं | Extract NSAP की date के बजाय roster meetingDate लिखता है |
| वही unchanged extraction | सभी 19 GP IDs बदलते हैं | Stable identities और audit references टूट सकते हैं |
| वही extraction | recordedDate नया timestamp | Historical provenance बदलता है |

Live NSAP dates roster से match करती हैं, लेकिन baseline में 13 अलग NSAP dates हैं। मौजूदा code इस अंतर को बिना explicit date-edit overwrite करता है। Live dates इसी bug से बदली थीं, यह historical logs के बिना सिद्ध नहीं किया जा सकता। मूल/वास्तविक/रोस्टर dates की semantics तय करनी होंगी।

सुधार: immutable GP/sheet ID से matching, used rows की पूरी scan, ID preservation, explicit delete/clear semantics, enteredAt/updatedAt/actualMeetingDate अलग, numeric/duplicate validation और save से पहले diff preview। ये tests production fixes के regression tests बनें।

## 9. Reload पर verified edits बदलने का खतरा

Evidence: `socialAuditStore.ts:1462`, `:1476`, `:1491`, `:1542`।

- Browser storage rehydrate में कुछ beneficiary names baseline से वापस replace होते हैं।
- NSAP meetingDate और block भी baseline से overwrite होते हैं।
- Missing baseline GP फिर add होते हैं; intentional deletion और migration का अंतर नहीं है।
- Hardcoded captured GP IDs का status फिर captured बन सकता है।
- Missing MIS status के लिए fixed GP sets से fed/pending और meetingDate से feedingDate बन जाती है।

यह initial import के लिए useful रहा होगा, लेकिन regular reload को official data migration की तरह उपयोग नहीं करना चाहिए। Versioned explicit migrations हों; deleted records के tombstones और original evidence सुरक्षित हों।

## 10. Saving, multi-device और audit trail

Evidence: `socialAuditFirebase.ts:74`, `:91`, `:101`, `socialAuditStore.ts:234`, `:263`, `:286`, `NSAPWorkbook.tsx:743`।

- Workbook “cloud saved” local `setNsapRecords` के तुरंत बाद दिखाता है। Server acknowledgement await नहीं होता। Save fail होने पर भी success दिख सकती है।
- Firestore load failure और missing document दोनों `null` बनते हैं। Initialization इसे missing document मानकर local baseline seed करने का प्रयास कर सकती है। Save result false होने पर भी इस branch में synced दिखता है।
- सभी records, beneficiaries, VRPs और logs एक ही document पर full `setDoc` हैं। दो devices के stale edits बिना transaction/version precondition overwrite हो सकते हैं। `Date.now()` कोई concurrency lock नहीं है।
- Auto-merge/initial seed के कुछ save calls VRP argument नहीं भेजते। Sanitization undefined को null बनाती है; full-document replacement में VRP data मिटने का code path है।
- Debounced save के isolated test में दो calls पर सिर्फ बाद वाली Promise resolve हुई। पहले caller को completion नहीं मिला।
- Logs 200 तक truncate होते हैं। VRP actions की unbounded newest-first list पर Firestore का `slice(-200)` recent की बजाय older logs रख सकता है।
- Generic update logs में पूर्ण field-level before/after और authenticated actor identity नहीं है।

सुधार: load result में missing/error अलग; baseline seeding explicit controlled operation; real pending/saved/failed status; retry/outbox; record-level writes; server revision preconditions/transactions; durable append-only history; scheduled backups और restore verification।

## 11. Public read सही उद्देश्य है, write authorization अलग चाहिए

Evidence: `socialAuditAuth.ts:23`, `socialAuditStore.ts:205`, `api/social-audit/complete-meeting/route.ts:45`, `firestore.rules:12`।

- Default client user DDO है और `isAuthenticated: true` है। Project में Firebase sign-in/token verification implementation नहीं मिला। Edit switch वास्तविक login नहीं है।
- Local Firestore rules write को `request.auth != null` पर allow करती हैं; DDO/admin role या block ownership नहीं जाँचतीं। इन rules का deployed होना verify नहीं हुआ।
- Completion API client-supplied role/date लेती है। Role न भेजने पर भी request accept हुई; malformed desiredStatus और invalid calendar date पर भी 200 success मिला। यह route केवल verification response देता है, database update नहीं करता।
- Sync routes unauthenticated payload को process-memory variable में रखते हैं, public CORS के साथ; payload validation और durable per-user/per-run isolation नहीं है। Restart/multi-worker पर behavior स्थिर नहीं रहेगा।

Public data के लिए public read रखा जा सकता है। Writes के लिए वास्तविक authentication, server verified roles, scoped rules और server-side validation चाहिए। Local rules लागू हों और कोई external auth न हो तो legitimate cloud saves fail हो सकती हैं; deployed policy देखे बिना live unauthorized-write exposure का दावा नहीं किया जा सकता।

## 12. Dates और validation

- जौहड़ी: start `2026-11-18`, amended meeting `2026-11-13`।
- शाहपुर बड़ौली: start `2026-12-28`, amended meeting `2026-12-25`।

दोनों में नया meeting date original amendment sheet से और start date main sheet से match है। यह merged schedule में source reconciliation conflict है; मनमाने ढंग से start या meeting date बदलना उचित नहीं।

`validateDateString('2026-10-1.5')` स्वीकार हुई। Completion guard ने `2026-02-31` जैसी impossible date स्वीकार की। API ने भी `2020-02-31` स्वीकार की। सभी write/import routes में एक strict schema चाहिए: real ISO dates, valid enums, finite non-negative integer counts, unique GP/FY/scheme keys और beneficiary identifier checks। Unknown/missing को confirmed zero से अलग रखें।

## 13. Filters और coverage

- Dashboard में NSAP filtering BRP = all होने पर early return करती है। Block/date filters के बावजूद beneficiary totals सभी NSAP GP के रह सकते हैं। `ExecutiveDashboardTab.tsx:127`।
- NSAP Data tab में भी यही early return pattern है। `NSAPDataTab.tsx:189`।
- NSAP Report tab केवल global BRP पढ़ती है; dashboard के global block/date-range समान रूप से लागू नहीं होते।
- Nirnay pending calculation `pending` को गिनती है, `not_captured` को उसी pending bucket में नहीं रखती। Live में 38 `not_captured` records हैं। इस status का business meaning एक जगह तय होना चाहिए।
- `AuditBlock` और report rows केवल बागपत/बड़ौत hardcode करते हैं। नई block coverage के लिए master-driven configuration चाहिए।

## 14. जरूरी सुधारों का क्रम

### पहले data protection और reconciliation

1. Current dataset का dated backup और restore drill; original source hashes और revision history।
2. Workbook mapping, row truncation, ID/date overwrite और reload overwrite बंद करना।
3. Server-confirmed save status, load-error handling, concurrency और authenticated writes ठीक करना।
4. तीन inconsistent NSAP GP, बली duplicate, दो date conflicts, 45 MIS/status conflicts और तीन missing completion dates की review queue। Original values सुरक्षित रखें; source मिलने पर reviewed correction करें।

### फिर एक reporting engine

5. Shared completion/status/date/FY/filter definitions। Legacy data को evidence सहित reconcile करें।
6. नौ report types के अलग datasets, columns, preview, Excel और PDF। Unsupported report को official report के रूप में export न होने दें।
7. Monthly/cumulative selection, correct cutoff, event history और immutable approved monthly snapshots।
8. Hardcoded descriptions/counts हटाएँ। Every exported report पर scope, period, report ID, revision और generatedAt दें।

### फिर रोजमर्रा का उपयोग

9. GP master में stable GP code, block, FY, scheme और source reference। Roster event और actual outcome अलग।
10. GP profile में roster, amendments, held-meeting evidence, Nirnay/MIS receipt, NSAP findings और dated follow-up एक साथ।
11. Data-quality queue: duplicate, missing evidence, count mismatch, overdue, feeding/capture pending। हर issue का owner और resolution history।
12. Excel import में dry run: added/updated/duplicate/unmatched/error rows; review के बाद apply; undo/revision support।
13. Official Hindi Unicode storage; KrutiDev को source/display/export representation के रूप में रखें। IDs, phone और pension registration numbers पर font conversion न चले।
14. BRP worklist और workload conflict checks; mobile entry; offline outbox और clear failed-sync recovery।
15. Findings/objections, responsible person, response, recovery/ATR और closure evidence का अलग register, यदि यह department workflow का हिस्सा हो।

## 15. Release से पहले acceptance checks

- Same FY/month/block/BRP/scheme पर dashboard, drilldown, report preview, Excel, PDF totals समान।
- Month के पहले/आखिरी दिन, next FY, amended/cancelled/postponed, actual completion late-entered, reopening/revision की boundary tests।
- हर non-completed past GP pending bucket में; cancelled GP completed नहीं; evidence-missing स्पष्ट।
- Workbook में 0, 1, 110 और बड़ी beneficiary lists; reordered/renamed sheets; blank/zero; duplicate IDs; clear/delete; save/reload पर कोई unexpected data change नहीं।
- दो devices के simultaneous edits में conflict visible; दूसरे record का change न खोए।
- Failed load पर seed न हो; failed save पर success न दिखे; retry और browser reopen recovery।
- Unauthorized writes rejected; authorized scoped writes accepted; immutable actor/timestamp/before/after log।
- Approved October report November data entry से न बदले; correction पर नई revision निकले।
- Original Hindi/KrutiDev report का readable PDF, repeated headers, margins, signatures और page totals browser में verify हों।
- Backup restore करके record counts, IDs और content checksum match हों।

## 16. परीक्षण के परिणाम और सीमाएँ

- TypeScript check पास।
- Existing fixed dashboard stats script पास; लेकिन इसकी assertions date-derived completion को ही expected मानती हैं। इससे actual completion semantics की correctness सिद्ध नहीं होती।
- Existing lifecycle script: 23 passed, 0 failed। यह cloned fixtures पर lifecycle assignments की जाँच है; actual persisted store/API integration नहीं।
- नया isolated export inspection: सभी नौ options पढ़े; चार specialized reports generic fallback पर confirmed।
- नया workbook verification: reorder mismatch 111 → 222; 110 → 95 rows; clear 111 → 111; unchanged extraction में 13 dates और 19 IDs बदलना confirmed।
- API handler: चार invalid/unauthenticated cases पर 200 success confirmed; deployed service पर write नहीं हुई।
- Mocked debounce: earlier Promise unresolved confirmed; cloud writes zero।
- Scoped ESLint: 38 files में 113 errors, 242 warnings। मुख्यतः explicit any, unused vars, hooks और unescaped entities। ये अपने आप हर data error का प्रमाण नहीं, लेकिन quality gate अभी पास नहीं है।
- Production build नहीं चलाया गया। Browser tools इस session में उपलब्ध नहीं थे; इसलिए interactive UI, actual downloads through browser और printed PDF visually certified नहीं हैं।

Machine-readable evidence और read-only scripts `scratch/social-audit-review-2026-11-07/` में हैं: `data-audit.json`, `logic-verification.json`, `source-reconciliation.json`, `runtime-checks.json`, `eslint.json`। Original workbooks unchanged हैं।
