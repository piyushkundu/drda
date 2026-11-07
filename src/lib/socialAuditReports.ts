import type { AuditBlock, MonthlyReportDraft, MonthlyReportSection, NSAPGramPanchayatData, ReportType, SocialAuditRecord, VRPMember } from '@/types/socialAudit';
import { buildVrpAuditProgress, VRP_DUTY_LABELS } from './vrpAuditProgress';
import { MONTHLY_WORD_BASELINES } from '@/data/monthlyReportWordBaseline';
import { extractBRPOptions, matchesBRP } from './brpHelper';
import { getEffectiveMeetingDate, getProgressCutoffDate, isMeetingCompletedEffective } from './dateResolution';
import { getDelhiDateString } from './delhiTime';
import { socialAuditRecordAsOf, nsapRecordsAsOf, reportingDate } from './socialAuditAsOf';
import { getNSAPVerification, sumNSAPUnverified, NSAP_REVIEW_REQUIRED } from './nsapVerification';
import { classifyText } from './fontConversion/smartTextPipeline';
import { krutiDevToUnicode } from './fontConversion/krutiDevToUnicode';

export const REPORT_CATALOG: { id: ReportType; title: string; description: string }[] = [
  { id: 'monthly_mpr', title: 'मासिक प्रगति रिपोर्ट मूल Word प्रारूप', description: 'वेबसाइट और पुराने Word के आँकड़े, स्रोत व पूर्णता तिथि सहित। रिपोर्ट खोलकर संपादन और Word / PDF डाउनलोड करें।' },
  { id: 'district_summary', title: 'जनपद सारांश', description: 'ब्लॉकवार कुल पंचायतें, सम्पन्न बैठकें, आगामी कार्य, निर्णय, MIS और NSAP।' },
  { id: 'block_wise', title: 'ब्लॉकवार प्रगति', description: 'बागपत और बड़ौत की तुलनात्मक प्रगति।' },
  { id: 'brp_wise', title: 'बीआरपीवार कार्य प्रगति', description: 'आवंटन, सम्पन्न बैठक, लंबित निर्णय, MIS और NSAP डेटा की स्थिति।' },
  { id: 'brp_detail', title: 'बीआरपीवार पंचायत विवरण', description: 'बीआरपी के अंतर्गत प्रत्येक पंचायत की बैठक और कार्य स्थिति।' },
  { id: 'vrp_wise', title: 'VRP सदस्यवार ऑडिट प्रगति', description: 'कैलेंडर में दर्ज नाम और गाँव के अनुसार कुल ड्यूटी, सम्पन्न, आगामी और शेष ग्राम सभाएँ।' },
  { id: 'vrp_detail', title: 'VRP ग्राम सभा ड्यूटी रजिस्टर', description: 'हर सदस्य की पंचायतवार ड्यूटी, कार्य तिथि, सम्पन्न स्थिति, बीआरपी, योजना और स्थान।' },
  { id: 'all_status', title: 'सभी कार्यों की स्थिति', description: 'बैठक, निर्णय, MIS और NSAP की पंचायतवार संयुक्त स्थिति।' },
  { id: 'pending_actions', title: 'लंबित कार्य सूची', description: 'देय बैठकें तथा सम्पन्न बैठकों के बाद शेष निर्णय, MIS और NSAP डेटा।' },
  { id: 'gp_master', title: 'ग्राम पंचायत मास्टर रजिस्टर', description: 'रोस्टर, बीआरपी, पर्यवेक्षक, योजनाएँ और कार्य की तिथियाँ।' },
  { id: 'meeting_progress', title: 'बैठक प्रगति एवं संशोधन', description: 'मूल और प्रभावी तिथि, सम्पन्न, आगामी, देय, निरस्त और संशोधित बैठकें।' },
  { id: 'panchayat_nirnay', title: 'पंचायत निर्णय ऐप रिपोर्ट', description: 'सम्पन्न बैठकों का अपलोड, कार्य तिथि और शेष कार्य।' },
  { id: 'mis_feeding', title: 'एमआईएस फीडिंग रिपोर्ट', description: 'सम्पन्न बैठकों की फीडिंग, फीडिंग तिथि और शेष कार्य।' },
  { id: 'scheme_wise', title: 'योजनावार प्रगति', description: 'मनरेगा, PMAY-G और NSAP की प्रस्तावित और सम्पन्न पंचायतें।' },
  { id: 'nsap_beneficiary', title: 'एनएसएपी लाभार्थी सत्यापन', description: 'कुल, सत्यापित, गणना से असत्यापित और अलग नामवार मामले।' },
  { id: 'nsap_social_audit', title: 'एनएसएपी मासिक नौ बिंदु रिपोर्ट', description: 'पूर्णता, लाभार्थी डेटा कवरेज और उपलब्ध आँकड़ों का ब्लॉकवार विवरण।' },
  { id: 'nsap_quality', title: 'एनएसएपी डेटा जाँच', description: 'गणना में अंतर, अनुपलब्ध GP डेटा और एक ही ID की दोहराई प्रविष्टियाँ।' },
];

export type ReportCell = string | number | null;
export interface ReportTable { title: string; headers: string[]; rows: ReportCell[][] }
export interface ReportDocument { id: ReportType; title: string; cutoff: string; scope: string; tables: ReportTable[]; notes: string[]; summary?: { label: string; value: ReportCell }[] }
export interface ReportInput {
  records: SocialAuditRecord[];
  nsapRecords: NSAPGramPanchayatData[];
  vrpMembers?: VRPMember[];
  asOfDate: string;
  today?: string;
  filters?: { block?: 'all' | AuditBlock; brp?: string; scheme?: 'all' | 'nsap' | 'mgnrega' | 'pmayg'; status?: string; query?: string };
}
export const HINDI_MONTHS = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
export const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const displayReportDate = (date: string) => date.split('-').reverse().join('/');
const blockName = (block: AuditBlock) => block === 'Baghpat' ? 'बागपत' : 'बड़ौत';

