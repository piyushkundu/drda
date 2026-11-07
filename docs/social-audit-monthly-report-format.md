# Monthly social audit reports

The supplied `C:/Users/piyus/Downloads/MPR social audit 2026.docx` controls the monthly Word layout and retained historical values. Its SHA-256 is `c531f4605e644032a9bc339f4e3a0a70af2f6a17f4093d13dac640f764610751`. The reference remains unchanged.

## Value precedence and provenance

1. A saved manual edit applies only to its selected reporting month. Explicit zero stays zero; an explicitly cleared value stays blank.
2. Housing retains the complete supplied Word data as requested. Other available website values take priority, including properly labelled sums of available NSAP GP data.
3. Fields unavailable on the website retain values from the latest supplied Word report whose date is on or before the reporting cutoff. Original blank cells remain blank. A later Word month never leaks into an earlier historical report.
4. Every value carries its origin (`website`, `word`, `manual` or `missing`), data date and applicable GP coverage. Old Word values are explicitly labelled “पुराना Word डेटा”.

`src/data/monthlyReportWordBaseline.ts` contains verified September and October snapshots. The source Word's October housing values are 4 completed GPs, 4 houses, 2 minority and 2 other houses, 11 findings, 7 resolved, 4 unresolved and 7 resolved through month end. Its blank SC/ST/disability cells remain blank. MGNREGA-only findings, attendance, recovery and similar fields retain their supplied historical values; calendar issue counts are not inferred from meeting dates. Family benefit values preserve the source's explicit zeros rather than inventing website coverage.

The baseline-to-source regression reads the real DOCX tables and checks both housing snapshots, MGNREGA snapshots, and October NSAP/family-benefit cells against the retained values.

## Dates and coverage

Reports are cumulative for FY 2026–27. Their cutoff is the earliest of the chosen month end, the header reference date and actual IST today. Future months and months outside this financial year are rejected. Effective meeting/work dates and manual future completion use the shared dashboard rules.

NSAP shows two distinct dates:

- Last available GP audit-data date: the latest dated detail entry included in the report.
- Continuous complete, calculation-valid coverage date: the latest completed meeting-date group before any missing or invalid GP detail. This does not incorrectly equate a recent entry with complete district coverage.

Available NSAP sums identify the recorded GP coverage, such as 19/25, and remain separate from a complete district total. Contradictory source counts are flagged; their recorded values are not silently rewritten. A manual group completion date is explicitly supplied by the user and is independently editable.

## Editing and storage

“आँकड़े भरें / बदलें” opens a scheme-by-scheme editor under the monthly report. It uses the existing authorized central edit mode. Each touched numeric field becomes a manual override; the reset icon restores that field's website/Word value. Group completion dates are editable. Save and cancel are explicit; closing the editor does not apply a draft.

Counts must be safe, non-negative integers. Money allows at most two decimal places. Completion dates cannot exceed the selected report cutoff or lie outside the financial year. Saving or resetting an old report month invokes the existing historical-edit warning before any local/cloud mutation, even when the global header is currently set to today.

Overrides are stored in `monthlyReportDrafts[YYYY-MM]`, persisted locally and included in the existing Firestore sync payload. Saving a report does not change roster, meeting, MIS, Nirnay or GP beneficiary records. Activity logs record the report-month action. Reset sends an explicit empty override for that month and leaves other months intact.

Firestore uses top-level `mergeFields`: the draft map is replaced as a whole so removed overrides do not reappear, while unrelated document fields are preserved. The UI distinguishes local saves, cloud syncing, completed cloud sync and sync failure.

## Downloads and presentation

The report center has 17 report types, grouped catalogue tabs and summary cards. Sidebar report counts derive from the same catalogue. Each card links to its own `/social-audit/reports/[reportId]` page. The dedicated page contains the reference date, filters, monthly editor, data preview, Word/PDF/Excel downloads and PDF print preview. `/social-audit/reports` is the standalone catalogue; the portal's existing reports tab also displays this catalogue. Invalid report URLs return 404.

- Monthly Word keeps the three original letter/table formats, adds a compact source note before each main table and a dated source/completeness appendix. Only `word/document.xml` changes; table grids, merges, page geometry and untouched package parts are preserved. The original PMAY subject's incorrect MGNREGA scheme reference is corrected.
- Other Word reports have a stronger title hierarchy, summary cards, repeating dark table headers and alternating rows.
- Every report has a direct PDF download generated from the exact same cached DOCX bytes as its Word download. Monthly PDF therefore retains the original three letters, tables, signature placement, source notes and appendix. There is no separate tabular PDF generator. Print opens this canonical PDF in an embedded native PDF viewer.
- `/api/social-audit/reports/pdf` converts the generated DOCX locally with Microsoft Word on the Windows server. Office macros are disabled; input is read-only and not added to recent files. Jobs are serialized and limited, each has its own temporary directory, and files are removed after conversion. The converter does not upload reports to an external service or touch master records. Cross-site requests, oversized packages, macros, embedded active content and external relationships are rejected. Errors remain visible and do not silently fall back to a different layout.
- Local Windows use requires Microsoft Word installed on the machine running Next.js. A non-Windows deployment can explicitly configure `REPORT_LIBREOFFICE_PATH` to its installed LibreOffice binary; rendering may then differ from Microsoft Word and must be checked before publishing. Without a renderer, Word/Excel remain available and PDF reports a clear converter error.
- Excel shares the same report model. Editing or viewing the website in Unicode does not change download Hindi encoding.

## Verification

- 16 report checks: real Word baseline comparison; selected-month and future cutoff rules; blank/zero and historical fallback handling; available NSAP coverage; manual overrides; filtered report schemas; glyph encoding; preserved package parts; source appendix; exact registration strings; Excel export; dedicated catalogue links; and real component download callbacks for all 17 Word/PDF selections, including byte-identical Word input to the PDF converter and cached conversion reuse.
- 6 report-edit checks: read-only rejection, count/date validation, cancellation of historical edits, month-scoped persistence, reset isolation and actual Firestore payload/options with the transport mocked.
- PDF conversion checks cover inert DOCX validation, invalid/oversized/active packages, cross-site requests, failure messages, same-Word retry, two actual native Word conversions, all 17 running Next.js routes, 404 handling and a successful real HTTP PDF download. `scripts/test_report_pdf_conversion.cjs --native --http-origin=http://localhost:3100` runs all 11 checks with the QA fixtures and a running production server.
- Existing 45 historical/future reporting checks and 17 NSAP checks remain applicable. Test cloud writes are mocked; no dummy records were written to the real dataset.
- Source Word SHA-256, primary table preservation and explicit source dates were checked. The new API rendered the monthly report with three letters plus source appendix (four pages) and BRP report (one page); every page was rendered with bundled Poppler and inspected. Page content streams match the independent native Word exports byte-for-byte, and all Kruti Dev font subsets are embedded. Original Word and Excel source hashes remain unchanged.
- Native Chrome accessibility inspection confirmed the live new report catalogue, old housing values, available NSAP sums and the separate completeness dates. Further computer input was stopped by the browser URL-verification policy; no test edits were submitted through the real UI.
- Production build, TypeScript and scoped lint were run. Broad pre-existing repository lint findings are outside this report change.
