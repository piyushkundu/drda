'use client';

import React, { useEffect, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { useUIStore } from '@/stores/uiStore';
import { DISTRICT_META } from '@/data/socialAuditInitialData';
import { getDelhiTimeString } from '@/lib/delhiTime';
import { 
  Landmark, Clock, Calendar, Cloud, Server, RefreshCw, 
  Menu, PanelLeftClose, PanelLeftOpen, Sparkles, ChevronRight, 
  Check, User, ShieldCheck, AlertCircle, Radio
} from 'lucide-react';

interface CompactHeaderProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SocialAuditCompactHeader({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen
}: CompactHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [serverHealth, setServerHealth] = useState<'checking' | 'online' | 'offline'>('checking');

  const { 
    fontViewMode, 
    setFontViewMode, 
    asOfDate, 
    setAsOfDate,
    liveDelhiTime,
    tickDelhiClock,
    syncWithDelhiTime,
    firebaseSyncStatus,
    firebaseLastSyncedAt,
    initFirebaseSync,
    forceSyncToFirebase
  } = useSocialAuditStore();

  const { setSidebarPanel } = useUIStore();

  // Check actual server API health
  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/time', { cache: 'no-store' });
      setServerHealth(res.ok ? 'online' : 'offline');
    } catch {
      setServerHealth('offline');
    }
  };

  // Clock ticking, Firebase initialization & Server Health
  useEffect(() => {
    setMounted(true);
    syncWithDelhiTime();
    initFirebaseSync();
    checkServerHealth();

    const tickInterval = setInterval(() => {
      tickDelhiClock();
    }, 1000);

    const syncInterval = setInterval(() => {
      syncWithDelhiTime();
      checkServerHealth();
    }, 60000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(syncInterval);
    };
  }, [tickDelhiClock, syncWithDelhiTime, initFirebaseSync]);

  const handleManualSync = async () => {
    setSyncToast('सर्वर से डेटा सिंक हो रहा है...');
    const ok = await forceSyncToFirebase();
    await syncWithDelhiTime();
    await checkServerHealth();
    setSyncToast(ok ? 'सर्वर से पूर्णतः सिंक हो गया!' : 'सिंक में त्रुटि!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs z-30 px-3 sm:px-5 flex items-center justify-between shrink-0 select-none">
      {/* LEFT: Mobile Toggle + Desktop Collapse + Government Branding */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle (Opens Drawer) */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          title="नेविगेशन मेन्यू खोलें"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
          title={isSidebarCollapsed ? 'साइडबार विस्तृत करें' : 'साइडबार संकुचित करें'}
          aria-label="Toggle Sidebar"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-blue-700" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Official Emblem & Branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-center shadow-md shadow-blue-800/20 shrink-0">
            <Landmark className="w-5 h-5 text-amber-300" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
                सोशल ऑडिट बागपत
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                FY {DISTRICT_META.financialYear || '2026-27'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 hidden md:block truncate">
              जनपद बागपत, उत्तर प्रदेश • DDO प्रशासनिक पोर्टल
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Status Badges, Clocks, Sync & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        
        {/* Live Delhi IST Clock Pill */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs shadow-inner"
          title="भारतीय मानक समय (IST) लाइव दिल्ली घड़ी"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono font-bold text-slate-800 tabular-nums text-[11px]" suppressHydrationWarning>
            {mounted ? (liveDelhiTime || getDelhiTimeString()) : '--:--:--'}
          </span>
        </div>

        {/* As-Of Reference Date Selector */}
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs hover:border-slate-300 transition-colors"
          title="सोशल ऑडिट संदर्भ कट-ऑफ तिथि"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="bg-transparent text-slate-800 text-[11px] outline-none cursor-pointer font-bold font-mono"
            title="संदर्भ तिथि बदलें"
          />
        </div>

        {/* Compact Firebase Cloud Connection Status Pill with Tooltip */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[11px] font-bold shadow-xs transition-all cursor-help relative group ${
            firebaseSyncStatus === 'synced'
              ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
              : firebaseSyncStatus === 'syncing' || firebaseSyncStatus === 'loading'
              ? 'bg-amber-50/70 text-amber-800 border-amber-200'
              : 'bg-rose-50/70 text-rose-800 border-rose-200'
          }`}
          title={`फायरबेस क्लाउड: ${
            firebaseSyncStatus === 'synced' 
              ? 'कनेक्टेड व सुरक्षित' 
              : firebaseSyncStatus === 'syncing' 
              ? 'सिंकिंग जारी...' 
              : 'ऑफलाइन/त्रुटि'
          } (अंतिम सिंक: ${firebaseLastSyncedAt || 'सक्रिय'})`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {firebaseSyncStatus === 'syncing' ? (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            ) : null}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                firebaseSyncStatus === 'synced'
                  ? 'bg-emerald-500'
                  : firebaseSyncStatus === 'syncing' || firebaseSyncStatus === 'loading'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
          </span>
          <Cloud className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline text-[10px]">
            {firebaseSyncStatus === 'synced' ? 'क्लाउड' : firebaseSyncStatus === 'syncing' ? 'सिंकिंग' : 'ऑफलाइन'}
          </span>
        </div>

        {/* Compact Server Health Status Indicator */}
        <div 
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-bold shadow-xs transition-all cursor-help ${
            serverHealth === 'online'
              ? 'bg-slate-50 text-slate-700 border-slate-200'
              : serverHealth === 'checking'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
          title={
            serverHealth === 'online' 
              ? 'सर्वर स्थिति: ऑनलाइन एवं सक्रिय (API 200 OK)' 
              : serverHealth === 'checking'
              ? 'सर्वर स्थिति: जांच हो रही है...'
              : 'सर्वर स्थिति: ऑफलाइन / संपर्क विहीन'
          }
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className={`inline-flex rounded-full h-1.5 w-1.5 ${
              serverHealth === 'online' ? 'bg-emerald-500' : serverHealth === 'checking' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
          </span>
          <Server className="w-3.5 h-3.5 text-slate-600" />
        </div>

        {/* Compact Manual Sync Button */}
        <button
          onClick={handleManualSync}
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs shrink-0"
          title="डेटा क्लाउड से रिफ्रेश व सिंक करें"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${firebaseSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">सिंक</span>
        </button>

        {/* Floating Sync Toast Notification */}
        {syncToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-emerald-500 text-xs font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Font View Mode Segmented Selector */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs shrink-0">
          <button
            onClick={() => setFontViewMode('unicode')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              fontViewMode === 'unicode'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="यूनिकोड / मंगल"
          >
            <span className="sm:hidden">यू</span>
            <span className="hidden sm:inline">यूनिकोड</span>
          </button>
          <button
            onClick={() => setFontViewMode('krutidev')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              fontViewMode === 'krutidev'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            style={{ fontFamily: fontViewMode === 'krutidev' ? "'Kruti Dev 010', sans-serif" : undefined }}
            title="कृतिदेव 010"
          >
            <span className="sm:hidden">कृ</span>
            <span className="hidden sm:inline">कृतिदेव</span>
          </button>
          <button
            onClick={() => setFontViewMode('dual')}
            className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              fontViewMode === 'dual'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="द्विभाषी दोनों फ़ॉन्ट"
          >
            <span className="sm:hidden">द्वि</span>
            <span className="hidden sm:inline">द्विभाषी</span>
          </button>
        </div>

        {/* User Account / Page Hindi Suite Jump */}
        <button
          onClick={() => setSidebarPanel('dashboard')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition-all transform active:scale-95 shrink-0"
          title="पेज हिंदी शासकीय ड्राफ्टिंग सुइट में जाएं"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden md:inline">पेज हिंदी सुइट</span>
          <ChevronRight className="w-3 h-3 text-white/70" />
        </button>
      </div>
    </header>
  );
}