export function getMonthlyReportPeriod(month: string, today = getDelhiDateString()) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('मान्य रिपोर्ट माह चुनें।');
  const [year, number] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
  const start = month + '-01';
  if (start > today) throw new Error('भविष्य के माह की प्रगति रिपोर्ट अभी उपलब्ध नहीं है।');
  const cutoff = end < today ? end : today;
  return { month, start, end, cutoff, year, monthName: HINDI_MONTHS[number - 1], englishMonth: ENGLISH_MONTHS[number - 1], partial: cutoff < end };
}

export function meetingReportStatus(record: SocialAuditRecord, cutoff: string, today = getDelhiDateString()) {
  if (record.status === 'cancelled') return 'निरस्त';
  if (isMeetingCompletedEffective(record, cutoff, today)) return 'सम्पन्न';
  if (record.rescheduleStatus === 'pending') return 'नई तिथि शेष';
  return getEffectiveMeetingDate(record) <= getProgressCutoffDate(cutoff, today) ? 'देय, सम्पन्न करना शेष' : 'आगामी';
}

function projected(input: ReportInput) {
  if (!reportingDate(input.asOfDate)) throw new Error('मान्य संदर्भ तिथि चुनें।');
  const today = input.today || getDelhiDateString();
  const cutoff = getProgressCutoffDate(input.asOfDate, today);
  const all = input.records.map(record => socialAuditRecordAsOf(record, cutoff, today));
  const f = input.filters || {};
  const records = all.filter(record => {
    if (f.block && f.block !== 'all' && record.block !== f.block) return false;
    if (!matchesBRP(record, f.brp || 'all')) return false;
    if (f.scheme === 'nsap' && !record.hasNSAP || f.scheme === 'mgnrega' && !record.hasMGNREGA || f.scheme === 'pmayg' && !record.hasPMAYG) return false;
    const completed = isMeetingCompletedEffective(record, cutoff, today);
    const status = meetingReportStatus(record, cutoff, today);
    if (f.status === 'completed' && !completed) return false;
    if (f.status === 'upcoming' && status !== 'आगामी') return false;
    if (f.status === 'overdue' && !status.includes('शेष')) return false;
    if (f.status === 'cancelled' && record.status !== 'cancelled') return false;
    if (f.status === 'amended' && !record.isAmended) return false;
    const query = f.query?.trim().toLowerCase();
    return !query || [record.gpNameUnicode, record.gpNameKrutiDev, record.brpName, record.brpPhone].some(value => value?.toLowerCase().includes(query));
  });
  const rosterById = new Map(records.map(record => [record.id, record]));
  const nsap = nsapRecordsAsOf(input.nsapRecords, cutoff, today).filter(data => records.some(record => record.id === data.rosterRecordId || record.id === data.id || record.block === data.block && record.gpNameUnicode.trim() === data.gpNameUnicode.trim()));
  const recordFor = (data: NSAPGramPanchayatData) => rosterById.get(data.rosterRecordId || data.id) || records.find(record => record.block === data.block && record.gpNameUnicode.trim() === data.gpNameUnicode.trim());
  const dataFor = (record: SocialAuditRecord) => nsap.find(data => recordFor(data)?.id === record.id);
  return { records, nsap, today, cutoff, dataFor, recordFor };
}

export interface MonthlyField { key: string; label: string; value: number | null; reason?: string; origin?: 'website' | 'word' | 'manual' | 'missing'; dataThrough?: string; coverage?: string }
export interface MonthlyReportData {
  period: ReturnType<typeof getMonthlyReportPeriod>;
  fields: { pmay: MonthlyField[]; mgnrega: MonthlyField[]; nsap: MonthlyField[]; nfbs: MonthlyField[] };
  coverage: { completed: number; recorded: number; missing: number; duplicates: number };
  websiteDataThrough?: string;
  websiteCompleteThrough?: string;
  sectionCompleteThrough?: Partial<Record<MonthlyReportSection, string>>;
  notes: string[];
}

