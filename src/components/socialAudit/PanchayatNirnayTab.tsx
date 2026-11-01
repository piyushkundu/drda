'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { PanchayatNirnayStatus, SocialAuditRecord } from '@/types/socialAudit';
import { matchesBRP } from '@/lib/brpHelper';
import { 
  CheckCircle2, Clock, XCircle, Search, Filter, 
  Download, Building2, ShieldCheck, 
  Smartphone, AlertCircle, ArrowUpRight, Check,
  Layers, Landmark, FileSpreadsheet, RefreshCw,
  Phone, UserCheck, Calendar, ChevronRight, AlertTriangle
} from 'lucide-react';

export default function PanchayatNirnayTab() {
  const { 
    records, 
    selectedBRP,
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

    const mappedRecords = effectiveRecords.filter(r => r.isMappedInPanchayatNirnay);
    const totalMapped = mappedRecords.length;
    const baghpatMapped = effectiveRecords.filter(r => r.block === 'Baghpat' && r.isMappedInPanchayatNirnay).length;
    const barautMapped = effectiveRecords.filter(r => r.block === 'Baraut' && r.isMappedInPanchayatNirnay).length;

    const capturedTotal = effectiveRecords.filter(r => r.panchayatNirnayStatus === 'captured');
    const capturedBaghpat = effectiveRecords.filter(r => r.block === 'Baghpat' && r.panchayatNirnayStatus === 'captured');
    const capturedBaraut = effectiveRecords.filter(r => r.block === 'Baraut' && r.panchayatNirnayStatus === 'captured');

    // Due Pending: Meeting date has arrived (meetingDate <= asOfDate) and status is pending
    const duePendingTotal = effectiveRecords.filter(r => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate);
    const duePendingBaghpat = effectiveRecords.filter(r => r.block === 'Baghpat' && (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate);
    const duePendingBaraut = effectiveRecords.filter(r => r.block === 'Baraut' && (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate);

    // Upcoming Scheduled: Future meetings (meetingDate > asOfDate) awaiting their meeting date
    const upcomingTotal = effectiveRecords.filter(r => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate);
    const upcomingBaghpat = effectiveRecords.filter(r => r.block === 'Baghpat' && (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate);
    const upcomingBaraut = effectiveRecords.filter(r => r.block === 'Baraut' && (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate);

    const notCapturedTotal = effectiveRecords.filter(r => r.panchayatNirnayStatus === 'not_captured');
    const notCapturedBaghpat = effectiveRecords.filter(r => r.block === 'Baghpat' && r.panchayatNirnayStatus === 'not_captured');
    const notCapturedBaraut = effectiveRecords.filter(r => r.block === 'Baraut' && r.panchayatNirnayStatus === 'not_captured');

    return {
      totalGps,
      totalMapped,
      baghpatMapped,
      barautMapped,
      capturedTotalCount: capturedTotal.length,
      capturedBaghpatCount: capturedBaghpat.length,
      capturedBarautCount: capturedBaraut.length,
      duePendingTotalCount: duePendingTotal.length,
      duePendingBaghpatCount: duePendingBaghpat.length,
      duePendingBarautCount: duePendingBaraut.length,
      upcomingTotalCount: upcomingTotal.length,
      upcomingBaghpatCount: upcomingBaghpat.length,
      upcomingBarautCount: upcomingBaraut.length,
      notCapturedTotalCount: notCapturedTotal.length,
      notCapturedBaghpatCount: notCapturedBaghpat.length,
      notCapturedBarautCount: notCapturedBaraut.length,
      baghpatPercentage: baghpatTotal > 0 ? ((capturedBaghpat.length / baghpatTotal) * 100).toFixed(2) : '0.00',
      barautPercentageTotal: barautTotal > 0 ? ((capturedBaraut.length / barautTotal) * 100).toFixed(2) : '0.00',
      barautPercentageMapped: barautMapped > 0 ? ((capturedBaraut.length / barautMapped) * 100).toFixed(2) : '0.00',
      districtPercentage: totalMapped > 0 ? ((capturedTotal.length / totalMapped) * 100).toFixed(2) : '0.00'
    };
  }, [effectiveRecords, asOfDate]);

  // Active Pending Queue: Meetings that occurred on or before asOfDate AND have not been confirmed yet
  const duePendingRecords = useMemo(() => {
    return effectiveRecords
      .filter(r => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate)
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [effectiveRecords, asOfDate]);

  const filteredDuePendingRecords = useMemo(() => {
    return duePendingRecords.filter(r => {
      if (pendingBlockFilter !== 'all' && r.block !== pendingBlockFilter) return false;
      return true;
    });
  }, [duePendingRecords, pendingBlockFilter]);

  // Upcoming Scheduled Meetings (meetingDate > asOfDate): Future meetings not due yet
  const upcomingScheduledRecords = useMemo(() => {
    return effectiveRecords
      .filter(r => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate)
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [effectiveRecords, asOfDate]);

  // Active Captured Records: Filter records by status === 'captured' dynamically
  const capturedBaghpatRecords = useMemo(() => {
    return effectiveRecords
      .filter(r => r.block === 'Baghpat' && r.panchayatNirnayStatus === 'captured')
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [effectiveRecords]);

  const capturedBarautRecords = useMemo(() => {
    return effectiveRecords
      .filter(r => r.block === 'Baraut' && r.panchayatNirnayStatus === 'captured')
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [effectiveRecords]);

  // Main Filtered records for table
  const filteredRecords = useMemo(() => {
    return effectiveRecords.filter(r => {
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
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                R 9.6.2 पंचायत निर्णय ऐप अपलोड प्रपत्र रिपोर्ट
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                वित्तीय वर्ष 2026-2027 • उत्तर प्रदेश
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                जनपद: बागपत
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              ग्राम पंचायत सोशल ऑडिट • पंचायत निर्णय ऐप ट्रैकर
            </h1>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
              पंचायत निर्णय ऐप (R 9.6.2) के अनुसार वर्तमान में बागपत में <strong className="text-emerald-700 font-bold">{metrics.capturedBaghpatCount}</strong> एवं बड़ौत में <strong className="text-emerald-700 font-bold">{metrics.capturedBarautCount}</strong> ग्राम पंचायतें अपलोड हैं (कुल <strong className="text-emerald-700 font-bold">{metrics.capturedTotalCount}</strong>)।
              आज (<strong className="text-slate-900">{formatDateHi(asOfDate)}</strong>) तक की सभी बैठकें पूरी तरह अद्यतन हैं। आगामी सभाएं अपने बैठक दिवस पर स्वतः नीचे दिए गए <strong className="text-amber-800 font-bold">&apos;लंबित पुष्टि बॉक्स&apos;</strong> में निर्णय हेतु सक्रिय होंगी।
            </p>
          </div>

          {/* Quick Counter Highlight */}
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-emerald-200 shadow-sm shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">कुल ऐप अपलोड सत्यापित</div>
              <div className="text-3xl font-black text-emerald-700 tracking-tight">
                {metrics.capturedTotalCount} <span className="text-sm font-semibold text-slate-500">/ {metrics.totalMapped} मैप्ड</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                बागपत: <strong className="text-blue-700 font-bold">{metrics.capturedBaghpatCount}</strong> | बड़ौत: <strong className="text-indigo-700 font-bold">{metrics.capturedBarautCount}</strong>
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
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>कुल अपलोड (Captured)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.capturedTotalCount} <span className="text-xs font-normal text-slate-500">GPs</span></div>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <span>सत्यापित दर: {metrics.districtPercentage}%</span>
          </div>
        </div>

        {/* Card 2: Past Not Captured (Missed) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>विगत बैठकें (अपलोड नहीं हुआ)</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {metrics.notCapturedTotalCount} <span className="text-xs font-normal text-slate-500">GPs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            विगत बैठकें (पोर्टल पर अब संभव नहीं)
          </div>
        </div>

        {/* Card 3: Due for Confirmation (Actionable Pending) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>आज तक लंबित (Due Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.duePendingTotalCount} <span className="text-xs font-normal text-slate-500">GPs</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold">
            {metrics.duePendingTotalCount === 0 ? '✓ आज तक सब क्लियर है' : 'सत्यापन प्रतीक्षित'}
          </div>
        </div>

        {/* Card 4: Upcoming Scheduled Meetings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>आगामी प्रस्तावित बैठकें</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">
            {metrics.upcomingTotalCount} <span className="text-xs font-normal text-slate-500">GPs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            31/10 से बैठक दिवस पर स्वतः सक्रिय
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CAPTURED HIGHLIGHT BADGES: DYNAMICALLY SYNCED WITH ALL USER ACCEPTED GPs */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              सत्यापित एवं अपलोड {metrics.capturedTotalCount} ग्राम पंचायतें (Live Captured)
            </h3>
          </div>
          <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {metrics.capturedBaghpatCount} बागपत + {metrics.capturedBarautCount} बड़ौत = {metrics.capturedTotalCount} पूर्ण
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baghpat */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
              <span>विकास खण्ड बागपत ({metrics.capturedBaghpatCount} ग्राम पंचायतें):</span>
              <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                {metrics.baghpatPercentage}% पूर्ण
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {capturedBaghpatRecords.length > 0 ? (
                capturedBaghpatRecords.map(gp => (
                  <span key={gp.id} className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-medium flex items-center gap-1.5 shadow-sm">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="font-bold">{renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({formatDateHi(gp.meetingDate)})</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">कोई ग्राम पंचायत अपलोड नहीं है</span>
              )}
            </div>
          </div>

          {/* Baraut */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-indigo-900 flex items-center justify-between">
              <span>विकास खण्ड बड़ौत ({metrics.capturedBarautCount} ग्राम पंचायतें):</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                {metrics.barautPercentageTotal}% पूर्ण (मैप्ड में {metrics.barautPercentageMapped}%)
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {capturedBarautRecords.length > 0 ? (
                capturedBarautRecords.map(gp => (
                  <span key={gp.id} className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-medium flex items-center gap-1.5 shadow-sm">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="font-bold">{renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({formatDateHi(gp.meetingDate)})</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">कोई ग्राम पंचायत अपलोड नहीं है</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. DEDICATED PENDING CONFIRMATION BOX (DATE-AWARE ACTION QUEUE) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
        {/* Header of Pending Box */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
              duePendingRecords.length > 0 
                ? 'bg-amber-50 border border-amber-200 text-amber-700' 
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              {duePendingRecords.length > 0 ? (
                <Clock className="w-6 h-6 animate-pulse" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-slate-900">
                  पंचायत निर्णय ऐप • लंबित पुष्टि बॉक्स (Pending Confirmation Box)
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  duePendingRecords.length > 0 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {duePendingRecords.length} आज तक लंबित
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                बैठक तिथि के अनुसार सत्यापन — सभा संपन्न होने के दिन ही पुष्टि हेतु यहाँ प्रदर्शित होगी।
              </p>
            </div>
          </div>

          {/* If there are due records, show block filter */}
          {duePendingRecords.length > 0 && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setPendingBlockFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'all'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                सभी ({duePendingRecords.length})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baghpat')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'Baghpat'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                बागपत ({duePendingRecords.filter(r => r.block === 'Baghpat').length})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baraut')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'Baraut'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                बड़ौत ({duePendingRecords.filter(r => r.block === 'Baraut').length})
              </button>
            </div>
          )}
        </div>

        {/* When 0 Due Records (All clear today) */}
        {duePendingRecords.length === 0 ? (
          <div className="py-8 px-6 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-800">
                आज ({formatDateHi(asOfDate)}) की तिथि तक कोई भी सभा निर्णय ऐप पर लंबित नहीं है!
              </h4>
              <p className="text-xs text-slate-600 max-w-xl mx-auto mt-1 leading-relaxed font-medium">
                आज तक की सभी विगत बैठकें पूरी तरह स्पष्ट हैं (14 ऐप पर अपलोड, 38 विगत में छूट गईं)।
                आगामी बैठकें (31/10/2026 से) अपने निर्धारित बैठक दिवस पर स्वतः यहाँ पुष्टि हेतु प्रदर्शित होंगी।
              </p>
            </div>

            {/* Quick expandable view for upcoming meetings */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowUpcomingList(!showUpcomingList)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl border border-blue-200 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{showUpcomingList ? 'आगामी सूची संक्षेप करें' : `आगामी निर्धारित बैठकें देखें (${upcomingScheduledRecords.length} सभाएं • 31/10 से शुरू)`}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showUpcomingList ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* If user clicks to view upcoming scheduled */}
            {showUpcomingList && (
              <div className="mt-4 pt-4 border-t border-slate-200 text-left space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                  <span>भविष्य की प्रस्तावित बैठकें (बैठक दिवस पर स्वतः सक्रिय होंगी):</span>
                  <span className="text-blue-700">कुल {upcomingScheduledRecords.length} ग्राम पंचायतें</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {upcomingScheduledRecords.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm">
                      <div>
                        <div className="font-bold text-slate-900">{renderText(gpNameUnicode(r), r.gpNameKrutiDev)}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'} • BRP: {r.brpName || '—'}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block">
                          {formatDateHi(r.meetingDate)}
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5 block font-medium">आगामी</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* When duePendingRecords > 0 */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredDuePendingRecords.map((gp) => {
              const isJustUpdated = justUpdatedId === gp.id;

              return (
                <div
                  key={gp.id}
                  className={`p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 transition-all space-y-3 shadow-sm ${
                    isJustUpdated ? 'ring-2 ring-emerald-400 bg-emerald-50/30' : ''
                  }`}
                >
                  {/* Top: Date & Block */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                      gp.block === 'Baghpat'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}>
                      {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>{formatDateHi(gp.meetingDate)}</span>
                    </div>
                  </div>

                  {/* Center: GP Name & BRP */}
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      {renderText(gpNameUnicode(gp), gp.gpNameKrutiDev)}
                    </h4>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>BRP: <strong className="text-slate-800 font-bold">{gp.brpName || '—'}</strong></span>
                      </span>
                      {gp.isAmended && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                          संशोधित
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleStatusChange(gp.id, 'captured')}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95"
                      title="पुष्टि करें: यह ग्राम सभा पंचायत निर्णय ऐप पर अपलोड हो चुकी है"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>सत्यापित (Captured)</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(gp.id, 'not_captured')}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1"
                      title="चिह्नित करें: ऐप पर नहीं हुआ"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>नहीं</span>
                    </button>

                    <button
                      onClick={() => openEditModal(gp)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold"
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
      {/* 7. FILTER & SEARCH TOOLBAR FOR MASTER TABLE */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Block Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedBlockFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBlockFilter === 'all'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            सभी ब्लॉक ({metrics.totalGps})
          </button>
          <button
            onClick={() => setSelectedBlockFilter('Baghpat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBlockFilter === 'Baghpat'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            बागपत ({metrics.capturedBaghpatCount}/44)
          </button>
          <button
            onClick={() => setSelectedBlockFilter('Baraut')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBlockFilter === 'Baraut'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            बड़ौत ({metrics.capturedBarautCount}/44)
          </button>
        </div>

        {/* Status Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedStatusFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सभी ({records.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('captured')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'captured'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>अपलोड ({metrics.capturedTotalCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatusFilter('due_pending')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'due_pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>आज तक लंबित ({metrics.duePendingTotalCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatusFilter('upcoming')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'upcoming'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-blue-800 hover:bg-blue-50'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>आगामी ({metrics.upcomingTotalCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatusFilter('not_captured')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'not_captured'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-50'
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. INTERACTIVE MASTER TABLE WITH 1-CLICK CONFIRMATION BUTTONS */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Mobile Swipe Notice */}
        <div className="md:hidden px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-medium">
          <span>👉 तालिका को बाएं-दाएं स्वाइप करें</span>
          <span className="font-mono text-slate-500">कुल {filteredRecords.length} रिकॉर्ड्स</span>
        </div>

        {/* Single Responsive Table for Desktop, Tablet and Mobile */}
        <div className="overflow-x-auto max-h-[700px] scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/90 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
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
                      className={`hover:bg-slate-50/80 transition-colors ${
                        status === 'captured' ? 'bg-emerald-50/30' : ''
                      } ${status === 'not_captured' ? 'bg-rose-50/20' : ''} ${
                        isJustUpdated ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
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
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}>
                          {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                        </span>
                      </td>

                      {/* GP Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {renderText(gpNameUnicode(r), r.gpNameKrutiDev)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          BRP: {r.brpName || '—'} • पर्यवेक्षक: {r.supervisorOfficerUnicode || '—'}
                        </div>
                      </td>

                      {/* Meeting Date */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {formatDateHi(r.meetingDate)}
                      </td>

                      {/* Mapping Status */}
                      <td className="py-3 px-3 text-center">
                        {r.isMappedInPanchayatNirnay ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            मैप्ड (100%)
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            गैर-मैप्ड
                          </span>
                        )}
                      </td>

                      {/* Status / Interactive Buttons */}
                      <td className="py-3 px-4 text-center">
                        {status === 'captured' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>सत्यापित (Captured)</span>
                          </span>
                        ) : status === 'not_captured' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>नहीं हुआ (Not Captured)</span>
                          </span>
                        ) : isFuture ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>आगामी ({formatDateHi(r.meetingDate)} को सक्रिय)</span>
                          </span>
                        ) : (
                          /* Due Pending (meetingDate <= asOfDate) */
                          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-amber-300 gap-1 shadow-inner">
                            <button
                              onClick={() => handleStatusChange(r.id, 'captured')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1"
                              title="सत्यापित करें"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>सत्यापित</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(r.id, 'not_captured')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1"
                              title="नहीं हुआ"
                            >
                              <XCircle className="w-3.5 h-3.5 text-white" />
                              <span>नहीं हुआ</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Captured / Upload Date / Status Detail */}
                      <td className="py-3 px-3 text-center text-xs font-mono">
                        {status === 'captured' ? (
                          <span className="text-emerald-700 font-bold">
                            {formatDateHi(r.panchayatNirnayCapturedDate || r.meetingDate)}
                          </span>
                        ) : status === 'not_captured' ? (
                          <span className="text-rose-600 font-medium text-[11px]">छूट गई (विगत)</span>
                        ) : isFuture ? (
                          <span className="text-slate-500 text-[11px] font-medium">बैठक प्रतीक्षित</span>
                        ) : (
                          <span className="text-amber-700 font-bold text-[11px]">पुष्टि प्रतीक्षित</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openEditModal(r)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
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
