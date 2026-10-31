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
  Briefcase, CheckCircle, ExternalLink, HelpCircle
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

  // Sub-Navigation Section Filter state
  // 'all' | 'today' | 'nirnay' | 'mis' | 'nsap' | 'team' | 'matrix' | 'amended'
  const [activeFilterSection, setActiveFilterSection] = useState<string>('all');
  const [showMatrix, setShowMatrix] = useState(true);
  const [showAmendedList, setShowAmendedList] = useState(true);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

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
      records: list,
    };
  }, [nsapRecords, blockStats.totalNSAP]);

  // BRP Team Directory and Performance Stats
  const brpDirectory = useMemo(() => {
    const knownBRPs = [
      { name: 'तेजपाल', phone: '9997202522', primaryBlock: 'बागपत' },
      { name: 'सुदेश पाल सिंह', phone: '9117323927', primaryBlock: 'बागपत / बड़ौत' },
      { name: 'राजकुमार', phone: '9760732189', primaryBlock: 'बड़ौत' },
      { name: 'ईश्वरचन्द', phone: '9759612544', primaryBlock: 'बड़ौत' },
      { name: 'हरिकिशन (पूर्व बी०आर०पी०)', phone: '8859660315', primaryBlock: 'कार्यमुक्त', isEx: true },
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

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 0. INTERACTIVE ADVANCED SUB-NAV FILTER BAR (Sticky / Horizontal Scroll) */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2.5 bg-slate-950/85 backdrop-blur-xl border-y border-white/10 shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold shrink-0 hidden sm:inline-flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            डैशबोर्ड दृश्य:
          </span>

          <button
            onClick={() => setActiveFilterSection('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'all'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30 font-bold'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>सम्पूर्ण डैशबोर्ड</span>
          </button>

          <button
            onClick={() => setActiveFilterSection('today')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'today'
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-500/30 font-bold'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>आज व आगामी बैठकें</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-200 border border-rose-400/30 font-black">
              {todayMeetings.length} आज • {blockStats.totalRemaining} शेष
            </span>
          </button>

          <button
            onClick={() => setActiveFilterSection('nirnay')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'nirnay'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30 font-bold'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>पंचायत निर्णय ऐप (R 9.6.2)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-black">
              {blockStats.totalNirnayCaptured} / {blockStats.totalNirnayMapped}
            </span>
          </button>

          <button
            onClick={() => setActiveFilterSection('mis')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'mis'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/30 font-bold'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>MIS फीडिंग (R 9.1.3)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-black">
              {blockStats.totalMisFed} / {blockStats.totalGPs}
            </span>
          </button>

          <button
            onClick={() => setActiveFilterSection('nsap')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'nsap'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/30 font-bold'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>NSAP पेंशन विश्लेषण</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30 font-black">
              {nsapAnalytics.totalRecordedGPs} GP • {nsapAnalytics.totalBeneficiaries} लाभार्थी
            </span>
          </button>

          <button
            onClick={() => setActiveFilterSection('team')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'team'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/30 font-bold'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>बी०आर०पी० टीम कार्यभार</span>
          </button>

          <button
            onClick={() => setActiveFilterSection('matrix')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'matrix'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30 font-bold'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Table2 className="w-3.5 h-3.5 text-blue-400" />
            <span>तुलनात्मक मैट्रिक्स</span>
          </button>

          <button
            onClick={() => setActiveFilterSection('amended')}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilterSection === 'amended'
                ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/30 font-bold'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>10 संशोधित रोस्टर</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-200 border border-amber-400/30 font-black">
              1 सम्पन्न • 9 शेष
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DISTRICT EXECUTIVE TOP METRIC CARDS (6 Core KPIs) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total GPs */}
        <div 
          onClick={() => navigateToTab('calendar')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-950/70 to-slate-900/90 border border-blue-500/25 backdrop-blur-md shadow-lg cursor-pointer hover:border-blue-500/50 transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-blue-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">कुल ग्राम पंचायतें</span>
            <Layers className="w-4 h-4 group-hover:scale-110 transition-transform text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{blockStats.totalGPs}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>बागपत: <strong className="text-white">44</strong> | बड़ौत: <strong className="text-white">44</strong></span>
            <ArrowUpRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-[10px] text-blue-300/80 mt-1 pt-1 border-t border-white/5 font-medium">
            2 ब्लॉक स्तरीय सभाएं सम्मिलित
          </div>
        </div>

        {/* Total Completed */}
        <div 
          onClick={() => navigateToTab('calendar')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900/90 border border-emerald-500/25 backdrop-blur-md shadow-lg cursor-pointer hover:border-emerald-500/50 transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">सम्पन्न सोशल ऑडिट</span>
            <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">{blockStats.totalCompleted}</span>
            <span className="text-xs text-emerald-400 font-bold">({blockStats.districtProgress}%)</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center justify-between">
            <span>बागपत: <strong>{blockStats.baghpat.completedCount}</strong> | बड़ौत: <strong>{blockStats.baraut.completedCount}</strong></span>
            <ArrowUpRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-full bg-slate-950/80 h-1.5 rounded-full mt-1.5 overflow-hidden border border-emerald-500/20">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-700" 
              style={{ width: `${blockStats.districtProgress}%` }}
            />
          </div>
        </div>

        {/* Total Remaining */}
        <div 
          onClick={() => navigateToTab('upcoming')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900/90 border border-indigo-500/25 backdrop-blur-md shadow-lg cursor-pointer hover:border-indigo-500/50 transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-indigo-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">शेष / आगामी बैठकें</span>
            <Clock className="w-4 h-4 group-hover:scale-110 transition-transform text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300">{blockStats.totalRemaining}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>बागपत: <strong>{blockStats.baghpat.remainingCount}</strong> | बड़ौत: <strong>{blockStats.baraut.remainingCount}</strong></span>
            <span className="text-[10px] text-indigo-400 font-bold">देखें →</span>
          </div>
          <div className="text-[10px] text-indigo-300/80 mt-1 pt-1 border-t border-white/5 font-medium flex items-center justify-between">
            <span>आज बैठकें: <strong>{todayMeetings.length}</strong></span>
            <span className="text-slate-400">कट-ऑफ बाद</span>
          </div>
        </div>

        {/* Total Amended */}
        <div 
          onClick={() => { setActiveFilterSection('amended'); setShowAmendedList(true); }}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 to-slate-900/90 border border-amber-500/25 backdrop-blur-md shadow-lg cursor-pointer hover:border-amber-500/50 transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">संशोधित रोस्टर</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">{blockStats.totalAmended}</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
              {blockStats.totalAmendedCompleted} सम्पन्न
            </span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 flex items-center justify-between">
            <span>बागपत: <strong>{blockStats.baghpat.amendedTotal}</strong> | बड़ौत: <strong>{blockStats.baraut.amendedTotal}</strong></span>
            <span className="text-[10px] text-amber-300 font-bold">{blockStats.totalAmendedRemaining} शेष</span>
          </div>
          <div className="text-[10px] text-amber-300/80 mt-1 pt-1 border-t border-white/5 font-medium truncate">
            खेड़की सम्पन्न • 9 आगामी
          </div>
        </div>

        {/* Card 5: Panchayat Nirnay App (R 9.6.2) */}
        <div 
          onClick={() => navigateToTab('nirnay')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/70 border border-emerald-500/30 backdrop-blur-md shadow-lg cursor-pointer hover:border-emerald-500/50 transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">निर्णय ऐप (R 9.6.2)</span>
            <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">{blockStats.totalNirnayCaptured}</span>
            <span className="text-xs text-emerald-400 font-bold">/ {blockStats.totalNirnayMapped} ({blockStats.totalNirnayPercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>बागपत: <strong className="text-blue-300">{blockStats.baghpat.nirnayCapturedCount}</strong> | बड़ौत: <strong className="text-indigo-300">{blockStats.baraut.nirnayCapturedCount}</strong></span>
            <span className="text-[10px] text-emerald-400 font-bold">ट्रैकर →</span>
          </div>
          <div className="text-[10px] text-slate-300 mt-1 pt-1 border-t border-white/5 flex items-center justify-between">
            <span className="text-emerald-300 font-semibold">लंबित: <strong>{blockStats.totalNirnayDuePending}</strong></span>
            <span className="text-blue-300 font-medium">आगामी: <strong>{blockStats.totalNirnayUpcoming}</strong></span>
          </div>
        </div>

        {/* Card 6: MIS Audit Feeding (R 9.1.3) */}
        <div 
          onClick={() => navigateToTab('mis-feeding')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/70 border border-blue-500/30 backdrop-blur-md shadow-lg cursor-pointer hover:border-blue-500/50 transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-blue-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">MIS फीडिंग (R 9.1.3)</span>
            <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-300">{blockStats.totalMisFed}</span>
            <span className="text-xs text-blue-400 font-bold">/ {blockStats.totalGPs} ({blockStats.districtMisFedPercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>बागपत: <strong className="text-blue-300">{blockStats.baghpat.misFedCount}</strong> | बड़ौत: <strong className="text-indigo-300">{blockStats.baraut.misFedCount}</strong></span>
            <span className="text-[10px] text-blue-400 font-bold">ट्रैकर →</span>
          </div>
          <div className="text-[10px] text-slate-300 mt-1 pt-1 border-t border-white/5 flex items-center justify-between">
            <span className="text-rose-300 font-semibold">देय लंबित: <strong>{blockStats.totalMisDuePending}</strong></span>
            <span className="text-amber-300 font-medium">समस्त: <strong>{blockStats.totalMisPending}</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TODAY'S MEETINGS LIVE ACTION BANNER (आज आयोजित होने वाली सभाएं) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'today') && (
        <div className="bg-gradient-to-br from-rose-950/50 via-slate-900/90 to-purple-950/40 border border-rose-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>आज होने वाली ग्राम सभाएं (Today's Scheduled Sabhas)</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {todayMeetings.length} पंचायतें निर्धारित
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  दिनांक: <strong className="text-rose-300">{formatDateHi(asOfDate)}</strong> | लाइव दिल्ली समय: <strong className="text-emerald-300">{liveDelhiTime || 'सक्रिय'}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('upcoming')}
              className="text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/70 px-3 py-1.5 rounded-xl border border-rose-800/50 flex items-center gap-1.5 font-bold transition-colors"
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
                  className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-3.5 shadow-md flex flex-col justify-between space-y-2.5 hover:border-rose-400/60 transition-colors"
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

                    <div className="text-xs text-slate-300 space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{renderText(gp.venueUnicode, gp.venueKrutiDev)}</span>
                        <span className="text-slate-500">({renderText(gp.timeUnicode, gp.timeKrutiDev)})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>BRP: <strong className="text-white">{gp.brpName}</strong></span>
                        <a href={`tel:${gp.brpPhone}`} className="text-emerald-400 hover:underline text-[11px]">
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
              आज दिनांक <strong className="text-white">{formatDateHi(asOfDate)}</strong> को कोई ग्राम सभा प्रस्तावित नहीं है। अगली निर्धारित सभाएं नीचे आगामी सूची में दर्शित हैं।
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SYNCHRONIZED 4-PILLAR CROSS-SYSTEM STATUS DECK */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'nirnay' || activeFilterSection === 'mis') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Roster Calendar Progress */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-500/20 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>सोशल ऑडिट रोस्टर प्रगति</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {blockStats.districtProgress}% पूर्ण
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-white">
                {blockStats.totalCompleted} <span className="text-sm font-normal text-slate-400">/ 88 ग्राम पंचायतें</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full mt-2 overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${blockStats.districtProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/5">
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div className="text-slate-400">बागपत पूर्ण</div>
                <div className="text-sm font-black text-emerald-300">{blockStats.baghpat.completedCount} / 44</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div className="text-slate-400">बड़ौत पूर्ण</div>
                <div className="text-sm font-black text-emerald-300">{blockStats.baraut.completedCount} / 44</div>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('calendar')}
              className="w-full py-1.5 text-xs font-bold text-blue-400 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 rounded-xl border border-blue-800/30 flex items-center justify-center gap-1 transition-colors"
            >
              <span>पूर्ण कैलेंडर तालिका</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 2: Panchayat Nirnay App (R 9.6.2) */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950/40 border border-teal-500/20 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span>निर्णय ऐप (R 9.6.2) स्थिति</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {blockStats.totalNirnayCaptured} सत्यापित
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-teal-300">
                {blockStats.totalNirnayCaptured} <span className="text-sm font-normal text-slate-400">/ {blockStats.totalNirnayMapped} मैप्ड ({blockStats.totalNirnayPercent}%)</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                बागपत: <strong className="text-emerald-300">{blockStats.baghpat.nirnayCapturedCount}</strong> | बड़ौत: <strong className="text-emerald-300">{blockStats.baraut.nirnayCapturedCount}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/5">
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div className="text-slate-400">आज तक देय लंबित</div>
                <div className="text-sm font-black text-emerald-300">{blockStats.totalNirnayDuePending} (क्लियर)</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div className="text-slate-400">विगत बैठकों में छूटे</div>
                <div className="text-sm font-black text-rose-300">{blockStats.totalNirnayNotCaptured}</div>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('nirnay')}
              className="w-full py-1.5 text-xs font-bold text-teal-400 hover:text-white bg-teal-950/40 hover:bg-teal-900/60 rounded-xl border border-teal-800/30 flex items-center justify-center gap-1 transition-colors"
            >
              <span>निर्णय ऐप लाइव ट्रैकर</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 3: MIS Audit Feeding (R 9.1.3) */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>MIS फीडिंग (R 9.1.3)</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {blockStats.districtMisFedPercent}% फीडेड
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-indigo-300">
                {blockStats.totalMisFed} <span className="text-sm font-normal text-slate-400">/ 88 ग्राम पंचायतें</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                बागपत: <strong className="text-blue-300">{blockStats.baghpat.misFedCount}</strong> | बड़ौत: <strong className="text-indigo-300">{blockStats.baraut.misFedCount}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/5">
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div className="text-slate-400">आज तक देय लंबित</div>
                <div className="text-sm font-black text-rose-300">
                  {blockStats.totalMisDuePending}
                  {blockStats.totalMisDuePendingNSAP > 0 && <span className="text-[10px] text-emerald-400 ml-1">({blockStats.totalMisDuePendingNSAP} NSAP)</span>}
                </div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div className="text-slate-400">समस्त लंबित में NSAP</div>
                <div className="text-sm font-black text-amber-300">{blockStats.totalMisPendingNSAP} / {blockStats.totalNSAP}</div>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('mis-feeding')}
              className="w-full py-1.5 text-xs font-bold text-indigo-400 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 rounded-xl border border-indigo-800/30 flex items-center justify-center gap-1 transition-colors"
            >
              <span>MIS फीडिंग ट्रैकर</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 4: NSAP Pension Verification */}
          <div className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/20 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>NSAP पेंशन सत्यापन</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {nsapAnalytics.totalRecordedGPs} GP डेटा
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-purple-300">
                {nsapAnalytics.totalBeneficiaries} <span className="text-sm font-normal text-slate-400">लाभार्थी दर्ज</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                सत्यापित: <strong className="text-emerald-300">{nsapAnalytics.totalVerified}</strong> | मृतक: <strong className="text-rose-300">{nsapAnalytics.totalDeceased}</strong> | अपात्र: <strong className="text-amber-300">{nsapAnalytics.totalIneligible}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/5">
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div className="text-slate-400">कुल NSAP रोस्टर</div>
                <div className="text-sm font-black text-purple-300">{blockStats.totalNSAP} GP</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div className="text-slate-400">शेष रिकॉर्डिंग</div>
                <div className="text-sm font-black text-amber-300">{nsapAnalytics.pendingToRecordGPs} GP</div>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('nsap-data')}
              className="w-full py-1.5 text-xs font-bold text-purple-400 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 rounded-xl border border-purple-800/30 flex items-center justify-center gap-1 transition-colors"
            >
              <span>NSAP डेटा व रिपोर्ट</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DEEP NSAP PENSION ANALYTICS HUB (नया एवं अति-उन्नत अनुभाग) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'nsap') && (
        <div className="bg-gradient-to-br from-slate-900/95 via-purple-950/30 to-slate-900/90 border border-purple-500/30 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) पेंशन विस्तृत विश्लेषण</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    माह अक्टूबर तक मासिक प्रगति
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  प्रारूपानुसार कुल 47 प्रस्तावित ग्राम पंचायतों में से अब तक 16 ग्राम पंचायतों का भौतिक सत्यापन डेटा एवं लाभार्थी विवरण दर्ज
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToTab('nsap-data')}
                className="text-xs text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 px-3 py-1.5 rounded-xl border border-purple-800/50 flex items-center gap-1.5 font-bold transition-colors"
              >
                <span>+ नया डेटा दर्ज करें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigateToTab('nsap-report')}
                className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors font-medium"
              >
                <span>सरकारी प्रारूप रिपोर्ट</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* NSAP KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">दर्ज कुल लाभार्थी</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">{nsapAnalytics.totalBeneficiaries}</div>
              <div className="text-[10px] text-purple-400 mt-0.5">{nsapAnalytics.totalRecordedGPs} पंचायतों में</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-emerald-500/20">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">प्रत्यक्ष मुलाकात सत्यापित</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">{nsapAnalytics.totalVerifiedDirect}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">भौतिक रूप से उपस्थित</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-teal-500/20">
              <div className="text-[10px] text-teal-400 uppercase font-bold">पारिवारिक सदस्यों द्वारा</div>
              <div className="text-xl sm:text-2xl font-black text-teal-300 mt-1">{nsapAnalytics.totalVerifiedFamily}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">परिवार द्वारा सत्यापन</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-rose-500/30">
              <div className="text-[10px] text-rose-400 uppercase font-bold flex items-center gap-1">
                <Skull className="w-3 h-3 text-rose-400" />
                <span>सत्यापित में मृतक</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-300 mt-1">{nsapAnalytics.totalDeceased}</div>
              <div className="text-[10px] text-rose-400 mt-0.5">मृत्यु हो चुकी है</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-amber-500/30">
              <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                <UserX className="w-3 h-3 text-amber-400" />
                <span>अपात्र लाभार्थी</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">{nsapAnalytics.totalIneligible}</div>
              <div className="text-[10px] text-amber-400 mt-0.5">एक से अधिक पेंशन/अपात्र</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-yellow-500/20">
              <div className="text-[10px] text-yellow-400 uppercase font-bold flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-yellow-400" />
                <span>वित्तीय अनियमितता</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-yellow-300 mt-1">₹{nsapAnalytics.totalFinancialIrregularity}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">वसूली योग्य धनराशि</div>
            </div>
          </div>

          {/* Quick Preview of Recorded Panchayats */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                दर्ज ग्राम पंचायतों का संक्षिप्त सारांश (16 ग्राम पंचायतें):
              </span>
              <button
                onClick={() => navigateToTab('nsap-data')}
                className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
              >
                <span>समस्त लाभार्थी सूची देखें</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
              {nsapAnalytics.records.slice(0, 16).map((gp) => {
                const deceasedCount = (gp.beneficiaries || []).filter(b => b.category === 'deceased').length;
                const ineligibleCount = (gp.beneficiaries || []).filter(b => b.category === 'ineligible').length;

                return (
                  <div
                    key={gp.id}
                    onClick={() => navigateToTab('nsap-data')}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-white truncate text-[11px]">
                      {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      पेंशनर: <strong className="text-slate-200">{gp.totalBeneficiaries}</strong>
                    </div>
                    <div className="text-[10px] flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                      <span className="text-rose-400">मृतक: {deceasedCount}</span>
                      <span className="text-amber-400">अपात्र: {ineligibleCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FIELD TEAM (BRP) WORKLOAD & COMPLETION ANALYTICS */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'team') && (
        <div className="bg-gradient-to-br from-slate-900/95 via-cyan-950/30 to-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>बी०आर०पी० टीम कार्यभार एवं प्रगति (BRP Team Workload)</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    4 मुख्य बी०आर०पी० + 1 पूर्व बी०आर०पी०
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  प्रत्येक ब्लॉक रिसोर्स पर्सन (BRP) को आवंटित ग्राम पंचायतें, सम्पन्न सोशल ऑडिट, शेष बैठकें एवं निर्णय/MIS फीडिंग
                </p>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('roster')}
              className="text-xs text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-1.5 rounded-xl border border-cyan-800/50 flex items-center gap-1.5 font-bold transition-colors"
            >
              <span>पूर्ण टीम विवरण देखें</span>
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
                    : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/40 transition-colors'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-400 text-[11px]">{brp.primaryBlock}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      brp.isEx ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {brp.isEx ? 'कार्यमुक्त' : `${brp.percent}% पूर्ण`}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-white flex items-center justify-between">
                    <span>{brp.name}</span>
                  </h4>

                  <a 
                    href={`tel:${brp.phone}`} 
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1 font-mono"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{brp.phone}</span>
                  </a>

                  {/* Progress bar */}
                  {!brp.isEx && (
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
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
                  <span className="text-emerald-400">निर्णय: {brp.nirnayCapturedCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. UPCOMING 7 DAYS SCHEDULE CALENDAR STRIP */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'today') && (
        <div className="bg-slate-900/90 border border-indigo-500/25 rounded-3xl p-5 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-black text-white">
                  आगामी बैठकों की समय-सारणी (Upcoming Social Audit Meetings)
                </h3>
                <p className="text-xs text-slate-400">
                  कट-ऑफ तिथि के तुरंत बाद निर्धारित बैठकें
                </p>
              </div>
            </div>

            <button
              onClick={() => navigateToTab('upcoming')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-800/40"
            >
              <span>समस्त 36 आगामी बैठकें देखें</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {upcomingNext7Days.map((gp) => {
              const diff = getDaysDiff(gp.meetingDate);
              return (
                <div
                  key={gp.id}
                  onClick={() => openEditModal(gp)}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold text-slate-400">
                        {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {diff === 1 ? 'कल' : `${diff} दिन में`}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white truncate">
                      {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                    </h4>

                    <div className="text-xs text-amber-300 font-bold mt-1">
                      {formatDateHi(gp.meetingDate)}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="truncate">BRP: {gp.brpName}</span>
                    {gp.hasNSAP && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
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

      {/* ========================================================================= */}
      {/* 7. DEDICATED LIVE AMENDMENT TRACKER (10 संशोधित ग्राम पंचायतें) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'amended') && (
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToTab('upcoming')}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-950/60 px-2.5 py-1.5 rounded-lg border border-blue-800/40"
              >
                <span>आगामी रोस्टर देखें</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigateToTab('nsap-report')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-950/60 px-2.5 py-1.5 rounded-lg border border-amber-800/40"
              >
                <span>विस्तृत NSAP रिपोर्ट देखें</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
      )}

      {/* ========================================================================= */}
      {/* 8. BLOCK-WISE COMPARATIVE COMMAND CARDS (BAGHPAT & BARAUT SIDE-BY-SIDE) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'matrix') && (
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
                onClick={() => navigateToTab('calendar', 'Baghpat')}
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

              <div className="text-[11px] text-slate-300 pt-1 border-t border-amber-500/15">
                <span className="text-slate-400">बागपत में शेष संशोधित: </span>
                <span className="text-amber-200">
                  निवाड़ा (03/11), क्यामपुर (10/11), पूठी-ब्राह्मण (10/11), सन्तोषपुर (13/11), ट्योढ़ी (19/12)
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

            {/* Panchayat Nirnay App Box */}
            <div 
              onClick={() => navigateToTab('nirnay', 'Baghpat')}
              className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-emerald-200">पंचायत निर्णय ऐप (R 9.6.2): </span>
                  <span className="text-slate-300">{blockStats.baghpat.nirnayCapturedCount} / 44 अपलोड</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 text-[11px]">
                  {blockStats.baghpat.nirnayPercent}% सत्यापित
                </span>
                <span className="text-emerald-400 font-bold text-[10px]">देखें →</span>
              </div>
            </div>

            {/* MIS Audit Feeding (R 9.1.3) Box */}
            <div 
              onClick={() => navigateToTab('mis-feeding', 'Baghpat')}
              className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 flex items-center justify-between text-xs cursor-pointer hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="font-bold text-blue-200">MIS फीडिंग (R 9.1.3): </span>
                  <span className="text-slate-300">{blockStats.baghpat.misFedCount} / 44 फीडेड</span>
                  <span className="text-amber-300 ml-1.5 text-[11px] font-semibold">
                    ({blockStats.baghpat.misDuePendingCount} आज तक लंबित{blockStats.baghpat.misDuePendingNSAPCount > 0 ? `, ${blockStats.baghpat.misDuePendingNSAPCount} NSAP` : ''})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30 text-[11px]">
                  {blockStats.baghpat.misFedPercent}%
                </span>
                <span className="text-blue-400 font-bold text-[10px]">देखें →</span>
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
                onClick={() => navigateToTab('calendar', 'Baraut')}
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

            {/* Panchayat Nirnay App Box */}
            <div 
              onClick={() => navigateToTab('nirnay', 'Baraut')}
              className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-emerald-200">पंचायत निर्णय ऐप (R 9.6.2): </span>
                  <span className="text-slate-300">{blockStats.baraut.nirnayCapturedCount} / 22 मैप्ड अपलोड</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 text-[11px]">
                  {blockStats.baraut.nirnayMappedPercent}% मैप्ड ({blockStats.baraut.nirnayPercent}% कुल)
                </span>
                <span className="text-emerald-400 font-bold text-[10px]">देखें →</span>
              </div>
            </div>

            {/* MIS Audit Feeding (R 9.1.3) Box */}
            <div 
              onClick={() => navigateToTab('mis-feeding', 'Baraut')}
              className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-blue-950/30 to-slate-900 border border-indigo-500/30 flex items-center justify-between text-xs cursor-pointer hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="font-bold text-indigo-200">MIS फीडिंग (R 9.1.3): </span>
                  <span className="text-slate-300">{blockStats.baraut.misFedCount} / 44 फीडेड</span>
                  <span className="text-amber-300 ml-1.5 text-[11px] font-semibold">
                    ({blockStats.baraut.misDuePendingCount} आज तक लंबित{blockStats.baraut.misDuePendingNSAPCount > 0 ? `, ${blockStats.baraut.misDuePendingNSAPCount} NSAP` : ''})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 text-[11px]">
                  {blockStats.baraut.misFedPercent}%
                </span>
                <span className="text-indigo-400 font-bold text-[10px]">देखें →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. BLOCK-WISE COMPARATIVE AUDIT MATRIX TABLE (DETAILED TABULAR BREAKDOWN) */}
      {/* ========================================================================= */}
      {(activeFilterSection === 'all' || activeFilterSection === 'matrix') && (
        <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-950/30 border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Table2 className="w-5 h-5" />
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToTab('upcoming')}
                className="text-xs text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 px-3 py-1.5 rounded-xl border border-blue-800/40 flex items-center gap-1.5 transition-colors font-bold"
              >
                <span>आगामी सभाएं देखें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[620px]">
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
                      <div className="inline-flex flex-col items-center">
                        <span className="bg-amber-500/25 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/40 text-sm">
                          {blockStats.baghpat.amendedRemainingCount} लंबित
                        </span>
                        <span className="text-[10px] text-amber-200/90 mt-0.5 max-w-[200px] leading-tight">
                          निवाड़ा, क्यामपुर, पूठी-ब्राह्मण, सन्तोषपुर, ट्योढ़ी
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      <div className="inline-flex flex-col items-center">
                        <span className="bg-amber-500/25 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/40 text-sm">
                          {blockStats.baraut.amendedRemainingCount} लंबित
                        </span>
                        <span className="text-[10px] text-amber-200/90 mt-0.5 max-w-[200px] leading-tight">
                          गुराना (10/11), जौहड़ी (13/11), महावतपुर (19/12), शाहपुर बड़ौली (25/12)
                        </span>
                      </div>
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
                      <span className="text-[11px] text-slate-500 block">(कुल 24)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      <strong className="text-emerald-400">{blockStats.baraut.nsapCompletedCount} सम्पन्न</strong>
                      <span className="text-slate-400"> / {blockStats.baraut.nsapRemainingCount} शेष</span>
                      <span className="text-[11px] text-slate-500 block">(कुल 23)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black bg-blue-950/20">
                      <strong className="text-emerald-300">{blockStats.totalNSAPCompleted} सम्पन्न</strong>
                      <span className="text-slate-400"> / {blockStats.totalNSAPRemaining} शेष</span>
                      <span className="text-[11px] text-blue-400 block">(कुल 47)</span>
                    </td>
                  </tr>

                  {/* Row 8: Block Sabha */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-slate-950/30">
                    <td className="py-3 px-3 sm:px-4 text-slate-300 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>ब्लॉक सोशल ऑडिट सभा (Block Sabha)</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-purple-300">
                      30/11/2026 (ब्लॉक मीटिंग हॉल)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-purple-300">
                      02/01/2027 (ब्लॉक मीटिंग हॉल)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-purple-300 bg-blue-950/20">
                      2 ब्लॉक स्तरीय सभाएं
                    </td>
                  </tr>

                  {/* Row 9: Panchayat Nirnay App Captured (R 9.6.2) */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/20">
                    <td className="py-3 px-3 sm:px-4 text-emerald-300 font-bold flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div>पंचायत निर्णय ऐप पर अपलोड (Captured in App - R 9.6.2)</div>
                        <div className="text-[11px] text-emerald-400/80 font-normal">आधिकारिक पोर्टल पर लाइव सत्यापित प्रपत्र एवं फोटो</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <span className="bg-emerald-500/25 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/40 text-sm">
                        {blockStats.baghpat.nirnayCapturedCount} / 44 ({blockStats.baghpat.nirnayPercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <span className="bg-emerald-500/25 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/40 text-sm">
                        {blockStats.baraut.nirnayCapturedCount} / 22 मैप्ड ({blockStats.baraut.nirnayMappedPercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-emerald-300 bg-emerald-950/40">
                      <span className="bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-500/50 text-sm">
                        {blockStats.totalNirnayCaptured} / {blockStats.totalNirnayMapped} मैप्ड ({blockStats.totalNirnayPercent}%)
                      </span>
                      <span className="text-[11px] text-emerald-400 block mt-1">कुल {blockStats.totalNirnayCaptured} ग्राम पंचायतें अपलोड</span>
                    </td>
                  </tr>

                  {/* Row 10: Nirnay App Due Pending Confirmation */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/10">
                    <td className="py-3 px-3 sm:px-4 text-emerald-300 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div>आज तक निर्णय ऐप पुष्टि लंबित (Due for Action)</div>
                        <div className="text-[11px] text-emerald-400/80 font-normal">आज ({formatDateHi(asOfDate)}) की तिथि तक सब अद्यतन एवं क्लियर है</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {blockStats.baghpat.nirnayDuePendingCount} लंबित (0)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {blockStats.baraut.nirnayDuePendingCount} लंबित (0)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-emerald-300 bg-emerald-950/30">
                      <span className="bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-500/50">
                        {blockStats.totalNirnayDuePending} लंबित (आज तक सब क्लियर)
                      </span>
                    </td>
                  </tr>

                  {/* Row 11: Upcoming Scheduled Meetings */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-blue-950/10">
                    <td className="py-3 px-3 sm:px-4 text-blue-300 font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div>आगामी निर्धारित बैठकें (Future Scheduled Meetings)</div>
                        <div className="text-[11px] text-blue-400/80 font-normal">बैठक दिवस पर स्वतः लंबित बॉक्स में सक्रिय होंगी</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-blue-300">
                      <span className="bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/30">
                        {blockStats.baghpat.nirnayUpcomingCount} आगामी
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-blue-300">
                      <span className="bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/30">
                        {blockStats.baraut.nirnayUpcomingCount} आगामी
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-blue-300 bg-blue-950/30">
                      <span className="bg-blue-500/30 text-blue-200 px-3 py-1 rounded-lg border border-blue-500/50">
                        {blockStats.totalNirnayUpcoming} बैठकें (प्रस्तावित)
                      </span>
                    </td>
                  </tr>

                  {/* Row 12: Nirnay App Missed Past Meetings */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-rose-950/10">
                    <td className="py-3 px-3 sm:px-4 text-rose-300 font-medium flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div>विगत बैठकों में ऐप पर अपलोड नहीं हो सका (Not Captured)</div>
                        <div className="text-[11px] text-rose-400/80 font-normal">आज तक की तारीख तक नहीं हो पाए (पोर्टल पर अब संभव नहीं)</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-semibold text-rose-300">
                      {blockStats.baghpat.nirnayNotCapturedCount} बैठकें
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-semibold text-rose-300">
                      {blockStats.baraut.nirnayNotCapturedCount} बैठकें
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-rose-300 bg-rose-950/20">
                      {blockStats.totalNirnayNotCaptured} बैठकें (छूट गईं)
                    </td>
                  </tr>

                  {/* Row 13: MIS Portal Audits Fed (R 9.1.3 - Column 8 = 1) */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-blue-950/20">
                    <td className="py-3 px-3 sm:px-4 text-blue-300 font-bold flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div>MIS पोर्टल पर सोशल ऑडिट फीडेड (R 9.1.3 - Column 8 = 1)</div>
                        <div className="text-[11px] text-blue-400/80 font-normal">मनरेगा सोशल ऑडिट कैलेंडर बनाम संपन्न ऑडिट सरकारी रिपोर्ट</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-blue-300">
                      <span className="bg-blue-500/25 text-blue-300 px-3 py-1 rounded-lg border border-blue-500/40 text-sm">
                        {blockStats.baghpat.misFedCount} / 44 ({blockStats.baghpat.misFedPercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-blue-300">
                      <span className="bg-blue-500/25 text-blue-300 px-3 py-1 rounded-lg border border-blue-500/40 text-sm">
                        {blockStats.baraut.misFedCount} / 44 ({blockStats.baraut.misFedPercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-blue-300 bg-blue-950/40">
                      <span className="bg-blue-500/30 text-blue-200 px-3 py-1 rounded-lg border border-blue-500/50 text-sm">
                        {blockStats.totalMisFed} / 88 ({blockStats.districtMisFedPercent}%)
                      </span>
                      <span className="text-[11px] text-blue-400 block mt-1 font-bold">कुल {blockStats.totalMisFed} ग्राम पंचायतें फीडेड</span>
                    </td>
                  </tr>

                  {/* Row 14: MIS Feeding Due Pending */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-amber-950/15">
                    <td className="py-3 px-3 sm:px-4 text-amber-300 font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div>MIS फीडिंग: आज तक लंबित बैठकें (Due Pending)</div>
                        <div className="text-[11px] text-amber-400/80 font-normal">बैठक संपन्न हो चुकी है परंतु वेबसाइट पर अभी फीड नहीं हुई</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        {blockStats.baghpat.misDuePendingCount} लंबित
                      </span>
                      {blockStats.baghpat.misDuePendingNSAPCount > 0 && (
                        <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
                          {blockStats.baghpat.misDuePendingNSAPCount} में NSAP पेंशन सत्यापन
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-amber-300">
                      <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        {blockStats.baraut.misDuePendingCount} लंबित
                      </span>
                      {blockStats.baraut.misDuePendingNSAPCount > 0 && (
                        <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
                          {blockStats.baraut.misDuePendingNSAPCount} में NSAP पेंशन सत्यापन
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-amber-300 bg-amber-950/30">
                      <span className="bg-amber-500/30 text-amber-200 px-3 py-1 rounded-lg border border-amber-500/50">
                        {blockStats.totalMisDuePending} लंबित बैठकें
                      </span>
                      {blockStats.totalMisDuePendingNSAP > 0 && (
                        <span className="text-[11px] text-emerald-300 block mt-1 font-bold">
                          {blockStats.totalMisDuePendingNSAP} में NSAP पेंशन सत्यापन
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Row 15: MIS Pending with NSAP Pension Verification */}
                  <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/15">
                    <td className="py-3 px-3 sm:px-4 text-emerald-300 font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div>समस्त MIS लंबित में NSAP पेंशन सत्यापन (Pending with NSAP)</div>
                        <div className="text-[11px] text-emerald-400/80 font-normal">अवशेष/लंबित पंचायतों में जहां NSAP राष्ट्रीय सामाजिक सहायता पेंशन शामिल है</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {blockStats.baghpat.misPendingNSAPCount} / {blockStats.baghpat.nsapTotal} पंचायतें
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        (कुल {blockStats.baghpat.misPendingCount} लंबित में से)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                      <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {blockStats.baraut.misPendingNSAPCount} / {blockStats.baraut.nsapTotal} पंचायतें
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        (कुल {blockStats.baraut.misPendingCount} लंबित में से)
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-emerald-300 bg-emerald-950/30">
                      <span className="bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-500/50">
                        {blockStats.totalMisPendingNSAP} / {blockStats.totalNSAP} पंचायतें
                      </span>
                      <span className="text-[11px] text-emerald-400 block mt-1 font-bold">
                        (समस्त {blockStats.totalMisPending} लंबित में से {blockStats.totalMisPendingNSAP} में NSAP)
                      </span>
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
