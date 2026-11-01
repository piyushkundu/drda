'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { MisAuditStatus, SocialAuditRecord } from '@/types/socialAudit';
import { matchesBRP } from '@/lib/brpHelper';
import { 
  CheckCircle2, Clock, XCircle, Search, Filter, 
  Download, Building2, ShieldCheck, 
  FileSpreadsheet, RefreshCw, Layers, Landmark, 
  Calendar, Check, AlertTriangle, ArrowUpRight, Phone
} from 'lucide-react';

export default function MisFeedingTab() {
  const { 
    records, 
    selectedBRP,
    asOfDate, 
    fontViewMode, 
    updateMisStatus,
    openEditModal 
  } = useSocialAuditStore();

  const [selectedBlockFilter, setSelectedBlockFilter] = useState<'all' | 'Baghpat' | 'Baraut'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'fed' | 'all_pending' | 'due_pending' | 'pending_nsap' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);

  // Dedicated Pending Box local filter & toggle for viewing upcoming schedule
  const [pendingViewScope, setPendingViewScope] = useState<'due' | 'all'>('due');
  const [pendingBlockFilter, setPendingBlockFilter] = useState<'all' | 'Baghpat' | 'Baraut'>('all');
  const [showUpcomingList, setShowUpcomingList] = useState(false);

  // Helper to format date
  const formatDateHi = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  // Render font text helper
  const renderText = (unicodeText: string, krutiText: string) => {
    if (fontViewMode === 'krutidev') {
      return <span style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>{krutiText}</span>;
    }
    if (fontViewMode === 'dual') {
      return (
        <span className="flex flex-col">
          <span>{unicodeText}</span>
          <span className="text-[11px] text-blue-300 font-mono" style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>
            {krutiText}
          </span>
        </span>
      );
    }
    return <span>{unicodeText}</span>;
  };

  // Filter records by global selectedBRP
  const effectiveRecords = useMemo(() => {
    if (!selectedBRP || selectedBRP === 'all') return records;
    return records.filter((r) => matchesBRP(r, selectedBRP));
  }, [records, selectedBRP]);

  // Detailed Metrics computation strictly respecting asOfDate and selected BRP
  const metrics = useMemo(() => {
    const totalGps = effectiveRecords.length;
    const baghpatTotal = effectiveRecords.filter(r => r.block === 'Baghpat').length;
    const barautTotal = effectiveRecords.filter(r => r.block === 'Baraut').length;

    const fedTotal = effectiveRecords.filter(r => r.misStatus === 'fed');
    const fedBaghpat = effectiveRecords.filter(r => r.block === 'Baghpat' && r.misStatus === 'fed');
    const fedBaraut = effectiveRecords.filter(r => r.block === 'Baraut' && r.misStatus === 'fed');

    // All Pending (Everything not yet fed on MIS)
    const allPendingTotal = effectiveRecords.filter(r => (r.misStatus || 'pending') !== 'fed');
    const allPendingBaghpat = effectiveRecords.filter(r => r.block === 'Baghpat' && (r.misStatus || 'pending') !== 'fed');
    const allPendingBaraut = effectiveRecords.filter(r => r.block === 'Baraut' && (r.misStatus || 'pending') !== 'fed');

    // Due Pending: Meeting date has arrived (meetingDate <= asOfDate) and status is pending (not yet fed on MIS)
    const duePendingTotal = effectiveRecords.filter(r => (r.misStatus || 'pending') !== 'fed' && r.meetingDate <= asOfDate);
    const duePendingBaghpat = effectiveRecords.filter(r => r.block === 'Baghpat' && (r.misStatus || 'pending') !== 'fed' && r.meetingDate <= asOfDate);
    const duePendingBaraut = effectiveRecords.filter(r => r.block === 'Baraut' && (r.misStatus || 'pending') !== 'fed' && r.meetingDate <= asOfDate);

    // Upcoming Scheduled: Future meetings (meetingDate > asOfDate) awaiting their meeting date
    const upcomingTotal = effectiveRecords.filter(r => (r.misStatus || 'pending') !== 'fed' && r.meetingDate > asOfDate);
    const upcomingBaghpat = effectiveRecords.filter(r => r.block === 'Baghpat' && (r.misStatus || 'pending') !== 'fed' && r.meetingDate > asOfDate);
    const upcomingBaraut = effectiveRecords.filter(r => r.block === 'Baraut' && (r.misStatus || 'pending') !== 'fed' && r.meetingDate > asOfDate);

    // Pending with NSAP Pension
    const pendingWithNSAPTotal = allPendingTotal.filter(r => r.hasNSAP);
    const pendingWithNSAPBaghpat = allPendingBaghpat.filter(r => r.hasNSAP);
    const pendingWithNSAPBaraut = allPendingBaraut.filter(r => r.hasNSAP);

    // Due Pending with NSAP Pension
    const duePendingWithNSAPTotal = duePendingTotal.filter(r => r.hasNSAP);
    const duePendingWithNSAPBaghpat = duePendingBaghpat.filter(r => r.hasNSAP);
    const duePendingWithNSAPBaraut = duePendingBaraut.filter(r => r.hasNSAP);

    return {
      totalGps,
      baghpatTotal,
      barautTotal,
      fedTotalCount: fedTotal.length,
      fedBaghpatCount: fedBaghpat.length,
      fedBarautCount: fedBaraut.length,
      allPendingTotalCount: allPendingTotal.length,
      allPendingBaghpatCount: allPendingBaghpat.length,
      allPendingBarautCount: allPendingBaraut.length,
      duePendingTotalCount: duePendingTotal.length,
      duePendingBaghpatCount: duePendingBaghpat.length,
      duePendingBarautCount: duePendingBaraut.length,
      upcomingTotalCount: upcomingTotal.length,
      upcomingBaghpatCount: upcomingBaghpat.length,
      upcomingBarautCount: upcomingBaraut.length,
      pendingWithNSAPTotalCount: pendingWithNSAPTotal.length,
      pendingWithNSAPBaghpatCount: pendingWithNSAPBaghpat.length,
      pendingWithNSAPBarautCount: pendingWithNSAPBaraut.length,
      duePendingWithNSAPTotalCount: duePendingWithNSAPTotal.length,
      duePendingWithNSAPBaghpatCount: duePendingWithNSAPBaghpat.length,
      duePendingWithNSAPBarautCount: duePendingWithNSAPBaraut.length,
      fedPercentage: totalGps > 0 ? ((fedTotal.length / totalGps) * 100).toFixed(2) : '0.00',
      baghpatFedPercentage: baghpatTotal > 0 ? ((fedBaghpat.length / baghpatTotal) * 100).toFixed(2) : '0.00',
      barautFedPercentage: barautTotal > 0 ? ((fedBaraut.length / barautTotal) * 100).toFixed(2) : '0.00',
    };
  }, [effectiveRecords, asOfDate]);

  // Pending Records for the dedicated Pending Box (Due only vs All pending)
  const pendingBoxRecords = useMemo(() => {
    return effectiveRecords
      .filter(r => {
        const isPending = (r.misStatus || 'pending') !== 'fed';
        if (!isPending) return false;
        if (pendingViewScope === 'due' && r.meetingDate > asOfDate) return false;
        if (pendingBlockFilter === 'all') return true;
        return r.block === pendingBlockFilter;
      })
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [effectiveRecords, asOfDate, pendingBlockFilter, pendingViewScope]);

  // Upcoming scheduled records awaiting meeting day
  const upcomingScheduledRecords = useMemo(() => {
    return effectiveRecords
      .filter(r => {
        const isPending = (r.misStatus || 'pending') !== 'fed';
        const isFuture = r.meetingDate > asOfDate;
        if (!isPending || !isFuture) return false;
        if (pendingBlockFilter === 'all') return true;
        return r.block === pendingBlockFilter;
      })
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [effectiveRecords, asOfDate, pendingBlockFilter]);

  // Main Table Filtered Records
  const filteredRecords = useMemo(() => {
    return effectiveRecords.filter(r => {
      // 1. Block Filter
      if (selectedBlockFilter !== 'all' && r.block !== selectedBlockFilter) return false;

      // 2. Status Filter
      if (selectedStatusFilter === 'fed') {
        if (r.misStatus !== 'fed') return false;
      } else if (selectedStatusFilter === 'all_pending') {
        if (r.misStatus === 'fed') return false;
      } else if (selectedStatusFilter === 'due_pending') {
        if (r.misStatus === 'fed' || r.meetingDate > asOfDate) return false;
      } else if (selectedStatusFilter === 'pending_nsap') {
        if (r.misStatus === 'fed' || !r.hasNSAP) return false;
      } else if (selectedStatusFilter === 'upcoming') {
        if (r.misStatus === 'fed' || r.meetingDate <= asOfDate) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameU = (r.gpNameUnicode || '').toLowerCase();
        const nameK = (r.gpNameKrutiDev || '').toLowerCase();
        const brpU = (r.brpUnicode || '').toLowerCase();
        const offU = (r.supervisorOfficerUnicode || '').toLowerCase();
        const snoStr = String(r.sno || '');
        if (!nameU.includes(q) && !nameK.includes(q) && !brpU.includes(q) && !offU.includes(q) && !snoStr.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by Due Pending first, then Fed, then Upcoming by meetingDate
      const getPriority = (rec: SocialAuditRecord) => {
        if (rec.misStatus !== 'fed' && rec.meetingDate <= asOfDate) return 1; // Due Pending
        if (rec.misStatus === 'fed') return 2; // Fed
        return 3; // Upcoming
      };
      const prioA = getPriority(a);
      const prioB = getPriority(b);
      if (prioA !== prioB) return prioA - prioB;
      return a.meetingDate.localeCompare(b.meetingDate);
    });
  }, [records, asOfDate, selectedBlockFilter, selectedStatusFilter, searchQuery]);

  const handleStatusChange = (id: string, newStatus: MisAuditStatus) => {
    updateMisStatus(id, newStatus);
    setJustUpdatedId(id);
    setTimeout(() => setJustUpdatedId(null), 1500);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['क्र०सं०', 'ब्लॉक', 'ग्राम पंचायत (यूनिकोड)', 'बैठक तिथि', 'MIS फीडिंग स्थिति', 'पोर्टल स्थिति (कॉलम 8)', 'BRP नाम एवं फोन'];
    const rows = filteredRecords.map(r => {
      const isDuePending = r.misStatus !== 'fed' && r.meetingDate <= asOfDate;
      const isUpcoming = r.misStatus !== 'fed' && r.meetingDate > asOfDate;
      const statusText = r.misStatus === 'fed' ? 'फीड हो चुका (पूर्ण)' : isDuePending ? 'आज तक लंबित (Due Pending)' : 'आगामी प्रस्तावित';
      const col8 = r.misStatus === 'fed' ? '1' : '0';
      return [
        r.sno,
        r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत',
        `"${r.gpNameUnicode}"`,
        r.meetingDate,
        `"${statusText}"`,
        col8,
        `"${r.brpUnicode}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `R_9_1_3_MIS_Audit_Feeding_${asOfDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. OFFICIAL REPORT HEADER BANNER (R 9.1.3) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
                R 9.1.3 Social Audit Calendar Vs Audits Completed
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                वित्तीय वर्ष 2026-2027 • उत्तर प्रदेश
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                जनपद: बागपत
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              एमआईएस सोशल ऑडिट फीडिंग स्थिति ट्रैकर
            </h1>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
              सरकारी पोर्टल R 9.1.3 रिपोर्ट के अनुसार वर्तमान में बागपत में <strong className="text-blue-700 font-bold">{metrics.fedBaghpatCount}</strong> एवं बड़ौत में <strong className="text-indigo-700 font-bold">{metrics.fedBarautCount}</strong> ग्राम पंचायतों का सोशल ऑडिट डेटा वेबसाइट पर फीड हो चुका है (कुल <strong className="text-blue-700 font-bold">{metrics.fedTotalCount}</strong>)।
              आज (<strong className="text-slate-900">{formatDateHi(asOfDate)}</strong>) की तिथि तक जिन पंचायतों की बैठक हो चुकी है परंतु वेबसाइट पर फीड नहीं हुई हैं, वे नीचे <strong className="text-amber-800 font-bold">&apos;आज तक लंबित पुष्टि बॉक्स&apos;</strong> में निर्णय हेतु उपलब्ध हैं।
            </p>
          </div>

          {/* Quick Counter Highlight */}
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-blue-200 shadow-sm shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8 text-blue-700" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">कुल MIS फीडेड ऑडिट</div>
              <div className="text-3xl font-black text-blue-700 tracking-tight">
                {metrics.fedTotalCount} <span className="text-sm font-semibold text-slate-500">/ {metrics.totalGps} ({metrics.fedPercentage}%)</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                बागपत: <strong className="text-blue-700">{metrics.fedBaghpatCount}/44 ({metrics.baghpatFedPercentage}%)</strong> | बड़ौत: <strong className="text-indigo-700">{metrics.fedBarautCount}/44 ({metrics.barautFedPercentage}%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY METRIC CARDS (4 PILLARS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: कुल ग्राम पंचायतें */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">कुल ग्राम पंचायतें</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.totalGps}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-medium">
            <span>बागपत: <strong className="text-blue-700">{metrics.baghpatTotal}</strong></span>
            <span>बड़ौत: <strong className="text-indigo-700">{metrics.barautTotal}</strong></span>
          </div>
        </div>

        {/* Card 2: MIS पर फीडेड (पूर्ण) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-xs font-bold uppercase tracking-wider">MIS फीडेड (पूर्ण)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-3xl font-black text-blue-700 tracking-tight">
            {metrics.fedTotalCount} <span className="text-sm font-semibold text-slate-500">/ {metrics.totalGps}</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-medium">
            <span>बागपत: <strong className="text-blue-700">{metrics.fedBaghpatCount} ({metrics.baghpatFedPercentage}%)</strong></span>
            <span>बड़ौत: <strong className="text-indigo-700">{metrics.fedBarautCount} ({metrics.barautFedPercentage}%)</strong></span>
          </div>
        </div>

        {/* Card 3: समस्त लंबित (All Pending) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">समस्त लंबित (All Pending)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700 tracking-tight">
            {metrics.allPendingTotalCount} <span className="text-sm font-semibold text-slate-500">/ {metrics.totalGps}</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-medium">
            <span>बागपत: <strong className="text-amber-800">{metrics.allPendingBaghpatCount}</strong></span>
            <span>बड़ौत: <strong className="text-amber-800">{metrics.allPendingBarautCount}</strong></span>
          </div>
          <div className="text-[11px] text-emerald-800 font-bold pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>लंबित में NSAP पेंशन:</span>
            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              {metrics.pendingWithNSAPTotalCount} पंचायतें
            </span>
          </div>
        </div>

        {/* Card 4: आज तक लंबित (Due Pending) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider">आज तक लंबित (Due)</span>
            <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-rose-600 tracking-tight">
            {metrics.duePendingTotalCount} <span className="text-sm font-normal text-slate-500">पंचायतें</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-medium">
            <span>बागपत: <strong className="text-rose-700">{metrics.duePendingBaghpatCount}</strong></span>
            <span>बड़ौत: <strong className="text-rose-700">{metrics.duePendingBarautCount}</strong></span>
          </div>
          <div className="text-[11px] text-emerald-800 font-bold pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>देय में NSAP पेंशन:</span>
            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              {metrics.duePendingWithNSAPTotalCount} पंचायतें
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DEDICATED "लंबित पुष्टि बॉक्स" (PENDING ACTION BOX) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg md:text-xl font-black text-slate-900">
                  लंबित पुष्टि बॉक्स (MIS Feeding Action)
                </h3>
                <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  {pendingBoxRecords.length} प्रदर्शित
                </span>
                {pendingBoxRecords.filter(r => r.hasNSAP).length > 0 && (
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    {pendingBoxRecords.filter(r => r.hasNSAP).length} में NSAP पेंशन शामिल
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {pendingViewScope === 'due' 
                  ? `कट-ऑफ तिथि (${formatDateHi(asOfDate)}) तक जिन ग्राम पंचायतों की बैठक संपन्न हो चुकी है परंतु पोर्टल पर फीड नहीं हुई—वे यहाँ सूचीबद्ध हैं।`
                  : 'समस्त ग्राम पंचायतें जिनका ऑडिट अभी पोर्टल पर फीड होना शेष है।'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Scope Filter: Due vs All Pending */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPendingViewScope('due')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingViewScope === 'due' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="केवल वे जिनकी बैठक आज तक संपन्न हो चुकी है"
              >
                आज तक लंबित ({metrics.duePendingTotalCount})
              </button>
              <button
                onClick={() => setPendingViewScope('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingViewScope === 'all' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="समस्त लंबित ग्राम पंचायतें"
              >
                समस्त लंबित ({metrics.allPendingTotalCount})
              </button>
            </div>

            {/* Block Filter in Pending Box */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPendingBlockFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                सभी ({pendingViewScope === 'due' ? metrics.duePendingTotalCount : metrics.allPendingTotalCount})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baghpat')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'Baghpat' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                बागपत ({pendingViewScope === 'due' ? metrics.duePendingBaghpatCount : metrics.allPendingBaghpatCount})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baraut')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'Baraut' ? 'bg-indigo-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                बड़ौत ({pendingViewScope === 'due' ? metrics.duePendingBarautCount : metrics.allPendingBarautCount})
              </button>
            </div>

            {/* Toggle Upcoming Schedule */}
            <button
              onClick={() => setShowUpcomingList(!showUpcomingList)}
              className="text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 font-bold transition-all shadow-sm"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{showUpcomingList ? 'आगामी सूची छुपाएं' : `आगामी (${metrics.upcomingTotalCount})`}</span>
            </button>
          </div>
        </div>

        {/* List of Pending Box GPs */}
        {pendingBoxRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingBoxRecords.map((r, i) => {
              const isPastMeeting = r.meetingDate <= asOfDate;
              return (
              <div
                key={r.id}
                className={`p-4 rounded-2xl bg-white border transition-all space-y-3 shadow-sm hover:shadow-md group ${
                  isPastMeeting ? 'border-amber-300 hover:border-amber-400' : 'border-indigo-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        SR# {i + 1}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {r.block === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'}
                      </span>
                      {r.hasNSAP && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          NSAP पेंशन
                        </span>
                      )}
                    </div>
                    <div className="text-base font-black text-slate-900 pt-1">
                      {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-xl border shrink-0 ${
                    isPastMeeting 
                      ? 'text-amber-800 bg-amber-50 border-amber-200' 
                      : 'text-indigo-800 bg-indigo-50 border-indigo-200'
                  }`}>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{isPastMeeting ? 'आज तक लंबित' : 'आगामी लंबित'}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100 font-medium">
                  <div className="flex items-center justify-between">
                    <span>{isPastMeeting ? 'बैठक संपन्न तिथि:' : 'प्रस्तावित बैठक तिथि:'}</span>
                    <strong className="text-slate-900 font-mono font-bold">{formatDateHi(r.meetingDate)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ऑडिट योजना:</span>
                    <div className="flex items-center gap-1">
                      {r.hasNSAP && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-600" />
                          NSAP पेंशन
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        मनरेगा
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>BRP:</span>
                    <span className="text-slate-800 font-bold">{r.brpName} ({r.brpPhone})</span>
                  </div>
                </div>

                {/* 1-Click Action Button */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleStatusChange(r.id, 'fed')}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
                  >
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                    <span>MIS पर फीड हो चुका है</span>
                  </button>
                  <button
                    onClick={() => openEditModal(r)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200"
                    title="विवरण संपादित करें"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );})}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">
              शाबाश! इस फ़िल्टर में कोई भी लंबित ग्राम पंचायत नहीं है।
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              सभी लक्षित बैठकें MIS पर अपडेट हैं।
            </p>
          </div>
        )}

        {/* Collapsible Upcoming Meetings Section */}
        {showUpcomingList && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>भविष्य की आगामी बैठकें ({upcomingScheduledRecords.length} पंचायतें) - अपनी तारीख पर स्वतः सक्रिय होंगी:</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {upcomingScheduledRecords.map((r, i) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">
                        {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                      </span>
                      {r.hasNSAP && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          NSAP
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      SR# {i + 1} • {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-blue-800 font-bold block">
                      {formatDateHi(r.meetingDate)}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">प्रस्तावित</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. MAIN DATA TABLE (WITH FILTERS, SEARCH, & EXPORT) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-700" />
              <span>समस्त ग्राम पंचायतें • विस्तृत MIS फीडिंग विवरण</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              कुल {filteredRecords.length} ग्राम पंचायतें प्रदर्शित (कॉलम 8 के अनुसार 1 = फीडेड, 0 = अपूर्ण/लंबित)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="सर्च करें (पंचायत / BRP)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Block Filter */}
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">सभी ब्लॉक (88)</option>
              <option value="Baghpat">विकास खण्ड बागपत (44)</option>
              <option value="Baraut">विकास खण्ड बड़ौत (44)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">सभी स्थितियां ({metrics.totalGps})</option>
              <option value="fed">✅ MIS पर फीडेड ({metrics.fedTotalCount})</option>
              <option value="all_pending">⏳ समस्त लंबित ({metrics.allPendingTotalCount})</option>
              <option value="due_pending">⚠️ आज तक लंबित - संपन्न ({metrics.duePendingTotalCount})</option>
              <option value="pending_nsap">🟢 लंबित जिनमें NSAP शामिल है ({metrics.pendingWithNSAPTotalCount})</option>
              <option value="upcoming">📅 आगामी बैठकें ({metrics.upcomingTotalCount})</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
              title="CSV फ़ाइल डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>एक्सपोर्ट CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile Swipe Notice */}
        <div className="md:hidden px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-medium">
          <span>👉 तालिका को बाएं-दाएं स्वाइप करें</span>
          <span className="font-mono text-slate-500">कुल {filteredRecords.length} रिकॉर्ड्स</span>
        </div>

        {/* Single Responsive Table for Desktop, Tablet and Mobile */}
        <div className="overflow-x-auto max-h-[700px] scrollbar-thin rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">SR#</th>
                <th className="py-3 px-4">ब्लॉक</th>
                <th className="py-3 px-4">ग्राम पंचायत</th>
                <th className="py-3 px-3 text-center">बैठक तिथि</th>
                <th className="py-3 px-3 text-center">पोर्टल स्थिति (Col 8)</th>
                <th className="py-3 px-4 text-center">वर्तमान स्थिति</th>
                <th className="py-3 px-4 text-center">एक्शन (मैनुअल टॉगल)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.map((r, idx) => {
                const isFed = r.misStatus === 'fed';
                const isDuePending = !isFed && r.meetingDate <= asOfDate;
                const isUpcoming = !isFed && r.meetingDate > asOfDate;
                const isRecentlyUpdated = justUpdatedId === r.id;

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isRecentlyUpdated ? 'bg-blue-50 animate-pulse' : ''
                    } ${isDuePending ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                        r.block === 'Baghpat'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}>
                        {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                        </span>
                        {r.hasNSAP && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            NSAP पेंशन
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        BRP: {r.brpName} ({r.brpPhone})
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-800 font-bold">
                      {formatDateHi(r.meetingDate)}
                    </td>

                    {/* Column 8 Value from Official R 9.1.3 */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold font-mono text-xs ${
                        isFed 
                          ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {isFed ? '1' : '0'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {isFed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>फीड हो चुका</span>
                        </span>
                      ) : isDuePending ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>आज तक लंबित</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>आगामी प्रस्तावित</span>
                        </span>
                      )}
                    </td>

                    {/* Manual Action Switch */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                        <button
                          onClick={() => handleStatusChange(r.id, 'fed')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            isFed
                              ? 'bg-blue-700 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="MIS पर फीड हो चुका मार्क करें"
                        >
                          <Check className="w-3 h-3" />
                          <span>फीडेड</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(r.id, 'pending')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            !isFed
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="लंबित मार्क करें"
                        >
                          <Clock className="w-3 h-3" />
                          <span>लंबित</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
