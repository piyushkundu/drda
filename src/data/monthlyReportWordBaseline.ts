/** Transcribed from the user's unchanged MPR social audit 2026.docx.
 * Blank source cells stay null; explicit zero is retained. Never use a baseline
 * whose reporting date is later than the selected historical cutoff.
 */
export interface MonthlyWordBaseline { through: string; values: Record<string, number | null> }
export const MONTHLY_WORD_BASELINES: MonthlyWordBaseline[] = [
  { through: '2026-09-30', values: {
    pmay_completed: 2, pmay_houses: 3, pmay_sc: null, pmay_st: null, pmay_minority: 2, pmay_disabled: null, pmay_other: 1,
    pmay_findings: 7, pmay_resolved_meeting: 4, pmay_unresolved: 3, pmay_resolved_total: 4, pmay_misused: 0, pmay_recovered: 0, pmay_fir: 0, pmay_action: 0,
    mgnrega_calendar: 20, mgnrega_completed: 20, mgnrega_uploaded: 20, mgnrega_no_records: 3, mgnrega_supervisor_absent: 15, mgnrega_findings: 75, mgnrega_resolved: 34, mgnrega_unresolved: 41,
    mgnrega_financial: 0, mgnrega_deviation: 0, mgnrega_recovered: 0, mgnrega_fir: 0, mgnrega_action: 0,
    nsap_completed: 6, nsap_total: 923, nsap_direct: 772, nsap_ineligible: 18, nsap_deceased: 94, nsap_financial: null,
    nfbs_completed: 0, nfbs_total: 0, nfbs_direct: 0, nfbs_ineligible: 0, nfbs_deceased: 0, nfbs_financial: 0,
  } },
  { through: '2026-10-31', values: {
    pmay_completed: 4, pmay_houses: 4, pmay_sc: null, pmay_st: null, pmay_minority: 2, pmay_disabled: null, pmay_other: 2,
    pmay_findings: 11, pmay_resolved_meeting: 7, pmay_unresolved: 4, pmay_resolved_total: 7, pmay_misused: 0, pmay_recovered: 0, pmay_fir: 0, pmay_action: 0,
    mgnrega_calendar: 55, mgnrega_completed: 53, mgnrega_uploaded: 50, mgnrega_no_records: 32, mgnrega_supervisor_absent: 43, mgnrega_findings: 201, mgnrega_resolved: 72, mgnrega_unresolved: 129,
    mgnrega_financial: 0, mgnrega_deviation: 0, mgnrega_recovered: 0, mgnrega_fir: 0, mgnrega_action: 0,
    nsap_proposed_fy: 47, nsap_proposed: 21, nsap_completed: 20, nsap_total: 2883, nsap_direct: 1787, nsap_family: 172, nsap_ineligible: 75, nsap_deceased: 270, nsap_financial: 0,
    nfbs_proposed_fy: 0, nfbs_proposed: 0, nfbs_completed: 0, nfbs_total: 0, nfbs_direct: 0, nfbs_family: 0, nfbs_ineligible: 0, nfbs_deceased: 0, nfbs_financial: 0,
  } },
];
