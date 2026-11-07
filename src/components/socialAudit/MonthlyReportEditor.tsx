'use client';

import { useState } from 'react';
import { RotateCcw, Save, X } from 'lucide-react';
import type { MonthlyReportDraft, MonthlyReportSection } from '@/types/socialAudit';
import { MONTHLY_SECTION_TITLES, monthlyFieldSource, validateMonthlyReportDraft } from '@/lib/socialAuditReports';
import type { MonthlyReportData } from '@/lib/socialAuditReports';

interface Props {
  base: MonthlyReportData;
  draft?: MonthlyReportDraft;
  onSave: (draft: MonthlyReportDraft) => boolean;
  onCancel: () => void;
}

export default function MonthlyReportEditor({ base, draft, onSave, onCancel }: Props) {
  const [values, setValues] = useState({ ...draft?.values });
  const [dates, setDates] = useState({ ...draft?.completeThrough });
  const [error, setError] = useState('');
  const groups = Object.keys(MONTHLY_SECTION_TITLES) as MonthlyReportSection[];
  const save = () => {
    const candidate: MonthlyReportDraft = { values, completeThrough: dates, updatedAt: new Date().toISOString() };
    const message = validateMonthlyReportDraft(base.period.month, candidate, base.period.cutoff);
    if (message) { setError(message); return; }
    if (onSave(candidate)) onCancel();
  };
  return <section className="overflow-hidden rounded-2xl border-2 border-blue-300 bg-white shadow-lg" aria-label="मासिक रिपोर्ट संपादक">
    <div className="flex items-start justify-between gap-3 bg-blue-50 p-4"><div><h3 className="font-extrabold text-blue-950">इस माह की रिपोर्ट में आँकड़े भरें</h3><p className="mt-1 text-xs leading-relaxed text-blue-800">बदले हुए खाने मैनुअल चिह्नित होंगे और इसी माह के Word / PDF में आएँगे। खाली छोड़ने का अर्थ खाली खाना है, शून्य नहीं।</p></div><button type="button" onClick={onCancel} aria-label="संपादक बंद करें" className="rounded-lg p-2 hover:bg-blue-100"><X className="h-4 w-4" /></button></div>
    <div className="max-h-[65vh] space-y-5 overflow-y-auto p-4 sm:p-5">
      {groups.map(group => <div key={group} className="rounded-xl border border-slate-200 p-3 sm:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h4 className="text-sm font-extrabold text-slate-900">{MONTHLY_SECTION_TITLES[group]}</h4><label className="text-[11px] font-bold text-slate-500">डेटा पूर्णता की तिथि<input aria-label={`${MONTHLY_SECTION_TITLES[group]} पूर्णता तिथि`} type="date" min="2026-04-01" max={base.period.cutoff} value={dates[group] ?? base.sectionCompleteThrough?.[group] ?? ''} onChange={event => { const date = event.target.value; setDates(previous => { const next = { ...previous }; if (date) next[group] = date; else delete next[group]; return next; }); }} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800" /></label></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{base.fields[group].map(field => {
          const manual = Object.hasOwn(values, field.key);
          const value = manual ? values[field.key] : field.value;
          return <label key={field.key} className={`rounded-xl border p-3 ${manual ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50/50'}`}><span className="block min-h-8 text-xs font-semibold text-slate-700">{field.label}</span><div className="mt-2 flex gap-2"><input aria-label={field.label} type="number" min="0" step={/financial|misused|recovered|deviation/.test(field.key) ? '0.01' : '1'} value={value ?? ''} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value === '' ? null : Number(event.target.value) }))} className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none" /><button type="button" disabled={!manual} title="वेबसाइट / Word का मूल मान वापस लें" aria-label={`${field.label} मूल मान`} onClick={() => setValues(previous => { const next = { ...previous }; delete next[field.key]; return next; })} className="rounded-lg border border-slate-200 bg-white px-2 text-slate-500 disabled:opacity-30"><RotateCcw className="h-3.5 w-3.5" /></button></div><span className="mt-2 block text-[10px] leading-relaxed text-slate-500">{manual ? 'मैनुअल संशोधन' : monthlyFieldSource(field)}</span></label>;
        })}</div>
      </div>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4">{error && <p role="alert" className="w-full text-xs text-rose-700">{error}</p>}<p className="text-[11px] text-slate-500">मूल पंचायत रिकॉर्ड सुरक्षित रहेंगे। पुराने माह को सेव करने पर ऐतिहासिक बदलाव की चेतावनी आएगी।</p><div className="flex gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600">रद्द करें</button><button type="button" onClick={save} className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white"><Save className="h-4 w-4" />रिपोर्ट में सेव करें</button></div></div>
  </section>;
}
