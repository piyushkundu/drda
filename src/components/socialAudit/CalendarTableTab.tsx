'use client';

import React, { useState, useMemo } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { SocialAuditRecord, AuditBlock, AuditStatus } from '@/types/socialAudit';
import { exportCalendarExcel } from '@/lib/exportSocialAuditExcel';
import { 
  Search, Filter, Calendar as CalendarIcon, Download, 
  Edit3, Plus, RotateCcw, CheckCircle2, AlertTriangle, 
  Layers, Phone, User, Users, Shield, FileSpreadsheet,
  ChevronLeft, ChevronRight, Check, X, Eye
} from 'lucide-react';

export default function CalendarTableTab() {
  const {
    records,
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
    markCompleted,
    resetToBaseline,
    asOfDate
  } = useSocialAuditStore();

  const [viewType, setViewType] = useState<'table' | 'calendar'>('table');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10'); // YYYY-MM
  const [downloading, setDownloading] = useState(false);

  // Helper date formatter
  const formatDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dStr;
    }
  };

  // Render text helper based on fontViewMode
  const renderText = (unicodeText: string, krutiText: string) => {
    if (fontViewMode === 'krutidev') {
      return <span style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>{krutiText}</span>;
    }
    if (fontViewMode === 'dual') {
      return (
        <div className="flex flex-col">
          <span className="text-slate-900 font-semibold">{unicodeText}</span>
          <span className="text-[11px] text-amber-800 font-mono tracking-wide" style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>
            {krutiText}
          </span>
        </div>
      );
    }
    return <span>{unicodeText}</span>;
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Block filter
      if (selectedBlock !== 'all' && r.block !== selectedBlock) return false;

      // Scheme filter
      if (selectedScheme === 'nsap' && !r.hasNSAP) return false;
      if (selectedScheme === 'mgnrega' && !r.hasMGNREGA) return false;
      if (selectedScheme === 'pmayg' && !r.hasPMAYG) return false;

      // Status filter
      if (selectedStatus === 'amended' && !r.isAmended) return false;
      if (selectedStatus === 'completed' && r.status !== 'completed' && r.meetingDate >= asOfDate) return false;
      if (selectedStatus === 'upcoming' && (r.status === 'completed' || r.meetingDate < asOfDate)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
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

        const matchDate = r.meetingDate.includes(q) || r.startDate.includes(q);

        if (!matchUnicode && !matchKruti && !matchDate) return false;
      }

      return true;
    });
  }, [records, selectedBlock, selectedScheme, selectedStatus, searchQuery, asOfDate]);

  // Handle Excel download
  const handleDownload = async (mode: 'krutidev' | 'unicode') => {
    setDownloading(true);
    try {
      await exportCalendarExcel(records, mode, selectedBlock);
    } catch (err) {
      console.error('Download error:', err);
      alert('Excel डाउनलोड करने में त्रुटि आई।');
    } finally {
      setDownloading(false);
    }
  };

  // Calendar days generation for Monthly Calendar Grid view
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
      const dayMeetings = records.filter((r) => r.meetingDate === dateStr);
      days.push({ dayNumber: d, dateStr, meetings: dayMeetings });
    }
    return days;
  }, [selectedMonth, records]);

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

            {/* Edit Mode Toggle Button */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isEditMode
                  ? 'bg-amber-500 text-white shadow-amber-500/30 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-amber-800 border border-amber-200'
              }`}
              title="कैलेंडर में संपादन मोड चालू/बंद करें"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'एडिट मोड सक्रिय' : 'एडिट मोड (Edit)'}</span>
            </button>

            {/* Add New Entry Button (visible in edit mode) */}
            {isEditMode && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>नया रोस्टर जोड़ें</span>
              </button>
            )}

            {/* Excel Download Dropdown */}
            <div className="relative group">
              <button
                disabled={downloading}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                <span>{downloading ? 'डाउनलोड हो रहा...' : 'Excel डाउनलोड'}</span>
              </button>

              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl z-30 min-w-56 text-xs">
                <button
                  onClick={() => handleDownload('krutidev')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-amber-800 font-bold flex items-center justify-between"
                  style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}
                >
                  <span>कृतिदेव 010 फ़ॉन्ट में</span>
                  <span className="text-[10px] text-slate-500 font-sans">शासकीय मुद्रण हेतु</span>
                </button>
                <button
                  onClick={() => handleDownload('unicode')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-between"
                >
                  <span>यूनिकोड / मंगल फ़ॉन्ट में</span>
                  <span className="text-[10px] text-slate-500">मानक प्रारूप</span>
                </button>
              </div>
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
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px] font-bold mr-1">स्थिति:</span>
            {[
              { id: 'all', label: 'सभी' },
              { id: 'amended', label: 'संशोधित (10)' },
              { id: 'upcoming', label: 'आगामी' },
              { id: 'completed', label: 'सम्पन्न' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id as any)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedStatus === st.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
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
          <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>
              कुल <strong>{filteredRecords.length}</strong> बैठकें प्रदर्शित
              {selectedBlock !== 'all' && ` (${selectedBlock === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'})`}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="text-amber-800 font-bold">संशोधित रोस्टर</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span className="text-emerald-800 font-bold">NSAP योजना</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[650px] scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/90 text-slate-700 sticky top-0 z-20 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">क्र०</th>
                  <th className="py-3 px-3">ग्राम पंचायत</th>
                  <th className="py-3 px-3">विकास खण्ड</th>
                  <th className="py-3 px-3 text-center">प्रारम्भ तिथि</th>
                  <th className="py-3 px-3 text-center">बैठक तिथि</th>
                  <th className="py-3 px-3">बी०आर०पी० (मो० नं०)</th>
                  <th className="py-3 px-3">सोशल ऑडिट टीम सदस्य</th>
                  <th className="py-3 px-3">पर्यवेक्षक अधिकारी</th>
                  <th className="py-3 px-3">योजना</th>
                  <th className="py-3 px-3 text-center">स्थिति</th>
                  {isEditMode && <th className="py-3 px-3 text-center">कार्य</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isEditMode ? 11 : 10} className="py-12 text-center text-slate-400">
                      कोई ग्राम सभा बैठक नहीं मिली। कृपया अपने फ़िल्टर बदलें।
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, index) => {
                    const isUpcoming = r.meetingDate >= asOfDate;
                    const isPast = r.meetingDate < asOfDate;

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors group ${
                          r.isAmended
                            ? 'bg-amber-50/60 hover:bg-amber-50 border-l-4 border-l-amber-500'
                            : index % 2 === 0
                            ? 'bg-white hover:bg-slate-50/80'
                            : 'bg-slate-50/40 hover:bg-slate-50/80'
                        }`}
                      >
                        {/* SNo */}
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">
                          {r.sno}
                        </td>

                        {/* Gram Panchayat Name */}
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                        </td>

                        {/* Block */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                          </span>
                        </td>

                        {/* Start Date */}
                        <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 font-medium">
                          {formatDate(r.startDate)}
                        </td>

                        {/* Meeting Date */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {r.isAmended && r.originalMeetingDate ? (
                            <div className="flex flex-col items-center">
                              <span className="line-through text-slate-400 text-[10px]">
                                {formatDate(r.originalMeetingDate)}
                              </span>
                              <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {formatDate(r.meetingDate)}
                              </span>
                            </div>
                          ) : (
                            <span className={`font-semibold ${isUpcoming ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                              {formatDate(r.meetingDate)}
                            </span>
                          )}
                        </td>

                        {/* BRP */}
                        <td className="py-3 px-3 text-slate-900 whitespace-nowrap">
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
                        <td className="py-3 px-3 max-w-xs text-slate-700 leading-snug">
                          <div className="line-clamp-2" title={r.teamMembersUnicode}>
                            {renderText(r.teamMembersUnicode, r.teamMembersKrutiDev)}
                          </div>
                        </td>

                        {/* Supervisor Officer */}
                        <td className="py-3 px-3 max-w-xs text-slate-600 text-[11px] leading-snug">
                          <div className="line-clamp-2" title={r.supervisorOfficerUnicode}>
                            {renderText(r.supervisorOfficerUnicode, r.supervisorOfficerKrutiDev)}
                          </div>
                        </td>

                        {/* Schemes */}
                        <td className="py-3 px-3 whitespace-nowrap">
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

                        {/* Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {r.isAmended ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                              title="BRP कार्यमुक्त होने के कारण बैठक तिथि व टीम संशोधित"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              संशोधित
                            </span>
                          ) : r.status === 'completed' || isPast ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              सम्पन्न
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              प्रस्तावित
                            </span>
                          )}
                        </td>

                        {/* Actions (in Edit Mode) */}
                        {isEditMode && (
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(r)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                                title="संपादित करें"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => markCompleted(r.id, r.status !== 'completed')}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  r.status === 'completed'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 border border-slate-200'
                                }`}
                                title="सम्पन्न टॉगल करें"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          {/* Month Selector Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-700" />
              <span>मासिक कैलेंडर रोस्टर</span>
            </h3>

            <div className="flex items-center gap-2">
              {['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'].map((m) => {
                const [y, mm] = m.split('-');
                const monthNames: Record<string, string> = {
                  '09': 'सितम्बर 2026',
                  '10': 'अक्टूबर 2026',
                  '11': 'नवम्बर 2026',
                  '12': 'दिसम्बर 2026',
                  '01': 'जनवरी 2027'
                };
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
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500">
            <div>रवि (Sun)</div>
            <div>सोम (Mon)</div>
            <div>मंगल (Tue)</div>
            <div>बुध (Wed)</div>
            <div>गुरु (Thu)</div>
            <div>शुक्र (Fri)</div>
            <div>शनि (Sat)</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="h-28 rounded-xl bg-slate-50/50 border border-dashed border-slate-200" />;
              }

              const isToday = day.dateStr === asOfDate;
              const hasMeetings = day.meetings.length > 0;

              return (
                <div
                  key={day.dateStr}
                  className={`h-28 rounded-xl p-2 flex flex-col justify-between border transition-all overflow-hidden ${
                    isToday
                      ? 'bg-blue-50/60 border-blue-400 shadow-sm ring-1 ring-blue-300'
                      : hasMeetings
                      ? 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                      : 'bg-slate-50/30 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isToday ? 'text-blue-700 font-black' : 'text-slate-800'}`}>
                      {day.dayNumber}
                    </span>
                    {hasMeetings && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        {day.meetings.length} बैठकें
                      </span>
                    )}
                  </div>

                  <div className="overflow-y-auto space-y-1 text-[10px] scrollbar-none flex-1 mt-1">
                    {day.meetings.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => openEditModal(m)}
                        className={`p-1 rounded cursor-pointer truncate font-bold ${
                          m.isAmended
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-900 border border-slate-200'
                        }`}
                        title={`${m.gpNameUnicode} (${m.blockHindi}) - BRP: ${m.brpUnicode}`}
                      >
                        {m.gpNameUnicode}
                        {m.hasNSAP && ' • NSAP'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
