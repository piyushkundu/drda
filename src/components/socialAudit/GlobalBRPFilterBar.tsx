'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { extractBRPOptions, getBRPDisplayName } from '@/lib/brpHelper';
import { 
  Users, UserCheck, X, ChevronDown, Search, Check, 
  Filter, Sparkles, AlertCircle 
} from 'lucide-react';

export default function GlobalBRPFilterBar() {
  const { records, selectedBRP, setSelectedBRP, resetSelectedBRP, selectedBlock, setSelectedBlock } = useSocialAuditStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract dynamic BRP options from records
  const brpOptions = useMemo(() => extractBRPOptions(records), [records]);

  // Filter options by search input
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return brpOptions;
    const q = search.toLowerCase();
    return brpOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.phone && opt.phone.includes(q))
    );
  }, [brpOptions, search]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeDisplayName = useMemo(() => getBRPDisplayName(selectedBRP, records), [selectedBRP, records]);

  const isFiltered = selectedBRP && selectedBRP !== 'all';

  // Find active option details
  const activeOption = useMemo(() => {
    if (!isFiltered) return null;
    return brpOptions.find(
      (opt) => opt.id === selectedBRP || opt.phone === selectedBRP || opt.name.includes(selectedBRP)
    );
  }, [isFiltered, selectedBRP, brpOptions]);

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-2.5 sm:px-4 py-1.5 transition-all z-20">
      <div className="w-full max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left Section: BRP Selector */}
        <div className="flex items-center gap-2 flex-wrap min-w-0" ref={dropdownRef}>
          {/* Main Filter Icon & Label */}
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs shrink-0">
            <span className={`p-1 rounded-lg ${isFiltered ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
              <Users className="w-3.5 h-3.5" />
            </span>
            <span className="hidden sm:inline text-slate-800">बी०आर०पी० फ़िल्टर:</span>
            <span className="sm:hidden text-slate-800">BRP:</span>
          </div>

          {/* Custom Searchable Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                isFiltered
                  ? 'bg-indigo-50/90 border-indigo-300 text-indigo-900 shadow-xs ring-1 ring-indigo-400/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="truncate max-w-[170px] sm:max-w-[220px]">
                {activeDisplayName}
              </span>
              {activeOption && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-200/80 text-indigo-800 font-bold text-[10px]">
                  {activeOption.totalGPs} GP
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Search Box */}
                <div className="px-2.5 pb-1.5 pt-0.5 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="BRP नाम या फ़ोन नंबर खोजें..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 scrollbar-thin">
                  {/* "All BRP" Option */}
                  <button
                    type="button"
                    onClick={() => {
                      resetSelectedBRP();
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      !isFiltered
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 opacity-80" />
                      <span>सभी बी०आर०पी० (सम्पूर्ण जनपद)</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${!isFiltered ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-semibold'}`}>
                      {records.length} GP
                    </span>
                  </button>

                  {/* Individual BRP Options */}
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-slate-400">
                      कोई बी०आर०पी० नहीं मिला
                    </div>
                  ) : (
                    filteredOptions.map((opt) => {
                      const isSelected = selectedBRP === opt.id || selectedBRP === opt.phone || (selectedBRP === opt.name);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedBRP(opt.id);
                            setIsOpen(false);
                            setSearch('');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              {isSelected && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                              <span className="truncate">{opt.name}</span>
                              {opt.isExBRP && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                                  कार्यमुक्त
                                </span>
                              )}
                            </div>
                            {opt.phone && (
                              <div className="text-[10px] text-slate-500 font-mono pl-4.5">
                                📞 {opt.phone} • बागपत: {opt.baghpatGPs} | बड़ौत: {opt.barautGPs}
                              </div>
                            )}
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 font-bold'
                          }`}>
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

          {/* Quick 1-tap Pills for Top Active BRPs on larger screens */}
          <div className="hidden lg:flex items-center gap-1">
            {brpOptions.filter(b => !b.isExBRP).slice(0, 4).map((b) => {
              const isSelected = selectedBRP === b.id || selectedBRP === b.phone;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBRP(isSelected ? 'all' : b.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
                  }`}
                  title={`${b.name} (${b.totalGPs} GP)`}
                >
                  {b.name.split(' ')[0]} ({b.totalGPs})
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section: Active Filter Status / Reset Action */}
        <div className="flex items-center gap-2 shrink-0">
          {isFiltered ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100/90 text-indigo-900 border border-indigo-200 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span className="hidden sm:inline">सक्रिय फ़िल्टर:</span>
                <span className="truncate max-w-[120px]">{activeDisplayName}</span>
                {activeOption && <span>({activeOption.totalGPs} GP)</span>}
              </span>
              <button
                type="button"
                onClick={resetSelectedBRP}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-medium transition-colors"
                title="सभी बी०आर०पी० पर वापस जाएं"
              >
                <X className="w-3 h-3" />
                <span className="hidden sm:inline">फ़िल्टर हटाएं</span>
                <span className="sm:hidden">हटाएं</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>सम्पूर्ण जनपद डेटा दृश्यमान (88 GP)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
