'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore, SocialAuditTab } from '@/stores/socialAuditStore';
import { SocialAuditRecord, AuditBlock } from '@/types/socialAudit';
import { 
  Calendar, Clock, MapPin, Phone, Users, Shield, 
  AlertCircle, CheckCircle2, ChevronRight, Sparkles,
  Layers, ArrowUpRight, Check, AlertTriangle, TrendingUp,
  BarChart3, Landmark, Eye, Table2, ChevronDown, ChevronUp,
  ArrowRight, Smartphone, ShieldCheck, XCircle, FileSpreadsheet,
  UserCheck, UserX, Skull, IndianRupee, Filter, Search,
  Award, Activity, FileText, RefreshCw, SlidersHorizontal,
  Briefcase, CheckCircle, ExternalLink, HelpCircle, Flame,
  PieChart, Gauge, Zap
} from 'lucide-react';

export default function ExecutiveDashboardTab() {
  const { 
    records, 
    nsapRecords,
    asOfDate, 
    liveDelhiTime,
    liveDelhiDate,
    fontViewMode, 
    openEditModal, 
    markCompleted,
    setActiveTab,
    setSelectedBlock 
  } = useSocialAuditStore();

  const [activeFilterSection, setActiveFilterSection] = useState<string>('all');
  const [showMatrix, setShowMatrix] = useState(true);
  const [activeChartBlock, setActiveChartBlock] = useState<'both' | 'Baghpat' | 'Baraut'>('both');

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
    try {
      const d1 = new Date(asOfDate + 'T00:00:00').getTime();
      const d2 = new Date(targetDate + 'T00:00:00').getTime();
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return 0;
    }
  };

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

      // Panchayat Nirnay App (R 9.6.2) stats
      const nirnayCaptured = all.filter((r) => r.panchayatNirnayStatus === 'captured');
      const nirnayDuePending = all.filter((r) => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate);
      const nirnayUpcoming = all.filter((r) => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate);
      const nirnayNotCaptured = all.filter((r) => r.panchayatNirnayStatus === 'not_captured');
      const nirnayMapped = all.filter((r) => r.isMappedInPanchayatNirnay);

      // MIS Audit Feeding (R 9.1.3) stats
      const misFed = all.filter((r) => r.misStatus === 'fed');
      const misPending = all.filter((r) => (r.misStatus || 'pending') !== 'fed');
      const misDuePending = all.filter((r) => (r.misStatus || 'pending') !== 'fed' && r.meetingDate <= asOfDate);
      const misUpcoming = all.filter((r) => (r.misStatus || 'pending') !== 'fed' && r.meetingDate > asOfDate);

      // MIS Pending with NSAP
      const misPendingNSAP = misPending.filter((r) => r.hasNSAP);
      const misDuePendingNSAP = misDuePending.filter((r) => r.hasNSAP);
      const misFedNSAP = misFed.filter((r) => r.hasNSAP);

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
        mgnregaRemainingCount: mgnregaRemaining.length,
        nirnayCapturedCount: nirnayCaptured.length,
        nirnayDuePendingCount: nirnayDuePending.length,
        nirnayUpcomingCount: nirnayUpcoming.length,
        nirnayNotCapturedCount: nirnayNotCaptured.length,
        nirnayMappedCount: nirnayMapped.length,
        nirnayPercent: total > 0 ? ((nirnayCaptured.length / total) * 100).toFixed(1) : '0.0',
        nirnayMappedPercent: nirnayMapped.length > 0 ? ((nirnayCaptured.length / nirnayMapped.length) * 100).toFixed(1) : '0.0',
        misFedCount: misFed.length,
        misPendingCount: misPending.length,
        misDuePendingCount: misDuePending.length,
        misUpcomingCount: misUpcoming.length,
        misPendingNSAPCount: misPendingNSAP.length,
        misDuePendingNSAPCount: misDuePendingNSAP.length,
        misFedNSAPCount: misFedNSAP.length,
        misFedPercent: total > 0 ? ((misFed.length / total) * 100).toFixed(1) : '0.0',
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

    const totalNirnayCaptured = baghpat.nirnayCapturedCount + baraut.nirnayCapturedCount;
    const totalNirnayDuePending = baghpat.nirnayDuePendingCount + baraut.nirnayDuePendingCount;
    const totalNirnayUpcoming = baghpat.nirnayUpcomingCount + baraut.nirnayUpcomingCount;
    const totalNirnayNotCaptured = baghpat.nirnayNotCapturedCount + baraut.nirnayNotCapturedCount;
    const totalNirnayMapped = baghpat.nirnayMappedCount + baraut.nirnayMappedCount;
    const totalNirnayPercent = totalNirnayMapped > 0 ? ((totalNirnayCaptured / totalNirnayMapped) * 100).toFixed(1) : '0.0';

    const totalMisFed = baghpat.misFedCount + baraut.misFedCount;
    const totalMisPending = baghpat.misPendingCount + baraut.misPendingCount;
    const totalMisDuePending = baghpat.misDuePendingCount + baraut.misDuePendingCount;
    const totalMisUpcoming = baghpat.misUpcomingCount + baraut.misUpcomingCount;
    const totalMisPendingNSAP = baghpat.misPendingNSAPCount + baraut.misPendingNSAPCount;
    const totalMisDuePendingNSAP = baghpat.misDuePendingNSAPCount + baraut.misDuePendingNSAPCount;
    const totalMisFedNSAP = baghpat.misFedNSAPCount + baraut.misFedNSAPCount;
    const districtMisFedPercent = totalGPs > 0 ? ((totalMisFed / totalGPs) * 100).toFixed(1) : '0.0';

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
      totalNSAPRemaining,
      totalNirnayCaptured,
      totalNirnayDuePending,
      totalNirnayUpcoming,
      totalNirnayNotCaptured,
      totalNirnayMapped,
      totalNirnayPercent,
      totalMisFed,
      totalMisPending,
      totalMisDuePending,
      totalMisUpcoming,
      totalMisPendingNSAP,
      totalMisDuePendingNSAP,
      totalMisFedNSAP,
      districtMisFedPercent,
    };
  }, [records, asOfDate]);

  // Today's Scheduled Meetings
  const todayMeetings = useMemo(() => {
    return records.filter((r) => r.meetingDate === asOfDate);
  }, [records, asOfDate]);

  // Upcoming meetings next 7 days
  const upcomingNext7Days = useMemo(() => {
    return records
      .filter((r) => r.meetingDate > asOfDate && r.status !== 'completed')
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))
      .slice(0, 8);
  }, [records, asOfDate]);

  // Deep NSAP Detailed Aggregations from nsapRecords
  const nsapAnalytics = useMemo(() => {
    const list = nsapRecords || [];
    const totalRecordedGPs = list.length;
    const totalBeneficiaries = list.reduce((sum, item) => sum + (item.totalBeneficiaries || 0), 0);
    const totalVerifiedDirect = list.reduce((sum, item) => sum + (item.verifiedDirect || 0), 0);
    const totalVerifiedFamily = list.reduce((sum, item) => sum + (item.verifiedFamily || 0), 0);
    const totalVerified = list.reduce((sum, item) => sum + (item.verifiedTotal || 0), 0);
    const totalFinancialIrregularity = list.reduce((sum, item) => sum + (item.financialIrregularityAmount || 0), 0);

    let totalDeceased = 0;
    let totalIneligible = 0;
    let totalUnverified = 0;

    list.forEach((gp) => {
      (gp.beneficiaries || []).forEach((ben) => {
        if (ben.category === 'deceased') totalDeceased++;
        else if (ben.category === 'ineligible') totalIneligible++;
        else if (ben.category === 'unverified') totalUnverified++;
      });
    });

    const nsapRosterTotal = blockStats.totalNSAP; // 47
    const pendingToRecordGPs = Math.max(0, nsapRosterTotal - totalRecordedGPs);

    const directPercent = totalBeneficiaries > 0 ? ((totalVerifiedDirect / totalBeneficiaries) * 100).toFixed(1) : '0';
    const familyPercent = totalBeneficiaries > 0 ? ((totalVerifiedFamily / totalBeneficiaries) * 100).toFixed(1) : '0';
    const deceasedPercent = totalBeneficiaries > 0 ? ((totalDeceased / totalBeneficiaries) * 100).toFixed(1) : '0';
    const ineligiblePercent = totalBeneficiaries > 0 ? ((totalIneligible / totalBeneficiaries) * 100).toFixed(1) : '0';

    return {
      totalRecordedGPs,
      totalBeneficiaries,
      totalVerifiedDirect,
      totalVerifiedFamily,
      totalVerified,
      totalDeceased,
      totalIneligible,
      totalUnverified,
      totalFinancialIrregularity,
      pendingToRecordGPs,
      coveragePercent: nsapRosterTotal > 0 ? Math.round((totalRecordedGPs / nsapRosterTotal) * 100) : 0,
      directPercent,
      familyPercent,
      deceasedPercent,
      ineligiblePercent,
      records: list,
    };
  }, [nsapRecords, blockStats.totalNSAP]);

  // BRP Team Directory and Performance Stats
  const brpDirectory = useMemo(() => {
    const knownBRPs = [
      { name: 'तेजपाल', phone: '9997202522', primaryBlock: 'बागपत', color: 'from-blue-500 to-indigo-600' },
      { name: 'सुदेश पाल सिंह', phone: '9117323927', primaryBlock: 'बागपत / बड़ौत', color: 'from-emerald-500 to-teal-600' },
      { name: 'राजकुमार', phone: '9760732189', primaryBlock: 'बड़ौत', color: 'from-purple-500 to-pink-600' },
      { name: 'ईश्वरचन्द', phone: '9759612544', primaryBlock: 'बड़ौत', color: 'from-amber-500 to-orange-600' },
      { name: 'हरिकिशन (पूर्व BRP)', phone: '8859660315', primaryBlock: 'कार्यमुक्त', isEx: true, color: 'from-slate-600 to-slate-800' },
    ];

    return knownBRPs.map((brp) => {
      const assigned = records.filter((r) => r.brpPhone === brp.phone || r.brpName?.includes(brp.name.split(' ')[0]));
      const completed = assigned.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
      const upcoming = assigned.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');
      const nirnayCaptured = assigned.filter((r) => r.panchayatNirnayStatus === 'captured');
      const misFed = assigned.filter((r) => r.misStatus === 'fed');
      const percent = assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 0;

      return {
        ...brp,
        totalAssigned: assigned.length,
        completedCount: completed.length,
        upcomingCount: upcoming.length,
        nirnayCapturedCount: nirnayCaptured.length,
        misFedCount: misFed.length,
        percent,
        allGPs: assigned,
      };
    });
  }, [records, asOfDate]);

  // Jump to specific tab with optional block filter
  const navigateToTab = (tab: SocialAuditTab, block?: 'Baghpat' | 'Baraut') => {
    if (block) setSelectedBlock(block);
    setActiveTab(tab);
  };

  // Helper for SVG Circular Radial Progress Gauge
  const renderRadialGauge = (percent: number, size: number, strokeWidth: number, gradientId: string, glowColor: string) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            transition: 'stroke-dashoffset 1s ease-in-out',
          }}
        />
      </svg>
    );
  };

  return (
    <div className="w-full space-y-5 pb-16">
      {/* SVG Linear Gradients for Gauges & Charts */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="grad-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
          <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>

      {/* ========================================================================= */}
      {/* 0. EXECUTIVE COMMAND SUB-NAV (Clean, responsive pill selector) */}
      {/* ========================================================================= */}
      <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-xl">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-bold shrink-0 hidden md:inline-flex items-center gap-1 ml-2 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            दृष्टिकोण:
          </span>

          <button
            onClick={() => setActiveFilterSection('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/80 shadow-lg shadow-blue-500/25 font-bold'
                : 'bg-slate-950/60 text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>सम्पूर्ण डैशबोर्ड</span>
          </button>

          <button
            onClick={() => setActiveFilterSection('charts')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'charts'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/80 shadow-lg shadow-cyan-500/25 font-bold'
                : 'bg-slate-950/60 text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>ग्राफिकल चार्ट्स</span>
          </button>

          <button
            onClick={() => setActiveFilterSection('today')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'today'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-400/80 shadow-lg shadow-rose-500/25 font-bold'
                : 'bg-slate-950/60 text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>आज व आगामी बैठकें ({todayMeetings.length} आज)</span>
          </button>

          <button
            onClick={() => setActiveFilterSection('nsap')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'nsap'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/80 shadow-lg shadow-purple-500/25 font-bold'
                : 'bg-slate-950/60 text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>NSAP पेंशन विश्लेषण ({nsapAnalytics.totalRecordedGPs} GP)</span>
          </button>

          <button
            onClick={() => setActiveFilterSection('team')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'team'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-400/80 shadow-lg shadow-teal-500/25 font-bold'
                : 'bg-slate-950/60 text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-teal-400" />
            <span>BRP कार्यभार</span>
          </button>

          <button
            onClick={() => setActiveFilterSection('matrix')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'matrix'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400/80 shadow-lg shadow-amber-500/25 font-bold'
                : 'bg-slate-950/60 text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            <Table2 className="w-3.5 h-3.5 text-amber-400" />
            <span>तुलनात्मक मैट्रिक्स</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO 4 RADIAL GAUGES WITH GLOWING VISUALS (ULTRA-HIGH CLASS GRAPHICS) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'charts') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Gauge 1: Overall Social Audit Completion */}
          <div 
            onClick={() => navigateToTab('calendar')}
            className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900/90 to-slate-950 border border-emerald-500/30 backdrop-blur-2xl shadow-xl hover:border-emerald-400/60 transition-all hover:scale-[1.01] cursor-pointer group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                सोशल ऑडिट प्रगति
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-extrabold">
                {blockStats.totalCompleted}/88 GP
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {blockStats.districtProgress}%
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  {blockStats.totalCompleted} सम्पन्न • {blockStats.totalRemaining} अवशेष
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex flex-col gap-0.5">
                  <span>बागपत: <strong className="text-white">{blockStats.baghpat.completedCount}/44 ({blockStats.baghpat.progressPercent}%)</strong></span>
                  <span>बड़ौत: <strong className="text-white">{blockStats.baraut.completedCount}/44 ({blockStats.baraut.progressPercent}%)</strong></span>
                </div>
              </div>

              <div className="relative flex items-center justify-center shrink-0">
                {renderRadialGauge(blockStats.districtProgress, 84, 8, 'grad-emerald', 'rgba(16, 185, 129, 0.4)')}
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-emerald-300">
                  {blockStats.districtProgress}%
                </div>
              </div>
            </div>
          </div>

          {/* Gauge 2: Panchayat Nirnay App (R 9.6.2) */}
          <div 
            onClick={() => navigateToTab('nirnay')}
            className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-950/70 via-slate-900/90 to-slate-950 border border-teal-500/30 backdrop-blur-2xl shadow-xl hover:border-teal-400/60 transition-all hover:scale-[1.01] cursor-pointer group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-400" />
                निर्णय ऐप (R 9.6.2)
              </span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-extrabold">
                {blockStats.totalNirnayCaptured}/66
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {blockStats.totalNirnayPercent}%
                </div>
                <div className="text-[11px] text-teal-400 font-semibold mt-1">
                  {blockStats.totalNirnayCaptured} लाइव अपलोड सत्यापित
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex flex-col gap-0.5">
                  <span className="text-emerald-400 font-medium">आज तक लंबित: <strong>0 (क्लियर)</strong></span>
                  <span>आगामी प्रस्तावित: <strong className="text-white">{blockStats.totalNirnayUpcoming}</strong></span>
                </div>
              </div>

              <div className="relative flex items-center justify-center shrink-0">
                {renderRadialGauge(Number(blockStats.totalNirnayPercent), 84, 8, 'grad-blue', 'rgba(56, 189, 248, 0.4)')}
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-teal-300">
                  {blockStats.totalNirnayCaptured} GP
                </div>
              </div>
            </div>
          </div>

          {/* Gauge 3: MIS Audit Feeding (R 9.1.3) */}
          <div 
            onClick={() => navigateToTab('mis-feeding')}
            className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-950/70 via-slate-900/90 to-slate-950 border border-blue-500/30 backdrop-blur-2xl shadow-xl hover:border-blue-400/60 transition-all hover:scale-[1.01] cursor-pointer group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                MIS फीडिंग (R 9.1.3)
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-extrabold">
                {blockStats.totalMisFed}/88
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {blockStats.districtMisFedPercent}%
                </div>
                <div className="text-[11px] text-blue-400 font-semibold mt-1">
                  {blockStats.totalMisFed} ग्राम पंचायतें फीडेड
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex flex-col gap-0.5">
                  <span className="text-rose-300 font-semibold">देय लंबित: <strong>{blockStats.totalMisDuePending} ({blockStats.totalMisDuePendingNSAP} NSAP)</strong></span>
                  <span>समस्त लंबित: <strong className="text-amber-300">{blockStats.totalMisPending}</strong></span>
                </div>
              </div>

              <div className="relative flex items-center justify-center shrink-0">
                {renderRadialGauge(Number(blockStats.districtMisFedPercent), 84, 8, 'grad-indigo', 'rgba(99, 102, 241, 0.4)')}
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-blue-300">
                  {blockStats.districtMisFedPercent}%
                </div>
              </div>
            </div>
          </div>

          {/* Gauge 4: NSAP Pension Verification */}
          <div 
            onClick={() => navigateToTab('nsap-data')}
            className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-950/70 via-slate-900/90 to-slate-950 border border-purple-500/30 backdrop-blur-2xl shadow-xl hover:border-purple-400/60 transition-all hover:scale-[1.01] cursor-pointer group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                NSAP पेंशन सत्यापन
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-extrabold">
                {nsapAnalytics.totalRecordedGPs}/47 GP
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {nsapAnalytics.coveragePercent}%
                </div>
                <div className="text-[11px] text-purple-400 font-semibold mt-1">
                  {nsapAnalytics.totalBeneficiaries} कुल पेंशनर्स दर्ज
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex flex-col gap-0.5">
                  <span className="text-emerald-300">सत्यापित: <strong>{nsapAnalytics.totalVerified}</strong></span>
                  <span className="text-rose-300">मृतक: <strong>{nsapAnalytics.totalDeceased}</strong> | अपात्र: <strong>{nsapAnalytics.totalIneligible}</strong></span>
                </div>
              </div>

              <div className="relative flex items-center justify-center shrink-0">
                {renderRadialGauge(nsapAnalytics.coveragePercent, 84, 8, 'grad-purple', 'rgba(168, 85, 247, 0.4)')}
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-purple-300">
                  {nsapAnalytics.totalRecordedGPs} GP
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADVANCED INTERACTIVE DUAL-BAR GRAPHIC CHART (Baghpat vs Baraut Comparison) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'charts') && (
        <div className="w-full bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>ग्राफिकल ब्लॉक तुलनात्मक चार्ट (Graphical Comparison)</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    बागपत (44) बनाम बड़ौत (44)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  सम्पन्न ऑडिट, ऐप अपलोड, MIS फीडिंग एवं पेंशन सत्यापन का लाइव विजुअल बार चार्ट
                </p>
              </div>
            </div>

            {/* Block Chart Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs font-semibold bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 inline-block shadow-sm shadow-blue-500" />
                  <span className="text-slate-300">बागपत</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 inline-block shadow-sm shadow-purple-500" />
                  <span className="text-slate-300">बड़ौत</span>
                </span>
              </div>
            </div>
          </div>

          {/* Comparative Bar Chart Visualization */}
          <div className="space-y-4 pt-1">
            {[
              {
                title: 'सम्पन्न सोशल ऑडिट (Completed Audits)',
                baghpatVal: blockStats.baghpat.completedCount,
                barautVal: blockStats.baraut.completedCount,
                max: 44,
                baghpatLabel: `${blockStats.baghpat.completedCount}/44 (${blockStats.baghpat.progressPercent}%)`,
                barautLabel: `${blockStats.baraut.completedCount}/44 (${blockStats.baraut.progressPercent}%)`,
                unit: 'GP',
              },
              {
                title: 'निर्णय ऐप पर अपलोड (Captured in Nirnay App - R 9.6.2)',
                baghpatVal: blockStats.baghpat.nirnayCapturedCount,
                barautVal: blockStats.baraut.nirnayCapturedCount,
                max: 44,
                baghpatLabel: `${blockStats.baghpat.nirnayCapturedCount}/44 (${blockStats.baghpat.nirnayPercent}%)`,
                barautLabel: `${blockStats.baraut.nirnayCapturedCount}/22 मैप्ड (${blockStats.baraut.nirnayMappedPercent}%)`,
                unit: 'GP',
              },
              {
                title: 'MIS पोर्टल फीडिंग (MIS Audits Fed - R 9.1.3)',
                baghpatVal: blockStats.baghpat.misFedCount,
                barautVal: blockStats.baraut.misFedCount,
                max: 44,
                baghpatLabel: `${blockStats.baghpat.misFedCount}/44 (${blockStats.baghpat.misFedPercent}%)`,
                barautLabel: `${blockStats.baraut.misFedCount}/44 (${blockStats.baraut.misFedPercent}%)`,
                unit: 'GP',
              },
              {
                title: 'NSAP पेंशन रोस्टर (NSAP Pension Audits Proposed)',
                baghpatVal: blockStats.baghpat.nsapTotal,
                barautVal: blockStats.baraut.nsapTotal,
                max: 44,
                baghpatLabel: `${blockStats.baghpat.nsapCompletedCount} सम्पन्न / ${blockStats.baghpat.nsapTotal} कुल`,
                barautLabel: `${blockStats.baraut.nsapCompletedCount} सम्पन्न / ${blockStats.baraut.nsapTotal} कुल`,
                unit: 'GP',
              },
              {
                title: 'संशोधित बैठकें (Amended Roster Meetings)',
                baghpatVal: blockStats.baghpat.amendedTotal,
                barautVal: blockStats.baraut.amendedTotal,
                max: 10,
                baghpatLabel: `${blockStats.baghpat.amendedCompletedCount} सम्पन्न / ${blockStats.baghpat.amendedTotal} कुल (खेड़की)`,
                barautLabel: `0 सम्पन्न / ${blockStats.baraut.amendedTotal} कुल (4 शेष)`,
                unit: 'GP',
              },
            ].map((row, idx) => {
              const baghpatPercent = Math.min(100, Math.round((row.baghpatVal / row.max) * 100));
              const barautPercent = Math.min(100, Math.round((row.barautVal / row.max) * 100));

              return (
                <div key={idx} className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      {row.title}
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-cyan-300 font-bold">बागपत: {row.baghpatLabel}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-purple-300 font-bold">बड़ौत: {row.barautLabel}</span>
                    </div>
                  </div>

                  {/* Dual Horizontal Bars */}
                  <div className="space-y-1.5 pt-1">
                    {/* Baghpat Bar */}
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden flex border border-white/5">
                      <div
                        className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 text-[9px] font-black text-white"
                        style={{ width: `${Math.max(8, baghpatPercent)}%` }}
                      >
                        {row.baghpatVal > 0 && `${row.baghpatVal}`}
                      </div>
                    </div>

                    {/* Baraut Bar */}
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden flex border border-white/5">
                      <div
                        className="bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 text-[9px] font-black text-white"
                        style={{ width: `${Math.max(8, barautPercent)}%` }}
                      >
                        {row.barautVal > 0 && `${row.barautVal}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TODAY'S MEETINGS LIVE ACTION BANNER (आज की सभाएं) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'today') && (
        <div className="w-full bg-gradient-to-br from-rose-950/50 via-slate-900/90 to-purple-950/40 border border-rose-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>आज आयोजित होने वाली सभाएं (Today's Meetings)</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {todayMeetings.length} ग्राम पंचायतें
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  दिनांक: <strong className="text-rose-300">{formatDateHi(asOfDate)}</strong> | समय: <strong className="text-emerald-300">{liveDelhiTime || 'सक्रिय'}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('upcoming')}
              className="text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/70 px-3.5 py-1.5 rounded-xl border border-rose-800/50 flex items-center gap-1.5 font-bold transition-colors"
            >
              <span>आगामी 40 बैठकें देखें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pt-1">
              {todayMeetings.map((gp) => (
                <div
                  key={gp.id}
                  className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3 hover:border-rose-400/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-400">
                        {gp.block === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        आज है!
                      </span>
                    </div>

                    <h4 className="text-base font-black text-white">
                      {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                    </h4>

                    {gp.hasNSAP && (
                      <span className="inline-block mt-1 text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                        NSAP पेंशन सत्यापन शामिल
                      </span>
                    )}

                    <div className="text-xs text-slate-300 space-y-1 mt-2.5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{renderText(gp.venueUnicode, gp.venueKrutiDev)}</span>
                        <span className="text-slate-500">({renderText(gp.timeUnicode, gp.timeKrutiDev)})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>BRP: <strong className="text-white">{gp.brpName}</strong></span>
                        <a href={`tel:${gp.brpPhone}`} className="text-emerald-400 hover:underline font-mono text-[11px]">
                          ({gp.brpPhone})
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => openEditModal(gp)}
                      className="flex-1 py-1.5 px-2 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/40 rounded-xl text-xs font-bold transition-colors"
                    >
                      संशोधित करें
                    </button>
                    <button
                      onClick={() => markCompleted(gp.id, gp.status !== 'completed')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                        gp.status === 'completed'
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{gp.status === 'completed' ? 'पूर्ण' : 'सम्पन्न'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center text-xs text-slate-400">
              आज दिनांक <strong className="text-white">{formatDateHi(asOfDate)}</strong> को कोई ग्राम सभा निर्धारित नहीं है।
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NSAP PENSION BENEFICIARY VISUAL METER & DEEP ANALYTICS */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'nsap') && (
        <div className="w-full bg-gradient-to-br from-slate-900/95 via-purple-950/30 to-slate-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) पेंशन विश्लेषण</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    2,234 पेंशन लाभार्थी
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  भौतिक सत्यापन में प्रत्यक्ष, पारिवारिक, मृतक एवं अपात्र लाभार्थियों का श्रेणीवार ग्राफ़िकल अनुपात
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToTab('nsap-data')}
                className="text-xs text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 px-3.5 py-1.5 rounded-xl border border-purple-800/50 flex items-center gap-1.5 font-bold transition-colors"
              >
                <span>+ नया NSAP डेटा दर्ज करें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigateToTab('nsap-report')}
                className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors font-medium"
              >
                <span>सरकारी प्रारूप रिपोर्ट</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Segmented Visual Meter */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">लाभार्थी भौतिक सत्यापन श्रेणी विभाजन (2,234 पेंशनर्स):</span>
              <span className="text-emerald-400">
                कुल सत्यापित: {nsapAnalytics.totalVerified} (81.6%)
              </span>
            </div>

            {/* Proportional Segmented Progress Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
              <div 
                className="bg-emerald-500 h-full transition-all duration-700" 
                style={{ width: `${nsapAnalytics.directPercent}%` }} 
                title={`प्रत्यक्ष मुलाकात: ${nsapAnalytics.totalVerifiedDirect} (${nsapAnalytics.directPercent}%)`}
              />
              <div 
                className="bg-teal-400 h-full transition-all duration-700" 
                style={{ width: `${nsapAnalytics.familyPercent}%` }} 
                title={`पारिवारिक सत्यापन: ${nsapAnalytics.totalVerifiedFamily} (${nsapAnalytics.familyPercent}%)`}
              />
              <div 
                className="bg-rose-500 h-full transition-all duration-700" 
                style={{ width: `${nsapAnalytics.deceasedPercent}%` }} 
                title={`मृतक पेंशनर्स: ${nsapAnalytics.totalDeceased} (${nsapAnalytics.deceasedPercent}%)`}
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-700" 
                style={{ width: `${nsapAnalytics.ineligiblePercent}%` }} 
                title={`अपात्र पेंशनर्स: ${nsapAnalytics.totalIneligible} (${nsapAnalytics.ineligiblePercent}%)`}
              />
            </div>

            {/* Legend / KPI Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  प्रत्यक्ष मुलाकात
                </div>
                <div className="text-lg font-black text-white mt-0.5">{nsapAnalytics.totalVerifiedDirect}</div>
                <div className="text-[10px] text-slate-400">{nsapAnalytics.directPercent}% भौतिक उपस्थित</div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-teal-500/30">
                <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[10px] uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                  परिवार द्वारा
                </div>
                <div className="text-lg font-black text-white mt-0.5">{nsapAnalytics.totalVerifiedFamily}</div>
                <div className="text-[10px] text-slate-400">{nsapAnalytics.familyPercent}% पारिवारिक साक्ष्य</div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-rose-500/40">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[10px] uppercase">
                  <Skull className="w-3 h-3 text-rose-400" />
                  सत्यापित में मृतक
                </div>
                <div className="text-lg font-black text-rose-300 mt-0.5">{nsapAnalytics.totalDeceased}</div>
                <div className="text-[10px] text-rose-400/80">{nsapAnalytics.deceasedPercent}% मृत्यु हो चुकी है</div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/40">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase">
                  <UserX className="w-3 h-3 text-amber-400" />
                  अपात्र लाभार्थी
                </div>
                <div className="text-lg font-black text-amber-300 mt-0.5">{nsapAnalytics.totalIneligible}</div>
                <div className="text-[10px] text-amber-400/80">{nsapAnalytics.ineligiblePercent}% डुप्लीकेट/अपात्र</div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-yellow-500/30">
                <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-[10px] uppercase">
                  <IndianRupee className="w-3 h-3 text-yellow-400" />
                  वित्तीय अनियमितता
                </div>
                <div className="text-lg font-black text-yellow-300 mt-0.5">₹{nsapAnalytics.totalFinancialIrregularity}</div>
                <div className="text-[10px] text-slate-400">वसूली योग्य धनराशि</div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[10px] uppercase">
                  <Layers className="w-3 h-3 text-purple-400" />
                  दर्ज ग्राम पंचायतें
                </div>
                <div className="text-lg font-black text-purple-300 mt-0.5">{nsapAnalytics.totalRecordedGPs} / 47</div>
                <div className="text-[10px] text-slate-400">{nsapAnalytics.pendingToRecordGPs} अवशेष</div>
              </div>
            </div>
          </div>

          {/* Quick Preview Grid of 16 Recorded GPs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>दर्ज ग्राम पंचायतों का कार्ड व्यू (16 GPs):</span>
              <button
                onClick={() => navigateToTab('nsap-data')}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold text-xs"
              >
                <span>समस्त 16 ग्राम पंचायतों का लाभार्थी रजिस्टर देखें</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
              {nsapAnalytics.records.slice(0, 16).map((gp) => {
                const dec = (gp.beneficiaries || []).filter(b => b.category === 'deceased').length;
                const inel = (gp.beneficiaries || []).filter(b => b.category === 'ineligible').length;

                return (
                  <div
                    key={gp.id}
                    onClick={() => navigateToTab('nsap-data')}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <div className="font-bold text-white truncate text-[11px]">
                      {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      पेंशनर: <strong className="text-slate-200">{gp.totalBeneficiaries}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-white/5">
                      <span className="text-rose-400 font-semibold">मृतक: {dec}</span>
                      <span className="text-amber-400 font-semibold">अपात्र: {inel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FIELD TEAM (BRP) PERFORMANCE LEADERBOARD */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'team') && (
        <div className="w-full bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>बी०आर०पी० टीम कार्यभार एवं लाइव प्रदर्शन (BRP Leaderboard)</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    4 BRP + 1 पूर्व BRP
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  प्रत्येक BRP को आवंटित बैठकें, पूर्ण सोशल ऑडिट, निर्णय ऐप व MIS फीडिंग प्रगति
                </p>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('roster')}
              className="text-xs text-teal-300 hover:text-white bg-teal-950/60 hover:bg-teal-900/60 px-3.5 py-1.5 rounded-xl border border-teal-800/50 flex items-center gap-1.5 font-bold transition-colors"
            >
              <span>पूर्ण टीम रोस्टर देखें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {brpDirectory.map((brp) => (
              <div
                key={brp.phone}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-lg ${
                  brp.isEx
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-teal-500/40 transition-colors'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-400 text-[11px]">{brp.primaryBlock}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      brp.isEx ? 'bg-amber-500/20 text-amber-300' : 'bg-teal-500/20 text-teal-300'
                    }`}>
                      {brp.isEx ? 'कार्यमुक्त' : `${brp.percent}% पूर्ण`}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-white flex items-center justify-between">
                    <span>{brp.name}</span>
                  </h4>

                  <a 
                    href={`tel:${brp.phone}`} 
                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-1 font-mono"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{brp.phone}</span>
                  </a>

                  {!brp.isEx && (
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-teal-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${brp.percent}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-white/5">
                  <div className="bg-slate-900 p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-medium">सम्पन्न</div>
                    <div className="text-base font-black text-emerald-300">{brp.completedCount}</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-medium">{brp.isEx ? 'संशोधित' : 'शेष'}</div>
                    <div className="text-base font-black text-indigo-300">{brp.upcomingCount}</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>कुल आवंटित: <strong className="text-white">{brp.totalAssigned}</strong></span>
                  <span className="text-emerald-400 font-bold">निर्णय: {brp.nirnayCapturedCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. 10 AMENDED PANCHAYATS LIVE ACTION CARDS */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'matrix') && (
        <div className="w-full bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
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
                  BRP हरिकिशन के कार्यमुक्त होने पर बागपत (6) एवं बड़ौत (4) में संशोधित की गई बैठकें
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                1 सम्पन्न (खेड़की)
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                9 शेष
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
            {records.filter(r => r.isAmended).map(gp => {
              const isCompleted = gp.meetingDate <= asOfDate || gp.status === 'completed';
              const diff = getDaysDiff(gp.meetingDate);

              return (
                <div
                  key={gp.id}
                  onClick={() => openEditModal(gp)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200'
                      : 'bg-amber-950/30 border-amber-500/40 text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-semibold text-slate-400">
                        {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
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
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1 rounded font-bold">NSAP</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DETAILED COMPARATIVE MATRIX TABLE (Baghpat vs Baraut Breakdown) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'matrix') && (
        <div className="w-full bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Table2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
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

            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span>{showMatrix ? 'मैट्रिक्स संक्षेप करें' : 'विस्तृत मैट्रिक्स देखें'}</span>
              {showMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showMatrix && (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/60">
                    <th className="py-3 px-3 sm:px-4 rounded-l-xl">ऑडिट विवरण (Audit Particulars)</th>
                    <th className="py-3 px-3 sm:px-4 text-center">विकास खण्ड - बागपत</th>
                    <th className="py-3 px-3 sm:px-4 text-center">विकास खण्ड - बड़ौत</th>
                    <th className="py-3 px-3 sm:px-4 text-center rounded-r-xl bg-blue-950/30 text-blue-300">जनपद कुल योग</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {/* Row 1: Total GPs */}
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-slate-300 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>कुल ग्राम पंचायतें (Total Gram Panchayats)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-white">44</td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-white">44</td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-blue-300 bg-blue-950/20">88</td>
                  </tr>

                  {/* Row 2: Total Completed */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/10">
                    <td className="py-3 px-3 sm:px-4 text-emerald-300 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>सम्पन्न सोशल ऑडिट (दिनांक {formatDateHi(asOfDate)} तक)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {blockStats.baghpat.completedCount} / 44 ({blockStats.baghpat.progressPercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {blockStats.baraut.completedCount} / 44 ({blockStats.baraut.progressPercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-emerald-300 bg-emerald-950/30">
                      <span className="bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-500/40">
                        {blockStats.totalCompleted} / 88 ({blockStats.districtProgress}%)
                      </span>
                    </td>
                  </tr>

                  {/* Row 3: Total Remaining */}
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-slate-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>शेष / आगामी सोशल ऑडिट (Remaining Audits)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-indigo-300">
                      {blockStats.baghpat.remainingCount} ग्राम पंचायतें
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-indigo-300">
                      {blockStats.baraut.remainingCount} ग्राम पंचायतें
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-indigo-300 bg-blue-950/20">
                      {blockStats.totalRemaining} ग्राम पंचायतें
                    </td>
                  </tr>

                  {/* Row 4: Total Amended */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-amber-950/15">
                    <td className="py-3 px-3 sm:px-4 text-amber-300 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>कुल संशोधित रोस्टर (BRP हरिकिशन कार्यमुक्त)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      {blockStats.baghpat.amendedTotal} ग्राम पंचायतें
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      {blockStats.baraut.amendedTotal} ग्राम पंचायतें
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-amber-300 bg-amber-950/30">
                      {blockStats.totalAmended} ग्राम पंचायतें
                    </td>
                  </tr>

                  {/* Row 5: Amended Completed */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/20">
                    <td className="py-3 px-3 sm:px-4 text-emerald-200 font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div>संशोधित में से सम्पन्न (Amended Completed)</div>
                        <div className="text-[11px] text-emerald-400/80 font-normal">कट-ऑफ तिथि तक जो संशोधित पूर्ण हो चुकी हैं</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <div className="inline-flex flex-col items-center">
                        <span className="bg-emerald-500/25 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/40 text-sm">
                          {blockStats.baghpat.amendedCompletedCount} सम्पन्न
                        </span>
                        <span className="text-[11px] text-emerald-400 mt-0.5">खेड़की (29/10/2026)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-400">
                      <div className="inline-flex flex-col items-center">
                        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 text-sm">
                          {blockStats.baraut.amendedCompletedCount} (शून्य)
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">सभी 4 आगामी तिथियों में</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-emerald-300 bg-emerald-950/40">
                      <span className="bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-500/50">
                        {blockStats.totalAmendedCompleted} सम्पन्न (खेड़की)
                      </span>
                    </td>
                  </tr>

                  {/* Row 6: Amended Remaining */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-amber-950/25">
                    <td className="py-3 px-3 sm:px-4 text-amber-200 font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div>संशोधित में से शेष / लंबित (Amended Remaining)</div>
                        <div className="text-[11px] text-amber-400/80 font-normal">आगामी तिथियों में आयोजित होने वाली संशोधित सभाएं</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      <span className="bg-amber-500/25 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/40 text-sm">
                        {blockStats.baghpat.amendedRemainingCount} लंबित
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      <span className="bg-amber-500/25 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/40 text-sm">
                        {blockStats.baraut.amendedRemainingCount} लंबित
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-amber-300 bg-amber-950/40">
                      <span className="bg-amber-500/30 text-amber-200 px-3 py-1 rounded-lg border border-amber-500/50">
                        {blockStats.totalAmendedRemaining} लंबित
                      </span>
                    </td>
                  </tr>

                  {/* Row 7: NSAP Pension Progress */}
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-slate-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>NSAP पेंशन सोशल ऑडिट (47 ग्राम पंचायतें)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      <strong className="text-emerald-400">{blockStats.baghpat.nsapCompletedCount} सम्पन्न</strong>
                      <span className="text-slate-400"> / {blockStats.baghpat.nsapRemainingCount} शेष</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      <strong className="text-emerald-400">{blockStats.baraut.nsapCompletedCount} सम्पन्न</strong>
                      <span className="text-slate-400"> / {blockStats.baraut.nsapRemainingCount} शेष</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black bg-blue-950/20">
                      <strong className="text-emerald-300">{blockStats.totalNSAPCompleted} सम्पन्न</strong>
                      <span className="text-slate-400"> / {blockStats.totalNSAPRemaining} शेष</span>
                    </td>
                  </tr>

                  {/* Row 8: Nirnay App Captured */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-teal-950/20">
                    <td className="py-3 px-3 sm:px-4 text-teal-300 font-bold flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>पंचायत निर्णय ऐप पर अपलोड (R 9.6.2)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-teal-300">
                      {blockStats.baghpat.nirnayCapturedCount} / 44 ({blockStats.baghpat.nirnayPercent}%)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-teal-300">
                      {blockStats.baraut.nirnayCapturedCount} / 22 मैप्ड ({blockStats.baraut.nirnayMappedPercent}%)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-teal-300 bg-teal-950/40">
                      {blockStats.totalNirnayCaptured} / {blockStats.totalNirnayMapped} मैप्ड ({blockStats.totalNirnayPercent}%)
                    </td>
                  </tr>

                  {/* Row 9: MIS Portal Fed */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-blue-950/20">
                    <td className="py-3 px-3 sm:px-4 text-blue-300 font-bold flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>MIS पोर्टल पर सोशल ऑडिट फीडेड (R 9.1.3)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-blue-300">
                      {blockStats.baghpat.misFedCount} / 44 ({blockStats.baghpat.misFedPercent}%)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-blue-300">
                      {blockStats.baraut.misFedCount} / 44 ({blockStats.baraut.misFedPercent}%)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-blue-300 bg-blue-950/40">
                      {blockStats.totalMisFed} / 88 ({blockStats.districtMisFedPercent}%)
                    </td>
                  </tr>

                  {/* Row 10: MIS Feeding Due Pending */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-amber-950/15">
                    <td className="py-3 px-3 sm:px-4 text-amber-300 font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>MIS फीडिंग: आज तक देय लंबित (Due Pending)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      {blockStats.baghpat.misDuePendingCount} लंबित ({blockStats.baghpat.misDuePendingNSAPCount} NSAP)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      {blockStats.baraut.misDuePendingCount} लंबित ({blockStats.baraut.misDuePendingNSAPCount} NSAP)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-amber-300 bg-amber-950/30">
                      {blockStats.totalMisDuePending} लंबित बैठकें ({blockStats.totalMisDuePendingNSAP} NSAP)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