/** Official district totals are blank when coverage is incomplete; a partial sum is not a district total. */
function buildWebsiteMonthlyReport(input: ReportInput, month: string): MonthlyReportData {
  if (month < '2026-04' || month > '2027-03') throw new Error('इस प्रारूप के लिए वित्तीय वर्ष 2026–27 का माह चुनें।');
  const period = getMonthlyReportPeriod(month, getProgressCutoffDate(input.asOfDate, input.today));
  const yearRecords = input.records.filter(record => {
    const planned = record.originalMeetingDate || record.amendmentDetails?.originalDate || record.meetingDate;
    return Boolean(reportingDate(planned) && planned >= '2026-04-01' && planned <= '2027-03-31');
  });
  const { records, nsap, today, cutoff, dataFor, recordFor } = projected({ ...input, records: yearRecords, asOfDate: period.cutoff, filters: undefined });
  const done = (record: SocialAuditRecord) => isMeetingCompletedEffective(record, cutoff, today);
  const live = records.filter(record => record.status !== 'cancelled');
  const completedNsap = live.filter(record => record.hasNSAP && done(record));
  const covered = completedNsap.filter(record => dataFor(record));
  const detail = covered.map(record => dataFor(record)!);
  const completedIds = new Set(completedNsap.map(record => record.id));
  const completedDetail = nsap.filter(record => completedIds.has(recordFor(record)?.id || ''));
  const duplicates = completedDetail.length - covered.length;
  const completeCoverage = covered.length === completedNsap.length && !duplicates;
  const sourceValid = detail.every(record => getNSAPVerification(record).valid);
  const field = (key: string, label: string, value: number | null, reason?: string): MonthlyField => ({ key, label, value, reason });
  const unavailable = (key: string, label: string) => field(key, label, null, 'यह जानकारी वेबसाइट पर उपलब्ध नहीं है।');
  const sum = (key: 'totalBeneficiaries' | 'verifiedDirect' | 'verifiedFamily' | 'financialIrregularityAmount') => {
    if (!completeCoverage || !sourceValid || detail.some(record => typeof record[key] !== 'number' || !Number.isFinite(record[key]))) return null;
    return detail.reduce((total, record) => total + (record[key] as number), 0);
  };
  const countCategory = (category: 'deceased' | 'ineligible') => completeCoverage && sourceValid ? detail.reduce((total, record) => total + record.beneficiaries.filter(beneficiary => beneficiary.category === category).length, 0) : null;
  const detailReason = !completeCoverage ? 'सम्पन्न पंचायतों का लाभार्थी डेटा अधूरा है।' : !sourceValid ? 'स्रोत के लाभार्थी आँकड़ों में जाँच आवश्यक है।' : 'पूर्ण जानकारी उपलब्ध नहीं है।';
  const pmay = [field('pmay_completed', 'सोशल ऑडिट सम्पन्न ग्राम पंचायतें', live.filter(record => record.hasPMAYG && done(record)).length), ...[
    ['pmay_houses', 'सत्यापित आवास'], ['pmay_sc', 'एससी आवास'], ['pmay_st', 'एसटी आवास'], ['pmay_minority', 'अल्पसंख्यक आवास'], ['pmay_disabled', 'दिव्यांगजन आवास'], ['pmay_other', 'अन्य आवास'], ['pmay_findings', 'इंगित कमियाँ'], ['pmay_resolved_meeting', 'बैठक में निस्तारित मामले'], ['pmay_unresolved', 'बैठक के बाद अनिस्तारित मामले'], ['pmay_resolved_total', 'माहांत तक निस्तारित मामले'], ['pmay_misused', 'दुरुपयोग की धनराशि'], ['pmay_recovered', 'वसूली'], ['pmay_fir', 'एफआईआर'], ['pmay_action', 'कार्यवाही वाले अधिकारी / कर्मचारी'],
  ].map(([key, label]) => unavailable(key, label))];
  const mgnrega = [
    unavailable('mgnrega_calendar', 'माहांत तक कैलेंडर निर्गत ग्राम पंचायतें'),
    field('mgnrega_completed', 'सोशल ऑडिट सम्पन्न ग्राम पंचायतें', live.filter(record => record.hasMGNREGA && done(record)).length),
    field('mgnrega_uploaded', 'भारत सरकार की वेबसाइट पर अपलोड प्रतिवेदन', live.filter(record => record.hasMGNREGA && done(record) && record.misStatus === 'fed').length),
    ...[['mgnrega_no_records', 'अभिलेख अप्राप्त पंचायतें'], ['mgnrega_supervisor_absent', 'पर्यवेक्षक अनुपस्थित पंचायतें'], ['mgnrega_findings', 'इंगित कमियाँ'], ['mgnrega_resolved', 'बैठक में निस्तारित मामले'], ['mgnrega_unresolved', 'बैठक के बाद अनिस्तारित मामले'], ['mgnrega_financial', 'वित्तीय अनियमितता की धनराशि'], ['mgnrega_deviation', 'वित्तीय विचलन की धनराशि'], ['mgnrega_recovered', 'वसूली'], ['mgnrega_fir', 'एफआईआर'], ['mgnrega_action', 'कार्यवाही वाले अधिकारी / कर्मचारी']].map(([key, label]) => unavailable(key, label)),
  ];
  const nsapFields = [
    field('nsap_proposed_fy', 'वित्तीय वर्ष में प्रस्तावित ग्राम पंचायतें', records.filter(record => record.hasNSAP).length),
    field('nsap_proposed', 'संदर्भ तिथि तक प्रस्तावित ग्राम पंचायतें', live.filter(record => record.hasNSAP && getEffectiveMeetingDate(record) <= cutoff).length),
    field('nsap_completed', 'सोशल ऑडिट सम्पन्न ग्राम पंचायतें', completedNsap.length),
    field('nsap_total', 'पेंशन लाभार्थी', sum('totalBeneficiaries'), detailReason),
    field('nsap_direct', 'प्रत्यक्ष मुलाकात से सत्यापित', sum('verifiedDirect'), detailReason),
    field('nsap_family', 'परिवार से सत्यापित', sum('verifiedFamily'), detailReason),
    field('nsap_ineligible', 'नामवार अपात्र लाभार्थी', countCategory('ineligible'), detailReason),
    field('nsap_deceased', 'नामवार मृतक लाभार्थी', countCategory('deceased'), detailReason),
    field('nsap_financial', 'वित्तीय अनियमितता की धनराशि', sum('financialIrregularityAmount'), detailReason),
  ];
  const nfbs = nsapFields.map(value => unavailable(value.key.replace('nsap_', 'nfbs_'), value.label));
  const notes = ['मासिक प्रारूप वित्तीय वर्ष की संचयी प्रगति है। खाली खाने का अर्थ जानकारी अनुपलब्ध है, शून्य नहीं।'];
  if (period.partial) notes.push(`यह रिपोर्ट ${displayReportDate(cutoff)} तक के कार्य पर आधारित है; पूरे माह का योग नहीं है।`);
  if (covered.length < completedNsap.length) notes.push(`NSAP की ${completedNsap.length} सम्पन्न पंचायतों में ${covered.length} का लाभार्थी डेटा उपलब्ध है। अधूरे जनपद योग मूल मासिक प्रारूप में खाली रखे गए हैं; उपलब्ध पंचायतों के आँकड़े NSAP लाभार्थी रिपोर्ट में देखें।`);
  if (duplicates) notes.push('एक ही पंचायत के एक से अधिक NSAP रिकॉर्ड मिले हैं। जाँच होने तक जनपद के लाभार्थी योग खाली रखे गए हैं।');
  if (!sourceValid) notes.push('NSAP स्रोत में कुल / सत्यापित का विरोध है। प्रभावित लाभार्थी योग खाली रखे गए हैं; डेटा जाँच रिपोर्ट देखें।');
  if (nsap.length !== detail.length) notes.push('सम्पन्न बैठक से मेल न खाने वाला NSAP डेटा मूल मासिक योग में शामिल नहीं है।');
  return { period, fields: { pmay, mgnrega, nsap: nsapFields, nfbs }, coverage: { completed: completedNsap.length, recorded: covered.length, missing: completedNsap.length - covered.length, duplicates }, notes };
}

