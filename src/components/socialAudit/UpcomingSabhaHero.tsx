'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { SocialAuditRecord } from '@/types/socialAudit';
import { 
  Calendar, Clock, MapPin, Phone, Users, Shield, 
  AlertCircle, CheckCircle2, ChevronRight, Sparkles,
  Layers, ArrowUpRight, Check, AlertTriangle, TrendingUp,
  BarChart3, Landmark, Eye, Table2, ChevronDown, ChevronUp
} from 'lucide-react';

export default function UpcomingSabhaHero() {
  const [showMatrix, setShowMatrix] = useState(true);
  const { 
    records, 
    asOfDate, 
    fontViewMode, 
    openEditModal, 
    markCompleted,
    setActiveTab,
    setSelectedBlock 
  } = useSocialAuditStore();

  // Helper to format date in Hindi DD/MM/YYYY
  const formatDateHi = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  // Helper to calculate days diff from asOfDate
  const getDaysDiff = (targetDate: string) => {
    const d1 = new Date(asOfDate).getTime();
    const d2 = new Date(targetDate).getTime();
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filter all upcoming meetings (meetingDate >= asOfDate)
  const upcomingMeetings = useMemo(() => {
    return [...records]
      .filter((r) => r.meetingDate >= asOfDate && r.status !== 'completed')
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [records, asOfDate]);

  // Compute detailed metrics for Baghpat and Baraut
  const blockStats = useMemo(() => {
    const compute = (blockName: 'Baghpat' | 'Baraut') => {
      const all = records.filter((r) => r.block === blockName);
      const total = all.length; // 44

      const completed = all.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
      const remaining = all.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');

      const amendedAll = all.filter((r) => r.isAmended);
      const amendedCompleted = amendedAll.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
      const amendedRemaining = amendedAll.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');

      const nsapAll = all.filter((r) => r.hasNSAP);
      const nsapCompleted = nsapAll.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
      const nsapRemaining = nsapAll.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');

      const mgnregaAll = all.filter((r) => r.hasMGNREGA);
      const mgnregaCompleted = mgnregaAll.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
      const mgnregaRemaining = mgnregaAll.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');

      return {
        total,
        completedCount: completed.length,
        remainingCount: remaining.length,
        progressPercent: total > 0 ? Math.round((completed.length / total) * 100) : 0,
        amendedTotal: amendedAll.length,
        amendedCompletedCount: amendedCompleted.length,
        amendedRemainingCount: amendedRemaining.length,
        amendedCompletedList: amendedCompleted,
        amendedRemainingList: amendedRemaining,
        nsapTotal: nsapAll.length,
        nsapCompletedCount: nsapCompleted.length,
        nsapRemainingCount: nsapRemaining.length,
        mgnregaTotal: mgnregaAll.length,
        mgnregaCompletedCount: mgnregaCompleted.length,
        mgnregaRemainingCount: mgnregaRemaining.length
      };
    };

    const baghpat = compute('Baghpat');
    const baraut = compute('Baraut');

    const totalGPs = baghpat.total + baraut.total; // 88
    const totalCompleted = baghpat.completedCount + baraut.completedCount;
    const totalRemaining = baghpat.remainingCount + baraut.remainingCount;
    const totalAmended = baghpat.amendedTotal + baraut.amendedTotal; // 10
    const totalAmendedCompleted = baghpat.amendedCompletedCount + baraut.amendedCompletedCount;
    const totalAmendedRemaining = baghpat.amendedRemainingCount + baraut.amendedRemainingCount;
    const totalNSAP = baghpat.nsapTotal + baraut.nsapTotal; // 47
    const totalNSAPCompleted = baghpat.nsapCompletedCount + baraut.nsapCompletedCount;
    const totalNSAPRemaining = baghpat.nsapRemainingCount + baraut.nsapRemainingCount;

    return {
      baghpat,
      baraut,
      totalGPs,
      totalCompleted,
      totalRemaining,
      districtProgress: totalGPs > 0 ? Math.round((totalCompleted / totalGPs) * 100) : 0,
      totalAmended,
      totalAmendedCompleted,
      totalAmendedRemaining,
      totalNSAP,
      totalNSAPCompleted,
      totalNSAPRemaining
    };
  }, [records, asOfDate]);

  const nextSabha = upcomingMeetings[0] as SocialAuditRecord | undefined;
  const nextFewSabhas = upcomingMeetings.slice(1, 7);

  // Render text helper respecting fontViewMode
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

  // Jump to calendar with block filter
  const handleViewBlockCalendar = (block: 'Baghpat' | 'Baraut') => {
    setSelectedBlock(block);
    setActiveTab('calendar');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. DISTRICT EXECUTIVE TOP METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Total GPs */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900/80 border border-blue-500/20 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">कुल ग्राम पंचायतें</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white">{blockStats.totalGPs}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            बागपत: <strong className="text-white">44</strong> | बड़ौत: <strong className="text-white">44</strong>
          </div>
        </div>

        {/* Total Completed */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900/80 border border-emerald-500/20 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">सम्पन्न सोशल ऑडिट</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-emerald-300">{blockStats.totalCompleted}</span>
            <span className="text-xs text-emerald-400 font-bold">({blockStats.districtProgress}%)</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            बागपत: <strong>{blockStats.baghpat.completedCount}</strong> | बड़ौत: <strong>{blockStats.baraut.completedCount}</strong>
          </div>
        </div>

        {/* Total Remaining */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900/80 border border-indigo-500/20 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">शेष / आगामी बैठकें</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-indigo-300">{blockStats.totalRemaining}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            बागपत: <strong>{blockStats.baghpat.remainingCount}</strong> | बड़ौत: <strong>{blockStats.baraut.remainingCount}</strong>
          </div>
        </div>

        {/* Total Amended */}
        <div 
          onClick={() => setActiveTab('nsap-report')}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-slate-900/80 border border-amber-500/20 backdrop-blur-md shadow-lg cursor-pointer hover:border-amber-500/40 transition-colors group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">संशोधित रोस्टर</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-amber-300">{blockStats.totalAmended}</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
              {blockStats.totalAmendedCompleted} सम्पन्न • {blockStats.totalAmendedRemaining} शेष
            </span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            बागपत: <strong>{blockStats.baghpat.amendedTotal}</strong> | बड़ौत: <strong>{blockStats.baraut.amendedTotal}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BLOCK-WISE COMPARATIVE AUDIT MATRIX TABLE */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-950/30 border border-blue-500/30 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                <span>ब्लॉक-वार सम्पूर्ण तुलनात्मक ऑडिट मैट्रिक्स</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  बागपत बनाम बड़ौत
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                कट-ऑफ तिथि: <strong className="text-slate-200">{formatDateHi(asOfDate)}</strong> तक की सम्पन्न, अवशेष एवं संशोधित रोस्टर की बिंदुवार स्थिति
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span>{showMatrix ? 'मैट्रिक्स संक्षेप करें' : 'विस्तृत मैट्रिक्स देखें'}</span>
              {showMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showMatrix && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/60">
                  <th className="py-3 px-4 rounded-l-xl">ऑडिट विवरण (Audit Particulars)</th>
                  <th className="py-3 px-4 text-center">विकास खण्ड - बागपत</th>
                  <th className="py-3 px-4 text-center">विकास खण्ड - बड़ौत</th>
                  <th className="py-3 px-4 text-center rounded-r-xl bg-blue-950/30 text-blue-300">जनपद कुल योग</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {/* Row 1: Total GPs */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>कुल ग्राम पंचायतें (Total Gram Panchayats)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-white">44</td>
                  <td className="py-3 px-4 text-center font-bold text-white">44</td>
                  <td className="py-3 px-4 text-center font-black text-blue-300 bg-blue-950/20">88</td>
                </tr>

                {/* Row 2: Total Completed */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/10">
                  <td className="py-3 px-4 text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>सम्पन्न सोशल ऑडिट (दिनांक {formatDateHi(asOfDate)} तक)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-300">
                    <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {blockStats.baghpat.completedCount} / 44 ({blockStats.baghpat.progressPercent}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-300">
                    <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {blockStats.baraut.completedCount} / 44 ({blockStats.baraut.progressPercent}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-black text-emerald-300 bg-emerald-950/30">
                    <span className="bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-500/40">
                      {blockStats.totalCompleted} / 88 ({blockStats.districtProgress}%)
                    </span>
                  </td>
                </tr>

                {/* Row 3: Total Remaining */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>शेष / आगामी सोशल ऑडिट (Remaining Audits)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-300">
                    {blockStats.baghpat.remainingCount} ग्राम पंचायतें
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-300">
                    {blockStats.baraut.remainingCount} ग्राम पंचायतें
                  </td>
                  <td className="py-3 px-4 text-center font-black text-indigo-300 bg-blue-950/20">
                    {blockStats.totalRemaining} ग्राम पंचायतें
                  </td>
                </tr>

                {/* Row 4: Total Amended */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-amber-950/15">
                  <td className="py-3 px-4 text-amber-300 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>कुल संशोधित रोस्टर (BRP हरिकिशन कार्यमुक्त)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-300">
                    {blockStats.baghpat.amendedTotal} ग्राम पंचायतें
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-300">
                    {blockStats.baraut.amendedTotal} ग्राम पंचायतें
                  </td>
                  <td className="py-3 px-4 text-center font-black text-amber-300 bg-amber-950/30">
                    {blockStats.totalAmended} ग्राम पंचायतें
                  </td>
                </tr>

                {/* Row 5: Amended Completed */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/20">
                  <td className="py-3 px-4 text-emerald-200 font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div>संशोधित में से सम्पन्न (Amended Completed)</div>
                      <div className="text-[11px] text-emerald-400/80 font-normal">कट-ऑफ तिथि तक जो संशोधित पूर्ण हो चुकी हैं</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-300">
                    <div className="inline-flex flex-col items-center">
                      <span className="bg-emerald-500/25 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/40 text-sm">
                        {blockStats.baghpat.amendedCompletedCount} सम्पन्न
                      </span>
                      <span className="text-[11px] text-emerald-400 mt-0.5">खेड़की (29/10/2026)</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-400">
                    <div className="inline-flex flex-col items-center">
                      <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 text-sm">
                        {blockStats.baraut.amendedCompletedCount} (शून्य)
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">सभी 4 आगामी तिथियों में</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-black text-emerald-300 bg-emerald-950/40">
                    <span className="bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-500/50">
                      {blockStats.totalAmendedCompleted} सम्पन्न (खेड़की)
                    </span>
                  </td>
                </tr>

                {/* Row 6: Amended Remaining */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-amber-950/25">
                  <td className="py-3 px-4 text-amber-200 font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <div>संशोधित में से शेष / लंबित (Amended Remaining)</div>
                      <div className="text-[11px] text-amber-400/80 font-normal">आगामी तिथियों में आयोजित होने वाली संशोधित सभाएं</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-300">
                    <div className="inline-flex flex-col items-center">
                      <span className="bg-amber-500/25 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/40 text-sm">
                        {blockStats.baghpat.amendedRemainingCount} लंबित
                      </span>
                      <span className="text-[10px] text-amber-200/90 mt-0.5 max-w-[200px] leading-tight">
                        निवाड़ा, क्यामपुर, पूठी-ब्राह्मण, सन्तोषपुर, ट्योढ़ी
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-300">
                    <div className="inline-flex flex-col items-center">
                      <span className="bg-amber-500/25 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/40 text-sm">
                        {blockStats.baraut.amendedRemainingCount} लंबित
                      </span>
                      <span className="text-[10px] text-amber-200/90 mt-0.5 max-w-[200px] leading-tight">
                        गुराना (10/11), जौहड़ी (13/11), महावतपुर (19/12), शाहपुर बड़ौली (25/12)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-black text-amber-300 bg-amber-950/40">
                    <span className="bg-amber-500/30 text-amber-200 px-3 py-1 rounded-lg border border-amber-500/50">
                      {blockStats.totalAmendedRemaining} लंबित
                    </span>
                  </td>
                </tr>

                {/* Row 7: NSAP Pension Progress */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>NSAP पेंशन सोशल ऑडिट (47 ग्राम पंचायतें)</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <strong className="text-emerald-400">{blockStats.baghpat.nsapCompletedCount} सम्पन्न</strong>
                    <span className="text-slate-400"> / {blockStats.baghpat.nsapRemainingCount} शेष</span>
                    <span className="text-[11px] text-slate-500 block">(कुल 24)</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <strong className="text-emerald-400">{blockStats.baraut.nsapCompletedCount} सम्पन्न</strong>
                    <span className="text-slate-400"> / {blockStats.baraut.nsapRemainingCount} शेष</span>
                    <span className="text-[11px] text-slate-500 block">(कुल 23)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-black bg-blue-950/20">
                    <strong className="text-emerald-300">{blockStats.totalNSAPCompleted} सम्पन्न</strong>
                    <span className="text-slate-400"> / {blockStats.totalNSAPRemaining} शेष</span>
                    <span className="text-[11px] text-blue-400 block">(कुल 47)</span>
                  </td>
                </tr>

                {/* Row 8: Block Sabha */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-slate-950/30">
                  <td className="py-3 px-4 text-slate-300 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-purple-400" />
                    <span>ब्लॉक सोशल ऑडिट सभा (Block Sabha)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-purple-300">
                    30/11/2026 (ब्लॉक मीटिंग हॉल)
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-purple-300">
                    02/01/2027 (ब्लॉक मीटिंग हॉल)
                  </td>
                  <td className="py-3 px-4 text-center font-black text-purple-300 bg-blue-950/20">
                    2 ब्लॉक स्तरीय सभाएं
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BLOCK-WISE COMPARATIVE COMMAND CARDS (BAGHPAT & BARAUT SIDE-BY-SIDE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* BLOCK 1: BAGHPAT */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/30 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black">
                बा
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>विकास खण्ड - बागपत</span>
                  <span className="text-xs font-normal text-slate-400">(44 ग्राम पंचायतें)</span>
                </h3>
                <span className="text-[11px] text-blue-400 font-medium">ब्लॉक सभा: 30/11/2026 (ब्लॉक मीटिंग हॉल)</span>
              </div>
            </div>

            <button
              onClick={() => handleViewBlockCalendar('Baghpat')}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-950/60 px-2.5 py-1.5 rounded-lg border border-blue-800/40 hover:bg-blue-900/60 transition-colors"
            >
              <span>बागपत रोस्टर</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">सोशल ऑडिट सम्पन्न प्रगति:</span>
              <span className="text-blue-400 font-bold">{blockStats.baghpat.completedCount} / 44 ({blockStats.baghpat.progressPercent}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div 
                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${blockStats.baghpat.progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3 Metric Mini Cards */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">सम्पन्न ऑडिट</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">{blockStats.baghpat.completedCount}</div>
              <div className="text-[10px] text-slate-400">ग्राम पंचायतें</div>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-indigo-400 font-bold uppercase">शेष / आगामी</div>
              <div className="text-xl font-black text-indigo-300 mt-0.5">{blockStats.baghpat.remainingCount}</div>
              <div className="text-[10px] text-slate-400">ग्राम पंचायतें</div>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-amber-400 font-bold uppercase">संशोधित रोस्टर</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{blockStats.baghpat.amendedTotal}</div>
              <div className="text-[10px] text-slate-400">बी०आर०पी० परिवर्तन</div>
            </div>
          </div>

          {/* Amended Breakdown Detail Box */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>बागपत संशोधित स्थिति (Amended Status)</span>
              </span>
              <span className="text-[11px] bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                कुल: {blockStats.baghpat.amendedTotal}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400 font-semibold">संशोधित में से सम्पन्न</div>
                <div className="text-lg font-black text-emerald-300">{blockStats.baghpat.amendedCompletedCount}</div>
                <div className="text-[10px] text-slate-400 truncate" title="खेड़की (2026-10-29)">
                  खेड़की (29/10)
                </div>
              </div>

              <div className="bg-slate-950/60 p-2 rounded-xl border border-amber-500/20">
                <div className="text-[10px] text-amber-400 font-semibold">संशोधित में से शेष / लंबित</div>
                <div className="text-lg font-black text-amber-300">{blockStats.baghpat.amendedRemainingCount}</div>
                <div className="text-[10px] text-slate-400">
                  5 आगामी संशोधित
                </div>
              </div>
            </div>

            {/* List of remaining amended in Baghpat */}
            <div className="text-[11px] text-slate-300 pt-1 border-t border-amber-500/15">
              <span className="text-slate-400">बागपत में शेष संशोधित: </span>
              <span className="text-amber-200">
                निवाड़ा (03/11), क्यामपुर (10/11), पूठी-ब्राह्मण (10/11), संतोषपुर (13/11), टयौढ़ी (19/12)
              </span>
            </div>
          </div>

          {/* Scheme Progress */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
            <div className="bg-slate-950/60 p-2 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">NSAP पेंशन:</span>
              <span className="font-bold text-emerald-300">
                {blockStats.baghpat.nsapCompletedCount} सम्पन्न / {blockStats.baghpat.nsapRemainingCount} शेष (कुल {blockStats.baghpat.nsapTotal})
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">मनरेगा:</span>
              <span className="font-bold text-blue-300">
                {blockStats.baghpat.mgnregaCompletedCount} सम्पन्न / {blockStats.baghpat.mgnregaRemainingCount} शेष (कुल 44)
              </span>
            </div>
          </div>
        </div>

        {/* BLOCK 2: BARAUT */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black">
                ब
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>विकास खण्ड - बड़ौत</span>
                  <span className="text-xs font-normal text-slate-400">(44 ग्राम पंचायतें)</span>
                </h3>
                <span className="text-[11px] text-indigo-400 font-medium">ब्लॉक सभा: 02/01/2027 (ब्लॉक मीटिंग हॉल)</span>
              </div>
            </div>

            <button
              onClick={() => handleViewBlockCalendar('Baraut')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/60 px-2.5 py-1.5 rounded-lg border border-indigo-800/40 hover:bg-indigo-900/60 transition-colors"
            >
              <span>बड़ौत रोस्टर</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">सोशल ऑडिट सम्पन्न प्रगति:</span>
              <span className="text-indigo-400 font-bold">{blockStats.baraut.completedCount} / 44 ({blockStats.baraut.progressPercent}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-purple-500 h-full transition-all duration-500"
                style={{ width: `${blockStats.baraut.progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3 Metric Mini Cards */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">सम्पन्न ऑडिट</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">{blockStats.baraut.completedCount}</div>
              <div className="text-[10px] text-slate-400">ग्राम पंचायतें</div>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-indigo-400 font-bold uppercase">शेष / आगामी</div>
              <div className="text-xl font-black text-indigo-300 mt-0.5">{blockStats.baraut.remainingCount}</div>
              <div className="text-[10px] text-slate-400">ग्राम पंचायतें</div>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-amber-400 font-bold uppercase">संशोधित रोस्टर</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{blockStats.baraut.amendedTotal}</div>
              <div className="text-[10px] text-slate-400">बी०आर०पी० परिवर्तन</div>
            </div>
          </div>

          {/* Amended Breakdown Detail Box */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>बड़ौत संशोधित स्थिति (Amended Status)</span>
              </span>
              <span className="text-[11px] bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                कुल: {blockStats.baraut.amendedTotal}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-emerald-400 font-semibold">संशोधित में से सम्पन्न</div>
                <div className="text-lg font-black text-emerald-300">{blockStats.baraut.amendedCompletedCount}</div>
                <div className="text-[10px] text-slate-400 truncate">
                  (सभी 4 आगामी तिथियों में)
                </div>
              </div>

              <div className="bg-slate-950/60 p-2 rounded-xl border border-amber-500/20">
                <div className="text-[10px] text-amber-400 font-semibold">संशोधित में से शेष / लंबित</div>
                <div className="text-lg font-black text-amber-300">{blockStats.baraut.amendedRemainingCount}</div>
                <div className="text-[10px] text-slate-400">
                  4 आगामी संशोधित
                </div>
              </div>
            </div>

            {/* List of remaining amended in Baraut */}
            <div className="text-[11px] text-slate-300 pt-1 border-t border-amber-500/15">
              <span className="text-slate-400">बड़ौत में शेष संशोधित: </span>
              <span className="text-amber-200">
                गुराना (10/11), जौहड़ी (13/11), महावतपुर (19/12), शाहपुर बड़ौली (25/12)
              </span>
            </div>
          </div>

          {/* Scheme Progress */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
            <div className="bg-slate-950/60 p-2 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">NSAP पेंशन:</span>
              <span className="font-bold text-emerald-300">
                {blockStats.baraut.nsapCompletedCount} सम्पन्न / {blockStats.baraut.nsapRemainingCount} शेष (कुल {blockStats.baraut.nsapTotal})
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">मनरेगा:</span>
              <span className="font-bold text-indigo-300">
                {blockStats.baraut.mgnregaCompletedCount} सम्पन्न / {blockStats.baraut.mgnregaRemainingCount} शेष (कुल 44)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DEDICATED LIVE AMENDMENT TRACKER FOR ALL 10 AMENDED PANCHAYATS */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">
                समस्त 10 संशोधित ग्राम पंचायतों का लाइव स्टेटस (Amended Audits Live Tracker)
              </h3>
              <p className="text-xs text-slate-400">
                बी०आर०पी० हरिकिशन के कार्यमुक्त होने पर बागपत (6) एवं बड़ौत (4) में संशोधित की गई बैठकें
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('nsap-report')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
          >
            <span>विस्तृत NSAP रिपोर्ट देखें</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 10 Amended Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {records.filter(r => r.isAmended).map(gp => {
            const isCompleted = gp.meetingDate <= asOfDate || gp.status === 'completed';
            const diff = getDaysDiff(gp.meetingDate);

            return (
              <div
                key={gp.id}
                onClick={() => openEditModal(gp)}
                className={`p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-200'
                    : 'bg-amber-950/30 border-amber-500/30 text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-semibold text-slate-400">
                      {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {isCompleted ? 'सम्पन्न' : diff === 0 ? 'आज' : `${diff} दिन शेष`}
                    </span>
                  </div>

                  <div className="font-bold text-xs truncate">
                    {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                  </div>

                  <div className="text-[10px] mt-1 text-slate-400 flex items-center gap-1">
                    <span className="line-through text-rose-400/80">{formatDateHi(gp.originalMeetingDate || '')}</span>
                    <span>→</span>
                    <span className="font-bold text-amber-300">{formatDateHi(gp.meetingDate)}</span>
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-white/5 text-[10px] flex items-center justify-between text-slate-400">
                  <span className="truncate">BRP: {gp.brpName}</span>
                  {gp.hasNSAP && (
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 rounded font-bold">NSAP</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. HERO CARD: NEXT UPCOMING GRAM SABHA */}
      {/* ========================================================================= */}
      {nextSabha ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-blue-950/80 border-2 border-indigo-500/30 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Meeting Details */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  अगली होने वाली ग्राम सभा (NEXT UPCOMING)
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {nextSabha.blockHindi}
                </span>

                {nextSabha.isAmended && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    संशोधित रोस्टर
                  </span>
                )}

                {nextSabha.hasNSAP && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    NSAP पेंशन ऑडिट
                  </span>
                )}
              </div>

              {/* Village Name & Meeting Date */}
              <div>
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">ग्राम पंचायत</div>
                <h2 className="text-3xl md:text-4xl font-black text-white mt-0.5 tracking-tight flex items-center gap-3">
                  {renderText(nextSabha.gpNameUnicode, nextSabha.gpNameKrutiDev)}
                </h2>
                {nextSabha.isAmended && nextSabha.originalMeetingDate && (
                  <div className="mt-1 text-xs text-amber-300 flex items-center gap-2">
                    <span className="line-through text-slate-400">मूल तिथि: {formatDateHi(nextSabha.originalMeetingDate)}</span>
                    <span className="font-bold">→ नई संशोधित तिथि: {formatDateHi(nextSabha.meetingDate)}</span>
                    <span className="text-[11px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">
                      BRP कार्यमुक्त/परिवर्तन के कारण
                    </span>
                  </div>
                )}
              </div>

              {/* Key Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                {/* Date & Time */}
                <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                  <Calendar className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">बैठक दिनांक एवं समय</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {formatDateHi(nextSabha.meetingDate)} ({renderText(nextSabha.timeUnicode, nextSabha.timeKrutiDev)})
                    </div>
                    <div className="text-[11px] text-slate-400">
                      प्रारम्भ: {formatDateHi(nextSabha.startDate)}
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                  <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">बैठक का स्थान</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {renderText(nextSabha.venueUnicode, nextSabha.venueKrutiDev)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ग्राम पंचायत {nextSabha.gpNameUnicode}
                    </div>
                  </div>
                </div>

                {/* BRP with Phone */}
                <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                  <Phone className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">आवंटित बी०आर०पी०</div>
                    <div className="text-sm font-bold text-amber-300 mt-0.5">
                      {renderText(nextSabha.brpName || nextSabha.brpUnicode, nextSabha.brpKrutiDev)}
                    </div>
                    {nextSabha.brpPhone && (
                      <a 
                        href={`tel:${nextSabha.brpPhone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 mt-0.5 font-mono"
                      >
                        📞 {nextSabha.brpPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Supervisory Officer */}
                <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                  <Shield className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">जनपद स्तरीय पर्यवेक्षक अधिकारी</div>
                    <div className="text-xs font-semibold text-slate-200 mt-0.5 leading-snug">
                      {renderText(nextSabha.supervisorOfficerUnicode, nextSabha.supervisorOfficerKrutiDev)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members List */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 text-xs">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>सोशल ऑडिट टीम सदस्य (VRPs/सदस्य):</span>
                </div>
                <div className="text-slate-300 leading-relaxed font-medium">
                  {renderText(nextSabha.teamMembersUnicode, nextSabha.teamMembersKrutiDev)}
                </div>
              </div>

              {/* Schemes */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">ऑडिट योजनाएं:</span>
                <span className="text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  {renderText(nextSabha.schemeUnicode, nextSabha.schemeKrutiDev)}
                </span>
              </div>
            </div>

            {/* Right: Countdown & Quick Action Box */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-blue-950/80 to-slate-900 border border-blue-500/30 text-center w-full lg:w-72 shrink-0 shadow-xl">
              <Clock className="w-8 h-8 text-blue-400 mb-2 animate-bounce" />
              <div className="text-xs text-blue-300 font-semibold uppercase tracking-wider">बैठक स्थिति</div>
              
              {/* Days Diff */}
              {(() => {
                const diff = getDaysDiff(nextSabha.meetingDate);
                if (diff === 0) {
                  return (
                    <div className="my-2">
                      <span className="text-3xl font-black text-rose-400 animate-pulse">आज है!</span>
                      <p className="text-xs text-slate-300 mt-1">1:00 बजे बैठक प्रारम्भ होगी</p>
                    </div>
                  );
                } else if (diff === 1) {
                  return (
                    <div className="my-2">
                      <span className="text-3xl font-black text-amber-400">कल होगी!</span>
                      <p className="text-xs text-slate-300 mt-1">तैयारी पूर्ण करें</p>
                    </div>
                  );
                } else {
                  return (
                    <div className="my-2">
                      <span className="text-4xl font-black text-blue-300">{diff}</span>
                      <span className="text-sm font-bold text-slate-300 block">दिन शेष</span>
                    </div>
                  );
                }
              })()}

              <div className="text-xs text-slate-400 mb-4">
                दिनांक: <span className="font-bold text-white">{formatDateHi(nextSabha.meetingDate)}</span>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => openEditModal(nextSabha)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95"
                >
                  संशोधित / संपादित करें
                </button>

                <button
                  onClick={() => markCompleted(nextSabha.id, nextSabha.status !== 'completed')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>सम्पन्न मार्क करें</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
          चयनित संदर्भ तिथि {formatDateHi(asOfDate)} के पश्चात कोई आगामी बैठकें शेष नहीं हैं।
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. UPCOMING SCHEDULE GRID (NEXT 6 MEETINGS) */}
      {/* ========================================================================= */}
      {nextFewSabhas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>इसके बाद की आगामी बैठकें (Next Upcoming Schedule)</span>
            </h3>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>सम्पूर्ण कैलेंडर देखें</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {nextFewSabhas.map((sabha) => {
              const diff = getDaysDiff(sabha.meetingDate);
              return (
                <div
                  key={sabha.id}
                  className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                    sabha.isAmended
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/30'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
                      {sabha.blockHindi}
                    </span>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      diff === 0 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {diff === 0 ? 'आज' : `${diff} दिन शेष`}
                    </span>
                  </div>

                  <div className="text-base font-bold text-white">
                    {renderText(sabha.gpNameUnicode, sabha.gpNameKrutiDev)}
                  </div>

                  <div className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>बैठक: {formatDateHi(sabha.meetingDate)} (1:00 बजे)</span>
                  </div>

                  {sabha.isAmended && (
                    <div className="text-[10px] text-amber-300 bg-amber-950/50 p-1.5 rounded-lg border border-amber-500/20 mt-2 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>संशोधित (मूल: {formatDateHi(sabha.originalMeetingDate || '')})</span>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">BRP:</span>
                      <span className="font-semibold text-amber-300">
                        {renderText(sabha.brpName || sabha.brpUnicode, sabha.brpKrutiDev)}
                      </span>
                    </div>
                    <div className="text-slate-400 truncate" title={sabha.teamMembersUnicode}>
                      टीम: {sabha.teamMembersUnicode}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEditModal(sabha)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      संशोधित करें
                    </button>
                    {sabha.hasNSAP && (
                      <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-bold">
                        NSAP
                      </span>
                    )}
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
