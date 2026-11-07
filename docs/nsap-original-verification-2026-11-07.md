# NSAP original workbook verification — 7 November 2026

Source: `C:/Users/piyus/Downloads/NSAP ALL PANCHAYT FILLED DATA LIST.xlsx`

SHA-256: `44c849cc86b4c2601a07a347583bc61e6f4bf30da511e936b0b994d723bc3917`

Read-only cloud comparison: socialAudit/baghpat-2026-27, updatedAt 2026-11-06T10:29:17.128Z. No cloud writes or original workbook edits were performed.

## Calculation rule

Unverified = total beneficiaries − recorded verified total. An explicit verified total, including zero, takes precedence over direct + family. Old unverified cells and named case counts do not determine the remainder. Missing verified totals retain the existing direct + family fallback, but invalid results are marked “जाँच आवश्यक”; they are never clamped to zero. Named beneficiaries, categories and registration IDs remain separate from population totals.

## Source totals

The original has 21 worksheets: 19 GP detail sheets, a summary and an auxiliary sheet. All 19 GP sheets were matched to stable roster IDs. The following values are from the source GP detail sheets. Blank verified totals are explicitly identified.

| GP | Stable roster ID | Total | Direct | Family | Verified total | Derived unverified |
|---|---|---:|---:|---:|---:|---:|
| शाहपुर पदडां | baghpat-1 | 135 | 120 | 0 | 120 | 15 |
| धनौरा सिल्वर नगर | baghpat-11 | 167 | 130 | 0 | 130 | 37 |
| बुढेडा | baghpat-8 | 166 | 120 | 0 | 120 | 46 |
| बाघू | baghpat-4 | 98 | 90 | 0 | 90 | 8 |
| बली | baghpat-5 | 95 | 90 | 0 | 90 | 5 |
| बावली | baraut-7 | 247 | 209 | 0 | 209 | 38 |
| गाधी | baghpat-17 | 103 | 95 | 0 | 95 | 8 |
| फै0 निनाना | baghpat-16 | 201 | 193 | 193 | blank (fallback 386) | जाँच आवश्यक |
| बुढपुर | baraut-11 | 113 | 82 | 0 | 82 | 31 |
| बिजरौल | baraut-12 | 271 | 95 | 73 | 168 | 103 |
| बडका | baraut-9 | 84 | 44 | 24 | 68 | 16 |
| चौबली | baraut-15 | 82 | 0 | 0 | 65 | 17 |
| ढिकाना | baraut-16 | 182 | 97 | 37 | 134 | 48 |
| ग्वालीखेडा | baghpat-20 | 81 | 68 | 0 | 68 | 13 |
| गौरीपुर जव0न0 | baghpat-19 | 126 | 0 | 0 | 118 | 8 |
| बिराल | baraut-13 | 83 | 57 | 5 | 62 | 21 |
| निरोजपुर गुर्जर | baghpat-30 | 184 | 147 | 33 | 147 | 37 |
| नैथला | baghpat-28 | 92 | 90 | 0 | 90 | 2 |
| खेडकी | baghpat-25 | 90 | 88 | 0 | 88 | 2 |

## Discrepancies requiring source review

- फै0 निनाना: total 201; direct 193; family 193; verified-total cell blank. The existing fallback produces 386, exceeding total 201. No guessed verified total is written; the remaining count and district remaining total show “जाँच आवश्यक”.
- निरोजपुर गुर्जर: source direct 147, family 33, explicit verified total 147. The authoritative 147 is retained, so remaining = 184 − 147 = 37. Cloud family count is 0 versus source 33. This is reported without silently overwriting the cloud record.
- चौबली and गौरीपुर: source direct/family are blank but explicit verified totals 65 and 118 exist. The explicit totals are retained rather than replaced with zero.
- बली: original and cloud both contain two deceased rows with registration ID 31651001478. Both rows are preserved; no automatic deduplication.
- All 340 named detail rows have matching counts and category/registration-ID sets in the cloud snapshot. 7 raw-name differences remain, listed below; therefore the data is not certified as an exact name-for-name match.

| GP | Category | Registration ID | Source raw text | Cloud raw text |
|---|---|---|---|---|
| शाहपुर पदडां | ineligible | 31651001342 | m"kk | mkk |
| शाहपुर पदडां | ineligible | 316510489791 | d`".kkorh | d`.kkorh |
| बाघू | deceased | 316510241421 | _"kiky @ [kpsMw | _kiky @ [kpsMw |
| फै0 निनाना | deceased | 316510359051 | —".k | —.k |
| बुढपुर | deceased | 316510490731 | d`".kk | d`.kk |
| चौबली | deceased | 316510548841 | d`".kk | d`.kk |
| ग्वालीखेडा | ineligible | 316510616441 | d`".kknsoh | d`.kknsoh |

The differing source names contain a double quote that the stored text lacks. The updated original-workbook importer preserves these characters. Import remains a preview-and-apply operation; no automatic source replacement was run.

## Implemented safeguards and UI

- Shared subtraction rule in cards, GP table/profile, dashboard, workbook GP/summary and Excel export; named-case counts remain separate.
- GP cards display total, verified, unverified, verification progress and named ineligible/deceased cases. Each card opens its exact GP worksheet using stable IDs.
- Workbook unverified cells are derived and protected from manual editing. Source explicit verified totals and zero values are retained.
- Import matches original worksheet names, detects different header-row layouts, retains all rows beyond row 100, preserves registration strings and duplicate occurrences, and derives unverified values.
- Excel export contains live subtraction formulas with cached results. CSV quotes and commas are escaped; print uses current values and literal escaped text.
- Existing historical-edit warnings and manual future-completion safeguards remain in place.

## Validation

- Isolated NSAP regression harness: 17 checks passed, including original workbook import, actual NSAP page card navigation, workbook dropdown/pending-edit handling and read-only protection, 83 − 62 = 21, explicit zero, invalid totals, changed sheet order, 110 named rows, duplicate IDs, quote preservation, CSV/print, Excel formula export/reimport and store guards.
- Historical/future reporting harness: 45 checks covering dates, cancellation of historical edits, manual completion and actual dashboard/Excel agreement.
- Firebase mocked for all regression tests. Original workbook SHA-256 checked before and after.
- TypeScript (`tsc --noEmit --incremental false`) passed. New verification helper, GP card, sheet-matching helper and regression harness passed scoped ESLint. Existing broader lint errors remain in older files; a clean repository-wide lint result is not claimed.
- Browser visual verification was unavailable in this session; component rendering and event handlers were checked in isolation.