export const MONTHLY_SECTION_TITLES: Record<MonthlyReportSection, string> = { pmay: 'प्रधानमंत्री आवास योजना ग्रामीण', mgnrega: 'मनरेगा', nsap: 'राष्ट्रीय वृद्धावस्था पेंशन', nfbs: 'राष्ट्रीय पारिवारिक लाभ' };
export function monthlyFieldSource(field: MonthlyField): string {
  const source = ({ website: 'वेबसाइट डेटा', word: 'पुराना Word डेटा', manual: 'मैनुअल संशोधन', missing: 'डेटा उपलब्ध नहीं' })[field.origin || 'missing'];
  return `${source}${field.dataThrough ? ` • ${displayReportDate(field.dataThrough)} तक` : ''}${field.coverage ? ` • ${field.coverage}` : ''}`;
}

export function validateMonthlyReportDraft(month: string, draft: MonthlyReportDraft, cutoff: string): string | undefined {
  if (!/^202[67]-(0[1-9]|1[0-2])$/.test(month) || month < '2026-04' || month > '2027-03' || month + '-01' > cutoff) return 'मान्य वर्तमान या पुराना रिपोर्ट माह चुनें।';
  if (!draft || !draft.values || Array.isArray(draft.values) || !draft.completeThrough) return 'रिपोर्ट के आँकड़े मान्य नहीं हैं।';
  const keys = new Set(MONTHLY_WORD_BASELINES.flatMap(baseline => Object.keys(baseline.values)));
  for (const [key, value] of Object.entries(draft.values)) {
    if (!keys.has(key)) return 'रिपोर्ट का अज्ञात खाना मिला।';
    const money = /financial|misused|recovered|deviation/.test(key);
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !money && !Number.isSafeInteger(value))) return 'संख्या गैर-ऋणात्मक होनी चाहिए; लाभार्थी, आवास और मामलों की संख्या पूर्णांक में लिखें।';
    if (value !== null && money && (!Number.isSafeInteger(Math.round(value * 100)) || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001)) return 'धनराशि अधिकतम दो दशमलव अंकों में लिखें।';
  }
  for (const [section, date] of Object.entries(draft.completeThrough)) {
    if (!(section in MONTHLY_SECTION_TITLES) || !date || !reportingDate(date) || date > cutoff || date < '2026-04-01') return 'डेटा पूर्णता की तिथि संदर्भ तिथि से आगे नहीं हो सकती और वित्तीय वर्ष के भीतर होनी चाहिए।';
  }
}

