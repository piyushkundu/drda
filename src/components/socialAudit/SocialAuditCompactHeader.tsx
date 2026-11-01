'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { DISTRICT_META } from '@/data/socialAuditInitialData';
import { 
  Landmark, Calendar, Menu, PanelLeftClose, PanelLeftOpen, 
  Check, Search, Lock, Unlock, SlidersHorizontal, X 
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
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const [isMobileDateOpen, setIsMobileDateOpen] = useState(false);

  // Short formatted date for compact mobile button (e.g. "01 Nov")
  const formatMobileDatePill = (dStr: string) => {
    if (!dStr) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    try {
      const parts = dStr.split('-');
      const day = parts[2] || '';
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${months[mIdx] || parts[1]}`;
    } catch {
      return dStr;
    }
  };

  const { 
    fontViewMode, 
    setFontViewMode, 
    asOfDate, 
    setAsOfDate,
    tickDelhiClock,
    syncWithDelhiTime,
    initFirebaseSync,
    setIsGlobalSearchOpen,
    isEditMode,
    setIsEditMode
  } = useSocialAuditStore();

  const handleToggleEditMode = () => {
    const success = setIsEditMode(!isEditMode);
    if (success) {
      setSyncToast(!isEditMode ? 'संपादन मोड (EDIT MODE ON) सक्रिय हो गया!' : 'केवल पठन मोड (EDIT MODE OFF / READ ONLY)');
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  // Background processes: IST time sync & Firebase synchronization run quietly in the background
  useEffect(() => {
    setMounted(true);
    syncWithDelhiTime();
    initFirebaseSync();

    const tickInterval = setInterval(() => {
      tickDelhiClock();
    }, 1000);

    const syncInterval = setInterval(() => {
      syncWithDelhiTime();
    }, 60000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(syncInterval);
    };
  }, [tickDelhiClock, syncWithDelhiTime, initFirebaseSync]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs shrink-0 select-none">
      
      {/* ===================================================================== */}
      {/* 1. DEDICATED CLEAN MOBILE HEADER (<640px / 320px-430px)               */}
      {/* ===================================================================== */}
      <div className="sm:hidden flex flex-col">
        <div className="h-14 px-3 flex items-center justify-between">
          {/* LEFT: Hamburger Drawer Toggle + Official Emblem + Compact Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="मेन्यू टॉगल करें"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Landmark className="w-4 h-4 text-amber-300" />
            </div>

            <div className="min-w-0 flex items-center gap-1.5">
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight truncate">
                सोशल ऑडिट बागपत
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                26-27
              </span>
            </div>
          </div>

          {/* RIGHT: Compact Controls Only (Search, Date, Settings & Compact Lock Icon) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Global Search Button */}
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="p-2 rounded-xl text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              title="खोजें (Ctrl + K)"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mobile Reference Date Compact Pill Button (<640px) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileDateOpen((prev) => !prev);
                setIsMobileSettingsOpen(false);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                isMobileDateOpen
                  ? 'bg-blue-100 text-blue-900 border-blue-400 ring-2 ring-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="प्रगति संदर्भ तिथि बदलें"
              aria-label="Change Progress Date"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span className="font-mono text-[11px] font-bold text-slate-800">
                {formatMobileDatePill(asOfDate)}
              </span>
            </button>

            {/* Mobile Font Selector Popover Toggle */}
            <button
              onClick={() => setIsMobileSettingsOpen((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors ${
                isMobileSettingsOpen ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="फ़ॉन्ट मोड विकल्प"
              aria-label="Font Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Central Compact Lock / Unlock Icon Button */}
            <button
              type="button"
              onClick={handleToggleEditMode}
              className={`p-2 rounded-xl border transition-all active:scale-95 shrink-0 ${
                isEditMode
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-500 ring-2 ring-emerald-300 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 border-slate-200'
              }`}
              title={
                isEditMode
                  ? 'Edit Mode ON – संपादन की अनुमति'
                  : 'Edit Mode OFF – केवल देखने की अनुमति'
              }
              aria-label={
                isEditMode
                  ? 'Edit Mode ON – संपादन की अनुमति'
                  : 'Edit Mode OFF – केवल देखने की अनुमति'
              }
            >
              {isEditMode ? (
                <Unlock className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Font Selector Dropdown */}
        {isMobileSettingsOpen && (
          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 flex items-center justify-between animate-in slide-in-from-top-1">
            <span className="text-[11px] font-bold text-slate-600">फ़ॉन्ट प्रदर्शन मोड:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setFontViewMode('unicode'); setIsMobileSettingsOpen(false); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  fontViewMode === 'unicode' ? 'bg-blue-700 text-white' : 'bg-white border text-slate-700'
                }`}
              >
                यूनिकोड
              </button>
              <button
                onClick={() => { setFontViewMode('krutidev'); setIsMobileSettingsOpen(false); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  fontViewMode === 'krutidev' ? 'bg-amber-600 text-white' : 'bg-white border text-slate-700'
                }`}
                style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}
              >
                कृतिदेव
              </button>
              <button
                onClick={() => { setFontViewMode('dual'); setIsMobileSettingsOpen(false); }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  fontViewMode === 'dual' ? 'bg-indigo-700 text-white' : 'bg-white border text-slate-700'
                }`}
              >
                द्विभाषी
              </button>
            </div>
          </div>
        )}

        {/* Mobile Reference Date Selector Dropdown */}
        {isMobileDateOpen && (
          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2.5 flex flex-col gap-2 animate-in slide-in-from-top-1 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>प्रगति संदर्भ तिथि चुनें:</span>
              </span>
              <button
                type="button"
                onClick={() => setIsMobileDateOpen(false)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
              >
                ✕ बंद करें
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => {
                  setAsOfDate(e.target.value);
                  setIsMobileDateOpen(false);
                }}
                className="flex-1 bg-white border border-slate-300 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl outline-none focus:border-blue-500 font-mono shadow-2xs"
              />
            </div>

            {/* Quick Presets for Mobile */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <button
                type="button"
                onClick={() => { setAsOfDate('2026-11-01'); setIsMobileDateOpen(false); }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  asOfDate === '2026-11-01' ? 'bg-blue-700 text-white' : 'bg-white border text-slate-700'
                }`}
              >
                01 Nov (आज)
              </button>
              <button
                type="button"
                onClick={() => { setAsOfDate('2026-10-08'); setIsMobileDateOpen(false); }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  asOfDate === '2026-10-08' ? 'bg-blue-700 text-white' : 'bg-white border text-slate-700'
                }`}
              >
                08 Oct (बेसलाइन)
              </button>
              <button
                type="button"
                onClick={() => { setAsOfDate('2026-11-30'); setIsMobileDateOpen(false); }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  asOfDate === '2026-11-30' ? 'bg-blue-700 text-white' : 'bg-white border text-slate-700'
                }`}
              >
                30 Nov
              </button>
              <button
                type="button"
                onClick={() => { setAsOfDate('2026-12-31'); setIsMobileDateOpen(false); }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  asOfDate === '2026-12-31' ? 'bg-blue-700 text-white' : 'bg-white border text-slate-700'
                }`}
              >
                31 Dec
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. DESKTOP & TABLET SINGLE-ROW HEADER (>=640px)                      */}
      {/* ===================================================================== */}
      <div className="hidden sm:flex h-14 sm:h-16 px-3 sm:px-5 items-center justify-between">
        {/* LEFT: Mobile Toggle + Desktop Collapse + Official Government Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Toggle (<lg) */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="नेविगेशन मेन्यू खोलें"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Collapse Toggle (>=lg) */}
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

        {/* CENTER: Prominent Global Search Bar */}
        <div className="flex-1 max-w-xs md:max-w-md mx-3 hidden sm:block">
          <button
            type="button"
            onClick={() => setIsGlobalSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-400 text-xs transition-all shadow-2xs group cursor-pointer"
            title="त्वरित एकीकृत खोज खोलें (Ctrl + K)"
            aria-label="खोजें"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              <span className="text-slate-500 font-medium group-hover:text-slate-800 truncate">ग्राम पंचायत, BRP, बैठक या NSAP खोजें...</span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs shrink-0">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* RIGHT: Essential User-Facing Controls Only (Date + Font Selector + Compact Lock Icon) */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* As-Of Reference Date Selector */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs hover:border-slate-300 transition-colors"
            title="सोशल ऑडिट प्रगति संदर्भ तिथि"
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

          {/* Font View Mode Segmented Selector */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs shrink-0">
            <button
              onClick={() => setFontViewMode('unicode')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                fontViewMode === 'unicode'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="यूनिकोड / मंगल"
            >
              यूनिकोड
            </button>
            <button
              onClick={() => setFontViewMode('krutidev')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                fontViewMode === 'krutidev'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}
              title="कृतिदेव 010"
            >
              कृतिदेव
            </button>
            <button
              onClick={() => setFontViewMode('dual')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                fontViewMode === 'dual'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="द्विभाषी दोनों फ़ॉन्ट"
            >
              द्विभाषी
            </button>
          </div>

          {/* CENTRAL COMPACT EDIT MODE CONTROL (Lock Icon Only) */}
          <button
            type="button"
            onClick={handleToggleEditMode}
            className={`p-2 rounded-xl border transition-all cursor-pointer select-none active:scale-95 shrink-0 group ${
              isEditMode
                ? 'bg-emerald-50 text-emerald-600 border-emerald-500 ring-2 ring-emerald-300 animate-pulse shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 border-slate-200 shadow-2xs'
            }`}
            title={
              isEditMode
                ? 'Edit Mode ON – संपादन की अनुमति'
                : 'Edit Mode OFF – केवल देखने की अनुमति'
            }
            aria-label={
              isEditMode
                ? 'Edit Mode ON – संपादन की अनुमति'
                : 'Edit Mode OFF – केवल देखने की अनुमति'
            }
          >
            {isEditMode ? (
              <Unlock className="w-4 h-4 text-emerald-600" />
            ) : (
              <Lock className="w-4 h-4 text-slate-500 group-hover:text-rose-600 transition-colors" />
            )}
            <span className="sr-only">
              {isEditMode ? 'Edit Mode ON' : 'Edit Mode OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Global Floating Edit Mode Toast Notification (Rendered via React Portal at body root) */}
      {mounted && typeof document !== 'undefined' && syncToast && createPortal(
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-4"
          role="status"
          aria-live="polite"
        >
          <div className={`px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-black border backdrop-blur-md ${
            isEditMode
              ? 'bg-slate-900/95 text-emerald-400 border-emerald-500/80 shadow-emerald-950/40'
              : 'bg-slate-900/95 text-slate-200 border-rose-500/80 shadow-rose-950/40'
          }`}>
            {isEditMode ? (
              <Unlock className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
            ) : (
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="tracking-wide">{syncToast}</span>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
