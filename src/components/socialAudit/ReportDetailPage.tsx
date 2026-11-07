'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, FileText, Printer, Search, CalendarDays, AlertTriangle, CheckCircle2, Pencil, RotateCcw, ArrowLeft } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import type { AuditBlock, ReportType } from '@/types/socialAudit';
import { extractBRPOptions } from '@/lib/brpHelper';
import { getProgressCutoffDate } from '@/lib/dateResolution';
import { buildMonthlyReport, buildSocialAuditReport, displayReportDate, monthlyReportDocument, REPORT_CATALOG } from '@/lib/socialAuditReports';
import type { ReportCell, ReportInput } from '@/lib/socialAuditReports';
import { createMonthlyMprDocx, createReportDocx, createReportExcel } from '@/lib/exportSocialAuditReports';
import { createReportFiles } from '@/lib/reportPdfClient';
import MonthlyReportEditor from './MonthlyReportEditor';
import { useEditMode } from '@/hooks/useEditMode';

function previewText(value: ReportCell) {
  if (value === null) return '';
  return String(value);
}

export default function ReportDetailPage({ reportId: selectedReport }: { reportId: ReportType }) {
  const { records, nsapRecords, vrpMembers, asOfDate, liveDelhiDate, selectedBRP, monthlyReportDrafts, saveMonthlyReportDraft, resetMonthlyReportDraft, firebaseSyncStatus, setAsOfDate } = useSocialAuditStore();
  const { isEditMode, toggleEditMode } = useEditMode();
  const [filterBlock, setFilterBlock] = useState<'all' | AuditBlock>('all');
  const [filterBRP, setFilterBRP] = useState(selectedBRP);
  const [filterScheme, setFilterScheme] = useState<'all' | 'nsap' | 'mgnrega' | 'pmayg'>('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportMonth, setReportMonth] = useState(() => getProgressCutoffDate(asOfDate, liveDelhiDate).slice(0, 7));
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState('');
  const monthlySelected = selectedReport === 'monthly_mpr';
  const brps = useMemo(() => extractBRPOptions(records), [records]);
  const input: ReportInput = useMemo(() => ({ records, nsapRecords, vrpMembers, asOfDate, today: liveDelhiDate, filters: { block: filterBlock, brp: filterBRP, scheme: filterScheme, status: filterStatus, query: searchQuery } }), [records, nsapRecords, vrpMembers, asOfDate, liveDelhiDate, filterBlock, filterBRP, filterScheme, filterStatus, searchQuery]);
  const monthlyResult = useMemo(() => {
    try { return { data: buildMonthlyReport(input, reportMonth, monthlyReportDrafts?.[reportMonth]), error: '' }; }
    catch (error) { return { data: null, error: error instanceof Error ? error.message : 'माह जाँचें।' }; }
  }, [input, reportMonth, monthlyReportDrafts]);
  const baseMonthly = useMemo(() => {
    try { return buildMonthlyReport(input, reportMonth); } catch { return null; }
  }, [input, reportMonth]);
  const report = useMemo(() => monthlySelected && monthlyResult.data ? monthlyReportDocument(monthlyResult.data) : buildSocialAuditReport(monthlySelected ? 'district_summary' : selectedReport, input), [monthlySelected, monthlyResult, selectedReport, input]);
  // One immutable DOCX per report snapshot: Word, PDF and print use identical bytes.
  const documentFiles = useMemo(() => createReportFiles(async () => {
    if (!monthlySelected) return createReportDocx(report);
    if (!monthlyResult.data) throw new Error(monthlyResult.error);
    const response = await fetch('/templates/social-audit-mpr-2026.docx');
    if (!response.ok) throw new Error('मासिक Word प्रारूप नहीं मिला। दोबारा प्रयास करें।');
    return createMonthlyMprDocx(await response.arrayBuffer(), monthlyResult.data);
  }), [report, monthlySelected, monthlyResult]);
  const save = (bytes: Uint8Array, extension: 'xlsx' | 'docx' | 'pdf') => {
    const copy = new Uint8Array(bytes);
    saveAs(new Blob([copy.buffer], { type: extension === 'pdf' ? 'application/pdf' : extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Baghpat_${selectedReport}_${report.cutoff}.${extension}`);
  };
  const runExport = async (action: () => Promise<void>) => {
    setError(''); setIsExporting(true);
    try { await action(); }
    catch (error) { setError(error instanceof Error ? error.message : 'रिपोर्ट डाउनलोड नहीं हुई। दोबारा प्रयास करें।'); }
    finally { setIsExporting(false); }
  };
  const handleExportExcel = () => runExport(async () => { save(await createReportExcel(report), 'xlsx'); });
  const handleExportWord = () => runExport(async () => { save(await documentFiles.getWord(), 'docx'); });
  const handlePrint = () => runExport(async () => {
    const bytes = await documentFiles.getPdf();
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type: 'application/pdf' }));
    // The embedded native PDF viewer exposes printing without rebuilding an HTML layout.
    setPdfPreview({ url, files: documentFiles });
  });
  const handleExportPdf = () => runExport(async () => { save(await documentFiles.getPdf(), 'pdf'); });
  const [pdfPreview, setPdfPreview] = useState<{ url: string; files: typeof documentFiles } | null>(null);
  useEffect(() => () => { if (pdfPreview) URL.revokeObjectURL(pdfPreview.url); }, [pdfPreview]);
  const disabled = isExporting || monthlySelected && !monthlyResult.data;
  const selectClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500';

  return (
    <div className="space-y-5">
      <nav aria-label="रिपोर्ट नेविगेशन" className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/social-audit/reports" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50"><ArrowLeft className="h-4 w-4" />सभी रिपोर्ट</Link>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><CalendarDays className="h-4 w-4" />संदर्भ तिथि<input aria-label="रिपोर्ट संदर्भ तिथि" type="date" value={asOfDate} onChange={event => setAsOfDate(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800" /></label>
      </nav>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="mb-2 inline-block rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-blue-100">सोशल ऑडिट • जनपद बागपत</span>
            <h1 className="flex items-center gap-2 text-2xl font-black text-white"><FileText className="h-6 w-6 shrink-0 text-blue-200" />{REPORT_CATALOG.find(item => item.id === selectedReport)?.title}</h1>
            <p className="mt-2 text-xs text-blue-100">वित्तीय वर्ष 2026–27 • स्रोत और तारीख सहित रिपोर्ट • हिंदी Kruti Dev 010</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExportWord} disabled={disabled} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-950 hover:bg-blue-50 disabled:opacity-50"><Download className="h-4 w-4" />{monthlySelected ? 'मूल प्रारूप Word (.docx)' : 'Word (.docx)'}</button>
            <button type="button" onClick={handleExportPdf} disabled={disabled} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"><Download className="h-4 w-4" />PDF डाउनलोड</button>
            <button type="button" onClick={handleExportExcel} disabled={disabled} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Download className="h-4 w-4" />Excel (.xlsx)</button>
            <button type="button" onClick={handlePrint} disabled={disabled} className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Printer className="h-4 w-4" />PDF देखें / प्रिंट</button>
          </div>
        </div>
        {isExporting && <p role="status" className="mt-3 text-xs text-blue-100">रिपोर्ट तैयार हो रही है… PDF में Word का वही प्रारूप रखा जा रहा है।</p>}
        </div>
        {error && <p role="alert" className="m-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
        <div className="grid gap-3 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-[11px] font-bold text-slate-500">विकास खंड<select aria-label="रिपोर्ट विकास खंड" value={filterBlock} onChange={event => setFilterBlock(event.target.value as 'all' | AuditBlock)} disabled={monthlySelected} className={selectClass}><option value="all">सभी विकास खंड</option><option value="Baghpat">बागपत</option><option value="Baraut">बड़ौत</option></select></label>
          <label className="text-[11px] font-bold text-slate-500">बीआरपी<select aria-label="रिपोर्ट बीआरपी" value={filterBRP} onChange={event => setFilterBRP(event.target.value)} disabled={monthlySelected} className={selectClass}><option value="all">सभी बीआरपी</option>{brps.map(brp => <option key={brp.id} value={brp.id}>{brp.name}</option>)}</select></label>
          <label className="text-[11px] font-bold text-slate-500">योजना<select aria-label="रिपोर्ट योजना" value={filterScheme} onChange={event => setFilterScheme(event.target.value as typeof filterScheme)} disabled={monthlySelected} className={selectClass}><option value="all">सभी योजनाएँ</option><option value="mgnrega">मनरेगा</option><option value="pmayg">प्रधानमंत्री आवास ग्रामीण</option><option value="nsap">एनएसएपी</option></select></label>
          <label className="text-[11px] font-bold text-slate-500">बैठक स्थिति<select aria-label="रिपोर्ट बैठक स्थिति" value={filterStatus} onChange={event => setFilterStatus(event.target.value)} disabled={monthlySelected} className={selectClass}>{[['all','सभी स्थितियाँ'],['completed','सम्पन्न'],['upcoming','आगामी'],['overdue','देय, सम्पन्न शेष'],['amended','संशोधित'],['cancelled','निरस्त']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-[11px] font-bold text-slate-500">पंचायत / सदस्य खोजें<div className="relative"><Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" /><input aria-label="रिपोर्ट खोज" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} disabled={monthlySelected} className={`${selectClass} pl-7`} placeholder="नाम, गाँव, कोड या मोबाइल" /></div></label>
        </div>
      </section>

      {monthlySelected && <section className="space-y-3 rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-extrabold text-emerald-900"><CalendarDays className="h-5 w-5" /> मूल मासिक रिपोर्ट</h2><p className="mt-1 text-xs text-slate-500">पूरा जनपद • वित्तीय वर्ष की संचयी प्रगति • Word में तीन मूल पत्र</p></div><label className="text-xs font-bold text-slate-600">रिपोर्ट माह<input aria-label="मासिक रिपोर्ट माह" type="month" min="2026-04" max={getProgressCutoffDate(asOfDate, liveDelhiDate).slice(0,7)} value={reportMonth} onChange={event => setReportMonth(event.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2" /></label></div>
        {!monthlyResult.data ? <p role="alert" className="text-sm text-rose-700">{monthlyResult.error}</p> : <>
          <p className="text-xs text-emerald-800">प्रगति की अंतिम तिथि: <strong>{displayReportDate(monthlyResult.data.period.cutoff)}</strong>। स्थानीय ब्लॉक / बीआरपी फ़िल्टर इस पूरे जनपद के प्रारूप पर लागू नहीं हैं।</p>
          <div className="flex flex-wrap gap-3 text-xs"><span className="rounded-lg bg-emerald-50 px-3 py-2">NSAP सम्पन्न बैठकें: <strong>{monthlyResult.data.coverage.completed}</strong></span><span className="rounded-lg bg-blue-50 px-3 py-2">लाभार्थी डेटा उपलब्ध: <strong>{monthlyResult.data.coverage.recorded}</strong></span><span className="rounded-lg bg-amber-50 px-3 py-2">पंचायत डेटा शेष: <strong>{monthlyResult.data.coverage.missing}</strong></span></div>
          <p className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />Word और PDF में वही मूल तीन पत्र, तालिकाएँ और स्रोत परिशिष्ट मिलेंगे। Excel में आँकड़ों की सारणियाँ मिलेंगी।</p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><div className="text-[11px] leading-relaxed text-slate-500">अंतिम उपलब्ध NSAP प्रविष्टि: <strong className="text-slate-700">{monthlyResult.data.websiteDataThrough ? displayReportDate(monthlyResult.data.websiteDataThrough) : 'अभी उपलब्ध नहीं'}</strong><br />लगातार पूर्ण, गणना-मान्य कवरेज: <strong className="text-slate-700">{monthlyResult.data.websiteCompleteThrough ? displayReportDate(monthlyResult.data.websiteCompleteThrough) : 'जाँच शेष'}</strong></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { if (isEditMode || toggleEditMode()) { setEditingMonth(reportMonth); setSavedNotice(''); } }} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white"><Pencil className="h-3.5 w-3.5" />आँकड़े भरें / बदलें</button>{isEditMode && monthlyReportDrafts?.[reportMonth] && <button type="button" onClick={() => { if (resetMonthlyReportDraft(reportMonth)) setSavedNotice('मूल वेबसाइट / Word मान वापस लिए गए।'); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"><RotateCcw className="h-3.5 w-3.5" />मूल मान</button>}</div></div>
          {savedNotice && <p role="status" className={`rounded-lg p-3 text-xs ${firebaseSyncStatus === 'error' || firebaseSyncStatus === 'offline' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800'}`}>{savedNotice} {firebaseSyncStatus === 'synced' ? 'क्लाउड पर भी सुरक्षित है।' : firebaseSyncStatus === 'error' || firebaseSyncStatus === 'offline' ? 'इस डिवाइस पर सुरक्षित है; क्लाउड सिंक की जाँच करें।' : 'क्लाउड सिंक चल रहा है।'}</p>}
        </>}
      </section>}
      {monthlySelected && isEditMode && editingMonth === reportMonth && baseMonthly && <MonthlyReportEditor key={reportMonth} base={baseMonthly} draft={monthlyReportDrafts?.[reportMonth]} onCancel={() => setEditingMonth(null)} onSave={draft => { const saved = saveMonthlyReportDraft(reportMonth, draft); if (saved) setSavedNotice('इस माह की रिपोर्ट के बदलाव सुरक्षित हैं; अब Word / PDF में आएँगे।'); return saved; }} />}

      {pdfPreview?.files === documentFiles && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4"><h2 className="text-sm font-extrabold">Word के समान PDF • प्रिंट पूर्वावलोकन</h2><button type="button" onClick={() => setPdfPreview(null)} className="text-xs font-bold text-blue-700">बंद करें</button></div><iframe title="रिपोर्ट PDF पूर्वावलोकन और प्रिंट" src={pdfPreview.url} className="h-[75vh] min-h-96 w-full" /><p className="p-3 text-xs text-slate-500">ऊपर PDF व्यूअर का प्रिंट विकल्प चुनें। <a href={pdfPreview.url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline">PDF नए टैब में खोलें</a></p></section>}

      {(!monthlySelected || monthlyResult.data) && <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div><h2 className="text-lg font-black text-slate-900">{report.title}</h2><p className="mt-1 text-xs text-slate-500">संदर्भ तिथि {displayReportDate(report.cutoff)} • {report.scope}</p></div>
        {report.summary && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{report.summary.map((item, index) => <div key={item.label} className={`rounded-2xl border p-4 ${index === 0 ? 'border-blue-100 bg-blue-50/70' : index === 1 ? 'border-emerald-100 bg-emerald-50/70' : index === 2 ? 'border-violet-100 bg-violet-50/70' : 'border-amber-100 bg-amber-50/70'}`}><p className="text-[11px] font-bold text-slate-500">{item.label}</p><p className="mt-2 font-mono text-2xl font-black text-slate-900">{item.value ?? '—'}</p></div>)}</div>}
        {report.notes.length > 0 && <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">{report.notes.map(note => <p key={note} className="flex gap-2 text-xs leading-relaxed text-amber-950"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{note}</p>)}</div>}
        {report.tables.map((table, index) => <div key={index}><h3 className="mb-2 text-sm font-extrabold text-slate-800">{table.title} <span className="font-normal text-slate-400">({table.rows.length} पंक्तियाँ)</span></h3><div className="max-h-[560px] overflow-auto rounded-xl border border-slate-200"><table className="w-full border-collapse text-left text-xs"><thead className="sticky top-0 bg-slate-100 text-slate-700"><tr>{table.headers.map((header, column) => <th key={column} className="min-w-24 border-b border-slate-200 px-3 py-3 font-bold">{header}</th>)}</tr></thead><tbody>{table.rows.length ? table.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">{row.map((value, column) => <td key={column} className={`px-3 py-2.5 align-top ${typeof value === 'number' ? 'font-mono font-bold' : ''}`} title={value === null ? 'जानकारी उपलब्ध नहीं है' : undefined}>{value === null ? <span className="text-slate-400">—</span> : previewText(value)}</td>)}</tr>) : <tr><td colSpan={table.headers.length} className="p-8 text-center text-slate-500">इस चयन में कोई प्रविष्टि नहीं है।</td></tr>}</tbody></table></div></div>)}
      </section>}
    </div>
  );
}