/** Website values, dated reference fallbacks and explicit per-month edits remain distinguishable. */
export function buildMonthlyReport(input: ReportInput, month: string, draft?: MonthlyReportDraft): MonthlyReportData {
  const report = buildWebsiteMonthlyReport(input, month);
  const baseline = [...MONTHLY_WORD_BASELINES].reverse().find(source => source.through <= report.period.cutoff);
  const view = projected({ ...input, asOfDate: report.period.cutoff, filters: undefined });
  const completed = view.records.filter(record => record.hasNSAP && record.meetingDate >= '2026-04-01' && isMeetingCompletedEffective(record, view.cutoff, view.today));
  const detail = completed.flatMap(record => { const data = view.dataFor(record); return data ? [data] : []; });
  const dates = detail.map(data => reportingDate(data.meetingDate)).filter((date): date is string => Boolean(date)).sort();
  report.websiteDataThrough = dates.at(-1);
  let completeThrough: string | undefined;
  for (const date of [...new Set(completed.map(getEffectiveMeetingDate))].sort()) {
    const due = completed.filter(record => getEffectiveMeetingDate(record) <= date);
    if (due.some(record => { const data = view.dataFor(record); if (!data || data.meetingDate > date) return true; const check = getNSAPVerification(data); return !check.valid || !check.breakdownMatches; })) break;
    completeThrough = date;
  }
  report.websiteCompleteThrough = completeThrough;
  const partialValues: Record<string, number> = {};
  if (detail.length && !report.coverage.duplicates) {
    for (const [key, property] of Object.entries({ nsap_total: 'totalBeneficiaries', nsap_direct: 'verifiedDirect', nsap_family: 'verifiedFamily', nsap_financial: 'financialIrregularityAmount' }) as [string, 'totalBeneficiaries' | 'verifiedDirect' | 'verifiedFamily' | 'financialIrregularityAmount'][]) {
      if (detail.every(data => typeof data[property] === 'number' && Number.isFinite(data[property]) && data[property]! >= 0)) partialValues[key] = property === 'financialIrregularityAmount' ? detail.reduce((sum, data) => sum + Math.round(data[property]! * 100), 0) / 100 : detail.reduce((sum, data) => sum + data[property]!, 0);
    }
    for (const category of ['ineligible', 'deceased'] as const) partialValues['nsap_' + category] = detail.reduce((sum, data) => sum + data.beneficiaries.filter(beneficiary => beneficiary.category === category).length, 0);
  }
  for (const [group, fields] of Object.entries(report.fields) as [MonthlyReportSection, MonthlyField[]][]) {
    report.fields[group] = fields.map(original => {
      let field: MonthlyField = { ...original, origin: original.value === null ? 'missing' : 'website', dataThrough: original.value === null ? undefined : report.period.cutoff };
      if (field.key in partialValues) field = { ...field, value: partialValues[field.key], origin: 'website', dataThrough: report.websiteDataThrough, coverage: `${detail.length}/${completed.length} पंचायतों का उपलब्ध विवरण` };
      // The user confirms that the supplied housing report is the complete source.
      if (baseline && (group === 'pmay' || field.value === null) && Object.hasOwn(baseline.values, field.key)) field = { ...field, value: baseline.values[field.key], origin: 'word', dataThrough: baseline.through, coverage: undefined, reason: 'दिए गए Word की पुरानी संचयी रिपोर्ट।' };
      if (draft && Object.hasOwn(draft.values, field.key)) field = { ...field, value: draft.values[field.key], origin: 'manual', dataThrough: draft.completeThrough[group] || report.period.cutoff, coverage: undefined, reason: 'इस माह की रिपोर्ट के लिए आपने दर्ज किया है।' };
      return field;
    });
  }
  report.sectionCompleteThrough = { pmay: baseline?.through, mgnrega: baseline?.through, nsap: report.websiteCompleteThrough, nfbs: baseline?.through, ...draft?.completeThrough };
  report.notes = [
    `वेबसाइट की प्रगति ${displayReportDate(report.period.cutoff)} तक की है। हर खाने के साथ उसका स्रोत और आँकड़ों की तिथि दी गई है।`,
    ...(baseline ? [`पुराना Word डेटा ${displayReportDate(baseline.through)} की रिपोर्ट से लिया गया है। आवास का पूरा दिया हुआ विवरण रखा गया है; Word के मूल खाली खाने खाली हैं।`] : ['चुनी तिथि तक की पुरानी Word रिपोर्ट उपलब्ध नहीं है; बाद के माह का डेटा नहीं मिलाया गया है।']),
    `NSAP: ${report.coverage.completed} सम्पन्न पंचायतें; ${report.coverage.recorded} का विवरण उपलब्ध है। वेबसाइट से निकाले लाभार्थी योग इन्हीं पंचायतों के हैं, पूरे जनपद का पूर्ण योग नहीं।`,
    ...(report.websiteDataThrough ? [`NSAP की अंतिम उपलब्ध ऑडिट प्रविष्टि ${displayReportDate(report.websiteDataThrough)} की है।${completeThrough ? ` लगातार पूर्ण और गणना-मान्य कवरेज ${displayReportDate(completeThrough)} तक है।` : ' पूर्ण और गणना-मान्य कवरेज की अंतिम तिथि अभी निर्धारित नहीं है।'}`] : []),
    ...(detail.some(data => { const check = getNSAPVerification(data); return !check.valid || !check.breakdownMatches; }) ? ['कुछ NSAP स्रोत आँकड़ों में कुल / सत्यापित या प्रत्यक्ष / परिवार के विभाजन का विरोध है। उपलब्ध दर्ज मान दिखाए गए हैं; डेटा-जाँच रिपोर्ट से इनकी समीक्षा करें।'] : []),
    ...(report.period.partial ? ['माह अभी संदर्भ तिथि तक है; भविष्य का कार्य स्वतः सम्पन्न नहीं माना गया है।'] : []),
    ...(draft ? ['मैनुअल संशोधन केवल इस माह की रिपोर्ट में लागू हैं; पंचायत के मूल रिकॉर्ड नहीं बदले गए हैं।'] : []),
  ];
  return report;
}

