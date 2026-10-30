'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { PanchayatNirnayStatus, SocialAuditRecord } from '@/types/socialAudit';
import { 
  CheckCircle2, Clock, XCircle, Search, Filter, 
  Download, Sparkles, Building2, ShieldCheck, 
  Smartphone, AlertCircle, ArrowUpRight, Check,
  Layers, Landmark, FileSpreadsheet, RefreshCw,
  Phone, UserCheck, Calendar, ChevronRight, AlertTriangle
} from 'lucide-react';

export default function PanchayatNirnayTab() {
  const { 
    records, 
    asOfDate, 
    fontViewMode, 
    updatePanchayatNirnayStatus,
    openEditModal 
  } = useSocialAuditStore();

  const [selectedBlockFilter, setSelectedBlockFilter] = useState<'all' | 'Baghpat' | 'Baraut'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'captured' | 'due_pending' | 'upcoming' | 'not_captured'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);

  // Dedicated Pending Box local filter & toggle for viewing upcoming schedule
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
          <span className="text-[11px] text-amber-300 font-mono" style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>
            {krutiText}
          </span>
        </span>
      );
    }
    return <span>{unicodeText}</span>;
  };

  // Detailed Metrics computation strictly respecting asOfDate
  const metrics = useMemo(() => {
    const totalGps = records.length; // 88
    const baghpatTotal = records.filter(r => r.block === 'Baghpat').length; // 44
    const barautTotal = records.filter(r => r.block === 'Baraut').length; // 44

    const mappedRecords = records.filter(r => r.isMappedInPanchayatNirnay);
    const totalMapped = mappedRecords.length; // 66 (44 in Baghpat + 22 in Baraut)
    const baghpatMapped = records.filter(r => r.block === 'Baghpat' && r.isMappedInPanchayatNirnay).length;
    const barautMapped = records.filter(r => r.block === 'Baraut' && r.isMappedInPanchayatNirnay).length;

    const capturedTotal = records.filter(r => r.panchayatNirnayStatus === 'captured');
    const capturedBaghpat = records.filter(r => r.block === 'Baghpat' && r.panchayatNirnayStatus === 'captured');
    const capturedBaraut = records.filter(r => r.block === 'Baraut' && r.panchayatNirnayStatus === 'captured');

    // Due Pending: Meeting date has arrived (meetingDate <= asOfDate) and status is pending
    const duePendingTotal = records.filter(r => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate);
    const duePendingBaghpat = records.filter(r => r.block === 'Baghpat' && (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate);
    const duePendingBaraut = records.filter(r => r.block === 'Baraut' && (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate);

    // Upcoming Scheduled: Future meetings (meetingDate > asOfDate) awaiting their meeting date
    const upcomingTotal = records.filter(r => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate);
    const upcomingBaghpat = records.filter(r => r.block === 'Baghpat' && (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate);
    const upcomingBaraut = records.filter(r => r.block === 'Baraut' && (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate);

    const notCapturedTotal = records.filter(r => r.panchayatNirnayStatus === 'not_captured');
    const notCapturedBaghpat = records.filter(r => r.block === 'Baghpat' && r.panchayatNirnayStatus === 'not_captured');
    const notCapturedBaraut = records.filter(r => r.block === 'Baraut' && r.panchayatNirnayStatus === 'not_captured');

    return {
      totalGps,
      totalMapped,
      baghpatMapped,
      barautMapped,
      capturedTotalCount: capturedTotal.length,
      capturedBaghpatCount: capturedBaghpat.length,
      capturedBarautCount: capturedBaraut.length,
      duePendingTotalCount: duePendingTotal.length, // Currently 0!
      duePendingBaghpatCount: duePendingBaghpat.length,
      duePendingBarautCount: duePendingBaraut.length,
      upcomingTotalCount: upcomingTotal.length, // Currently 40
      upcomingBaghpatCount: upcomingBaghpat.length,
      upcomingBarautCount: upcomingBaraut.length,
      notCapturedTotalCount: notCapturedTotal.length,
      notCapturedBaghpatCount: notCapturedBaghpat.length,
      notCapturedBarautCount: notCapturedBaraut.length,
      baghpatPercentage: ((capturedBaghpat.length / baghpatTotal) * 100).toFixed(2),
      barautPercentageTotal: ((capturedBaraut.length / barautTotal) * 100).toFixed(2),
      barautPercentageMapped: barautMapped > 0 ? ((capturedBaraut.length / barautMapped) * 100).toFixed(2) : '0.00',
      districtPercentage: ((capturedTotal.length / totalMapped) * 100).toFixed(2)
    };
  }, [records, asOfDate]);

  // Active Pending Queue: Meetings that occurred on or before asOfDate AND have not been confirmed yet
  const duePendingRecords = useMemo(() => {
    return records
      .filter(r => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate)
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [records, asOfDate]);

  const filteredDuePendingRecords = useMemo(() => {
    return duePendingRecords.filter(r => {
      if (pendingBlockFilter !== 'all' && r.block !== pendingBlockFilter) return false;
      return true;
    });
  }, [duePendingRecords, pendingBlockFilter]);

  // Upcoming Scheduled Meetings (meetingDate > asOfDate): Future meetings not due yet
  const upcomingScheduledRecords = useMemo(() => {
    return records
      .filter(r => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate)
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [records, asOfDate]);

  // Main Filtered records for table
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Block
      if (selectedBlockFilter !== 'all' && r.block !== selectedBlockFilter) return false;
      // Status
      if (selectedStatusFilter !== 'all') {
        const status = r.panchayatNirnayStatus || 'pending';
        if (selectedStatusFilter === 'captured' && status !== 'captured') return false;
        if (selectedStatusFilter === 'not_captured' && status !== 'not_captured') return false;
        if (selectedStatusFilter === 'due_pending') {
          if (status !== 'pending' || r.meetingDate > asOfDate) return false;
        }
        if (selectedStatusFilter === 'upcoming') {
          if (status !== 'pending' || r.meetingDate <= asOfDate) return false;
        }
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchGp = r.gpNameUnicode.toLowerCase().includes(q) || r.gpNameRaw.toLowerCase().includes(q);
        const matchBrp = (r.brpName || '').toLowerCase().includes(q);
        const matchOfficer = (r.supervisorOfficerUnicode || '').toLowerCase().includes(q);
        if (!matchGp && !matchBrp && !matchOfficer) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort captured first, then due pending, then upcoming, then not_captured
      const score = (r: SocialAuditRecord) => {
        if (r.panchayatNirnayStatus === 'captured') return 1;
        if ((r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate) return 2;
        if ((r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate) return 3;
        return 4;
      };
      const scoreA = score(a);
      const scoreB = score(b);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.meetingDate.localeCompare(b.meetingDate);
    });
  }, [records, asOfDate, selectedBlockFilter, selectedStatusFilter, searchQuery]);

  const handleStatusChange = (id: string, newStatus: PanchayatNirnayStatus) => {
    updatePanchayatNirnayStatus(id, newStatus);
    setJustUpdatedId(id);
    setTimeout(() => setJustUpdatedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. OFFICIAL REPORT HEADER BANNER (R 9.6.2) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                R 9.6.2 पंचायत निर्णय ऐप अपलोड प्रपत्र रिपोर्ट
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                वित्तीय वर्ष 2026-2027 • उत्तर प्रदेश
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                जनपद: बागपत
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              ग्राम पंचायत सोशल ऑडिट • पंचायत निर्णय ऐप ट्रैकर
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              सरकारी पोर्टल R 9.6.2 के अनुसार बागपत में <strong className="text-emerald-400 font-bold">6</strong> एवं बड़ौत में <strong className="text-emerald-400 font-bold">3</strong> ग्राम पंचायतें अपलोड हैं।
              विगत बैठकों में जो ऐप पर नहीं हो सकीं, वे अब पोर्टल पर संभव नहीं हैं।
              आज (<strong className="text-white">{formatDateHi(asOfDate)}</strong>) तक की सभी बैठकें पूरी तरह अद्यतन हैं। आगामी सभाएं अपने बैठक दिवस पर स्वतः नीचे दिए गए <strong className="text-amber-300 font-bold">&apos;लंबित पुष्टि बॉक्स&apos;</strong> में निर्णय हेतु सक्रिय होंगी।
            </p>
          </div>

          {/* Quick Counter Highlight */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 shadow-xl shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">कुल ऐप अपलोड सत्यापित</div>
              <div className="text-3xl font-black text-emerald-400 tracking-tight">
                {metrics.capturedTotalCount} <span className="text-sm font-semibold text-slate-400">/ {metrics.totalMapped} मैप्ड</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                बागपत: <strong className="text-blue-400">{metrics.capturedBaghpatCount}</strong> | बड़ौत: <strong className="text-indigo-400">{metrics.capturedBarautCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS OVERVIEW CARDS (DATE-AWARE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Captured in App */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>कुल अपलोड (Captured)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.capturedTotalCount} <span className="text-xs font-normal text-slate-400">GPs</span></div>
          <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <span>सत्यापित दर: {metrics.districtPercentage}%</span>
          </div>
        </div>

        {/* Card 2: Past Not Captured (Missed) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>विगत बैठकें (अपलोड नहीं हुआ)</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300">
            {metrics.notCapturedTotalCount} <span className="text-xs font-normal text-slate-400">GPs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            विगत बैठकें (पोर्टल पर अब संभव नहीं)
          </div>
        </div>

        {/* Card 3: Due for Confirmation (Actionable Pending - Currently 0!) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>आज तक लंबित (Due Pending)</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {metrics.duePendingTotalCount} <span className="text-xs font-normal text-slate-400">GPs</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-bold">
            {metrics.duePendingTotalCount === 0 ? '✓ आज तक सब क्लियर है' : 'सत्यापन प्रतीक्षित'}
          </div>
        </div>

        {/* Card 4: Upcoming Scheduled Meetings */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>आगामी प्रस्तावित बैठकें</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">
            {metrics.upcomingTotalCount} <span className="text-xs font-normal text-slate-400">GPs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            31/10 से बैठक दिवस पर स्वतः सक्रिय
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CAPTURED HIGHLIGHT BADGES: 6 BAGHPAT + 3 BARAUT */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/20">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white">
              आधिकारिक रिपोर्ट R 9.6.2 से सत्यापित 9 ग्राम पंचायतें (Live Captured)
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-semibold">
            6 बागपत + 3 बड़ौत = 9 पूर्ण
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baghpat 6 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-blue-500/20 space-y-2">
            <div className="text-xs font-bold text-blue-400 flex items-center justify-between">
              <span>विकास खण्ड बागपत (6 ग्राम पंचायतें):</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                13.64% पूर्ण
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { name: 'खेड़ा इस्लामपुर', date: '16/10/2026' },
                { name: 'खेड़की', date: '29/10/2026' },
                { name: 'लधवाड़ी', date: '22/10/2026' },
                { name: 'नैथला', date: '27/10/2026' },
                { name: 'नंगला-जफराबाद', date: '27/10/2026' },
                { name: 'निरोजपुर गूर्जर', date: '27/10/2026' }
              ].map(gp => (
                <span key={gp.name} className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{gp.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({gp.date})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Baraut 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-indigo-500/20 space-y-2">
            <div className="text-xs font-bold text-indigo-400 flex items-center justify-between">
              <span>विकास खण्ड बड़ौत (3 ग्राम पंचायतें):</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                6.82% पूर्ण (मैप्ड में 13.6%)
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { name: 'अलावलपुर', date: '12/09/2026' },
                { name: 'अंगदपुर', date: '12/09/2026' },
                { name: 'फतहपुर चक', date: '22/10/2026' }
              ].map(gp => (
                <span key={gp.name} className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{gp.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({gp.date})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DEDICATED PENDING CONFIRMATION BOX (DATE-AWARE ACTION QUEUE) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 border-2 border-amber-500/30 p-5 md:p-6 shadow-2xl space-y-4">
        {/* Header of Pending Box */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
              duePendingRecords.length > 0 
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-amber-500/20' 
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-emerald-500/20'
            }`}>
              {duePendingRecords.length > 0 ? (
                <Clock className="w-6 h-6 animate-pulse" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-white">
                  पंचायत निर्णय ऐप • लंबित पुष्टि बॉक्स (Pending Confirmation Box)
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-md ${
                  duePendingRecords.length > 0 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-emerald-500 text-slate-950'
                }`}>
                  {duePendingRecords.length} आज तक लंबित
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                बैठक तिथि के अनुसार सत्यापन — सभा संपन्न होने के दिन ही पुष्टि हेतु यहाँ प्रदर्शित होगी।
              </p>
            </div>
          </div>

          {/* If there are due records, show block filter */}
          {duePendingRecords.length > 0 && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setPendingBlockFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'all'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                सभी ({duePendingRecords.length})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baghpat')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'Baghpat'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                बागपत ({duePendingRecords.filter(r => r.block === 'Baghpat').length})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baraut')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'Baraut'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                बड़ौत ({duePendingRecords.filter(r => r.block === 'Baraut').length})
              </button>
            </div>
          )}
        </div>

        {/* When 0 Due Records (All clear today) */}
        {duePendingRecords.length === 0 ? (
          <div className="py-8 px-6 text-center rounded-2xl bg-slate-950/60 border border-emerald-500/20 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-300">
                आज ({formatDateHi(asOfDate)}) की तिथि तक कोई भी सभा निर्णय ऐप पर लंबित नहीं है!
              </h4>
              <p className="text-xs text-slate-400 max-w-xl mx-auto mt-1 leading-relaxed">
                आज तक की सभी विगत बैठकें पूरी तरह स्पष्ट हैं (9 ऐप पर अपलोड, 39 विगत में छूट गईं)।
                आगामी बैठकें (31/10/2026 से) अपने निर्धारित बैठक दिवस पर स्वतः यहाँ पुष्टि हेतु प्रदर्शित होंगी, ताकि आप बैठक संपन्न होने पर ही निर्णय ले सकें।
              </p>
            </div>

            {/* Quick expandable view for 40 upcoming meetings */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowUpcomingList(!showUpcomingList)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 px-4 py-2 rounded-xl border border-blue-800/50 flex items-center gap-1.5 transition-all shadow-md"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{showUpcomingList ? 'आगामी सूची संक्षेप करें' : `आगामी निर्धारित बैठकें देखें (${upcomingScheduledRecords.length} सभाएं • 31/10 से शुरू)`}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showUpcomingList ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* If user clicks to view upcoming scheduled */}
            {showUpcomingList && (
              <div className="mt-4 pt-4 border-t border-slate-800 text-left space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>भविष्य की प्रस्तावित बैठकें (बैठक दिवस पर स्वतः सक्रिय होंगी):</span>
                  <span className="text-blue-400">कुल {upcomingScheduledRecords.length} ग्राम पंचायतें</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {upcomingScheduledRecords.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{renderText(gpNameUnicode(r), r.gpNameKrutiDev)}</div>
                        <div className="text-[10px] text-slate-400">{r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'} • BRP: {r.brpName || '—'}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 block">
                          {formatDateHi(r.meetingDate)}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5 block">आगामी</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* When duePendingRecords > 0 (e.g. on 31-Oct-2026 or when date changes) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredDuePendingRecords.map((gp) => {
              const isJustUpdated = justUpdatedId === gp.id;

              return (
                <div
                  key={gp.id}
                  className={`p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all space-y-3 shadow-md ${
                    isJustUpdated ? 'ring-2 ring-emerald-400 bg-emerald-950/20' : ''
                  }`}
                >
                  {/* Top: Date & Block */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                      gp.block === 'Baghpat'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-amber-300 font-bold bg-amber-950/50 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>{formatDateHi(gp.meetingDate)}</span>
                    </div>
                  </div>

                  {/* Center: GP Name & BRP */}
                  <div>
                    <h4 className="text-base font-black text-white">
                      {renderText(gpNameUnicode(gp), gp.gpNameKrutiDev)}
                    </h4>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>BRP: <strong className="text-slate-300">{gp.brpName || '—'}</strong></span>
                      </span>
                      {gp.isAmended && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/30">
                          संशोधित
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleStatusChange(gp.id, 'captured')}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1 active:scale-95"
                      title="पुष्टि करें: यह ग्राम सभा पंचायत निर्णय ऐप पर अपलोड हो चुकी है"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>सत्यापित (Captured)</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(gp.id, 'not_captured')}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-bold border border-slate-800 hover:border-rose-500/40 transition-all flex items-center gap-1"
                      title="चिह्नित करें: ऐप पर नहीं हुआ"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>नहीं</span>
                    </button>

                    <button
                      onClick={() => openEditModal(gp)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs"
                      title="विवरण संपादित करें"
                    >
                      संपादित
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FILTER & SEARCH TOOLBAR FOR MASTER TABLE */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
        {/* Block Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedBlockFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBlockFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            सभी ब्लॉक ({metrics.totalGps})
          </button>
          <button
            onClick={() => setSelectedBlockFilter('Baghpat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBlockFilter === 'Baghpat'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            बागपत ({metrics.capturedBaghpatCount}/44)
          </button>
          <button
            onClick={() => setSelectedBlockFilter('Baraut')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBlockFilter === 'Baraut'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            बड़ौत ({metrics.capturedBarautCount}/44)
          </button>
        </div>

        {/* Status Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedStatusFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              सभी ({records.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('captured')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'captured'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:bg-emerald-950/40'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>अपलोड ({metrics.capturedTotalCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatusFilter('due_pending')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'due_pending'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-400 hover:bg-amber-950/40'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>आज तक लंबित ({metrics.duePendingTotalCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatusFilter('upcoming')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-400 hover:bg-blue-950/40'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>आगामी ({metrics.upcomingTotalCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatusFilter('not_captured')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'not_captured'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>नहीं हुआ ({metrics.notCapturedTotalCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ग्राम पंचायत खोजें..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. INTERACTIVE MASTER TABLE WITH 1-CLICK CONFIRMATION BUTTONS */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-12 text-center">क्र०</th>
                <th className="py-3 px-3">विकास खण्ड</th>
                <th className="py-3 px-4">ग्राम पंचायत</th>
                <th className="py-3 px-3 text-center">सोशल ऑडिट तिथि</th>
                <th className="py-3 px-3 text-center">निर्णय ऐप मैपिंग</th>
                <th className="py-3 px-4 text-center">
                  पंचायत निर्णय ऐप स्थिति (सत्यापन)
                </th>
                <th className="py-3 px-3 text-center">अपलोड / स्थिति विवरण</th>
                <th className="py-3 px-3 text-center">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                    कोई रिकॉर्ड नहीं मिला।
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const status: PanchayatNirnayStatus = r.panchayatNirnayStatus || 'pending';
                  const isFuture = r.meetingDate > asOfDate;
                  const isJustUpdated = justUpdatedId === r.id;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        status === 'captured' ? 'bg-emerald-950/10' : ''
                      } ${status === 'not_captured' ? 'bg-rose-950/5' : ''} ${
                        isJustUpdated ? 'ring-2 ring-emerald-500/80 bg-emerald-950/30' : ''
                      }`}
                    >
                      {/* S.No */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Block */}
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.block === 'Baghpat'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                        </span>
                      </td>

                      {/* GP Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">
                          {renderText(gpNameUnicode(r), r.gpNameKrutiDev)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          BRP: {r.brpName || '—'} • पर्यवेक्षक: {r.supervisorOfficerUnicode || '—'}
                        </div>
                      </td>

                      {/* Meeting Date */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                        {formatDateHi(r.meetingDate)}
                      </td>

                      {/* Mapping Status */}
                      <td className="py-3 px-3 text-center">
                        {r.isMappedInPanchayatNirnay ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            मैप्ड (100%)
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            गैर-मैप्ड
                          </span>
                        )}
                      </td>

                      {/* Status / Interactive Buttons */}
                      <td className="py-3 px-4 text-center">
                        {status === 'captured' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>सत्यापित (Captured)</span>
                          </span>
                        ) : status === 'not_captured' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>नहीं हुआ (Not Captured)</span>
                          </span>
                        ) : isFuture ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-950/40 text-blue-300 border border-blue-500/30 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            <span>आगामी ({formatDateHi(r.meetingDate)} को सक्रिय)</span>
                          </span>
                        ) : (
                          /* Due Pending (meetingDate <= asOfDate) */
                          <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-amber-500/40 gap-1 shadow-inner">
                            <button
                              onClick={() => handleStatusChange(r.id, 'captured')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-md flex items-center gap-1"
                              title="सत्यापित करें"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>सत्यापित</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(r.id, 'not_captured')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-md flex items-center gap-1"
                              title="नहीं हुआ"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>नहीं हुआ</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Captured / Upload Date / Status Detail */}
                      <td className="py-3 px-3 text-center text-xs font-mono">
                        {status === 'captured' ? (
                          <span className="text-emerald-400 font-bold">
                            {formatDateHi(r.panchayatNirnayCapturedDate || r.meetingDate)}
                          </span>
                        ) : status === 'not_captured' ? (
                          <span className="text-rose-400/80 text-[11px]">छूट गई (विगत)</span>
                        ) : isFuture ? (
                          <span className="text-slate-400 text-[11px]">बैठक प्रतीक्षित</span>
                        ) : (
                          <span className="text-amber-400 font-bold text-[11px]">पुष्टि प्रतीक्षित</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openEditModal(r)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                          title="विवरण संपादित करें"
                        >
                          संपादित
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper to safely get GP Name
function gpNameUnicode(r: SocialAuditRecord) {
  return r.gpNameUnicode || r.gpNameRaw;
}
