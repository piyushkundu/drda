# VRP audit progress from the calendar

Team roster now includes a “VRP ऑडिट प्रगति • ग्राम सभाएँ” tab. Every active member card and master roster row links to the calendar detail. The panel lists the literal calendar name and village, block, exact employee code when unambiguous, total duties, completed/upcoming/overdue/undated/cancelled counts. Selecting a person shows each GP, original/effective meeting dates, start date, completion date or explicitly labelled calendar basis, BRP, schemes, venue and the full source team text. Search and status filtering are available; GP names open the existing GP profile.

## Calculation and identity

- The source is each `SocialAuditRecord.teamMembersUnicode`, projected through the shared historical reporting rules. Current master Team A/B/C allocation does not award historical audits. Former or reserve members retain duties under their calendar name.
- Future dates cannot advance completed work beyond actual IST today. Post-rollout meetings need manual completion. Historical cancellations and amendments use the same shared as-of projection as the dashboard and other reports.
- A person identity is the calendar name plus home village plus block. Repeated names on one GP row and repeated GP IDs count only once. One meeting involving several people contributes one GP meeting but several person duties; these two totals are labelled separately.
- The original 88-GP calendar has 24 such identities. Missing closing brackets are parsed without dropping the next member, including Kapil Tomar and Suman. Missing names or dates remain visible instead of being invented.
- Employee IDs are attached only to unique exact normalized names with no competing longer master name. Shortened names and duplicate names remain candidates, visibly labelled for review. Current block/team membership does not resolve ambiguity. This prevents, for example, assigning Vipin Kumar's work to one of three same-name master employees or attaching Satendra Kumar to the wrong similarly named employee.
- Completion counts describe calendar duty on completed meetings. There is no separate attendance register in the provided data; participation certification is not invented. An inferred legacy calendar date is explicitly distinguished from a recorded completion date.
- All views are derived and read-only. No master employee, calendar row, beneficiary record or remote data is overwritten to generate this feature.

## Reports

The report catalogue now has 17 entries. `vrp_wise` is a member summary and `vrp_detail` is the per-member GP duty register. Each has its own report page, reference date and filters, Word/PDF/Excel downloads and canonical PDF print preview. Hindi downloads use the existing Kruti Dev 010 encoding. PDF is converted from the same DOCX bytes. Search matches person/village/code/GP/BRP and includes the matching person's selected duty history; this scope is stated in the report.

## Verification

`scripts/test_vrp_audit_progress.cjs` has 14 checks covering literal source parsing, rotation/reserve members, cutoff/manual completion, historical cancellation/amendment, duplicate protection, identity collisions, missing data, block/BRP scope, the full 88-GP/24-identity baseline, matching report schemas/counts, detail/status UI interactions, actual member-card navigation, exact Excel values, repeating document headings and page numbers. Existing report export tests exercise all 17 canonical Word/PDF callbacks. The production Next server exposes both new report routes; conversion was also exercised through the real HTTP API. No test writes to the real cloud dataset.

The read-only live snapshot produced a three-page summary and a 36-page all-person duty register. Native Word converted the canonical DOCX files, and bundled Poppler rendered all pages for review. Member headings and column headings repeat on continuation pages, person/GP rows do not split across pages, and page counters are included. These scratch QA artifacts are not baseline data or published report downloads.