export function buildSocialAuditReport(id: ReportType, input: ReportInput): ReportDocument {
  const vrpReport = id === 'vrp_wise' || id === 'vrp_detail';
  const { records, nsap, today, cutoff, dataFor } = projected(vrpReport ? { ...input, filters: { ...input.filters, query: undefined } } : input);
  const done = (record: SocialAuditRecord) => isMeetingCompletedEffective(record, cutoff, today);
  const status = (record: SocialAuditRecord) => meetingReportStatus(record, cutoff, today);
  const meta = REPORT_CATALOG.find(report => report.id === id)!;
  const filters = input.filters || {};
  const scope = [filters.block && filters.block !== 'all' ? blockName(filters.block) : 'समस्त ब्लॉक', filters.brp && filters.brp !== 'all' ? `बीआरपी ${filters.brp}` : 'सभी बीआरपी', filters.scheme && filters.scheme !== 'all' ? filters.scheme.toUpperCase() : 'सभी योजनाएँ', filters.status && filters.status !== 'all' ? filters.status : 'सभी स्थितियाँ', filters.query ? `खोज ${filters.query}` : ''].filter(Boolean).join(' | ');
  const document: ReportDocument = { id, title: meta.title, cutoff, scope, tables: [], notes: [] };
  document.summary = [{ label: 'चयनित पंचायतें', value: records.length }, { label: 'सम्पन्न बैठकें', value: records.filter(done).length }, { label: 'एमआईएस फीडेड', value: records.filter(record => done(record) && record.misStatus === 'fed').length }, { label: 'एनएसएपी डेटा दर्ज', value: nsap.length }];
  const add = (title: string, headers: string[], rows: ReportCell[][]) => document.tables.push({ title, headers, rows });
  const stats = (list: SocialAuditRecord[]) => [list.length, list.filter(done).length, list.filter(record => status(record) === 'आगामी').length, list.filter(record => done(record) && record.panchayatNirnayStatus === 'captured').length, `${list.filter(record => done(record) && record.misStatus === 'fed').length}/${list.filter(done).length}`, list.filter(record => record.hasNSAP).length];
  const pending = (record: SocialAuditRecord) => [!done(record) && status(record).includes('शेष') ? 'बैठक सम्पन्न करना' : '', done(record) && record.panchayatNirnayStatus !== 'captured' ? 'पंचायत निर्णय' : '', done(record) && record.misStatus !== 'fed' && record.misStatus !== 'not_eligible' ? 'एमआईएस फीडिंग' : '', done(record) && record.hasNSAP && !dataFor(record) ? 'एनएसएपी डेटा' : ''].filter(Boolean).join(', ');
  if (vrpReport) {
    const progress = buildVrpAuditProgress(records, input.vrpMembers || [], cutoff, today);
    const query = filters.query?.trim().toLowerCase();
    const profiles = progress.profiles.filter(profile => !query || [profile.name, profile.locality, profile.member?.empCode, profile.member?.mobileNo, ...profile.candidates.flatMap(member => [member.nameHindi, member.name, member.empCode, member.mobileNo]), ...profile.duties.flatMap(duty => [duty.record.gpNameUnicode, duty.record.brpName, duty.record.brpPhone])].some(text => text?.toLowerCase().includes(query)));
    const duties = profiles.flatMap(profile => profile.duties);
    document.summary = [{ label: 'कैलेंडर सदस्य पहचान', value: profiles.length }, { label: 'ग्राम पंचायतें', value: new Set(duties.map(duty => duty.record.id)).size }, { label: 'सम्पन्न ग्राम सभाएँ', value: new Set(duties.filter(duty => duty.status === 'completed').map(duty => duty.record.id)).size }, { label: 'सम्पन्न सदस्य-ड्यूटी', value: duties.filter(duty => duty.status === 'completed').length }];
    document.notes.push('यह कैलेंडर में पंचायतवार दर्ज नामों और बैठक की सम्पन्न स्थिति का विवरण है। वर्तमान Team A/B/C से पुरानी ड्यूटी नहीं जोड़ी गई है। अलग उपस्थिति प्रमाण उपलब्ध नहीं है।', 'सम्पन्न सदस्य-ड्यूटी का योग ग्राम सभाओं की संख्या से अलग है। छोटे/दोहराए मास्टर नामों को अनुमान से कर्मचारी कोड नहीं दिया गया है।', 'सम्पन्न तारीख अलग दर्ज न होने पर कैलेंडर आधार तिथि स्पष्ट लिखी गई है।');
    if (query) document.notes.push('खोज से मेल खाने वाले सदस्य का पूरा चयनित ड्यूटी विवरण शामिल है।');
    if (progress.missingTeamGPs.length) document.notes.push(`टीम नाम अनुपलब्ध: ${progress.missingTeamGPs.map(record => record.gpNameUnicode).join(', ')}।`);
    if (id === 'vrp_wise') add(meta.title, ['क्र०','कैलेंडर सदस्य','मूल गाँव','ब्लॉक','कर्मचारी कोड / पहचान','कुल ड्यूटी','सम्पन्न','आगामी','देय','तिथि शेष','निरस्त'], profiles.map((profile, index) => [index + 1, profile.name, profile.locality, blockName(profile.block), profile.member?.empCode || 'कैलेंडर नाम; कोड मिलान शेष', profile.duties.length, profile.counts.completed, profile.counts.upcoming, profile.counts.overdue, profile.counts.undated, profile.counts.cancelled]));
    else {
      for (const profile of profiles) add(`${profile.name} (${profile.locality}) • ${blockName(profile.block)} • ${profile.member?.empCode || 'कैलेंडर पहचान'} • ${profile.counts.completed}/${profile.duties.length} सम्पन्न`, ['क्र०','ग्राम पंचायत','प्रारम्भ','प्रभावी सभा तिथि','सम्पन्न / आधार तिथि','स्थिति','बीआरपी','योजना / स्थान'], profile.duties.map((duty, index) => [index + 1, duty.record.gpNameUnicode, displayReportDate(duty.record.startDate), displayReportDate(duty.meetingDate), duty.status === 'completed' ? duty.completedDate ? displayReportDate(duty.completedDate) : `${displayReportDate(duty.meetingDate)} (कैलेंडर आधार)` : '', VRP_DUTY_LABELS[duty.status], `${duty.record.brpName} ${duty.record.brpPhone}`, `${duty.record.schemeUnicode}; ${duty.record.venueUnicode}`]));
      if (!profiles.length) add(meta.title, ['सदस्य','ग्राम पंचायत','स्थिति'], []);
    }
  } else if (id === 'district_summary' || id === 'block_wise') {
    add('ब्लॉकवार सारांश', ['क्र०', 'विकास खंड', 'कुल पंचायतें', 'सम्पन्न बैठकें', 'आगामी बैठकें', 'निर्णय अपलोड', 'एमआईएस / सम्पन्न', 'एनएसएपी पंचायतें'], (['Baghpat', 'Baraut'] as AuditBlock[]).map((block, index) => [index + 1, blockName(block), ...stats(records.filter(record => record.block === block))]).concat([['', 'कुल योग', ...stats(records)]]));
    document.notes.push(`देय किन्तु असम्पन्न: ${records.filter(record => status(record).includes('शेष')).length}; निरस्त: ${records.filter(record => record.status === 'cancelled').length}।`);
  } else if (id === 'brp_wise') {
    add('बीआरपीवार सारांश', ['क्र०', 'बीआरपी', 'मोबाइल', 'आवंटित पंचायतें', 'सम्पन्न', 'आगामी', 'निर्णय अपलोड', 'एमआईएस / सम्पन्न', 'एनएसएपी पंचायतें', 'देय बैठकें', 'लंबित निर्णय', 'लंबित एमआईएस', 'एनएसएपी डेटा शेष'], extractBRPOptions(records).map((brp, index) => {
      const assigned = records.filter(record => matchesBRP(record, brp.id));
      return [index + 1, brp.name, brp.phone || '', ...stats(assigned), assigned.filter(record => status(record).includes('शेष')).length, assigned.filter(record => done(record) && record.panchayatNirnayStatus !== 'captured').length, assigned.filter(record => done(record) && record.misStatus !== 'fed' && record.misStatus !== 'not_eligible').length, assigned.filter(record => done(record) && record.hasNSAP && !dataFor(record)).length];
    }));
  } else if (id === 'scheme_wise') {
    add('योजनावार सारांश', ['योजना', 'वर्ष में प्रस्तावित', 'तिथि तक प्रस्तावित', 'सम्पन्न', 'आगामी', 'देय, सम्पन्न शेष', 'निरस्त', 'एमआईएस फीडिंग'], ([['मनरेगा', 'hasMGNREGA'], ['प्रधानमंत्री आवास ग्रामीण', 'hasPMAYG'], ['राष्ट्रीय वृद्धावस्था पेंशन', 'hasNSAP']] as const).map(([label, key]) => {
      const list = records.filter(record => record[key]);
      return [label, list.length, list.filter(record => record.status !== 'cancelled' && getEffectiveMeetingDate(record) <= cutoff).length, list.filter(done).length, list.filter(record => status(record) === 'आगामी').length, list.filter(record => status(record).includes('शेष')).length, list.filter(record => record.status === 'cancelled').length, list.filter(record => done(record) && record.misStatus === 'fed').length];
    }));
  } else if (id === 'nsap_beneficiary' || id === 'nsap_social_audit') {
    add('उपलब्ध एनएसएपी पंचायत डेटा', ['क्र०', 'ग्राम पंचायत', 'विकास खंड', 'ऑडिट तिथि', 'कुल लाभार्थी', 'कुल सत्यापित', 'असत्यापित', 'प्रत्यक्ष', 'परिवार', 'नामवार अपात्र', 'नामवार मृतक', 'वित्तीय अनियमितता'], nsap.map((data, index) => [index + 1, data.gpNameUnicode, blockName(data.block), displayReportDate(data.meetingDate), data.totalBeneficiaries, getNSAPVerification(data).verified, getNSAPVerification(data).unverified ?? NSAP_REVIEW_REQUIRED, data.verifiedDirect, data.verifiedFamily, data.beneficiaries.filter(row => row.category === 'ineligible').length, data.beneficiaries.filter(row => row.category === 'deceased').length, data.financialIrregularityAmount ?? null]));
    if (id === 'nsap_beneficiary') add('नामवार दर्ज मामले', ['क्र०', 'ग्राम पंचायत', 'विकास खंड', 'लाभार्थी', 'पंजीकरण संख्या', 'श्रेणी', 'कारण', 'मृत्यु तिथि'], nsap.flatMap(data => data.beneficiaries.map((beneficiary, index) => [index + 1, data.gpNameUnicode, blockName(data.block), beneficiary.nameKrutiDev ? krutiDevToUnicode(beneficiary.nameKrutiDev) : classifyText(beneficiary.nameUnicode) === 'krutidev-encoded' ? krutiDevToUnicode(beneficiary.nameUnicode) : beneficiary.nameUnicode, beneficiary.registrationId, beneficiary.categoryHindi, beneficiary.reason || '', beneficiary.deathDate || ''])));
    if (id === 'nsap_social_audit') add('ब्लॉकवार नौ बिंदु और डेटा कवरेज', ['विकास खंड', 'वर्ष में प्रस्तावित', 'तिथि तक प्रस्तावित', 'सम्पन्न बैठकें', 'डेटा दर्ज पंचायतें', 'उपलब्ध कुल लाभार्थी', 'प्रत्यक्ष', 'परिवार', 'नामवार अपात्र', 'नामवार मृतक', 'असत्यापित', 'वित्तीय अनियमितता'], (['Baghpat', 'Baraut'] as AuditBlock[]).map(block => {
      const roster = records.filter(record => record.block === block && record.hasNSAP), detail = nsap.filter(record => record.block === block);
      return [blockName(block), roster.length, roster.filter(record => record.status !== 'cancelled' && getEffectiveMeetingDate(record) <= cutoff).length, roster.filter(done).length, detail.length, detail.reduce((sum, record) => sum + record.totalBeneficiaries, 0), detail.reduce((sum, record) => sum + record.verifiedDirect, 0), detail.reduce((sum, record) => sum + record.verifiedFamily, 0), detail.reduce((sum, record) => sum + record.beneficiaries.filter(row => row.category === 'ineligible').length, 0), detail.reduce((sum, record) => sum + record.beneficiaries.filter(row => row.category === 'deceased').length, 0), sumNSAPUnverified(detail) ?? NSAP_REVIEW_REQUIRED, detail.every(record => typeof record.financialIrregularityAmount === 'number') ? detail.reduce((sum, record) => sum + (record.financialIrregularityAmount || 0), 0) : null];
    }));
    document.notes.push(`योग केवल उपलब्ध ${nsap.length} पंचायतों के डेटा के हैं। असत्यापित = कुल लाभार्थी − दर्ज कुल सत्यापित; नामवार मामलों की संख्या अलग है।`);
  } else if (id === 'nsap_quality') {
    const issues: ReportCell[][] = [];
    records.filter(record => record.hasNSAP && done(record) && !dataFor(record)).forEach(record => issues.push([record.gpNameUnicode, blockName(record.block), 'सम्पन्न बैठक का एनएसएपी डेटा अनुपलब्ध', '', '', '']));
    const seenGps = new Set<string>();
    nsap.forEach(data => {
      const gpKey = data.rosterRecordId || `${data.block}:${data.gpNameUnicode}`;
      if (seenGps.has(gpKey)) issues.push([data.gpNameUnicode, blockName(data.block), 'पंचायत का एनएसएपी रिकॉर्ड एक से अधिक बार है', '', '', '']);
      seenGps.add(gpKey);
      const counts = getNSAPVerification(data);
      if (!counts.valid || !counts.breakdownMatches) issues.push([data.gpNameUnicode, blockName(data.block), !counts.valid ? 'कुल / सत्यापित में जाँच आवश्यक' : 'प्रत्यक्ष + परिवार, दर्ज सत्यापित से अलग', data.totalBeneficiaries, counts.verified, '']);
      const seen = new Set<string>();
      data.beneficiaries.forEach(beneficiary => {
        if (!beneficiary.registrationId) return;
        if (seen.has(beneficiary.registrationId)) issues.push([data.gpNameUnicode, blockName(data.block), 'पंजीकरण संख्या दोहराई गई है; स्रोत जाँचें', '', '', beneficiary.registrationId]);
        seen.add(beneficiary.registrationId);
      });
    });
    add('जाँच सूची', ['ग्राम पंचायत', 'विकास खंड', 'जाँच का विषय', 'कुल लाभार्थी', 'कुल सत्यापित', 'पंजीकरण संख्या'], issues);
  } else if (id === 'gp_master') {
    add('पूरा ग्राम पंचायत रोस्टर', ['क्र०', 'ग्राम पंचायत', 'विकास खंड', 'प्रारम्भ तिथि', 'बैठक तिथि', 'बीआरपी', 'मोबाइल', 'पर्यवेक्षक', 'ऑडिट टीम', 'योजनाएँ', 'बैठक का स्थान', 'समय', 'बैठक स्थिति'], records.map((record, index) => [index + 1, record.gpNameUnicode, blockName(record.block), displayReportDate(record.startDate), displayReportDate(getEffectiveMeetingDate(record)), record.brpName, record.brpPhone, record.supervisorOfficerUnicode, record.teamMembersUnicode, record.schemeUnicode, record.venueUnicode, record.timeUnicode, status(record)]));
  } else if (id === 'meeting_progress') {
    add('बैठक एवं संशोधन विवरण', ['क्र०', 'ग्राम पंचायत', 'विकास खंड', 'मूल बैठक तिथि', 'प्रभावी बैठक तिथि', 'बीआरपी', 'स्थिति', 'संशोधन / निरस्तीकरण का कारण'], records.map((record, index) => [index + 1, record.gpNameUnicode, blockName(record.block), displayReportDate(record.originalMeetingDate || record.meetingDate), displayReportDate(getEffectiveMeetingDate(record)), record.brpName, status(record), record.cancellationDetails?.reason || record.amendmentDetails?.reason || '']));
  } else if (id === 'panchayat_nirnay' || id === 'mis_feeding') {
    const nirnay = id === 'panchayat_nirnay';
    add(meta.title, ['क्र०', 'ग्राम पंचायत', 'विकास खंड', 'बैठक तिथि', 'बीआरपी', nirnay ? 'निर्णय स्थिति' : 'एमआईएस स्थिति', 'कार्य तिथि', 'टिप्पणी'], records.filter(done).map((record, index) => [index + 1, record.gpNameUnicode, blockName(record.block), displayReportDate(getEffectiveMeetingDate(record)), record.brpName, nirnay ? record.panchayatNirnayStatus === 'captured' ? 'अपलोड' : 'लंबित' : record.misStatus === 'fed' ? 'फीडेड' : record.misStatus === 'not_eligible' ? 'लागू नहीं' : 'लंबित', (nirnay ? record.panchayatNirnayCapturedDate : record.misFedDate) || '', (nirnay ? record.panchayatNirnayNotes : record.misNotes) || '']));
  } else {
    const list = id === 'pending_actions' ? records.filter(record => record.status !== 'cancelled' && pending(record)) : records;
    add(meta.title, ['क्र०', 'ग्राम पंचायत', 'विकास खंड', 'बीआरपी', 'मोबाइल', 'पर्यवेक्षक', 'मूल बैठक तिथि', 'प्रभावी बैठक तिथि', 'बैठक स्थिति', 'निर्णय', 'एमआईएस', 'एनएसएपी डेटा', 'शेष कार्य'], list.map((record, index) => [index + 1, record.gpNameUnicode, blockName(record.block), record.brpName, record.brpPhone, record.supervisorOfficerUnicode, displayReportDate(record.originalMeetingDate || record.meetingDate), displayReportDate(getEffectiveMeetingDate(record)), status(record), record.panchayatNirnayStatus === 'captured' ? 'अपलोड' : done(record) ? 'लंबित' : 'बैठक शेष', record.misStatus === 'fed' ? 'फीडेड' : record.misStatus === 'not_eligible' ? 'लागू नहीं' : done(record) ? 'लंबित' : 'बैठक शेष', record.hasNSAP ? dataFor(record) ? 'दर्ज' : 'डेटा शेष' : 'लागू नहीं', pending(record)]));
    if (id === 'brp_detail') document.tables[0].rows.sort((a, b) => String(a[3]).localeCompare(String(b[3]), 'hi'));
  }
  if (input.asOfDate > today) document.notes.push(`चुनी तिथि भविष्य की है। सम्पन्न कार्य केवल ${displayReportDate(cutoff)} तक का है; आगामी बैठकें योजना के रूप में दिखती हैं।`);
  return document;
}

