'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { AuditBlock } from '@/types/socialAudit';
import { extractBRPOptions, getBRPDisplayName } from '@/lib/brpHelper';
import { 
  getAvailableBRPOptionsForBlock, 
  filterRecordsByGlobalFilters, 
  calculatePresetDateRange, 
  formatRangeLabel, 
  validateDateRange,
  DateRangePreset
} from '@/lib/globalFilterHelper';
import { 
  Users, Building2, Calendar, X, ChevronDown, Search, 
  Check, RotateCcw, Filter, AlertCircle, CalendarDays 
} from 'lucide-react';

export default function GlobalBRPFilterBar() {
  const { 
    records, 
    selectedBRP, 
    setSelectedBRP, 
    resetSelectedBRP,
    selectedBlock,
    setSelectedBlock,
    dateRange,
    setDateRange,
    resetDateRange,
    resetAllGlobalFilters,
    asOfDate
  } = useSocialAuditStore();

  // Dropdown open states
  const [isBRPOpen, setIsBRPOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  // Search in BRP dropdown
  const [brpSearch, setBrpSearch] = useState('');

  // Local draft state for custom date inputs
  const [customStart, setCustomStart] = useState(dateRange.startDate || '');
  const [customEnd, setCustomEnd] = useState(dateRange.endDate || '');
  const [dateError, setDateError] = useState<string | null>(null);

  // Sync draft dates when store updates
  useEffect(() => {
    setCustomStart(dateRange.startDate || '');
    setCustomEnd(dateRange.endDate || '');
    setDateError(null);
  }, [dateRange.startDate, dateRange.endDate]);

  // Outside click refs
  const brpRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (brpRef.current && !brpRef.current.contains(target)) {
        setIsBRPOpen(false);
      }
      if (blockRef.current && !blockRef.current.contains(target)) {
        setIsBlockOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(target)) {
        setIsDateOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsBRPOpen(false);
        setIsBlockOpen(false);
        setIsDateOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filtered records across all 3 active global filters
  const filteredRecords = useMemo(() => {
    return filterRecordsByGlobalFilters(records, selectedBRP, selectedBlock, dateRange);
  }, [records, selectedBRP, selectedBlock, dateRange]);

  // Dynamic BRP options for the currently selected block
  const brpOptions = useMemo(() => {
    return getAvailableBRPOptionsForBlock(records, selectedBlock);
  }, [records, selectedBlock]);

  // Filter BRP list by search
  const filteredBrpOptions = useMemo(() => {
    if (!brpSearch.trim()) return brpOptions;
    const q = brpSearch.toLowerCase().trim();
    return brpOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.phone && opt.phone.includes(q))
    );
  }, [brpOptions, brpSearch]);

  // Block counts
  const totalBaghpat = useMemo(() => records.filter((r) => r.block === 'Baghpat').length, [records]);
  const totalBaraut = useMemo(() => records.filter((r) => r.block === 'Baraut').length, [records]);

  // Active filter checks
  const isBRPFiltered = Boolean(selectedBRP && selectedBRP !== 'all');
  const isBlockFiltered = Boolean(selectedBlock && selectedBlock !== 'all');
  const isDateFiltered = Boolean(
    (dateRange && dateRange.preset !== 'all') ||
    Boolean(dateRange?.startDate) ||
    Boolean(dateRange?.endDate)
  );
  const isAnyFilterActive = isBRPFiltered || isBlockFiltered || isDateFiltered;

  // Active BRP display name
  const activeBRPName = useMemo(() => {
    if (!isBRPFiltered) return 'सभी BRP';
    const found = brpOptions.find((o) => o.id === selectedBRP || o.phone === selectedBRP || o.name.includes(selectedBRP));
    return found?.name || getBRPDisplayName(selectedBRP, records);
  }, [isBRPFiltered, selectedBRP, brpOptions, records]);

  // Active BRP GP count
  const activeBRPGpCount = useMemo(() => {
    if (!isBRPFiltered) return records.length;
    const found = brpOptions.find((o) => o.id === selectedBRP || o.phone === selectedBRP || o.name.includes(selectedBRP));
    return found ? found.totalGPs : 0;
  }, [isBRPFiltered, selectedBRP, brpOptions, records]);

  // Block display name
  const activeBlockLabel = useMemo(() => {
    if (selectedBlock === 'Baghpat') return 'बागपत';
    if (selectedBlock === 'Baraut') return 'बड़ौत';
    return 'सभी विकास खंड';
  }, [selectedBlock]);

  // Date range display label
  const activeDateLabel = useMemo(() => {
    return formatRangeLabel(dateRange);
  }, [dateRange]);

  // Handle Preset selection
  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === 'all') {
      resetDateRange();
      setIsDateOpen(false);
      return;
    }
    const computed = calculatePresetDateRange(preset, asOfDate);
    setDateRange({
      startDate: computed.startDate,
      endDate: computed.endDate,
      preset,
    });
    setIsDateOpen(false);
  };

  // Handle Custom date apply
  const handleApplyCustomDates = () => {
    const err = validateDateRange(customStart, customEnd);
    if (err) {
      setDateError(err);
      return;
    }
    setDateError(null);
    setDateRange({
      startDate: customStart,
      endDate: customEnd,
      preset: 'custom',
    });
    setIsDateOpen(false);
  };

  const isAnyDropdownOpen = isBRPOpen || isBlockOpen || isDateOpen;

  return (
    <div
      className={`relative w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-3 sm:px-5 py-2 transition-all ${
        isAnyDropdownOpen ? 'z-50' : 'z-30'
      }`}
    >
      <div className="w-full max-w-[1920px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* ================================================================= */}
        {/* LEFT / CENTER: The 4 Toolbar Controls                             */}
        {/* Layout: BRP Filter | Block Filter | Date Range | Reset Filters    */}
        {/* ================================================================= */}
        <div className="flex items-center flex-wrap gap-2 min-w-0">

          {/* ------------------------------------------------------------- */}
          {/* 1. BRP FILTER DROPDOWN                                        */}
          {/* ------------------------------------------------------------- */}
          <div className="relative" ref={brpRef}>
            <button
              type="button"
              onClick={() => {
                setIsBRPOpen(!isBRPOpen);
                setIsBlockOpen(false);
                setIsDateOpen(false);
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isBRPFiltered
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="बी०आर०पी० के अनुसार फ़िल्टर करें"
            >
              <div className={`p-1 rounded-md ${isBRPFiltered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-left truncate">
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">BRP:</span>
                <span className="truncate max-w-[130px] sm:max-w-[170px] text-slate-900 font-bold">
                  {activeBRPName}
                </span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isBRPFiltered ? 'bg-indigo-200 text-indigo-950' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activeBRPGpCount} GP
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isBRPOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* BRP Dropdown Menu */}
            {isBRPOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-68 sm:w-76 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Search Box */}
                <div className="px-3 pb-2 pt-0.5 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="BRP नाम या फ़ोन खोजें..."
                      value={brpSearch}
                      onChange={(e) => setBrpSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Options List */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
                  {/* All BRP */}
                  <button
                    type="button"
                    onClick={() => {
                      resetSelectedBRP();
                      setIsBRPOpen(false);
                      setBrpSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      !isBRPFiltered
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 opacity-80" />
                      <span>सभी बी०आर०पी० (All BRPs)</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        !isBRPFiltered ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {selectedBlock === 'all'
                        ? `${records.length} GP`
                        : `${records.filter((r) => r.block === selectedBlock).length} GP`}
                    </span>
                  </button>

                  {/* Individual BRP Options */}
                  {filteredBrpOptions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">
                      कोई BRP उपलब्ध नहीं
                    </div>
                  ) : (
                    filteredBrpOptions.map((opt) => {
                      const isSelected = selectedBRP === opt.id || selectedBRP === opt.phone || selectedBRP === opt.name;
                      const hasZeroInBlock = opt.totalGPs === 0;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={hasZeroInBlock}
                          title={opt.phone ? `फोन: ${opt.phone}` : undefined}
                          onClick={() => {
                            setSelectedBRP(opt.id);
                            setIsBRPOpen(false);
                            setBrpSearch('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                            hasZeroInBlock
                              ? 'opacity-40 cursor-not-allowed text-slate-400'
                              : isSelected
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-800 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            <span className="truncate">{opt.name}</span>
                            {opt.isExBRP && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                                कार्यमुक्त
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-mono font-bold ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.totalGPs} GP
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 2. BLOCK FILTER DROPDOWN                                      */}
          {/* ------------------------------------------------------------- */}
          <div className="relative" ref={blockRef}>
            <button
              type="button"
              onClick={() => {
                setIsBlockOpen(!isBlockOpen);
                setIsBRPOpen(false);
                setIsDateOpen(false);
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isBlockFiltered
                  ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="विकास खंड (Block) के अनुसार फ़िल्टर करें"
            >
              <div className={`p-1 rounded-md ${isBlockFiltered ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-left">
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">ब्लॉक:</span>
                <span className="text-slate-900 font-bold">{activeBlockLabel}</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isBlockFiltered ? 'bg-blue-200 text-blue-950' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {selectedBlock === 'all'
                  ? `${records.length} GP`
                  : selectedBlock === 'Baghpat'
                  ? `${totalBaghpat} GP`
                  : `${totalBaraut} GP`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isBlockOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Block Dropdown Menu */}
            {isBlockOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                {/* All Blocks */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlock('all');
                    setIsBlockOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    selectedBlock === 'all'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 opacity-80" />
                    <span>सभी विकास खंड (All)</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      selectedBlock === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {records.length} GP
                  </span>
                </button>

                {/* Baghpat */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlock('Baghpat');
                    setIsBlockOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    selectedBlock === 'Baghpat'
                      ? 'bg-blue-50 border border-blue-200 text-blue-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedBlock === 'Baghpat' && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    <span>बागपत (Baghpat)</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      selectedBlock === 'Baghpat' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {totalBaghpat} GP
                  </span>
                </button>

                {/* Baraut */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlock('Baraut');
                    setIsBlockOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    selectedBlock === 'Baraut'
                      ? 'bg-blue-50 border border-blue-200 text-blue-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedBlock === 'Baraut' && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    <span>बड़ौत (Baraut)</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      selectedBlock === 'Baraut' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {totalBaraut} GP
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 3. DATE RANGE FILTER POPOVER                                  */}
          {/* ------------------------------------------------------------- */}
          <div className="relative" ref={dateRef}>
            <button
              type="button"
              onClick={() => {
                setIsDateOpen(!isDateOpen);
                setIsBRPOpen(false);
                setIsBlockOpen(false);
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isDateFiltered
                  ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="बैठक तिथि अवधि (Date Range) के अनुसार फ़िल्टर करें"
            >
              <div className={`p-1 rounded-md ${isDateFiltered ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-left truncate">
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">तिथि:</span>
                <span className="truncate max-w-[120px] sm:max-w-[160px] text-slate-900 font-bold">
                  {activeDateLabel}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isDateOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Date Range Popover */}
            {isDateOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 md:left-0 top-full mt-1.5 w-76 sm:w-84 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <CalendarDays className="w-4 h-4 text-amber-600" />
                    <span>बैठक तिथि फ़िल्टर (Meeting Date)</span>
                  </div>
                  {isDateFiltered && (
                    <button
                      type="button"
                      onClick={() => {
                        resetDateRange();
                        setIsDateOpen(false);
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      रीसेट
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                    त्वरित विकल्प (Presets)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('all')}
                      className={`px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors font-medium cursor-pointer ${
                        dateRange.preset === 'all'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      सभी तिथियां
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('today')}
                      className={`px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors font-medium cursor-pointer ${
                        dateRange.preset === 'today'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      आज की सभाएं
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('next7')}
                      className={`px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors font-medium cursor-pointer ${
                        dateRange.preset === 'next7'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      अगले 7 दिन
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('next30')}
                      className={`px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors font-medium cursor-pointer ${
                        dateRange.preset === 'next30'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      अगले 30 दिन
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('thisMonth')}
                      className={`col-span-2 px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors font-medium cursor-pointer ${
                        dateRange.preset === 'thisMonth'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      इस माह की सभाएं (Current Month)
                    </button>
                  </div>
                </div>

                {/* Custom Date Inputs */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    कस्टम तारीख चुनें (Custom Range)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">प्रारंभ तिथि:</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => {
                          setCustomStart(e.target.value);
                          setDateError(null);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">समापन तिथि:</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => {
                          setCustomEnd(e.target.value);
                          setDateError(null);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {dateError && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{dateError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsDateOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCustomDates}
                      className="px-3.5 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      लागू करें
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 4. ACTIVE FILTER BADGE & ONE-CLICK RESET BUTTON                */}
          {/* ------------------------------------------------------------- */}
          {isAnyFilterActive && (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-100 text-indigo-950 border border-indigo-200 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span>फ़िल्टर सक्रिय</span>
              </span>
              <button
                type="button"
                onClick={resetAllGlobalFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                title="सभी फ़िल्टर (BRP, ब्लॉक, तिथि) हटाएं"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>रीसेट</span>
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* RIGHT: Status Indicator & Visible GP Count                        */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between md:justify-end gap-2 text-xs font-medium shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isAnyFilterActive ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="text-slate-600 font-semibold text-[11px] sm:text-xs">
              {isAnyFilterActive ? (
                <>
                  फ़िल्टर्ड दृश्य:{' '}
                  <strong className="text-indigo-950 font-black">{filteredRecords.length}</strong>
                  <span className="text-slate-400 font-mono"> / {records.length} बैठकें</span>
                </>
              ) : (
                <>
                  सम्पूर्ण जनपद:{' '}
                  <strong className="text-slate-900 font-black">{records.length}</strong> बैठकें दृश्यमान
                </>
              )}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
