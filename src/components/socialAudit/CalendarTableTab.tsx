'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { renderAuditText } from '@/lib/renderAuditText';
import { SocialAuditRecord, AuditBlock, AuditStatus } from '@/types/socialAudit';
import { exportCalendarExcel } from '@/lib/exportSocialAuditExcel';
import { exportCalendarPDF, exportBRPCalendarPDF } from '@/lib/exportSocialAuditPdf';
import { matchesBRP, extractBRPOptions } from '@/lib/brpHelper';
import {
  getEffectiveMeetingDate,
  isMeetingAmended,
  getOriginalMeetingDate,
  formatDisplayDate,
  isMeetingCompletedEffective
} from '@/lib/dateResolution';
import { matchesTeamMember, extractTeamMemberOptions } from '@/lib/teamMemberHelper';
import { saveAs } from 'file-saver';
import { 
  Search, Filter, Calendar as CalendarIcon, Download, 
  Edit3, Plus, RotateCcw, CheckCircle2, AlertTriangle, 
  Layers, Phone, User, Users, Shield, FileSpreadsheet,
  ChevronLeft, ChevronRight, Check, X, Eye, CalendarDays,
  Lock, Unlock, FileText, ChevronDown, UserCheck
} from 'lucide-react';

export default function CalendarTableTab() {
  const {
    records,
    selectedBRP,
    selectedTeamMember,
    setSelectedTeamMember,
    resetSelectedTeamMember,
    dateRange,
    fontViewMode,
    selectedBlock,
    setSelectedBlock,
    selectedScheme,
    setSelectedScheme,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    isEditMode,
    setIsEditMode,
    openEditModal,
    openAddModal,
    openGPProfile,
    openCompletionModal,
    canCompleteMeeting,
    markCompleted,
    resetToBaseline,
    asOfDate,
    vrpMembers
  } = useSocialAuditStore();

  const [viewType, setViewType] = useState<'table' | 'calendar'>('table');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10'); // YYYY-MM
  const [downloading, setDownloading] = useState(false);

  // Dropdown states for export menus
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);
  const excelMenuRef = useRef<HTMLDivElement>(null);

  // Team Member dropdown state
  const [isTeamFilterOpen, setIsTeamFilterOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const teamFilterRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target as Node)) {
        setIsPdfMenuOpen(false);
      }
      if (excelMenuRef.current && !excelMenuRef.current.contains(e.target as Node)) {
        setIsExcelMenuOpen(false);
      }
      if (teamFilterRef.current && !teamFilterRef.current.contains(e.target as Node)) {
        setIsTeamFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Universal font renderer respecting fontViewMode with bidirectional fallback
  const renderText = (unicodeText?: string, krutiText?: string) => {
    return renderAuditText(fontViewMode, unicodeText, krutiText);
  };

  const formatDate = (dateStr?: string) => formatDisplayDate(dateStr);

  // Extract all dynamic BRP and Team Member options
  const brpOptions = useMemo(() => extractBRPOptions(records), [records]);
  const activeBRPOption = useMemo(() => {
    if (!selectedBRP || selectedBRP === 'all') return null;
    return brpOptions.find(b => b.id === selectedBRP || b.name === selectedBRP || b.phone === selectedBRP);
  }, [brpOptions, selectedBRP]);

  const teamMemberOptions = useMemo(() => {
    return extractTeamMemberOptions(records, vrpMembers);
  }, [records, vrpMembers]);

  const filteredTeamOptions = useMemo(() => {
    if (!teamSearch.trim()) return teamMemberOptions;
    const q = teamSearch.toLowerCase().trim();
    return teamMemberOptions.filter(t => t.name.toLowerCase().includes(q));
  }, [teamMemberOptions, teamSearch]);

  // Unified Effective Records based on global BRP, Team Member, and Date Range
  const effectiveRecords = useMemo(() => {
    return records.filter((r) => {
      if (!matchesBRP(r, selectedBRP)) return false;
      if (!matchesTeamMember(r, selectedTeamMember)) return false;
      const effDate = getEffectiveMeetingDate(r);
      if (dateRange && (dateRange.startDate || dateRange.endDate)) {
        if (dateRange.startDate && effDate < dateRange.startDate) return false;
        if (dateRange.endDate && effDate > dateRange.endDate) return false;
      }
      return true;
    });
  }, [records, selectedBRP, selectedTeamMember, dateRange]);

  // Unified Filtered Records - Single source of truth for Table, Monthly Grid & Exports
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Block filter
      if (selectedBlock !== 'all' && r.block !== selectedBlock) return false;

      // 2. Global BRP filter
      if (!matchesBRP(r, selectedBRP)) return false;

      // 3. Team Member filter
      if (!matchesTeamMember(r, selectedTeamMember)) return false;

      // 4. Scheme filter
      if (selectedScheme === 'nsap' && !r.hasNSAP) return false;
      if (selectedScheme === 'mgnrega' && !r.hasMGNREGA) return false;
      if (selectedScheme === 'pmayg' && !r.hasPMAYG) return false;

      // 5. Effective Date & Status
      const effDate = getEffectiveMeetingDate(r);
      const isComp = isMeetingCompletedEffective(r, asOfDate);
      const amended = isMeetingAmended(r);

      if (selectedStatus === 'amended' && !amended) return false;
      if (selectedStatus === 'completed' && !isComp) return false;
      if (selectedStatus === 'upcoming' && (isComp || effDate <= asOfDate)) return false;
      if (selectedStatus === 'overdue' && (isComp || effDate > asOfDate)) return false;

      // 6. Global Date Range (inclusive on effective meeting date)
      if (dateRange && (dateRange.startDate || dateRange.endDate)) {
        if (dateRange.startDate && effDate < dateRange.startDate) return false;
        if (dateRange.endDate && effDate > dateRange.endDate) return false;
      }

      // 7. Search query matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const origDate = getOriginalMeetingDate(r) || '';
        const matchUnicode = 
          r.gpNameUnicode.toLowerCase().includes(q) ||
          r.brpUnicode.toLowerCase().includes(q) ||
          r.teamMembersUnicode.toLowerCase().includes(q) ||
          r.supervisorOfficerUnicode.toLowerCase().includes(q) ||
          r.blockHindi.toLowerCase().includes(q);

        const matchKruti =
          r.gpNameKrutiDev.toLowerCase().includes(q) ||
          r.brpKrutiDev.toLowerCase().includes(q) ||
          r.teamMembersKrutiDev.toLowerCase().includes(q);

        const matchDate = effDate.includes(q) || r.meetingDate.includes(q) || origDate.includes(q) || r.startDate.includes(q);

        if (!matchUnicode && !matchKruti && !matchDate) return false;
      }

      return true;
    });
  }, [records, selectedBlock, selectedBRP, selectedTeamMember, selectedScheme, selectedStatus, searchQuery, dateRange, asOfDate]);

  // Status counts for filter buttons
  const statusCounts = useMemo(() => {
    const base = records.filter(r => {
      if (selectedBlock !== 'all' && r.block !== selectedBlock) return false;
      if (!matchesBRP(r, selectedBRP)) return false;
      if (!matchesTeamMember(r, selectedTeamMember)) return false;
      if (selectedScheme === 'nsap' && !r.hasNSAP) return false;
      if (selectedScheme === 'mgnrega' && !r.hasMGNREGA) return false;
      if (selectedScheme === 'pmayg' && !r.hasPMAYG) return false;
      return true;
    });

    const amended = base.filter(r => isMeetingAmended(r)).length;
    const completed = base.filter(r => isMeetingCompletedEffective(r, asOfDate)).length;
    const upcoming = base.filter(r => !isMeetingCompletedEffective(r, asOfDate) && getEffectiveMeetingDate(r) > asOfDate).length;
    const overdue = base.filter(r => !isMeetingCompletedEffective(r, asOfDate) && getEffectiveMeetingDate(r) <= asOfDate).length;

    return {
      all: base.length,
      amended,
      completed,
      upcoming,
      overdue
    };
  }, [records, selectedBlock, selectedBRP, selectedTeamMember, selectedScheme, asOfDate]);

  // Applied Filters Summary string for reports and headers
  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedBlock !== 'all') {
      parts.push(`विकास खंड: ${selectedBlock === 'Baghpat' ? 'बागपत' : 'बड़ौत'}`);
    } else {
      parts.push('विकास खंड: सभी');
    }
    if (selectedBRP && selectedBRP !== 'all') {
      parts.push(`बी०आर०पी०: ${activeBRPOption?.name || selectedBRP}`);
    }
    if (selectedTeamMember && selectedTeamMember !== 'all') {
      parts.push(`टीम सदस्य: ${selectedTeamMember}`);
    }
    if (selectedScheme !== 'all') {
      parts.push(`योजना: ${selectedScheme === 'nsap' ? 'NSAP पेंशन' : selectedScheme === 'mgnrega' ? 'मनरेगा' : 'प्र०आ०ग्रा०'}`);
    }
    if (selectedStatus !== 'all') {
      parts.push(`स्थिति: ${selectedStatus === 'amended' ? 'संशोधित' : selectedStatus === 'completed' ? 'सम्पन्न' : selectedStatus === 'upcoming' ? 'प्रस्तावित' : 'लंबित'}`);
    }
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      parts.push(`तिथि रेंज: ${formatDisplayDate(dateRange.startDate)} से ${formatDisplayDate(dateRange.endDate)}`);
    }
    if (searchQuery.trim()) {
      parts.push(`खोज: "${searchQuery.trim()}"`);
    }
    parts.push(`कुल रिकॉर्ड: ${filteredRecords.length}`);
    return parts.join(' | ');
  }, [selectedBlock, selectedBRP, activeBRPOption, selectedTeamMember, selectedScheme, selectedStatus, dateRange, searchQuery, filteredRecords.length]);

  // Handle Excel download (strictly filtered records)
  const handleDownloadExcel = async (mode: 'krutidev' | 'unicode') => {
    if (filteredRecords.length === 0) {
      alert('डाउनलोड करने के लिए कोई रिकॉर्ड उपलब्ध नहीं है।');
      return;
    }
    setDownloading(true);
    setIsExcelMenuOpen(false);
    try {
      await exportCalendarExcel(filteredRecords, {
        fontMode: mode,
        appliedFiltersSummary: activeFiltersSummary,
        reportTitle: `Social_Audit_Calendar_${mode}`
      });
    } catch (err) {
      console.error('Download error:', err);
      alert('Excel डाउनलोड करने में त्रुटि आई।');
    } finally {
      setDownloading(false);
    }
  };

  // Handle PDF download (strictly filtered records)
  const handleDownloadPDF = async (mode: 'krutidev' | 'unicode') => {
    if (filteredRecords.length === 0) {
      alert('डाउनलोड करने के लिए कोई रिकॉर्ड उपलब्ध नहीं है।');
      return;
    }
    setDownloading(true);
    setIsPdfMenuOpen(false);
    try {
      const blob = await exportCalendarPDF(filteredRecords, {
        fontMode: mode,
        appliedFiltersSummary: activeFiltersSummary,
        asOfDate
      });
      const fileName = `Social_Audit_Calendar_${mode}_${new Date().toISOString().slice(0, 10)}.pdf`;
      saveAs(blob, fileName);
    } catch (err) {
      console.error('PDF Download error:', err);
      alert('PDF डाउनलोड करने में त्रुटि आई।');
    } finally {
      setDownloading(false);
    }
  };

  // Handle BRP-specific PDF download
  const handleDownloadBRPPDF = async (brpTarget: string, mode: 'krutidev' | 'unicode' = 'krutidev') => {
    setDownloading(true);
    setIsPdfMenuOpen(false);
    try {
      const brpOpt = brpOptions.find(b => b.id === brpTarget || b.name === brpTarget || b.phone === brpTarget);
      const blob = await exportBRPCalendarPDF(records, brpTarget, {
        fontMode: mode,
        brpName: brpOpt?.name,
        brpPhone: brpOpt?.phone,
        asOfDate
      });
      const fileName = `BRP_Calendar_${(brpOpt?.name || brpTarget).replace(/\s+/g, '_')}_${mode}_${new Date().toISOString().slice(0, 10)}.pdf`;
      saveAs(blob, fileName);
    } catch (err) {
      console.error('BRP PDF Download error:', err);
      alert('BRP कैलेंडर PDF डाउनलोड करने में त्रुटि आई।');
    } finally {
      setDownloading(false);
    }
  };

  // Month order & Hindi mappings for navigation
  const monthOrder = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'];
  const monthNames: Record<string, string> = {
    '09': 'सितम्बर 2026',
    '10': 'अक्टूबर 2026',
    '11': 'नवम्बर 2026',
    '12': 'दिसम्बर 2026',
    '01': 'जनवरी 2027'
  };

  const getHindiDayName = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const hindiDays = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
      return hindiDays[date.getDay()] || '';
    } catch {
      return '';
    }
  };

  const formatDateHiLong = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const hindiMonths: Record<string, string> = {
        '01': 'जनवरी', '02': 'फ़रवरी', '03': 'मार्च', '04': 'अप्रैल',
        '05': 'मई', '06': 'जून', '07': 'जुलाई', '08': 'अगस्त',
        '09': 'सितम्बर', '10': 'अक्टूबर', '11': 'नवम्बर', '12': 'दिसम्बर'
      };
      return `${parseInt(d, 10)} ${hindiMonths[m] || m} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const handlePrevMonth = () => {
    const idx = monthOrder.indexOf(selectedMonth);
    if (idx > 0) setSelectedMonth(monthOrder[idx - 1]);
  };

  const handleNextMonth = () => {
    const idx = monthOrder.indexOf(selectedMonth);
    if (idx < monthOrder.length - 1) setSelectedMonth(monthOrder[idx + 1]);
  };

  // Selected date in monthly calendar for detailed bottom table view
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>('2026-10-12');

  // Calendar days generation for Monthly Calendar Grid view (using effective meeting date)
  const calendarDays = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayMeetings = filteredRecords.filter((r) => getEffectiveMeetingDate(r) === dateStr);
      days.push({ dayNumber: d, dateStr, meetings: dayMeetings });
    }
    return days;
  }, [selectedMonth, filteredRecords]);

  // Meetings for currently selected date in calendar
  const selectedDateMeetings = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return filteredRecords.filter((r) => getEffectiveMeetingDate(r) === selectedCalendarDate);
  }, [filteredRecords, selectedCalendarDate]);

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-white/90 border border-slate-200/90 rounded-2xl p-4 shadow-sm backdrop-blur-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ग्राम पंचायत, बी०आर०पी०, अधिकारी, टीम या दिनांक खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-blue-500 transition-colors font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Toggle (Table vs Month Grid) */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewType('table')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewType === 'table' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                तालिका सूची (Table)
              </button>
              <button
                onClick={() => setViewType('calendar')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewType === 'calendar' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मासिक कैलेंडर (Calendar)
              </button>
            </div>

            {/* Add New Entry Button (visible only in global edit mode) */}
            {isEditMode && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>नया रोस्टर जोड़ें</span>
              </button>
            )}

            {/* Dedicated BRP Calendar PDF (visible when a BRP is selected) */}
            {selectedBRP && selectedBRP !== 'all' && (
              <button
                disabled={downloading}
                onClick={() => handleDownloadBRPPDF(selectedBRP, fontViewMode === 'krutidev' ? 'krutidev' : 'unicode')}
                className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                title={`${activeBRPOption?.name || selectedBRP} का संपूर्ण रोस्टर कैलेंडर PDF डाउनलोड करें`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-200" />
                <span>{downloading ? 'डाउनलोड हो रहा...' : `${activeBRPOption?.name || 'BRP'} कैलेंडर PDF`}</span>
              </button>
            )}

            {/* PDF Download Dropdown */}
            <div className="relative" ref={pdfMenuRef}>
              <button
                type="button"
                disabled={downloading}
                onClick={() => {
                  setIsPdfMenuOpen(!isPdfMenuOpen);
                  setIsExcelMenuOpen(false);
                }}
                className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-rose-100" />
                <span>{downloading ? 'डाउनलोड हो रहा...' : 'PDF डाउनलोड'}</span>
                <ChevronDown className="w-3 h-3 text-rose-200" />
              </button>

              {isPdfMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 flex flex-col bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl z-30 min-w-64 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    फ़िल्टर अनुसार कैलेंडर PDF ({filteredRecords.length} GP)
                  </div>
                  <button
                    onClick={() => handleDownloadPDF('krutidev')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-amber-900 font-bold flex items-center justify-between"
                    style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}
                  >
                    <span>कृतिदेव 010 फ़ॉन्ट में</span>
                    <span className="text-[10px] text-slate-500 font-sans">शासकीय मुद्रण हेतु</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPDF('unicode')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-between"
                  >
                    <span>यूनिकोड / मंगल फ़ॉन्ट में</span>
                    <span className="text-[10px] text-slate-500">मानक प्रारूप</span>
                  </button>
                  {selectedBRP && selectedBRP !== 'all' && (
                    <>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => handleDownloadBRPPDF(selectedBRP, 'krutidev')}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-indigo-900 font-bold flex items-center justify-between"
                      >
                        <span>{activeBRPOption?.name || 'BRP'} का कैलेंडर (कृतिदेव)</span>
                        <span className="text-[10px] text-indigo-600 font-mono">BRP PDF</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Excel Download Dropdown */}
            <div className="relative" ref={excelMenuRef}>
              <button
                type="button"
                disabled={downloading}
                onClick={() => {
                  setIsExcelMenuOpen(!isExcelMenuOpen);
                  setIsPdfMenuOpen(false);
                }}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                <span>{downloading ? 'डाउनलोड हो रहा...' : 'Excel डाउनलोड'}</span>
                <ChevronDown className="w-3 h-3 text-emerald-200" />
              </button>

              {isExcelMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 flex flex-col bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl z-30 min-w-56 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    फ़िल्टर अनुसार Excel ({filteredRecords.length} GP)
                  </div>
                  <button
                    onClick={() => handleDownloadExcel('krutidev')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-amber-900 font-bold flex items-center justify-between"
                    style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}
                  >
                    <span>कृतिदेव 010 फ़ॉन्ट में</span>
                    <span className="text-[10px] text-slate-500 font-sans">शासकीय मुद्रण हेतु</span>
                  </button>
                  <button
                    onClick={() => handleDownloadExcel('unicode')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-between"
                  >
                    <span>यूनिकोड / मंगल फ़ॉन्ट में</span>
                    <span className="text-[10px] text-slate-500">मानक प्रारूप</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset to baseline button (if edited) */}
            <button
              onClick={resetToBaseline}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors"
              title="मूल आधिकारिक डेटा पर रीसेट करें"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Block Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px] font-bold mr-1">विकास खण्ड:</span>
            {(['all', 'Baghpat', 'Baraut'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBlock(b)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedBlock === b
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {b === 'all' ? 'सभी (88)' : b === 'Baghpat' ? 'बागपत (44)' : 'बड़ौत (44)'}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Scheme Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px] font-bold mr-1">योजना:</span>
            {[
              { id: 'all', label: 'सभी' },
              { id: 'nsap', label: 'NSAP पेंशन (47)' },
              { id: 'mgnrega', label: 'मनरेगा (88)' },
              { id: 'pmayg', label: 'प्र०आ०ग्रा० (4)' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScheme(s.id as any)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedScheme === s.id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Status Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-slate-500 text-[11px] font-bold mr-1">स्थिति:</span>
            {[
              { id: 'all', label: `सभी (${statusCounts.all})` },
              { id: 'completed', label: `🟢 सम्पन्न (${statusCounts.completed})` },
              { id: 'upcoming', label: `🔵 प्रस्तावित (${statusCounts.upcoming})` },
              ...(statusCounts.overdue > 0 ? [{ id: 'overdue', label: `🔴 लंबित (${statusCounts.overdue})` }] : []),
              { id: 'amended', label: `🟠 संशोधित (${statusCounts.amended})` }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id as any)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedStatus === st.id
                    ? st.id === 'completed'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : st.id === 'overdue'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : st.id === 'upcoming'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : st.id === 'amended'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Team Member Filter Dropdown */}
          <div className="relative" ref={teamFilterRef}>
            <button
              type="button"
              onClick={() => setIsTeamFilterOpen(!isTeamFilterOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                selectedTeamMember !== 'all'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
              title="सोशल ऑडिट टीम सदस्य के आधार पर फ़िल्टर करें"
            >
              <Users className="w-3 h-3" />
              <span>
                {selectedTeamMember !== 'all' ? `टीम: ${selectedTeamMember}` : 'टीम सदस्य: सभी'}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isTeamFilterOpen && (
              <div className="absolute left-0 top-full mt-1.5 flex flex-col bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-30 min-w-64 max-h-72 overflow-y-auto text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="pb-1.5 mb-1.5 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="टीम सदस्य खोजें..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-[11px] rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-500 font-medium"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setSelectedTeamMember('all');
                    setIsTeamFilterOpen(false);
                    setTeamSearch('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between ${
                    selectedTeamMember === 'all' ? 'bg-purple-50 text-purple-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>समस्त टीम सदस्य (सभी)</span>
                  <span className="text-[10px] text-slate-400">{records.length} GP</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                {filteredTeamOptions.length === 0 ? (
                  <div className="py-3 text-center text-slate-400 text-[11px]">कोई सदस्य नहीं मिला</div>
                ) : (
                  filteredTeamOptions.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => {
                        setSelectedTeamMember(opt.name);
                        setIsTeamFilterOpen(false);
                        setTeamSearch('');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between transition-colors ${
                        selectedTeamMember === opt.name
                          ? 'bg-purple-100 text-purple-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="truncate">{opt.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 ml-2">
                        {opt.totalGPs} GP
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Reset Filters button if any filter is active */}
          {(selectedBlock !== 'all' || selectedScheme !== 'all' || selectedStatus !== 'all' || selectedTeamMember !== 'all' || (selectedBRP && selectedBRP !== 'all') || searchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setSelectedBlock('all');
                setSelectedScheme('all');
                setSelectedStatus('all');
                setSelectedTeamMember('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors ml-auto cursor-pointer"
              title="सभी सक्रिय फ़िल्टर साफ़ करें"
            >
              <X className="w-3 h-3" />
              <span>फ़िल्टर रीसेट</span>
            </button>
          )}
        </div>

        {/* Edit Mode Notification Banner */}
        {isEditMode && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>एडिट मोड सक्रिय है:</strong> आप किसी भी ग्राम सभा की बैठक तिथि, बी०आर०पी० या स्थिति बदल सकते हैं। सभी संशोधन आपके ब्राउज़र में सुरक्षित रहते हैं।
              </span>
            </div>
            <button
              onClick={() => setIsEditMode(false)}
              className="text-amber-800 hover:underline font-bold ml-2"
            >
              पूर्ण करें
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Table or Monthly Calendar */}
      {viewType === 'table' ? (
        /* Full Data Table View */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          {/* Top Status Bar with Color Legend */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 font-medium">
              कुल <strong>{filteredRecords.length}</strong> बैठकें प्रदर्शित
              {selectedBlock !== 'all' && ` (${selectedBlock === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'})`}
            </span>
            {/* Clear Color Legend */}
            <div className="flex flex-wrap items-center gap-3 font-semibold text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" />
                <span>🟢 सम्पन्न</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-2xs" />
                <span>🔵 प्रस्तावित</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-2xs" />
                <span>🔴 लंबित</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-2xs" />
                <span>🟠 संशोधित</span>
              </span>
            </div>
          </div>

          {/* Mobile horizontal swipe notice */}
          <div className="lg:hidden px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-medium">
            <span>👉 तालिका को बाएं-दाएं स्वाइप करें</span>
            <span className="font-mono text-slate-500">कुल {filteredRecords.length} रिकॉर्ड्स</span>
          </div>

          {/* Single Semantic Responsive Table for Desktop, Tablet and Mobile */}
          <div className="overflow-x-auto max-h-[700px] scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs min-w-[980px]">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 z-20 font-bold border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="py-3 px-3 w-12 min-w-[48px] text-center static lg:sticky lg:left-0 bg-slate-100 z-10 lg:z-30">क्र०</th>
                  <th className="py-3 px-3 min-w-[140px] static lg:sticky lg:left-12 bg-slate-100 z-10 lg:z-30 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">ग्राम पंचायत</th>
                  <th className="py-3 px-3 min-w-[85px]">विकास खण्ड</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">प्रारम्भ तिथि</th>
                  <th className="py-3 px-3 text-center min-w-[105px]">बैठक तिथि</th>
                  <th className="py-3 px-3 min-w-[140px]">बी०आर०पी० (मो० नं०)</th>
                  <th className="py-3 px-3 min-w-[160px]">सोशल ऑडिट टीम सदस्य</th>
                  <th className="py-3 px-3 min-w-[150px]">पर्यवेक्षक अधिकारी</th>
                  <th className="py-3 px-3 min-w-[90px] text-center">योजना</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">स्थिति</th>
                  {isEditMode && <th className="py-3 px-3 text-center min-w-[80px]">कार्य</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isEditMode ? 11 : 10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600 text-sm">चयनित फ़िल्टर के अनुसार कोई सोशल ऑडिट रिकॉर्ड नहीं मिला।</p>
                        <p className="text-slate-400 text-xs">कृपया अपने फ़िल्टर बदलें या खोज शब्द साफ़ करें।</p>
                        <button
                          onClick={() => {
                            setSelectedBlock('all');
                            setSelectedScheme('all');
                            setSelectedStatus('all');
                            setSelectedTeamMember('all');
                            setSearchQuery('');
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          समस्त फ़िल्टर रीसेट करें
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, index) => {
                    const effDate = getEffectiveMeetingDate(r);
                    const isCompleted = isMeetingCompletedEffective(r, asOfDate);
                    const isOverdue = !isCompleted && effDate <= asOfDate;
                    const isUpcoming = !isCompleted && effDate > asOfDate;
                    const isAmended = isMeetingAmended(r);
                    const origDate = getOriginalMeetingDate(r);

                    // Row subtle background & left status indicator
                    let rowBorder = 'border-l-4 border-l-transparent';
                    let rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';

                    if (isCompleted) {
                      rowBorder = 'border-l-4 border-l-emerald-500';
                      rowBg = 'bg-emerald-50/20 hover:bg-emerald-50/40';
                    } else if (isOverdue) {
                      rowBorder = 'border-l-4 border-l-rose-500';
                      rowBg = 'bg-rose-50/25 hover:bg-rose-50/45';
                    } else if (isUpcoming) {
                      rowBorder = 'border-l-4 border-l-blue-400';
                      rowBg = 'bg-blue-50/15 hover:bg-blue-50/30';
                    }

                    if (isAmended) {
                      rowBg = isCompleted
                        ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                        : isOverdue
                        ? 'bg-rose-50/30 hover:bg-rose-50/50'
                        : 'bg-amber-50/30 hover:bg-amber-50/50';
                    }

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors group ${rowBorder} ${rowBg}`}
                      >
                        {/* SNo - Sequential restarting from 1, static on mobile/tablet, sticky on desktop */}
                        <td className="py-3.5 px-3 text-center text-slate-500 font-mono static lg:sticky lg:left-0 bg-inherit z-auto lg:z-10 font-semibold">
                          {index + 1}
                        </td>

                        {/* Gram Panchayat Name - Static on mobile/tablet, sticky on desktop */}
                        <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap static lg:sticky lg:left-12 bg-inherit z-auto lg:z-10 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                          <button
                            type="button"
                            onClick={() => openGPProfile(r)}
                            className="text-left font-bold text-slate-900 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                            title="ग्राम पंचायत प्रोफाइल देखें"
                          >
                            {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                          </button>
                        </td>

                        {/* Block */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                          </span>
                        </td>

                        {/* Start Date */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap text-slate-600 font-medium">
                          {formatDate(r.startDate)}
                        </td>

                        {/* Meeting Date */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {isAmended && origDate && origDate !== effDate ? (
                            <div className="flex flex-col items-center">
                              <span className="line-through text-slate-400 text-[10px]" title="मूल निर्धारित तिथि">
                                {formatDate(origDate)}
                              </span>
                              <span className="font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300 shadow-2xs" title="संशोधित प्रभावी बैठक तिथि">
                                {formatDate(effDate)}
                              </span>
                            </div>
                          ) : (
                            <span className={`font-semibold ${isCompleted ? 'text-emerald-700' : isOverdue ? 'text-rose-700 font-bold' : 'text-blue-700 font-bold'}`}>
                              {formatDate(effDate)}
                            </span>
                          )}
                        </td>

                        {/* BRP */}
                        <td className="py-3.5 px-3 text-slate-900 whitespace-nowrap">
                          <div className="font-bold">
                            {renderText(r.brpName || r.brpUnicode, r.brpKrutiDev)}
                          </div>
                          {r.brpPhone && (
                            <a
                              href={`tel:${r.brpPhone}`}
                              className="text-[10px] text-blue-700 hover:text-blue-900 block font-mono font-bold"
                            >
                              📞 {r.brpPhone}
                            </a>
                          )}
                        </td>

                        {/* Team Members */}
                        <td className="py-3.5 px-3 max-w-xs text-slate-700 leading-snug">
                          <div className="line-clamp-2 text-[11px] leading-relaxed" title={r.teamMembersUnicode}>
                            {renderText(r.teamMembersUnicode, r.teamMembersKrutiDev)}
                          </div>
                        </td>

                        {/* Supervisor Officer */}
                        <td className="py-3.5 px-3 max-w-xs text-slate-600 text-[11px] leading-snug">
                          <div className="line-clamp-2 text-[11px] leading-relaxed font-medium" title={r.supervisorOfficerUnicode}>
                            {renderText(r.supervisorOfficerUnicode, r.supervisorOfficerKrutiDev)}
                          </div>
                        </td>

                        {/* Schemes */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {r.hasNSAP && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                NSAP
                              </span>
                            )}
                            {r.hasMGNREGA && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                मनरेगा
                              </span>
                            )}
                            {r.hasPMAYG && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                                प्र०आ०ग्रा०
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Clear Status Column with Badges & Icons */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-center flex-wrap">
                            {isAmended && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                                title="BRP कार्यमुक्त होने के कारण बैठक तिथि व टीम संशोधित"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                संशोधित
                              </span>
                            )}
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                सम्पन्न
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                लंबित
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                प्रस्तावित
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions (in Edit Mode) */}
                        {isEditMode && (
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(r)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                                title="विवरण संशोधित करें"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {(() => {
                                const completionCheck = canCompleteMeeting(r);
                                if (isCompleted) {
                                  return (
                                    <button
                                      onClick={() => {
                                        if (confirm(`क्या आप ${r.gpNameUnicode} की बैठक को पुनः प्रस्तावित करना चाहते हैं?`)) {
                                          markCompleted(r.id, false);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-rose-600 transition-colors shadow-2xs"
                                      title="सम्पन्न (पुनः प्रस्तावित करने हेतु क्लिक करें)"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  );
                                }
                                if (!completionCheck.canComplete) {
                                  return (
                                    <button
                                      disabled
                                      className="p-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                      title={completionCheck.errorMessage || 'निर्धारित तिथि से पूर्व सम्पन्न नहीं किया जा सकता'}
                                    >
                                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                                    </button>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() => openCompletionModal(r)}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 transition-colors shadow-2xs"
                                    title="सत्यापन कर बैठक सम्पन्न करें"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                );
                              })()}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Monthly Calendar Grid View */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-4">
          {/* Month Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-700" />
              <span>मासिक कैलेंडर रोस्टर</span>
            </h3>

            {/* Desktop Month Tabs */}
            <div className="hidden sm:flex items-center gap-2">
              {monthOrder.map((m) => {
                const mm = m.split('-')[1];
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedMonth === m
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {monthNames[mm] || m}
                  </button>
                );
              })}
            </div>

            {/* Mobile Month Switcher Controls */}
            <div className="sm:hidden flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                disabled={monthOrder.indexOf(selectedMonth) === 0}
                className="p-1.5 rounded-lg bg-white text-slate-700 disabled:opacity-40 shadow-xs"
                title="पिछला माह"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-xs font-black text-slate-900 block">
                  {monthNames[selectedMonth.split('-')[1]] || selectedMonth}
                </span>
                <span className="text-[10px] text-blue-700 font-bold block">
                  {records.filter(r => getEffectiveMeetingDate(r).startsWith(selectedMonth)).length} बैठकें निर्धारित
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedMonth('2026-10')}
                  className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200"
                >
                  आज
                </button>
                <button
                  onClick={handleNextMonth}
                  disabled={monthOrder.indexOf(selectedMonth) === monthOrder.length - 1}
                  className="p-1.5 rounded-lg bg-white text-slate-700 disabled:opacity-40 shadow-xs"
                  title="अगला माह"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 7-Column Responsive Monthly Grid (Desktop, Tablet & Mobile) */}
          <div className="w-full">
            {/* Calendar Status Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-600 font-semibold text-[11px]">
                माह में कुल <strong>{filteredRecords.filter(r => getEffectiveMeetingDate(r).startsWith(selectedMonth)).length}</strong> बैठकें निर्धारित
              </span>
              {/* Status Color Legend */}
              <div className="flex flex-wrap items-center gap-3 font-semibold text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" />
                  <span>🟢 सम्पन्न</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-2xs" />
                  <span>🔵 प्रस्तावित</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-2xs" />
                  <span>🔴 लंबित</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-2xs" />
                  <span>🟠 संशोधित</span>
                </span>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] sm:text-xs font-bold text-slate-600">
              <div><span className="sm:hidden">रवि</span><span className="hidden sm:inline">रवि (Sun)</span></div>
              <div><span className="sm:hidden">सोम</span><span className="hidden sm:inline">सोम (Mon)</span></div>
              <div><span className="sm:hidden">मंगल</span><span className="hidden sm:inline">मंगल (Tue)</span></div>
              <div><span className="sm:hidden">बुध</span><span className="hidden sm:inline">बुध (Wed)</span></div>
              <div><span className="sm:hidden">गुरु</span><span className="hidden sm:inline">गुरु (Thu)</span></div>
              <div><span className="sm:hidden">शुक्र</span><span className="hidden sm:inline">शुक्र (Fri)</span></div>
              <div><span className="sm:hidden">शनि</span><span className="hidden sm:inline">शनि (Sat)</span></div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[52px] sm:min-h-[75px] md:h-28 rounded-lg sm:rounded-xl bg-slate-50/50 border border-dashed border-slate-200"
                    />
                  );
                }

                const isToday = day.dateStr === asOfDate;
                const isSelected = selectedCalendarDate === day.dateStr;
                const hasMeetings = day.meetings.length > 0;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedCalendarDate(day.dateStr)}
                    className={`min-h-[52px] sm:min-h-[75px] md:h-28 rounded-lg sm:rounded-xl p-1 sm:p-2 flex flex-col justify-between border cursor-pointer transition-all overflow-hidden ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500 shadow-sm'
                        : isToday
                        ? 'bg-blue-50/60 border-blue-400 shadow-sm ring-1 ring-blue-300'
                        : hasMeetings
                        ? 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 shadow-2xs'
                        : 'bg-slate-50/30 border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className={`font-mono font-bold ${isSelected ? 'text-indigo-900 font-black' : isToday ? 'text-blue-700 font-black' : 'text-slate-800'}`}>
                        {day.dayNumber}
                      </span>
                      {hasMeetings && (
                        <span className={`font-bold px-1 sm:px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          <span className="sm:hidden">{day.meetings.length}</span>
                          <span className="hidden sm:inline">{day.meetings.length} बैठकें</span>
                        </span>
                      )}
                    </div>

                    {/* Mobile Status Dots Indicator */}
                    {hasMeetings && (
                      <div className="flex md:hidden items-center gap-1 mt-1 flex-wrap">
                        {day.meetings.slice(0, 3).map((m) => {
                          const mEff = getEffectiveMeetingDate(m);
                          const isComp = isMeetingCompletedEffective(m, asOfDate);
                          const isOver = !isComp && mEff <= asOfDate;
                          const isAm = isMeetingAmended(m);

                          let dotColor = 'bg-blue-500';
                          if (isComp) dotColor = 'bg-emerald-500';
                          else if (isOver) dotColor = 'bg-rose-500';
                          if (isAm) dotColor = 'bg-amber-500';

                          return (
                            <span
                              key={m.id}
                              className={`w-2 h-2 rounded-full ${dotColor} inline-block`}
                              title={`${m.gpNameUnicode} (${isComp ? 'सम्पन्न' : isOver ? 'लंबित' : 'प्रस्तावित'}${isAm ? ' - संशोधित' : ''})`}
                            />
                          );
                        })}
                        {day.meetings.length > 3 && (
                          <span className="text-[8px] font-bold text-slate-500 leading-none">+{day.meetings.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Desktop Meetings preview inside cell with status color badges */}
                    <div className="hidden md:block overflow-y-auto space-y-1 text-[10px] scrollbar-none flex-1 mt-1">
                      {day.meetings.slice(0, 2).map((m) => {
                        const mEff = getEffectiveMeetingDate(m);
                        const isComp = isMeetingCompletedEffective(m, asOfDate);
                        const isOver = !isComp && mEff <= asOfDate;
                        const isAm = isMeetingAmended(m);

                        let pillClass = 'bg-blue-50/90 text-blue-900 border-blue-200 hover:bg-blue-100';
                        if (isComp) {
                          pillClass = 'bg-emerald-50/90 text-emerald-900 border-emerald-200 hover:bg-emerald-100';
                        } else if (isOver) {
                          pillClass = 'bg-rose-50/90 text-rose-900 border-rose-200 hover:bg-rose-100';
                        }
                        if (isAm) {
                          pillClass = 'bg-amber-50/90 text-amber-950 border-amber-300 hover:bg-amber-100';
                        }

                        return (
                          <div
                            key={m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCalendarDate(day.dateStr);
                              openEditModal(m);
                            }}
                            className={`p-1 rounded truncate font-medium text-[10px] border transition-colors flex items-center justify-between gap-1 ${pillClass}`}
                            title={`${m.gpNameUnicode} (${m.blockHindi || (m.block === 'Baghpat' ? 'बागपत' : 'बड़ौत')}) - ${isComp ? 'सम्पन्न' : isOver ? 'लंबित' : 'प्रस्तावित'}${isAm ? ' [संशोधित]' : ''}`}
                          >
                            <span className="truncate">{m.gpNameUnicode}</span>
                            <span className="shrink-0 text-[8px] font-bold">
                              {isComp ? '✓' : isOver ? '!' : isAm ? 'सं' : ''}
                            </span>
                          </div>
                        );
                      })}
                      {day.meetings.length > 2 && (
                        <div className="text-[9px] text-slate-500 font-bold pl-0.5">
                          +{day.meetings.length - 2} अन्य...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Table for Selected Date (Preserves genuine table experience on Desktop & Mobile) */}
          {selectedCalendarDate && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <span>
                    चयनित तिथि की बैठकें: <strong>{formatDate(selectedCalendarDate)}</strong>
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900">
                    {selectedDateMeetings.length} बैठकें निर्धारित
                  </span>
                </h4>
                {selectedDateMeetings.length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    तालिका को स्वाइप कर सभी विवरण देखें
                  </span>
                )}
              </div>

              {selectedDateMeetings.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  <CalendarIcon className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">इस तिथि ({formatDate(selectedCalendarDate)}) पर कोई सोशल ऑडिट बैठक नहीं है।</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">कैलेंडर में किसी अन्य तिथि पर क्लिक करके उसकी बैठकें देखें।</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center static lg:sticky lg:left-0 bg-slate-100 z-10">क्र०</th>
                        <th className="py-2.5 px-3 min-w-[120px] static lg:sticky lg:left-10 bg-slate-100 z-10 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">ग्राम पंचायत</th>
                        <th className="py-2.5 px-2.5">विकास खण्ड</th>
                        <th className="py-2.5 px-3">बी०आर०पी० (मो० नं०)</th>
                        <th className="py-2.5 px-3">पर्यवेक्षक अधिकारी</th>
                        <th className="py-2.5 px-3">टीम सदस्य</th>
                        <th className="py-2.5 px-2 text-center">योजना</th>
                        <th className="py-2.5 px-2 text-center">स्थिति</th>
                        <th className="py-2.5 px-2 text-center">कार्य</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDateMeetings.map((r, i) => {
                        const effDate = getEffectiveMeetingDate(r);
                        const isCompleted = isMeetingCompletedEffective(r, asOfDate);
                        const isOverdue = !isCompleted && effDate <= asOfDate;
                        const isUpcoming = !isCompleted && effDate > asOfDate;
                        const isAmended = isMeetingAmended(r);

                        let rowBorder = 'border-l-4 border-l-transparent';
                        if (isCompleted) rowBorder = 'border-l-4 border-l-emerald-500 bg-emerald-50/15 hover:bg-emerald-50/30';
                        else if (isOverdue) rowBorder = 'border-l-4 border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/35';
                        else if (isUpcoming) rowBorder = 'border-l-4 border-l-blue-400 bg-blue-50/10 hover:bg-blue-50/25';

                        return (
                          <tr key={r.id} className={`transition-colors ${rowBorder}`}>
                            <td className="py-2 px-3 text-center font-mono text-slate-500 static lg:sticky lg:left-0 bg-inherit z-auto lg:z-10 font-semibold">{i + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 static lg:sticky lg:left-10 bg-inherit z-auto lg:z-10 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                              {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600">{r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}</td>
                            <td className="py-2 px-3 text-slate-700">
                              <div className="font-semibold">{r.brpName}</div>
                              {r.brpPhone && <div className="text-[10px] text-slate-500 font-mono">📞 {r.brpPhone}</div>}
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px] max-w-[160px] truncate">
                              {renderText(r.supervisorOfficerUnicode, r.supervisorOfficerKrutiDev)}
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px] max-w-[160px] truncate">
                              {renderText(r.teamMembersUnicode, r.teamMembersKrutiDev)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex gap-1 justify-center flex-wrap">
                                {r.hasNSAP && <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">NSAP</span>}
                                {r.hasMGNREGA && <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">मनरेगा</span>}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 justify-center flex-wrap">
                                {isAmended && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                    संशोधित
                                  </span>
                                )}
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    सम्पन्न
                                  </span>
                                ) : isOverdue ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    लंबित
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    प्रस्तावित
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => openEditModal(r)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center gap-1 mx-auto"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>एडिट</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