export function monthlyReportDocument(monthly: MonthlyReportData): ReportDocument {
  return {
    id: 'monthly_mpr', title: `मासिक प्रगति रिपोर्ट ${monthly.period.monthName} ${monthly.period.year}`, cutoff: monthly.period.cutoff, scope: 'सम्पूर्ण जनपद बागपत | संचयी प्रगति', notes: monthly.notes,
    summary: [{ label: 'सत्यापित आवास', value: monthly.fields.pmay.find(field => field.key === 'pmay_houses')?.value ?? null }, { label: 'मनरेगा सम्पन्न', value: monthly.fields.mgnrega.find(field => field.key === 'mgnrega_completed')?.value ?? null }, { label: 'एनएसएपी सम्पन्न', value: monthly.coverage.completed }, { label: 'लाभार्थी डेटा उपलब्ध', value: monthly.coverage.recorded }],
    tables: (Object.entries(monthly.fields) as [MonthlyReportSection, MonthlyField[]][]).map(([key, fields]) => ({ title: `${MONTHLY_SECTION_TITLES[key]}${monthly.sectionCompleteThrough?.[key] ? ` • डेटा पूर्णता ${displayReportDate(monthly.sectionCompleteThrough[key]!)}` : ''}`, headers: ['बिंदु', 'आँकड़ा', 'स्रोत एवं आँकड़ों की तिथि'], rows: fields.map(field => [field.label, field.value, monthlyFieldSource(field)]) })),
  };
}
