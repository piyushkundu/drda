'use client';

import React, { useEffect, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { useUIStore } from '@/stores/uiStore';
import { FontViewMode } from '@/types/socialAudit';
import { DISTRICT_META } from '@/data/socialAuditInitialData';
import { getDelhiTimeString } from '@/lib/delhiTime';
import { 
  Landmark, Sparkles, FileText, Calendar, Type, 
  ChevronRight, CalendarDays, RefreshCw, LayoutDashboard, Clock, Radio,
  Smartphone, FileSpreadsheet, Users, Cloud, Check
} from 'lucide-react';

export default function SocialAuditHeader() {
  const [mounted, setMounted] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const { 
    fontViewMode, 
    setFontViewMode, 
    asOfDate, 
    setAsOfDate,
    isLiveSync,
    setLiveSync,
    liveDelhiTime,
    liveDelhiDate,
    tickDelhiClock,
    syncWithDelhiTime,
    activeTab, 
    setActiveTab,
    records,
    nsapRecords,
    resetToBaseline,
    firebaseSyncStatus,
    firebaseLastSyncedAt,
    initFirebaseSync,
    forceSyncToFirebase
  } = useSocialAuditStore();

  const { setSidebarPanel } = useUIStore();

  // Keep Delhi time ticking every 1 second, sync online, and initialize Firebase real-time sync
  useEffect(() => {
    setMounted(true);
    // Initial online calibration
    syncWithDelhiTime();

    // Initialize Firebase Cloud Sync (bidirectional real-time)
    initFirebaseSync();

    // 1-second interval to tick the clock live
    const tickInterval = setInterval(() => {
      tickDelhiClock();
    }, 1000);

    // 60-second background sync to avoid any drift
    const syncInterval = setInterval(() => {
      syncWithDelhiTime();
    }, 60000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(syncInterval);
    };
  }, [tickDelhiClock, syncWithDelhiTime, initFirebaseSync]);

  const amendedCount = records.filter(r => r.isAmended).length;
  const nsapCount = records.filter(r => r.hasNSAP).length;
  const upcomingCount = records.filter(r => r.meetingDate >= asOfDate && r.status !== 'completed').length;
  const nirnayCapturedCount = records.filter(r => r.panchayatNirnayStatus === 'captured').length;
  const misFedCount = records.filter(r => r.misStatus === 'fed').length;

  return (
    <header className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Title & Official Branding */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Landmark className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                उत्तर प्रदेश शासन • जिला विकास अधिकारी (DDO) बागपत
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                वित्तीय वर्ष {DISTRICT_META.financialYear}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>सोशल ऑडिट बागपत</span>
              <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                (विकास खण्ड बागपत एवं बड़ौत)
              </span>
            </h1>
          </div>
        </div>

        {/* Right Action Controls: Page Hindi Suite Jump & Font Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Live Delhi (IST) Clock Badge */}
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border shadow-inner transition-all ${
              isLiveSync 
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50' 
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
            }`}
            title={isLiveSync ? "नई दिल्ली (IST) ऑनलाइन समय से लाइव सिंक है" : "कस्टम संदर्भ तिथि सक्रिय है"}
          >
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {isLiveSync && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveSync ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              </span>
              <span className="font-bold text-[10px] tracking-wider uppercase">
                {isLiveSync ? 'लाइव दिल्ली' : 'कस्टम'}
              </span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-1 font-mono font-bold text-white text-[11px]">
              <Clock className={`w-3.5 h-3.5 shrink-0 ${isLiveSync ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="tabular-nums" suppressHydrationWarning>
                {mounted ? (liveDelhiTime || getDelhiTimeString()) : '--:--:--'}
              </span>
            </div>
          </div>

          {/* As-Of Date Reference Selector */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs border transition-all ${
            isLiveSync 
              ? 'bg-slate-800/90 border-slate-700/80' 
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}>
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${isLiveSync ? 'text-blue-400' : 'text-amber-400'}`} />
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {isLiveSync ? 'प्रगति तिथि:' : 'कस्टम तिथि:'}
            </span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-transparent text-white text-xs outline-none cursor-pointer font-bold font-mono"
              title="सोशल ऑडिट की संदर्भ तिथि बदलें"
            />
            {!isLiveSync && (
              <button
                onClick={() => {
                  setLiveSync(true);
                  syncWithDelhiTime(true);
                }}
                className="ml-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all"
                title="आज की लाइव दिल्ली तिथि पर वापस जाएं"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>लाइव करें</span>
              </button>
            )}
          </div>

          {/* Real-time Firebase Cloud Sync Status Button */}
          <button
            onClick={async () => {
              setSyncToast('फायरबेस सर्वर से सिंक हो रहा है...');
              const ok = await forceSyncToFirebase();
              setSyncToast(ok ? 'सर्वर (Firebase) से पूर्णतः सिंक हो गया!' : 'सिंक में त्रुटि!');
              setTimeout(() => setSyncToast(null), 3000);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
              firebaseSyncStatus === 'syncing' || firebaseSyncStatus === 'loading'
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-amber-950/40'
                : firebaseSyncStatus === 'synced'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40 hover:border-emerald-400'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-rose-950/40 hover:border-rose-400'
            }`}
            title="क्लिक करके फायरबेस सर्वर से तुरंत सिंक करें"
          >
            {firebaseSyncStatus === 'syncing' || firebaseSyncStatus === 'loading' ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : firebaseSyncStatus === 'synced' ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="font-bold text-[11px]">
              {firebaseSyncStatus === 'syncing'
                ? 'सर्वर सेविंग...'
                : firebaseSyncStatus === 'loading'
                ? 'लोड हो रहा है...'
                : firebaseSyncStatus === 'synced'
                ? (firebaseLastSyncedAt ? `सर्वर सुरक्षित (${firebaseLastSyncedAt})` : 'सर्वर सुरक्षित ✓')
                : 'सिंक पुनः प्रयास'}
            </span>
          </button>

          {/* Sync Floating Toast */}
          {syncToast && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{syncToast}</span>
            </div>
          )}

          {/* Font View Mode Toggle (Unicode vs KrutiDev vs Dual) */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFontViewMode('unicode')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                fontViewMode === 'unicode'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="यूनिकोड / मंगल फॉन्ट"
            >
              यूनिकोड
            </button>
            <button
              onClick={() => setFontViewMode('krutidev')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                fontViewMode === 'krutidev'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={{ fontFamily: fontViewMode === 'krutidev' ? "'Kruti Dev 010', sans-serif" : undefined }}
              title="कृतिदेव 010 फ़ॉन्ट दृश्य"
            >
              कृतिदेव 010
            </button>
            <button
              onClick={() => setFontViewMode('dual')}
              className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] ${
                fontViewMode === 'dual'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="दोनों फ़ॉन्ट एक साथ"
            >
              द्विभाषी
            </button>
          </div>

          {/* Prominent Button to Jump to Page Hindi Drafting Suite */}
          <button
            onClick={() => setSidebarPanel('dashboard')}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 group"
            title="पेज हिंदी शासकीय ड्राफ्टिंग सुइट खोलें"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 group-hover:rotate-12 transition-transform" />
            <span>पेज हिंदी सुइट</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none border-t border-white/5 pt-3">
        {/* TAB 1: आगामी सभाएं (FIRST) */}
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-300" />
          <span>आगामी सभाएं</span>
          <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-1.5 py-0.2 rounded-full font-bold">
            {upcomingCount}
          </span>
        </button>

        {/* TAB 2: डैशबोर्ड (SECOND) */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'dashboard' || activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>डैशबोर्ड</span>
        </button>

        {/* TAB 3: सोशल ऑडिट कैलेंडर */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>सोशल ऑडिट कैलेंडर (रोस्टर)</span>
          {amendedCount > 0 && (
            <span className="text-[10px] bg-amber-500/30 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded-full font-bold">
              {amendedCount} संशोधित
            </span>
          )}
        </button>

        {/* TAB 4: पंचायत निर्णय ऐप (R 9.6.2) */}
        <button
          onClick={() => setActiveTab('nirnay')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'nirnay'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-300" />
          <span>पंचायत निर्णय ऐप (R 9.6.2)</span>
          <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-bold">
            {nirnayCapturedCount} अपलोड
          </span>
        </button>

        {/* TAB 5: MIS ऑडिट फीडिंग (R 9.1.3) */}
        <button
          onClick={() => setActiveTab('mis-feeding')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'mis-feeding'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-300" />
          <span>MIS ऑडिट फीडिंग (R 9.1.3)</span>
          <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/40 px-1.5 py-0.2 rounded-full font-bold">
            {misFedCount} फीडेड
          </span>
        </button>

        {/* TAB 6: NSAP डेटा (मासिक रिपोर्ट प्रारूप एवं लाभार्थी सूची) */}
        <button
          onClick={() => setActiveTab('nsap-data')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'nsap-data'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-300" />
          <span>NSAP डेटा</span>
          <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-bold">
            {nsapRecords?.length || 16} रिकॉर्डेड
          </span>
        </button>

        {/* TAB 7: NSAP पेंशन रिपोर्ट */}
        <button
          onClick={() => setActiveTab('nsap-report')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'nsap-report'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>NSAP पेंशन रिपोर्ट</span>
          <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-bold">
            {nsapCount}
          </span>
        </button>

        {/* TAB 6: टीम एवं बी०आर०पी० रोस्टर */}
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'roster'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>टीम एवं बी०आर०पी० रोस्टर</span>
        </button>
      </div>
    </header>
  );
}
