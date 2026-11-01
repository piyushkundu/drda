'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore, SocialAuditTab } from '@/stores/socialAuditStore';
import { SocialAuditRecord, AuditBlock } from '@/types/socialAudit';
import { DISTRICT_META } from '@/data/socialAuditInitialData';
import { 
  Landmark, Building2, Calendar, CheckCircle2, Clock, 
  AlertTriangle, Smartphone, FileSpreadsheet, Users, 
  Search, X, ChevronRight, RefreshCw, Cloud, MapPin, 
  Phone, ArrowRight, ExternalLink, ShieldCheck, Check, 
  Layers, AlertCircle, Info, FileText, Filter, CalendarDays,
  CheckCircle, ArrowUpRight
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
    setActiveTab,
    setSelectedBlock,
    syncWithDelhiTime,
    forceSyncToFirebase,
    firebaseSyncStatus,
    firebaseLastSyncedAt
  } = useSocialAuditStore();

  // Modal drill-down state for KPI cards
  // null | 'all' | 'completed' | 'upcoming' | 'pending' | 'nirnay' | 'mis' | 'nsap'
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalBlockFilter, setModalBlockFilter] = useState<'all' | AuditBlock>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
          <span className="text-[11px] text-amber-700 font-mono" style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>
            {krutiText}
          </span>
        </span>
      );
    }
    return <span>{unicodeText}</span>;
  };

  // Compute metrics dynamically from current records & asOfDate
  const metrics = useMemo(() => {
    const totalGPs = records.length; // 88

    // Block splits
    const baghpatRecords = records.filter((r) => r.block === 'Baghpat');
    const barautRecords = records.filter((r) => r.block === 'Baraut');

    // Completed & Upcoming
    const completedRecords = records.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
    const upcomingRecords = records.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');
    const duePendingRecords = records.filter((r) => r.meetingDate <= asOfDate && r.status !== 'completed');

    const baghpatCompleted = baghpatRecords.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
    const baghpatUpcoming = baghpatRecords.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');
    const barautCompleted = barautRecords.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
    const barautUpcoming = barautRecords.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');

    // Panchayat Nirnay App (R 9.6.2)
    const nirnayMappedRecords = records.filter((r) => r.isMappedInPanchayatNirnay);
    const nirnayCapturedRecords = records.filter((r) => r.panchayatNirnayStatus === 'captured');
    const nirnayDuePending = records.filter((r) => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate <= asOfDate);
    const nirnayUpcoming = records.filter((r) => (r.panchayatNirnayStatus || 'pending') === 'pending' && r.meetingDate > asOfDate);

    const baghpatNirnayCaptured = baghpatRecords.filter((r) => r.panchayatNirnayStatus === 'captured');
    const barautNirnayCaptured = barautRecords.filter((r) => r.panchayatNirnayStatus === 'captured');

    // MIS Audit Feeding (R 9.1.3)
    const misFedRecords = records.filter((r) => r.misStatus === 'fed');
    const misPendingRecords = records.filter((r) => (r.misStatus || 'pending') !== 'fed');
    const misDuePendingRecords = records.filter((r) => (r.misStatus || 'pending') !== 'fed' && r.meetingDate <= asOfDate);
    const misDuePendingNSAP = misDuePendingRecords.filter((r) => r.hasNSAP);

    const baghpatMisFed = baghpatRecords.filter((r) => r.misStatus === 'fed');
    const barautMisFed = barautRecords.filter((r) => r.misStatus === 'fed');

    // NSAP Beneficiaries & Recorded GPs
    const nsapRosterRecords = records.filter((r) => r.hasNSAP); // 47
    const nsapList = nsapRecords || [];
    const totalBeneficiaries = nsapList.reduce((acc, item) => acc + (item.totalBeneficiaries || 0), 0);
    const totalDirect = nsapList.reduce((acc, item) => acc + (item.verifiedDirect || 0), 0);
    const totalFamily = nsapList.reduce((acc, item) => acc + (item.verifiedFamily || 0), 0);
    const totalVerified = nsapList.reduce((acc, item) => acc + (item.verifiedTotal || 0), 0);
    const totalFinancialIrreg = nsapList.reduce((acc, item) => acc + (item.financialIrregularityAmount || 0), 0);

    let totalDeceased = 0;
    let totalIneligible = 0;
    nsapList.forEach((gp) => {
      (gp.beneficiaries || []).forEach((b) => {
        if (b.category === 'deceased') totalDeceased++;
        else if (b.category === 'ineligible') totalIneligible++;
      });
    });

    // Amended Meetings
    const amendedRecords = records.filter((r) => r.isAmended);
    const amendedCompleted = amendedRecords.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
    const amendedRemaining = amendedRecords.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');

    // Recent Completed (last 5)
    const recentlyCompleted = [...completedRecords]
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
      .slice(0, 5);

    // Upcoming next 5
    const upcomingNext = [...upcomingRecords]
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))
      .slice(0, 5);

    return {
      totalGPs,
      baghpatCount: baghpatRecords.length,
      barautCount: barautRecords.length,
      completedCount: completedRecords.length,
      completedPercent: totalGPs > 0 ? Math.round((completedRecords.length / totalGPs) * 100) : 0,
      upcomingCount: upcomingRecords.length,
      duePendingCount: duePendingRecords.length,
      baghpatCompletedCount: baghpatCompleted.length,
      baghpatUpcomingCount: baghpatUpcoming.length,
      barautCompletedCount: barautCompleted.length,
      barautUpcomingCount: barautUpcoming.length,
      nirnayMappedCount: nirnayMappedRecords.length,
      nirnayCapturedCount: nirnayCapturedRecords.length,
      nirnayPercent: nirnayMappedRecords.length > 0 ? ((nirnayCapturedRecords.length / nirnayMappedRecords.length) * 100).toFixed(1) : '0.0',
      nirnayDuePendingCount: nirnayDuePending.length,
      nirnayUpcomingCount: nirnayUpcoming.length,
      baghpatNirnayCapturedCount: baghpatNirnayCaptured.length,
      barautNirnayCapturedCount: barautNirnayCaptured.length,
      misFedCount: misFedRecords.length,
      misFedPercent: totalGPs > 0 ? ((misFedRecords.length / totalGPs) * 100).toFixed(1) : '0.0',
      misDuePendingCount: misDuePendingRecords.length,
      misDuePendingNSAPCount: misDuePendingNSAP.length,
      misPendingCount: misPendingRecords.length,
      baghpatMisFedCount: baghpatMisFed.length,
      barautMisFedCount: barautMisFed.length,
      nsapRosterCount: nsapRosterRecords.length,
      nsapRecordedCount: nsapList.length,
      totalBeneficiaries,
      totalDirect,
      totalFamily,
      totalVerified,
      totalDeceased,
      totalIneligible,
      totalFinancialIrreg,
      amendedCount: amendedRecords.length,
      amendedCompletedCount: amendedCompleted.length,
      amendedRemainingCount: amendedRemaining.length,
      completedRecords,
      upcomingRecords,
      duePendingRecords,
      nirnayCapturedRecords,
      misFedRecords,
      misDuePendingRecords,
      recentlyCompleted,
      upcomingNext,
    };
  }, [records, nsapRecords, asOfDate]);

  // Handle Safe Refresh Action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncWithDelhiTime();
      await forceSyncToFirebase();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter records inside modal
  const filteredModalRecords = useMemo(() => {
    let list: SocialAuditRecord[] = [];
    if (activeModal === 'all') list = records;
    else if (activeModal === 'completed') list = metrics.completedRecords;
    else if (activeModal === 'upcoming') list = metrics.upcomingRecords;
    else if (activeModal === 'pending') list = metrics.duePendingRecords;
    else if (activeModal === 'nirnay') list = metrics.nirnayCapturedRecords;
    else if (activeModal === 'mis') list = metrics.misFedRecords;
    else if (activeModal === 'mis-due') list = metrics.misDuePendingRecords;

    if (modalBlockFilter !== 'all') {
      list = list.filter((r) => r.block === modalBlockFilter);
    }

    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      list = list.filter((r) => 
        r.gpNameUnicode?.toLowerCase().includes(q) ||
        r.brpName?.toLowerCase().includes(q) ||
        r.sno?.toString().includes(q)
      );
    }

    return list;
  }, [activeModal, modalBlockFilter, modalSearch, records, metrics]);

  // BRP Directory stats
  const brpSummary = useMemo(() => {
    const list = [
      { name: 'तेजपाल', phone: '9997202522', block: 'बागपत' },
      { name: 'सुदेश पाल सिंह', phone: '9117323927', block: 'बागपत / बड़ौत' },
      { name: 'राजकुमार', phone: '9760732189', block: 'बड़ौत' },
      { name: 'ईश्वरचन्द', phone: '9759612544', block: 'बड़ौत' },
      { name: 'हरिकिशन (पूर्व BRP)', phone: '8859660315', block: 'कार्यमुक्त' },
    ];

    return list.map((b) => {
      const assigned = records.filter((r) => r.brpPhone === b.phone || r.brpName?.includes(b.name.split(' ')[0]));
      const completed = assigned.filter((r) => r.meetingDate <= asOfDate || r.status === 'completed');
      const upcoming = assigned.filter((r) => r.meetingDate > asOfDate && r.status !== 'completed');
      const percent = assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 0;
      return { ...b, assignedCount: assigned.length, completedCount: completed.length, upcomingCount: upcoming.length, percent };
    });
  }, [records, asOfDate]);

  return (
    <div className="bg-slate-50 text-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 border border-slate-200/90 shadow-sm font-sans">
      
      {/* ========================================================================= */}
      {/* SECTION A: DASHBOARD HEADER (Compact & Elegant Government Enterprise Banner) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
              <Landmark className="w-3.5 h-3.5 text-blue-800" />
              उत्तर प्रदेश शासन • जिला विकास अधिकारी (DDO)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              वित्तीय वर्ष: <strong className="text-slate-800">{DISTRICT_META.financialYear || '2026-2027'}</strong>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>सोशल ऑडिट डैशबोर्ड</span>
            <span className="text-sm font-semibold text-slate-500 hidden sm:inline">
              (जनपद बागपत, उत्तर प्रदेश)
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            विकास खंड बागपत एवं बड़ौत की ग्राम पंचायतों का प्रशासनिक अनुश्रवण।
          </p>
        </div>

        {/* Quick Block Scope Indicators */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end text-xs">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
            <Layers className="w-4 h-4 text-blue-700" />
            <span className="text-[11px] font-bold">
              कुल 88 ग्राम पंचायतें
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 px-3 py-1.5 rounded-xl border border-blue-200 text-[11px] font-bold">
            <span>बागपत: 44</span>
            <span className="text-blue-300">|</span>
            <span>बड़ौत: 44</span>
          </div>

          <button
            onClick={() => setActiveTab('upcoming')}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 text-xs"
            title="आगामी सभाएं देखें"
          >
            <span>आगामी सभाएं देखें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: TOP 8 DYNAMIC KPI CARDS (Clickable for Detail Lists) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-800" />
            मुख्य प्रगति संकेतक (Key Performance Indicators)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            (विवरण सूची देखने हेतु किसी भी कार्ड पर क्लिक करें)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* KPI 1: Total GPs */}
          <div
            onClick={() => { setActiveModal('all'); setModalSearch(''); setModalBlockFilter('all'); }}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">कुल ग्राम पंचायतें</span>
              <Building2 className="w-4 h-4 text-blue-800 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {metrics.totalGPs}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>बागपत: <strong className="text-slate-800">{metrics.baghpatCount}</strong> | बड़ौत: <strong className="text-slate-800">{metrics.barautCount}</strong></span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* KPI 2: Total Scheduled */}
          <div
            onClick={() => { setActiveModal('all'); setModalSearch(''); setModalBlockFilter('all'); }}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">कुल निर्धारित सोशल ऑडिट</span>
              <Calendar className="w-4 h-4 text-blue-800 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {metrics.totalGPs}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>2 ब्लॉक स्तरीय सभाएं सम्मिलित</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* KPI 3: Completed Audits */}
          <div
            onClick={() => { setActiveModal('completed'); setModalSearch(''); setModalBlockFilter('all'); }}
            className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">पूर्ण सोशल ऑडिट बैठकें</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                {metrics.completedCount}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                {metrics.completedPercent}%
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>बागपत: <strong className="text-slate-800">{metrics.baghpatCompletedCount}</strong> | बड़ौत: <strong className="text-slate-800">{metrics.barautCompletedCount}</strong></span>
              <span className="text-[10px] text-emerald-700 font-bold">सूची देखें →</span>
            </div>
          </div>

          {/* KPI 4: Upcoming Audits */}
          <div
            onClick={() => { setActiveModal('upcoming'); setModalSearch(''); setModalBlockFilter('all'); }}
            className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-blue-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">आगामी बैठकें</span>
              <Clock className="w-4 h-4 text-blue-800 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
              {metrics.upcomingCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>बागपत: <strong className="text-slate-800">{metrics.baghpatUpcomingCount}</strong> | बड़ौत: <strong className="text-slate-800">{metrics.barautUpcomingCount}</strong></span>
              <span className="text-[10px] text-blue-800 font-bold">सूची देखें →</span>
            </div>
          </div>

          {/* KPI 5: Due Pending */}
          <div
            onClick={() => { setActiveModal('pending'); setModalSearch(''); setModalBlockFilter('all'); }}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">आज तक देय लंबित बैठकें</span>
              <AlertTriangle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {metrics.duePendingCount}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                {metrics.duePendingCount === 0 ? 'सब क्लियर' : 'कार्यवाही अपेक्षित'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {metrics.duePendingCount === 0 ? 'कट-ऑफ तिथि तक समस्त बैठकें अद्यतन' : 'बैठक तिथि उपरांत शेष'}
            </div>
          </div>

          {/* KPI 6: Panchayat Nirnay Status */}
          <div
            onClick={() => { setActiveModal('nirnay'); setModalSearch(''); setModalBlockFilter('all'); }}
            className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/20 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-teal-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">पंचायत निर्णय ऐप (R 9.6.2)</span>
              <Smartphone className="w-4 h-4 text-teal-700 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-teal-900 tracking-tight">
                {metrics.nirnayCapturedCount}
              </span>
              <span className="text-xs font-bold text-teal-700">
                / {metrics.nirnayMappedCount} ({metrics.nirnayPercent}%)
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>बागपत: <strong className="text-slate-800">{metrics.baghpatNirnayCapturedCount}</strong> | बड़ौत: <strong className="text-slate-800">{metrics.barautNirnayCapturedCount}</strong></span>
              <span className="text-[10px] text-teal-800 font-bold">सूची देखें →</span>
            </div>
          </div>

          {/* KPI 7: MIS Feeding Status */}
          <div
            onClick={() => { setActiveModal('mis'); setModalSearch(''); setModalBlockFilter('all'); }}
            className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-indigo-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">MIS फीडिंग (R 9.1.3)</span>
              <FileSpreadsheet className="w-4 h-4 text-indigo-700 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-900 tracking-tight">
                {metrics.misFedCount}
              </span>
              <span className="text-xs font-bold text-indigo-700">
                / {metrics.totalGPs} ({metrics.misFedPercent}%)
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>देय लंबित: <strong className="text-amber-700">{metrics.misDuePendingCount}</strong> ({metrics.misDuePendingNSAPCount} NSAP)</span>
              <span className="text-[10px] text-indigo-800 font-bold">सूची देखें →</span>
            </div>
          </div>

          {/* KPI 8: Total NSAP Beneficiaries */}
          <div
            onClick={() => { setActiveModal('nsap'); setModalSearch(''); }}
            className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-purple-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">NSAP पेंशन लाभार्थी संख्या</span>
              <Users className="w-4 h-4 text-purple-700 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-900 tracking-tight">
                {metrics.totalBeneficiaries}
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                {metrics.nsapRecordedCount} GP
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>सत्यापित: <strong className="text-emerald-700">{metrics.totalVerified}</strong> | मृतक: <strong className="text-rose-700">{metrics.totalDeceased}</strong></span>
              <span className="text-[10px] text-purple-800 font-bold">सूची देखें →</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: BLOCK-WISE COMPARATIVE SUMMARY (बागपत एवं बड़ौत) */}
      {/* ========================================================================= */}
      <div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-blue-800" />
          विकास खंड-वार तुलनात्मक स्थिति (Block-wise Status)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BLOCK 1: BAGHPAT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-black text-sm">
                  बा
                </span>
                <div>
                  <h4 className="font-black text-slate-900 text-base">विकास खण्ड - बागपत</h4>
                  <span className="text-xs text-slate-500 font-medium">ब्लॉक सभा: 30/11/2026 (ब्लॉक मीटिंग हॉल)</span>
                </div>
              </div>

              <span className="text-xs font-black bg-blue-100 text-blue-900 px-3 py-1 rounded-full border border-blue-200">
                44 ग्राम पंचायतें
              </span>
            </div>

            {/* Simple Subtle Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>सम्पन्न सोशल ऑडिट प्रगति:</span>
                <span className="font-bold text-slate-900">
                  {metrics.baghpatCompletedCount} / 44 ({Math.round((metrics.baghpatCompletedCount / 44) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-blue-800 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(metrics.baghpatCompletedCount / 44) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">सम्पन्न बैठकें</div>
                <div className="text-lg font-black text-emerald-800 mt-0.5">{metrics.baghpatCompletedCount}</div>
                <div className="text-[10px] text-slate-500">ग्राम पंचायतें</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">आगामी बैठकें</div>
                <div className="text-lg font-black text-blue-900 mt-0.5">{metrics.baghpatUpcomingCount}</div>
                <div className="text-[10px] text-slate-500">ग्राम पंचायतें</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">निर्णय ऐप सत्यापित</div>
                <div className="text-lg font-black text-teal-800 mt-0.5">{metrics.baghpatNirnayCapturedCount} / 44</div>
                <div className="text-[10px] text-slate-500">लाइव अपलोड</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">MIS फीडेड</div>
                <div className="text-lg font-black text-indigo-800 mt-0.5">{metrics.baghpatMisFedCount} / 44</div>
                <div className="text-[10px] text-slate-500">पोर्टल पर दर्ज</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">संशोधित रोस्टर</div>
                <div className="text-lg font-black text-amber-800 mt-0.5">6 ग्राम पंचायतें</div>
                <div className="text-[10px] text-emerald-700 font-semibold">1 सम्पन्न (खेड़की)</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">NSAP पेंशन रोस्टर</div>
                <div className="text-lg font-black text-purple-900 mt-0.5">24 ग्राम पंचायतें</div>
                <div className="text-[10px] text-slate-500">8 में विस्तृत डेटा दर्ज</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => { setSelectedBlock('Baghpat'); setActiveTab('calendar'); }}
                className="text-xs text-blue-900 font-bold hover:underline flex items-center gap-1"
              >
                <span>बागपत का पूरा कैलेंडर देखें</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* BLOCK 2: BARAUT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center justify-center font-black text-sm">
                  ब
                </span>
                <div>
                  <h4 className="font-black text-slate-900 text-base">विकास खण्ड - बड़ौत</h4>
                  <span className="text-xs text-slate-500 font-medium">ब्लॉक सभा: 02/01/2027 (ब्लॉक मीटिंग हॉल)</span>
                </div>
              </div>

              <span className="text-xs font-black bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full border border-indigo-200">
                44 ग्राम पंचायतें
              </span>
            </div>

            {/* Simple Subtle Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>सम्पन्न सोशल ऑडिट प्रगति:</span>
                <span className="font-bold text-slate-900">
                  {metrics.barautCompletedCount} / 44 ({Math.round((metrics.barautCompletedCount / 44) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-indigo-800 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(metrics.barautCompletedCount / 44) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">सम्पन्न बैठकें</div>
                <div className="text-lg font-black text-emerald-800 mt-0.5">{metrics.barautCompletedCount}</div>
                <div className="text-[10px] text-slate-500">ग्राम पंचायतें</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">आगामी बैठकें</div>
                <div className="text-lg font-black text-indigo-900 mt-0.5">{metrics.barautUpcomingCount}</div>
                <div className="text-[10px] text-slate-500">ग्राम पंचायतें</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">निर्णय ऐप सत्यापित</div>
                <div className="text-lg font-black text-teal-800 mt-0.5">{metrics.barautNirnayCapturedCount} / 22</div>
                <div className="text-[10px] text-slate-500">मैप्ड में से अपलोड</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">MIS फीडेड</div>
                <div className="text-lg font-black text-indigo-800 mt-0.5">{metrics.barautMisFedCount} / 44</div>
                <div className="text-[10px] text-slate-500">पोर्टल पर दर्ज</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">संशोधित रोस्टर</div>
                <div className="text-lg font-black text-amber-800 mt-0.5">4 ग्राम पंचायतें</div>
                <div className="text-[10px] text-slate-500">4 आगामी तिथियों में</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">NSAP पेंशन रोस्टर</div>
                <div className="text-lg font-black text-purple-900 mt-0.5">23 ग्राम पंचायतें</div>
                <div className="text-[10px] text-slate-500">8 में विस्तृत डेटा दर्ज</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => { setSelectedBlock('Baraut'); setActiveTab('calendar'); }}
                className="text-xs text-indigo-900 font-bold hover:underline flex items-center gap-1"
              >
                <span>बड़ौत का पूरा कैलेंडर देखें</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: IMPORTANT INFORMATION SECTIONS (Clean Government Data Tables) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Card 1: आगामी बैठकों की सूची (Upcoming Meetings) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>आगामी प्रस्तावित सोशल ऑडिट बैठकें</span>
            </h4>
            <button
              onClick={() => setActiveTab('upcoming')}
              className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All ({metrics.upcomingCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">ग्राम पंचायत</th>
                  <th className="py-2.5 px-2">ब्लॉक</th>
                  <th className="py-2.5 px-2">तिथि</th>
                  <th className="py-2.5 px-3">BRP / फोन</th>
                  <th className="py-2.5 px-2 text-right">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.upcomingNext.map((gp) => {
                  const diff = getDaysDiff(gp.meetingDate);
                  return (
                    <tr key={gp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600">
                        {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-semibold text-slate-700">
                        {formatDateHi(gp.meetingDate)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{gp.brpName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{gp.brpPhone}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {diff === 0 ? 'आज' : `${diff} दिन शेष`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: हाल ही में पूर्ण सोशल ऑडिट (Recently Completed) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>सम्पन्न सोशल ऑडिट बैठकें (Recently Completed)</span>
            </h4>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All ({metrics.completedCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">ग्राम पंचायत</th>
                  <th className="py-2.5 px-2">ब्लॉक</th>
                  <th className="py-2.5 px-2">सम्पन्न तिथि</th>
                  <th className="py-2.5 px-3">BRP नाम</th>
                  <th className="py-2.5 px-2 text-right">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.recentlyCompleted.map((gp) => (
                  <tr key={gp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                    </td>
                    <td className="py-2.5 px-2 text-slate-600">
                      {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-slate-700">
                      {formatDateHi(gp.meetingDate)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {gp.brpName}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        सम्पन्न ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: पंचायत निर्णय ऐप R 9.6.2 की स्थिति */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-700" />
              <span>पंचायत निर्णय ऐप (R 9.6.2) लाइव स्थिति</span>
            </h4>
            <button
              onClick={() => setActiveTab('nirnay')}
              className="text-xs font-bold text-teal-900 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View All ({metrics.nirnayCapturedCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-teal-50/60 p-2.5 rounded-xl border border-teal-200">
              <div className="text-[10px] text-teal-900 font-bold uppercase">लाइव अपलोड</div>
              <div className="text-xl font-black text-teal-900 mt-0.5">{metrics.nirnayCapturedCount}</div>
              <div className="text-[10px] text-teal-700">सत्यापित GP</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-600 font-bold uppercase">देय लंबित</div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{metrics.nirnayDuePendingCount}</div>
              <div className="text-[10px] text-emerald-700">सब क्लियर</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-600 font-bold uppercase">आगामी बैठकें</div>
              <div className="text-xl font-black text-slate-800 mt-0.5">{metrics.nirnayUpcomingCount}</div>
              <div className="text-[10px] text-slate-500">निर्धारित</div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">सत्यापित ग्राम पंचायतें (नमूना):</div>
            <div className="flex flex-wrap gap-1.5">
              {metrics.nirnayCapturedRecords.slice(0, 8).map((gp) => (
                <span key={gp.id} className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[11px] font-medium">
                  {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: MIS Feeding R 9.1.3 की स्थिति */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
              <span>MIS ऑडिट फीडिंग (R 9.1.3) स्थिति</span>
            </h4>
            <button
              onClick={() => setActiveTab('mis-feeding')}
              className="text-xs font-bold text-indigo-900 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All ({metrics.misFedCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-200">
              <div className="text-[10px] text-indigo-900 font-bold uppercase">पोर्टल फीडेड</div>
              <div className="text-xl font-black text-indigo-900 mt-0.5">{metrics.misFedCount}</div>
              <div className="text-[10px] text-indigo-700">{metrics.misFedPercent}% कुल</div>
            </div>
            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
              <div className="text-[10px] text-amber-900 font-bold uppercase">देय लंबित</div>
              <div className="text-xl font-black text-amber-800 mt-0.5">{metrics.misDuePendingCount}</div>
              <div className="text-[10px] text-amber-700 font-semibold">{metrics.misDuePendingNSAPCount} में NSAP</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-600 font-bold uppercase">समस्त लंबित</div>
              <div className="text-xl font-black text-slate-800 mt-0.5">{metrics.misPendingCount}</div>
              <div className="text-[10px] text-slate-500">आगामी सहित</div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">MIS फीडिंग हेतु आज तक देय ग्राम पंचायतें:</div>
            <div className="flex flex-wrap gap-1.5">
              {metrics.misDuePendingRecords.slice(0, 6).map((gp) => (
                <span key={gp.id} className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[11px] font-medium">
                  {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                  {gp.hasNSAP && <span className="ml-1 text-[9px] text-emerald-700 font-bold">[NSAP]</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 5: NSAP Pension Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                <span>राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) पेंशन सोशल ऑडिट विवरण</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                माह अक्टूबर तक मासिक प्रगति प्रारूपानुसार दर्ज 16 ग्राम पंचायतों का भौतिक सत्यापन डेटा
              </p>
            </div>
            <button
              onClick={() => setActiveTab('nsap-data')}
              className="text-xs font-bold text-purple-900 hover:text-purple-700 flex items-center gap-1"
            >
              <span>View All NSAP Data</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">दर्ज कुल पेंशनर्स</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{metrics.totalBeneficiaries}</div>
              <div className="text-[10px] text-purple-700 font-medium">16 ग्राम पंचायतों में</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-emerald-200">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">प्रत्यक्ष मुलाकात</div>
              <div className="text-xl font-black text-emerald-800 mt-0.5">{metrics.totalDirect}</div>
              <div className="text-[10px] text-slate-500">भौतिक उपस्थिति</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-blue-200">
              <div className="text-[10px] text-blue-900 font-bold uppercase">परिवार द्वारा साक्ष्य</div>
              <div className="text-xl font-black text-blue-900 mt-0.5">{metrics.totalFamily}</div>
              <div className="text-[10px] text-slate-500">सत्यापित</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-rose-200">
              <div className="text-[10px] text-rose-800 font-bold uppercase">सत्यापित में मृतक</div>
              <div className="text-xl font-black text-rose-700 mt-0.5">{metrics.totalDeceased}</div>
              <div className="text-[10px] text-rose-600 font-medium">मृत्यु हो चुकी है</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-amber-200">
              <div className="text-[10px] text-amber-900 font-bold uppercase">अपात्र लाभार्थी</div>
              <div className="text-xl font-black text-amber-800 mt-0.5">{metrics.totalIneligible}</div>
              <div className="text-[10px] text-amber-700 font-medium">डुप्लीकेट / अपात्र</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">वित्तीय अनियमितता</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">₹{metrics.totalFinancialIrreg}</div>
              <div className="text-[10px] text-slate-500">वसूली योग्य धनराशि</div>
            </div>
          </div>
        </div>

        {/* Card 6: BRP Team Workload */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-800" />
              <span>बी०आर०पी० टीम कार्यभार एवं प्रगति (Field Resource Persons)</span>
            </h4>
            <button
              onClick={() => setActiveTab('roster')}
              className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Full Roster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {brpSummary.map((b) => (
              <div key={b.phone} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-500">{b.block}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                      {b.percent}%
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">{b.name}</h5>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">{b.phone}</div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span>सम्पन्न: <strong className="text-emerald-700">{b.completedCount}</strong></span>
                  <span>शेष: <strong className="text-blue-900">{b.upcomingCount}</strong></span>
                  <span>कुल: <strong className="text-slate-900">{b.assignedCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION E: QUICK ACTIONS (प्रशासनिक शॉर्टकट नेविगेशन) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <ChevronRight className="w-4 h-4 text-blue-800" />
          त्वरित शासकीय कार्यवाही शॉर्टकट्स (Quick Navigation Actions)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('calendar')}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-2 transition-colors justify-center text-center"
          >
            <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
            <span>बैठक कैलेंडर देखें</span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-2 transition-colors justify-center text-center"
          >
            <Clock className="w-4 h-4 text-blue-700 shrink-0" />
            <span>आगामी बैठकें देखें</span>
          </button>

          <button
            onClick={() => setActiveTab('nirnay')}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-2 transition-colors justify-center text-center"
          >
            <Smartphone className="w-4 h-4 text-teal-700 shrink-0" />
            <span>पंचायत निर्णय देखें</span>
          </button>

          <button
            onClick={() => setActiveTab('mis-feeding')}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-2 transition-colors justify-center text-center"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-700 shrink-0" />
            <span>MIS Feeding देखें</span>
          </button>

          <button
            onClick={() => setActiveTab('nsap-data')}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-2 transition-colors justify-center text-center"
          >
            <Users className="w-4 h-4 text-purple-700 shrink-0" />
            <span>NSAP Data देखें</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-2 transition-colors justify-center text-center"
          >
            <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
            <span>Team Roster देखें</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION F: KPI CLICK DRILLDOWN DETAIL MODAL */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>
                    {activeModal === 'all' && 'समस्त 88 ग्राम पंचायतें (Total Gram Panchayats)'}
                    {activeModal === 'completed' && `सम्पन्न सोशल ऑडिट बैठकें (${metrics.completedCount} ग्राम पंचायतें)`}
                    {activeModal === 'upcoming' && `आगामी सोशल ऑडिट बैठकें (${metrics.upcomingCount} ग्राम पंचायतें)`}
                    {activeModal === 'pending' && `आज तक देय लंबित बैठकें (${metrics.duePendingCount} ग्राम पंचायतें)`}
                    {activeModal === 'nirnay' && `पंचायत निर्णय ऐप सत्यापित बैठकें (${metrics.nirnayCapturedCount} ग्राम पंचायतें)`}
                    {activeModal === 'mis' && `MIS पोर्टल पर फीडेड बैठकें (${metrics.misFedCount} ग्राम पंचायतें)`}
                    {activeModal === 'nsap' && `NSAP पेंशन डेटा रजिस्टर (${metrics.nsapRecordedCount} ग्राम पंचायतें / ${metrics.totalBeneficiaries} पेंशनर्स)`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  कट-ऑफ तिथि {formatDateHi(asOfDate)} के अनुसार वास्तविक शासकीय रिकॉर्ड
                </p>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
                title="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search & Filter Toolbar */}
            {activeModal !== 'nsap' && (
              <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="ग्राम पंचायत या BRP खोजें..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-slate-500 font-semibold text-[11px]">ब्लॉक:</span>
                  <button
                    onClick={() => setModalBlockFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                      modalBlockFilter === 'all'
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    सभी
                  </button>
                  <button
                    onClick={() => setModalBlockFilter('Baghpat')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                      modalBlockFilter === 'Baghpat'
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    बागपत
                  </button>
                  <button
                    onClick={() => setModalBlockFilter('Baraut')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                      modalBlockFilter === 'Baraut'
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    बड़ौत
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: Scrollable Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeModal === 'nsap' ? (
                /* NSAP Special List */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {(nsapRecords || []).map((gp) => {
                      const dec = (gp.beneficiaries || []).filter(b => b.category === 'deceased').length;
                      const inel = (gp.beneficiaries || []).filter(b => b.category === 'ineligible').length;
                      return (
                        <div key={gp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="font-bold text-slate-900 text-sm truncate">
                            {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            कुल पेंशनर: <strong className="text-slate-800">{gp.totalBeneficiaries}</strong>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            सत्यापित: <strong className="text-emerald-700">{gp.verifiedTotal}</strong>
                          </div>
                          <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-slate-200">
                            <span className="text-rose-700 font-bold">मृतक: {dec}</span>
                            <span className="text-amber-800 font-bold">अपात्र: {inel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* General Roster List */
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <th className="py-2.5 px-3">क्र०</th>
                      <th className="py-2.5 px-3">ग्राम पंचायत</th>
                      <th className="py-2.5 px-2">विकास खंड</th>
                      <th className="py-2.5 px-2">बैठक तिथि</th>
                      <th className="py-2.5 px-3">BRP / फोन</th>
                      <th className="py-2.5 px-2 text-right">स्थिति</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredModalRecords.map((r, i) => {
                      const isCompleted = r.meetingDate <= asOfDate || r.status === 'completed';
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{i + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600">
                            {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-700">
                            {formatDateHi(r.meetingDate)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{r.brpName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{r.brpPhone}</div>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {isCompleted ? 'सम्पन्न' : 'आगामी'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>प्रदर्शित रिकॉर्ड: {filteredModalRecords.length}</span>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
