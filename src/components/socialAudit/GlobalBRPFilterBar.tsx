'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { extractBRPOptions, getBRPDisplayName } from '@/lib/brpHelper';
import { Users, X, ChevronDown, Search, Check } from 'lucide-react';

export default function GlobalBRPFilterBar() {
  const { records, selectedBRP, setSelectedBRP, resetSelectedBRP } = useSocialAuditStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract dynamic BRP options from records
  const brpOptions = useMemo(() => extractBRPOptions(records), [records]);

  // Filter options by search input (matches name and phone number)
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return brpOptions;
    const q = search.toLowerCase().trim();
    return brpOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.phone && opt.phone.includes(q))
    );
  }, [brpOptions, search]);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeDisplayName = useMemo(() => getBRPDisplayName(selectedBRP, records), [selectedBRP, records]);
  const isFiltered = Boolean(selectedBRP && selectedBRP !== 'all');

  // Find active option details
  const activeOption = useMemo(() => {
    if (!isFiltered) return null;
    return brpOptions.find(
      (opt) => opt.id === selectedBRP || opt.phone === selectedBRP || opt.name.includes(selectedBRP)
    );
  }, [isFiltered, selectedBRP, brpOptions]);

  return (
    <div className={`relative w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-3 sm:px-5 py-1.5 transition-all ${
      isOpen ? 'z-50' : 'z-30'
    }`}>
      <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-3">
        {/* Left Section: BRP Selector & Active Controls */}
        <div className="flex items-center gap-2 flex-wrap min-w-0" ref={dropdownRef}>
          {/* Main Filter Icon & Label */}
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs shrink-0">
            <span className={`p-1 rounded-md ${isFiltered ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
              <Users className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-800 font-medium">BRP Filter:</span>
          </div>

          {/* Custom Searchable Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                isFiltered
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="truncate max-w-[160px] sm:max-w-[200px]">
                {activeDisplayName}
              </span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isFiltered ? 'bg-indigo-200/90 text-indigo-900' : 'bg-slate-100 text-slate-600'
              }`}>
                {activeOption ? `${activeOption.totalGPs} GP` : `${records.length} GP`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu - Positioned with safe viewport bounds and highest z-index */}
            {isOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Search Box */}
                <div className="px-2.5 pb-1.5 pt-0.5 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="BRP का नाम खोजें..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Dropdown Options List */}
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
                      <span>सभी BRP</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      !isFiltered ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-slate-600 font-semibold'
                    }`}>
                      {records.length} GP
                    </span>
                  </button>

                  {/* Individual BRP Options - Single compact row each */}
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-slate-400">
                      कोई BRP नहीं मिला
                    </div>
                  ) : (
                    filteredOptions.map((opt) => {
                      const isSelected = selectedBRP === opt.id || selectedBRP === opt.phone || (selectedBRP === opt.name);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          title={opt.phone ? `फोन: ${opt.phone}` : undefined}
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
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            {isSelected && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                            <span className="truncate">{opt.name}</span>
                            {opt.isExBRP && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                                कार्यमुक्त
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-mono ${
                            isSelected ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-600 font-semibold'
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

          {/* Active Filter Pill & Clear Button right next to Dropdown */}
          {isFiltered && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>फ़िल्टर सक्रिय</span>
              </span>
              <button
                type="button"
                onClick={resetSelectedBRP}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-colors"
                title="सभी BRP पर वापस जाएं"
              >
                <X className="w-3 h-3" />
                <span>हटाएं</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Section: Compact Status Notice */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${isFiltered ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
          <span>
            {isFiltered
              ? `चयनित BRP: ${activeOption?.totalGPs || 0} बैठकें फ़िल्टर`
              : `सम्पूर्ण जनपद: ${records.length} बैठकें दृश्यमान`}
          </span>
        </div>
      </div>
    </div>
  );
}
