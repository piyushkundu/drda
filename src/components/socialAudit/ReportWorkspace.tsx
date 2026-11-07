'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Landmark, Lock, Unlock } from 'lucide-react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { useUIStore } from '@/stores/uiStore';
import ReportCenterTab from './ReportCenterTab';
import ReportDetailPage from './ReportDetailPage';
import type { ReportType } from '@/types/socialAudit';
import { useEditMode } from '@/hooks/useEditMode';

export default function ReportWorkspace({ reportId }: { reportId?: ReportType }) {
  const { initFirebaseSync, syncWithDelhiTime, tickDelhiClock, setActiveTab, firebaseSyncStatus } = useSocialAuditStore();
  const { isEditMode, toggleEditMode } = useEditMode();
  useEffect(() => {
    initFirebaseSync();
    syncWithDelhiTime();
    const tick = setInterval(tickDelhiClock, 1000);
    const sync = setInterval(syncWithDelhiTime, 60000);
    return () => { clearInterval(tick); clearInterval(sync); };
  }, [initFirebaseSync, syncWithDelhiTime, tickDelhiClock]);

  return <div className="social-audit-shell flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-800">
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-blue-800 p-2.5 text-amber-300"><Landmark className="h-5 w-5" /></span><div><p className="text-sm font-black text-slate-900">सोशल ऑडिट बागपत</p><p className="mt-0.5 text-[10px] text-slate-500">रिपोर्ट कार्यक्षेत्र • वित्तीय वर्ष 2026–27</p></div></div>
      <div className="flex flex-wrap items-center gap-3"><span role="status" className={`text-[10px] font-bold ${firebaseSyncStatus === 'synced' ? 'text-emerald-700' : 'text-slate-500'}`}>{firebaseSyncStatus === 'synced' ? 'डेटा सिंक है' : firebaseSyncStatus === 'error' || firebaseSyncStatus === 'offline' ? 'स्थानीय डेटा • सिंक की जाँच करें' : 'डेटा सिंक हो रहा है…'}</span><button type="button" onClick={toggleEditMode} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${isEditMode ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-600'}`} aria-pressed={isEditMode} title={isEditMode ? 'संपादन बंद करें' : 'संपादन खोलें'}>{isEditMode ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{isEditMode ? 'संपादन चालू' : 'केवल पढ़ें'}</button><Link href="/" onClick={() => { useUIStore.getState().setSidebarPanel('social-audit'); setActiveTab('reports'); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" />पोर्टल पर लौटें</Link></div>
    </div></header>
    <main className="flex-1 overflow-y-auto p-3 sm:p-6"><div className="mx-auto max-w-[1600px]">{reportId ? firebaseSyncStatus === 'loading' ? <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">रिपोर्ट के लिए नवीनतम डेटा लोड हो रहा है…</p> : <ReportDetailPage key={reportId} reportId={reportId} /> : <ReportCenterTab />}</div></main>
  </div>;
}
