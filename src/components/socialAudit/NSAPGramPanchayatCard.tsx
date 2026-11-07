'use client';

import { Check, Edit3, Eye, FileSpreadsheet, ClipboardPaste, AlertTriangle } from 'lucide-react';
import type { FontViewMode, NSAPGramPanchayatData } from '@/types/socialAudit';
import { renderAuditText } from '@/lib/renderAuditText';
import { getNSAPVerification, NSAP_REVIEW_REQUIRED } from '@/lib/nsapVerification';

interface Props {
  record: NSAPGramPanchayatData;
  index: number;
  fontViewMode: FontViewMode;
  isEditMode: boolean;
  onView: () => void;
  onOpenWorkbook: () => void;
  onPaste: () => void;
}

export default function NSAPGramPanchayatCard({ record, index, fontViewMode, isEditMode, onView, onOpenWorkbook, onPaste }: Props) {
  const stats = getNSAPVerification(record);
  const ineligible = record.beneficiaries.filter(beneficiary => beneficiary.category === 'ineligible').length;
  const deceased = record.beneficiaries.filter(beneficiary => beneficiary.category === 'deceased').length;
  const progress = stats.valid && stats.total > 0 ? Math.round(stats.verified / stats.total * 100) : 0;
  return (
    <article className={`min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${stats.valid ? 'border-slate-200' : 'border-rose-300'}`}>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5">{String(index + 1).padStart(2, '0')}</span>
              <span>{record.block === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'}</span>
            </div>
            <h3 className="mt-2 text-base font-extrabold leading-snug text-slate-900">
              {renderAuditText(fontViewMode, record.gpNameUnicode, record.gpNameKrutiDev)}
            </h3>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${stats.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
            {stats.valid ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {stats.valid ? 'डेटा दर्ज' : NSAP_REVIEW_REQUIRED}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span>सोशल ऑडिट तिथि</span>
          <time className="font-mono font-semibold text-slate-700" dateTime={record.meetingDate}>{record.meetingDate.split('-').reverse().join('/')}</time>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
            <div className="text-[10px] font-semibold text-slate-500">कुल लाभार्थी</div>
            <div className="mt-1 font-mono text-xl font-black text-slate-900">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-center">
            <div className="text-[10px] font-semibold text-emerald-700">कुल सत्यापित</div>
            <div className="mt-1 font-mono text-xl font-black text-emerald-900">{stats.verified}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-center" title="कुल लाभार्थी − कुल सत्यापित">
            <div className="text-[10px] font-semibold text-amber-700">असत्यापित</div>
            <div className={`mt-1 font-mono font-black text-amber-900 ${stats.unverified === null ? 'text-xs' : 'text-xl'}`}>{stats.unverified ?? NSAP_REVIEW_REQUIRED}</div>
          </div>
        </div>
        {stats.valid ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium text-slate-500">
              <span>सत्यापन प्रगति</span><span className="font-mono text-emerald-800">{progress}%</span>
            </div>
            <div role="progressbar" aria-label="लाभार्थी सत्यापन प्रगति" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : <p className="rounded-lg bg-rose-50 p-2 text-[11px] font-medium text-rose-800">कुल और सत्यापित संख्याओं का स्रोत से मिलान करें। असत्यापित संख्या अभी प्रमाणित नहीं है।</p>}
        <div className="flex flex-wrap justify-between gap-1 text-[10px] text-slate-500">
          <span>प्रत्यक्ष: <strong className="font-mono text-slate-700">{record.verifiedDirect}</strong></span>
          <span>परिवार से: <strong className="font-mono text-slate-700">{record.verifiedFamily}</strong></span>
        </div>
        {!stats.breakdownMatches && <p className="text-[10px] text-amber-800">स्रोत में कुल सत्यापित और प्रत्यक्ष/परिवार के विभाजन का मिलान आवश्यक है।</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px]">
          <span className="text-slate-500">नामवार दर्ज मामले</span>
          <div className="flex gap-2">
            <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">अपात्र <strong className="font-mono">{ineligible}</strong></span>
            <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-800">मृतक <strong className="font-mono">{deceased}</strong></span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
        <button type="button" onClick={onView} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
          <Eye className="h-3.5 w-3.5" /> विवरण ({record.beneficiaries.length})
        </button>
        <button type="button" onClick={onOpenWorkbook} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-800" title={`${record.gpNameUnicode} की एक्सेल शीट खोलें`}>
          {isEditMode ? <Edit3 className="h-3.5 w-3.5" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
          {isEditMode ? 'एक्सेल में एडिट' : 'एक्सेल शीट'}
        </button>
        {isEditMode && <button type="button" onClick={onPaste} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" title="इस पंचायत में एक्सेल से पेस्ट करें"><ClipboardPaste className="h-3.5 w-3.5" /></button>}
      </div>
    </article>
  );
}
