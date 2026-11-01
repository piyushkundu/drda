'use client';

import React, { useEffect, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { useUIStore } from '@/stores/uiStore';
import { DISTRICT_META } from '@/data/socialAuditInitialData';
import { getDelhiTimeString } from '@/lib/delhiTime';
import { 
  Landmark, Clock, Calendar, Cloud, Server, RefreshCw, 
  Menu, PanelLeftClose, PanelLeftOpen, Sparkles, ChevronRight, 
  Check, User, ShieldCheck, AlertCircle, Radio, SlidersHorizontal,
  MoreVertical, X
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
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

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

  // Format short date for mobile display: DD/MM/YYYY
  const formatShortDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dStr;
    }
  };

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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs shrink-0 select-none">
      
      {/* ===================================================================== */}
      {/* 1. DEDICATED MOBILE HEADER (<640px / 360px-430px) */}
      {/* ===================================================================== */}
      <div className="sm:hidden flex flex-col">
        {/* Mobile Row 1: Hamburger + Logo + Branding + Sync + More Actions */}
        <div className="h-13 px-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger Button (Opens Drawer) */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="मेन्यू खोलें"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Emblem / Logo */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Landmark className="w-4 h-4 text-amber-300" />
            </div>

            {/* Branding Text */}
            <div className="min-w-0 flex items-center gap-1.5">
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight truncate">
                सोशल ऑडिट बागपत
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                26-27
              </span>
            </div>
          </div>

          {/* Quick Actions (Sync + More) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleManualSync}
              className="p-2 rounded-xl text-blue-700 hover:bg-blue-50 transition-colors"
              title="सिंक करें"
            >
              <RefreshCw className={`w-4 h-4 ${firebaseSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsMobileMoreOpen((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors ${
                isMobileMoreOpen ? 'bg-blue-100 text-blue-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="अतिरिक्त विकल्प"
              aria-label="More Actions"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Row 2: Live IST Time + Current Date + Firebase Connection Status */}
        <div className="h-9 px-3 bg-slate-50/90 flex items-center justify-between text-xs font-semibold">
          {/* Clock & Pulse */}
          <div className="flex items-center gap-1.5 text-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono font-bold text-[11px] tabular-nums" suppressHydrationWarning>
              {mounted ? (liveDelhiTime || getDelhiTimeString()) : '--:--:--'}
            </span>
          </div>

          {/* Reference Date Display */}
          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
            <Calendar className="w-3 h-3 text-blue-700" />
            <span>{formatShortDate(asOfDate)}</span>
          </div>

          {/* Firebase Status Badge */}
          <div className="flex items-center gap-1 text-[11px]">
            <span
              className={`inline-flex rounded-full h-2 w-2 ${
                firebaseSyncStatus === 'synced'
                  ? 'bg-emerald-500'
                  : firebaseSyncStatus === 'syncing'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className={`text-[10px] font-bold ${
              firebaseSyncStatus === 'synced' ? 'text-emerald-800' : firebaseSyncStatus === 'syncing' ? 'text-amber-800' : 'text-rose-800'
            }`}>
              {firebaseSyncStatus === 'synced' ? 'क्लाउड सिंक' : firebaseSyncStatus === 'syncing' ? 'सिंकिंग...' : 'ऑफलाइन'}
            </span>
          </div>
        </div>

        {/* Mobile More Actions Popover Drawer */}
        {isMobileMoreOpen && (
          <>
            <div 
              onClick={() => setIsMobileMoreOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-2xs"
            />
            <div className="absolute top-full left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  अतिरिक्त सेटिंग्स व विकल्प
                </span>
                <button
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Full Date Picker */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  <span>कट-ऑफ संदर्भ तिथि बदलें</span>
                </label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold font-mono outline-none focus:border-blue-500"
                />
              </div>

              {/* 2. Font Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">फ़ॉन्ट प्रदर्शन मोड</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setFontViewMode('unicode')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      fontViewMode === 'unicode' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-700'
                    }`}
                  >
                    यूनिकोड
                  </button>
                  <button
                    onClick={() => setFontViewMode('krutidev')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      fontViewMode === 'krutidev' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700'
                    }`}
                    style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}
                  >
                    कृतिदेव
                  </button>
                  <button
                    onClick={() => setFontViewMode('dual')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      fontViewMode === 'dual' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-700'
                    }`}
                  >
                    द्विभाषी
                  </button>
                </div>
              </div>

              {/* 3. Server Health & Cloud Status */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-700">सर्वर स्थिति:</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  serverHealth === 'online' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {serverHealth === 'online' ? 'ऑनलाइन (200 OK)' : 'ऑफलाइन'}
                </span>
              </div>

              {/* 4. Page Hindi Suite Navigation */}
              <button
                onClick={() => { setSidebarPanel('dashboard'); setIsMobileMoreOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold text-xs shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>पेज हिंदी शासकीय ड्राफ्टिंग सुइट में जाएं</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. DESKTOP & TABLET SINGLE-ROW HEADER (>=640px) */}
      {/* ===================================================================== */}
      <div className="hidden sm:flex h-14 sm:h-16 px-3 sm:px-5 items-center justify-between">
        {/* LEFT: Mobile Toggle + Desktop Collapse + Government Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Toggle (Opens Drawer on tablet <lg) */}
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
      </div>

      {/* Floating Sync Toast Notification */}
      {syncToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-emerald-500 text-xs font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}
    </header>
  );
}

