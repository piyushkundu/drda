'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BarChart3, CalendarDays, FileText, Search, ShieldCheck, Users } from 'lucide-react';
import { REPORT_CATALOG } from '@/lib/socialAuditReports';
import type { ReportType } from '@/types/socialAudit';

const reportGroup = (id: ReportType) => id === 'monthly_mpr' ? 'मासिक' : id.startsWith('nsap') ? 'एनएसएपी' : id.startsWith('vrp') ? 'वीआरपी' : id.startsWith('brp') ? 'बीआरपी' : 'प्रगति';

export default function ReportCenterTab() {
  const [group, setGroup] = useState('सभी');
  const [query, setQuery] = useState('');
  const reports = REPORT_CATALOG.filter(item => (group === 'सभी' || reportGroup(item.id) === group) && `${item.title} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <div className="space-y-6">
    <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-sm sm:p-8">
      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-blue-100">सोशल ऑडिट • जनपद बागपत • 2026–27</span>
      <h1 className="mt-4 flex items-center gap-3 text-2xl font-black sm:text-3xl"><FileText className="h-7 w-7 text-blue-200" />रिपोर्ट सेंटर</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100">रिपोर्ट चुनें। उसके अलग पेज पर तारीख, फ़िल्टर, पूर्वावलोकन और सभी डाउनलोड मिलेंगे। मासिक रिपोर्ट के आँकड़े भी वहीं भर सकते हैं।</p>
      <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold">{[`${REPORT_CATALOG.length} रिपोर्ट`, 'Word जैसा PDF', 'हिंदी Kruti Dev 010', 'Word • PDF • Excel'].map(label => <span key={label} className="rounded-lg bg-white/10 px-3 py-2">{label}</span>)}</div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div aria-label="रिपोर्ट श्रेणी" className="flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1">{['सभी','मासिक','प्रगति','बीआरपी','वीआरपी','एनएसएपी'].map(item => <button key={item} type="button" onClick={() => setGroup(item)} aria-pressed={group === item} className={`rounded-lg px-3 py-2 text-xs font-bold ${group === item ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}>{item}</button>)}</div>
      <label className="relative"><span className="sr-only">रिपोर्ट खोजें</span><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="रिपोर्ट खोजें…" className="w-64 max-w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-xs outline-none focus:border-blue-500" /></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {reports.map(item => {
        const Icon = item.id === 'monthly_mpr' ? CalendarDays : item.id.startsWith('brp') || item.id.startsWith('vrp') ? Users : item.id.startsWith('nsap') ? ShieldCheck : BarChart3;
        return <Link key={item.id} href={`/social-audit/reports/${item.id}`} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600">
          <div className="mb-4 flex items-center justify-between"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Icon className="h-5 w-5" /></span><span className="text-[10px] font-bold text-slate-400">{reportGroup(item.id)}</span><ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-700" /></div>
          <h2 className="text-sm font-extrabold text-slate-900">{item.title}</h2><p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
          <span className="mt-5 border-t border-slate-100 pt-3 text-[11px] font-bold text-blue-700">रिपोर्ट खोलें <span className="float-right font-normal text-slate-400">Word / PDF / Excel</span></span>
        </Link>;
      })}
    </div>
    {!reports.length && <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">इस खोज में कोई रिपोर्ट नहीं मिली।</p>}
  </div>;
}
