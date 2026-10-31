'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { 
  NSAPGramPanchayatData, 
  NSAPBeneficiaryRecord, 
  NSAPBeneficiaryCategory,
  AuditBlock
} from '@/types/socialAudit';
import { 
  FileSpreadsheet, Users, CheckCircle2, AlertTriangle, Clock, 
  Search, Filter, Plus, Printer, Download, Sparkles, Building2, 
  ShieldCheck, ArrowRight, UserX, Skull, Home, Phone, Calendar,
  ChevronDown, ChevronUp, X, Check, Eye
} from 'lucide-react';

export default function NSAPDataTab() {
  const { 
    records, 
    nsapRecords, 
    asOfDate, 
    fontViewMode,
    addNsapRecord,
    updateNsapRecord,
    deleteNsapRecord,
    addNsapBeneficiary,
    deleteNsapBeneficiary
  } = useSocialAuditStore();

  // Active section view mode: 'completed' | 'pending' | 'report' | 'beneficiaries' | 'upcoming'
  const [activeSection, setActiveSection] = useState<'completed' | 'pending' | 'report' | 'beneficiaries' | 'upcoming'>('completed');
  const [recordedViewMode, setRecordedViewMode] = useState<'cards' | 'table'>('cards');

  // Pending Box filter states
  const [pendingScope, setPendingScope] = useState<'due' | 'all'>('due');
  const [pendingBlockFilter, setPendingBlockFilter] = useState<'all' | AuditBlock>('all');

  // Recorded GPs filter states
  const [gpBlockFilter, setGpBlockFilter] = useState<'all' | AuditBlock>('all');
  const [gpSearchQuery, setGpSearchQuery] = useState('');
  const [expandedGpId, setExpandedGpId] = useState<string | null>(null);

  // Beneficiary table filter states
  const [benCategoryFilter, setBenCategoryFilter] = useState<'all' | NSAPBeneficiaryCategory>('all');
  const [benGpFilter, setBenGpFilter] = useState<string>('all');
  const [benSearchQuery, setBenSearchQuery] = useState('');

  // Add / Edit Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGpForAdd, setSelectedGpForAdd] = useState<string>('');
  const [modalTotalBens, setModalTotalBens] = useState<number>(0);
  const [modalVerDirect, setModalVerDirect] = useState<number>(0);
  const [modalVerFamily, setModalVerFamily] = useState<number>(0);
  const [modalUnverCount, setModalUnverCount] = useState<number>(0);
  const [modalUnverReason, setModalUnverReason] = useState<string>('');
  
  // Single Beneficiary quick add modal state
  const [isBenModalOpen, setIsBenModalOpen] = useState(false);
  const [targetGpIdForBen, setTargetGpIdForBen] = useState<string>('');
  const [newBenName, setNewBenName] = useState('');
  const [newBenRegId, setNewBenRegId] = useState('');
  const [newBenCategory, setNewBenCategory] = useState<NSAPBeneficiaryCategory>('ineligible');
  const [newBenReason, setNewBenReason] = useState('लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं');
  const [newBenDeathDate, setNewBenDeathDate] = useState('');

  // Helper date formatter DD/MM/YYYY
  const formatDateHi = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  // Helper font renderer
  const renderText = (unicodeText: string, krutiText?: string) => {
    if (fontViewMode === 'krutidev' && krutiText) {
      return <span style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>{krutiText}</span>;
    }
    if (fontViewMode === 'dual' && krutiText) {
      return (
        <span className="flex flex-col">
          <span>{unicodeText}</span>
          <span className="text-[11px] text-emerald-300 font-mono" style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>
            {krutiText}
          </span>
        </span>
      );
    }
    return <span>{unicodeText}</span>;
  };

  // Baseline recorded Roster IDs (16 Gram Panchayats from Excel data)
  const baselineRecordedRosterIds = useMemo(() => new Set([
    'baghpat-1',  // अ0 शाहपुर पदडा (अहमदपुर शाहपुर पदडा)
    'baghpat-4',  // बाधू / बाघू
    'baghpat-5',  // बली
    'baghpat-8',  // बुढेड़ा / बुढेरा
    'baghpat-11', // धनाैंरा सिल्वर नगर / धनौरा सिल्वरनगर
    'baghpat-16', // फै. निनाना / फैजुल्लापुर निनाना
    'baghpat-17', // गाध़ी / गांधी
    'baghpat-19', // गौरीपुरजवाहरनगर
    'baghpat-20', // ग्वालीखेड़ा / ग्वालीखेड़ा
    'baraut-7',   // बावली
    'baraut-9',   // बड़का देवीगढ़ / बड़का
    'baraut-11',  // भूड़पुर / बुढपुर
    'baraut-12',  // बिजरोल / बिजरौल
    'baraut-13',  // बिराल
    'baraut-15',  // चौबाली / चौबली
    'baraut-16'   // ढिकाना
  ]), []);

  // Combined set of all recorded roster IDs (baseline + dynamically added records)
  const recordedRosterIdSet = useMemo(() => {
    const s = new Set(baselineRecordedRosterIds);
    nsapRecords.forEach(nr => {
      if (nr.rosterRecordId) {
        s.add(nr.rosterRecordId);
      }
    });
    return s;
  }, [baselineRecordedRosterIds, nsapRecords]);

  // All 47 NSAP Gram Panchayats from main roster
  const allNsapRosterRecords = useMemo(() => {
    return records.filter(r => r.hasNSAP);
  }, [records]);

  // Helper to check if a roster record is recorded / completed
  const isRecordCompleted = (rosterRec: (typeof records)[0]) => {
    if (recordedRosterIdSet.has(rosterRec.id)) return true;
    return nsapRecords.some(nr => 
      nr.rosterRecordId === rosterRec.id ||
      nr.gpNameUnicode.trim() === rosterRec.gpNameUnicode.trim()
    );
  };

  // 1. Completed / Recorded NSAP GPs (16 baseline)
  const completedNsapRosterGps = useMemo(() => {
    return allNsapRosterRecords.filter(r => isRecordCompleted(r));
  }, [allNsapRosterRecords, recordedRosterIdSet, nsapRecords]);

  // 2. Due Pending NSAP GPs: meetingDate <= asOfDate AND not yet recorded (7 GPs)
  const duePendingNsapGps = useMemo(() => {
    return allNsapRosterRecords.filter(r => {
      return !isRecordCompleted(r) && r.meetingDate <= asOfDate;
    }).sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [allNsapRosterRecords, recordedRosterIdSet, asOfDate, nsapRecords]);

  // 3. Upcoming NSAP GPs: meetingDate > asOfDate AND not yet recorded (24 GPs)
  const upcomingNsapGps = useMemo(() => {
    return allNsapRosterRecords.filter(r => {
      return !isRecordCompleted(r) && r.meetingDate > asOfDate;
    }).sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [allNsapRosterRecords, recordedRosterIdSet, asOfDate, nsapRecords]);

  // 4. All Pending NSAP GPs: not yet recorded (31 GPs)
  const allPendingNsapGps = useMemo(() => {
    return allNsapRosterRecords.filter(r => {
      return !isRecordCompleted(r);
    }).sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [allNsapRosterRecords, recordedRosterIdSet, nsapRecords]);

  // Filtered Pending GPs for the Action Box
  const filteredPendingBoxGps = useMemo(() => {
    const list = pendingScope === 'due' ? duePendingNsapGps : allPendingNsapGps;
    if (pendingBlockFilter === 'all') return list;
    return list.filter(r => r.block === pendingBlockFilter);
  }, [pendingScope, duePendingNsapGps, allPendingNsapGps, pendingBlockFilter]);

  // Filtered Upcoming GPs
  const filteredUpcomingGps = useMemo(() => {
    if (pendingBlockFilter === 'all') return upcomingNsapGps;
    return upcomingNsapGps.filter(r => r.block === pendingBlockFilter);
  }, [upcomingNsapGps, pendingBlockFilter]);

  // Aggregated Monthly Report Statistics (Points 1 to 9 from uploaded image)
  const monthlyReportStats = useMemo(() => {
    // 1. Point (क): कुल प्रस्तावित ग्राम पंचायतें (FY 2026-27)
    const point1_totalProposed = allNsapRosterRecords.length; // 47
    const baghpatProposed = allNsapRosterRecords.filter(r => r.block === 'Baghpat').length; // 24
    const barautProposed = allNsapRosterRecords.filter(r => r.block === 'Baraut').length; // 23

    // 2. Point (ख): कट-ऑफ तिथि तक कुल प्रस्तावित ग्राम पंचायतें (16 सम्पन्न + 7 लंबित = 23)
    const point2_proposedUpToDate = allNsapRosterRecords.filter(r => r.meetingDate <= asOfDate).length; // 23
    const baghpatProposedUpToDate = allNsapRosterRecords.filter(r => r.block === 'Baghpat' && r.meetingDate <= asOfDate).length; // 14
    const barautProposedUpToDate = allNsapRosterRecords.filter(r => r.block === 'Baraut' && r.meetingDate <= asOfDate).length; // 9

    // 3. Point (ग): माह तक सम्पन्न सोशल ऑडिट ग्राम पंचायतें
    const point3_recordedCount = nsapRecords.length; // 16
    const baghpatRecorded = nsapRecords.filter(r => r.block === 'Baghpat').length; // 9
    const barautRecorded = nsapRecords.filter(r => r.block === 'Baraut').length; // 7

    // Beneficiary totals from recorded GPs
    let point4_totalBeneficiaries = 0;
    let point5_verifiedDirect = 0;
    let point6_verifiedFamily = 0;
    let totalVerified = 0;
    let point7_ineligible = 0;
    let point8_deceased = 0;
    let totalUnverified = 0;
    let point9_financialIrregularity = 0;

    nsapRecords.forEach(gp => {
      point4_totalBeneficiaries += (gp.totalBeneficiaries || 0);
      point5_verifiedDirect += (gp.verifiedDirect || 0);
      point6_verifiedFamily += (gp.verifiedFamily || 0);
      totalVerified += (gp.verifiedTotal || ((gp.verifiedDirect || 0) + (gp.verifiedFamily || 0)));
      point9_financialIrregularity += (gp.financialIrregularityAmount || 0);

      // Count from individual beneficiaries list
      if (gp.beneficiaries && Array.isArray(gp.beneficiaries)) {
        point7_ineligible += gp.beneficiaries.filter(b => b.category === 'ineligible').length;
        point8_deceased += gp.beneficiaries.filter(b => b.category === 'deceased').length;
        totalUnverified += gp.beneficiaries.filter(b => b.category === 'unverified').length;
      }
    });

    return {
      point1_totalProposed,
      baghpatProposed,
      barautProposed,
      point2_proposedUpToDate,
      baghpatProposedUpToDate,
      barautProposedUpToDate,
      point3_recordedCount,
      baghpatRecorded,
      barautRecorded,
      point4_totalBeneficiaries,
      point5_verifiedDirect,
      point6_verifiedFamily,
      totalVerified,
      point7_ineligible,
      point8_deceased,
      totalUnverified,
      point9_financialIrregularity,
    };
  }, [allNsapRosterRecords, nsapRecords, asOfDate]);

  // All individual beneficiaries flat list
  const allBeneficiaries = useMemo(() => {
    const list: (NSAPBeneficiaryRecord & { gpNameUnicode: string; block: AuditBlock; gpId: string })[] = [];
    nsapRecords.forEach(gp => {
      if (gp.beneficiaries && Array.isArray(gp.beneficiaries)) {
        gp.beneficiaries.forEach(b => {
          list.push({
            ...b,
            gpNameUnicode: gp.gpNameUnicode,
            block: gp.block,
            gpId: gp.id
          });
        });
      }
    });
    return list;
  }, [nsapRecords]);

  // Filtered Beneficiaries List
  const filteredBeneficiaries = useMemo(() => {
    return allBeneficiaries.filter(b => {
      if (benCategoryFilter !== 'all' && b.category !== benCategoryFilter) return false;
      if (benGpFilter !== 'all' && b.gpNameUnicode !== benGpFilter) return false;
      if (benSearchQuery.trim()) {
        const q = benSearchQuery.toLowerCase();
        const nameU = (b.nameUnicode || '').toLowerCase();
        const nameK = (b.nameKrutiDev || '').toLowerCase();
        const reg = (b.registrationId || '').toLowerCase();
        const reason = (b.reason || '').toLowerCase();
        const gp = (b.gpNameUnicode || '').toLowerCase();
        if (!nameU.includes(q) && !nameK.includes(q) && !reg.includes(q) && !reason.includes(q) && !gp.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allBeneficiaries, benCategoryFilter, benGpFilter, benSearchQuery]);

  // Filtered Recorded GPs
  const filteredRecordedGps = useMemo(() => {
    return nsapRecords.filter(gp => {
      if (gpBlockFilter !== 'all' && gp.block !== gpBlockFilter) return false;
      if (gpSearchQuery.trim()) {
        const q = gpSearchQuery.toLowerCase();
        const nameU = (gp.gpNameUnicode || '').toLowerCase();
        const nameK = (gp.gpNameKrutiDev || '').toLowerCase();
        if (!nameU.includes(q) && !nameK.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => a.sno - b.sno);
  }, [nsapRecords, gpBlockFilter, gpSearchQuery]);

  // Handle open Add Record Modal for a pending GP
  const handleOpenAddForGp = (gpUnicodeName: string) => {
    setSelectedGpForAdd(gpUnicodeName);
    setModalTotalBens(100);
    setModalVerDirect(85);
    setModalVerFamily(10);
    setModalUnverCount(5);
    setModalUnverReason('घर पर ताला बंद मिला');
    setIsAddModalOpen(true);
  };

  // Submit Add GP Record
  const handleSaveGpRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGpForAdd) return;

    const rosterItem = allNsapRosterRecords.find(r => r.gpNameUnicode === selectedGpForAdd);
    const newRecord: NSAPGramPanchayatData = {
      id: `nsap-gp-${Date.now()}`,
      sno: nsapRecords.length + 1,
      rosterRecordId: rosterItem?.id,
      gpNameUnicode: selectedGpForAdd,
      gpNameKrutiDev: rosterItem?.gpNameKrutiDev || selectedGpForAdd,
      block: rosterItem?.block || 'Baghpat',
      meetingDate: rosterItem?.meetingDate || asOfDate,
      totalBeneficiaries: modalTotalBens,
      verifiedDirect: modalVerDirect,
      verifiedFamily: modalVerFamily,
      verifiedTotal: modalVerDirect + modalVerFamily,
      unverifiedCount: modalUnverCount,
      unverifiedReason: modalUnverReason,
      financialIrregularityAmount: 0,
      beneficiaries: [],
      recordedDate: asOfDate
    };

    addNsapRecord(newRecord);
    setIsAddModalOpen(false);
    setSelectedGpForAdd('');
  };

  // Submit Add Single Beneficiary
  const handleSaveSingleBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGpIdForBen || !newBenName || !newBenRegId) return;

    addNsapBeneficiary(targetGpIdForBen, {
      category: newBenCategory,
      categoryHindi: newBenCategory === 'ineligible' ? 'अपात्र लाभार्थी' : newBenCategory === 'deceased' ? 'सत्यापित में मृतक' : 'सत्यापन नहीं हो सका',
      nameUnicode: newBenName,
      registrationId: newBenRegId,
      reason: newBenReason,
      deathDate: newBenDeathDate
    });

    setIsBenModalOpen(false);
    setNewBenName('');
    setNewBenRegId('');
    setNewBenReason('लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं');
    setNewBenDeathDate('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['क्र०सं०', 'ब्लॉक', 'ग्राम पंचायत', 'लाभार्थी का नाम', 'पंजीकरण संख्या', 'श्रेणी', 'कारण / मृत्यु तिथि'];
    const rows = filteredBeneficiaries.map((b, idx) => [
      idx + 1,
      b.block === 'Baghpat' ? 'बागपत' : 'बड़ौत',
      `"${b.gpNameUnicode}"`,
      `"${b.nameUnicode}"`,
      `"${b.registrationId}"`,
      `"${b.categoryHindi}"`,
      `"${b.reason || b.deathDate || ''}"`
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NSAP_Beneficiaries_Baghpat_${asOfDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. OFFICIAL BANNER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                वृद्धावस्था पेंशन योजना • वित्तीय वर्ष 2026-2027
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                जनपद: बागपत (बागपत एवं बड़ौत)
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              राष्ट्रीय वृद्धावस्था पेंशन सोशल ऑडिट डेटा एवं मासिक प्रगति रिपोर्ट
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              निदेशालय द्वारा निर्धारित मासिक प्रगति प्रारूप के अनुसार लाभार्थियों का सत्यापन, अपात्रों एवं मृतकों का पंजीकरण-वार डेटा, एवं कट-ऑफ तिथि (<strong className="text-white">{formatDateHi(asOfDate)}</strong>) तक अवशेष/लंबित ग्राम पंचायतों की मॉनिटरिंग।
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => { setSelectedGpForAdd(''); setIsAddModalOpen(true); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 border border-emerald-400/30 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>नया NSAP डेटा जोड़ें</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>प्रिंट प्रारूप</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>एक्सपोर्ट CSV</span>
            </button>
          </div>
        </div>

        {/* Top 4 Interactive KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div 
            onClick={() => setActiveSection('completed')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 shadow-lg group select-none ${
              activeSection === 'completed' 
                ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50' 
                : 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-400/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
              <span>सम्पन्न (डेटा रिकॉर्डेड)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {nsapRecords.length} <span className="text-xs font-normal text-slate-400">/ 47</span>
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium">
              बागपत: {monthlyReportStats.baghpatRecorded} • बड़ौत: {monthlyReportStats.barautRecorded}
            </div>
          </div>

          <div 
            onClick={() => setActiveSection('pending')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 shadow-lg group select-none ${
              activeSection === 'pending' 
                ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/50' 
                : 'bg-amber-950/30 border-amber-500/30 hover:border-amber-400/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
              <span>आज तक लंबित (Due)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {duePendingNsapGps.length} <span className="text-xs font-normal text-slate-400">पंचायतें</span>
            </div>
            <div className="text-[11px] text-amber-400/90 font-medium">
              कट-ऑफ {formatDateHi(asOfDate)} तक बैठक सम्पन्न
            </div>
          </div>

          <div 
            onClick={() => setActiveSection('upcoming')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 shadow-lg group select-none ${
              activeSection === 'upcoming' 
                ? 'bg-blue-950/80 border-blue-400 ring-2 ring-blue-500/50' 
                : 'bg-blue-950/30 border-blue-500/30 hover:border-blue-400/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-300 font-bold">
              <span>आगामी प्रस्तावित</span>
              <Clock className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {upcomingNsapGps.length} <span className="text-xs font-normal text-slate-400">पंचायतें</span>
            </div>
            <div className="text-[11px] text-blue-300/90 font-medium">
              नवम्बर एवं दिसम्बर 2026 में बैठक
            </div>
          </div>

          <div 
            onClick={() => setActiveSection('report')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 shadow-lg group select-none ${
              activeSection === 'report' 
                ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-500/50' 
                : 'bg-purple-950/30 border-purple-500/30 hover:border-purple-400/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
              <span>कुल NSAP योजना</span>
              <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              47 <span className="text-xs font-normal text-slate-400">पंचायतें</span>
            </div>
            <div className="text-[11px] text-purple-300/90 font-medium">
              बागपत: 24 • बड़ौत: 23
            </div>
          </div>
        </div>

        {/* Section Navigation Pills */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          {/* Tab 1: सम्पन्न ग्राम पंचायतें */}
          <button
            onClick={() => setActiveSection('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'completed'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-2 ring-emerald-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>1. सम्पन्न ग्राम पंचायतें ({nsapRecords.length})</span>
          </button>

          {/* Tab 2: आज तक लंबित */}
          <button
            onClick={() => setActiveSection('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>2. आज तक लंबित ({duePendingNsapGps.length})</span>
          </button>

          {/* Tab 3: मासिक प्रगति रिपोर्ट प्रारूप */}
          <button
            onClick={() => setActiveSection('report')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'report'
                ? 'bg-blue-600 text-white shadow-md font-black ring-2 ring-blue-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-300" />
            <span>3. मासिक प्रगति रिपोर्ट (प्रारूप 1 से 9)</span>
          </button>

          {/* Tab 4: लाभार्थी सूची */}
          <button
            onClick={() => setActiveSection('beneficiaries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'beneficiaries'
                ? 'bg-purple-600 text-white shadow-md font-black ring-2 ring-purple-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-purple-300" />
            <span>4. अपात्र / मृतक लाभार्थी ({allBeneficiaries.length})</span>
          </button>

          {/* Tab 5: आगामी ग्राम पंचायतें */}
          <button
            onClick={() => setActiveSection('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'upcoming'
                ? 'bg-teal-600 text-white shadow-md font-black ring-2 ring-teal-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-300" />
            <span>5. आगामी ग्राम पंचायतें ({upcomingNsapGps.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: RECORDED / COMPLETED GRAM PANCHAYATS (16 GPs) */}
      {/* ========================================================================= */}
      {(activeSection === 'completed') && (
        <div className="rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  सम्पन्न (डेटा रिकॉर्डेड)
                </span>
                <h3 className="text-lg md:text-xl font-black text-white">
                  सम्पन्न ग्राम पंचायतें • पेंशन ऑडिट डेटा रिकॉर्डेड ({filteredRecordedGps.length})
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                इन 16 ग्राम पंचायतों का राष्ट्रीय वृद्धावस्था पेंशन सोशल ऑडिट डेटा निदेशालय प्रारूप एवं लाभार्थी विवरण सहित पूर्णतः रिकॉर्डेड है।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setRecordedViewMode('cards')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    recordedViewMode === 'cards' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  कार्ड दृश्य (Cards)
                </button>
                <button
                  onClick={() => setRecordedViewMode('table')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    recordedViewMode === 'table' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  तालिका दृश्य (Table)
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={gpSearchQuery}
                  onChange={(e) => setGpSearchQuery(e.target.value)}
                  placeholder="पंचायत सर्च करें..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Block Filter */}
              <select
                value={gpBlockFilter}
                onChange={(e) => setGpBlockFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="all">सभी ब्लॉक ({nsapRecords.length})</option>
                <option value="Baghpat">विकास खण्ड बागपत ({nsapRecords.filter(r => r.block === 'Baghpat').length})</option>
                <option value="Baraut">विकास खण्ड बड़ौत ({nsapRecords.filter(r => r.block === 'Baraut').length})</option>
              </select>

              <button
                onClick={() => { setSelectedGpForAdd(''); setIsAddModalOpen(true); }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>नया डेटा जोड़ें</span>
              </button>
            </div>
          </div>

          {/* Cards Grid View */}
          {recordedViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredRecordedGps.map(gp => {
                const inelCount = gp.beneficiaries.filter(b => b.category === 'ineligible').length;
                const decCount = gp.beneficiaries.filter(b => b.category === 'deceased').length;

                return (
                  <div
                    key={gp.id}
                    className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 hover:border-emerald-400 transition-all space-y-3 shadow-lg group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            SR# {gp.sno}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            gp.block === 'Baghpat' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                          </span>
                        </div>
                        <div className="text-base font-black text-white pt-1">
                          {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                        </div>
                      </div>

                      <span className="text-[10px] font-black px-2.5 py-1 rounded-xl border text-emerald-300 bg-emerald-950/80 border-emerald-600/50 flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>सम्पन्न</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>बैठक संपन्न तिथि:</span>
                      <strong className="text-white font-mono">{formatDateHi(gp.meetingDate)}</strong>
                    </div>

                    {/* 4 Stat Boxes */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">कुल पेंशनर</div>
                        <div className="text-sm font-black text-white font-mono">{gp.totalBeneficiaries}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-teal-950/40 border border-teal-800/40">
                        <div className="text-[10px] text-teal-300">सत्यापित</div>
                        <div className="text-sm font-black text-teal-300 font-mono">{gp.verifiedTotal}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40">
                        <div className="text-[10px] text-amber-300">अपात्र</div>
                        <div className="text-sm font-black text-amber-300 font-mono">{inelCount}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/40">
                        <div className="text-[10px] text-rose-300">मृतक</div>
                        <div className="text-sm font-black text-rose-300 font-mono">{decCount}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setBenGpFilter(gp.gpNameUnicode);
                          setActiveSection('beneficiaries');
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>लाभार्थी विवरण ({gp.beneficiaries.length})</span>
                      </button>

                      <button
                        onClick={() => {
                          setTargetGpIdForBen(gp.id);
                          setIsBenModalOpen(true);
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                        title="नया लाभार्थी जोड़ें"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>जोड़ें</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Master GP Table View */}
          {recordedViewMode === 'table' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center">क्र०सं०</th>
                    <th className="py-3 px-3">ब्लॉक</th>
                    <th className="py-3 px-4">ग्राम पंचायत</th>
                    <th className="py-3 px-3 text-center">बैठक तिथि</th>
                    <th className="py-3 px-3 text-center">कुल लाभार्थी</th>
                    <th className="py-3 px-3 text-center">प्रत्यक्ष सत्यापित</th>
                    <th className="py-3 px-3 text-center">परिवार से</th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-300">कुल सत्यापित</th>
                    <th className="py-3 px-3 text-center font-bold text-amber-300">अपात्र</th>
                    <th className="py-3 px-3 text-center font-bold text-rose-300">मृतक</th>
                    <th className="py-3 px-3 text-center">असत्यापित</th>
                    <th className="py-3 px-4 text-center">एक्शन</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredRecordedGps.map(gp => {
                    const inelCount = gp.beneficiaries.filter(b => b.category === 'ineligible').length;
                    const decCount = gp.beneficiaries.filter(b => b.category === 'deceased').length;
                    const unverCount = gp.beneficiaries.filter(b => b.category === 'unverified').length;
                    const isExpanded = expandedGpId === gp.id;

                    return (
                      <React.Fragment key={gp.id}>
                        <tr className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">{gp.sno}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              gp.block === 'Baghpat' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}>
                              {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-white text-sm">
                            {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-300">{formatDateHi(gp.meetingDate)}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-white">{gp.totalBeneficiaries}</td>
                          <td className="py-3 px-3 text-center font-mono text-teal-300">{gp.verifiedDirect || '—'}</td>
                          <td className="py-3 px-3 text-center font-mono text-indigo-300">{gp.verifiedFamily || '—'}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-300">{gp.verifiedTotal}</td>
                          <td className="py-3 px-3 text-center">
                            {inelCount > 0 ? (
                              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                                {inelCount}
                              </span>
                            ) : <span className="text-slate-500">0</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {decCount > 0 ? (
                              <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                                {decCount}
                              </span>
                            ) : <span className="text-slate-500">0</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{unverCount || gp.unverifiedCount || 0}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setExpandedGpId(isExpanded ? null : gp.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                                title="लाभार्थी विवरण देखें"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isExpanded ? 'छुपाएं' : `सूची (${gp.beneficiaries.length})`}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setTargetGpIdForBen(gp.id);
                                  setIsBenModalOpen(true);
                                }}
                                className="p-1 rounded-lg bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-700/50"
                                title="इस पंचायत में लाभार्थी जोड़ें"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Beneficiaries Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={12} className="p-4 bg-slate-950/90 border-y border-emerald-500/30">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                                    <span>{gp.gpNameUnicode} • कुल {gp.beneficiaries.length} दर्ज लाभार्थी (अपात्र, मृतक एवं असत्यापित)</span>
                                  </h4>
                                  <button
                                    onClick={() => {
                                      setTargetGpIdForBen(gp.id);
                                      setIsBenModalOpen(true);
                                    }}
                                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>लाभार्थी जोड़ें</span>
                                  </button>
                                </div>

                                {gp.beneficiaries.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {gp.beneficiaries.map(b => (
                                      <div
                                        key={b.id}
                                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                          b.category === 'ineligible' 
                                            ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' 
                                            : b.category === 'deceased'
                                            ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                                            : 'bg-slate-900 border-slate-800 text-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-white text-sm">
                                            {renderText(b.nameUnicode, b.nameKrutiDev)}
                                          </span>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            b.category === 'ineligible' ? 'bg-amber-500/20 text-amber-300' : b.category === 'deceased' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                                          }`}>
                                            {b.categoryHindi}
                                          </span>
                                        </div>
                                        <div className="font-mono text-[11px] text-slate-400">
                                          पंजीकरण: <strong className="text-slate-200">{b.registrationId}</strong>
                                        </div>
                                        {b.reason && (
                                          <div className="text-[11px] text-amber-300/90 italic">
                                            कारण: {b.reason}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400 italic">
                                    इस ग्राम पंचायत में सभी लाभार्थी सत्यापित पाए गए (कोई अपात्र अथवा मृतक दर्ज नहीं)।
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DEDICATED "आज तक लंबित पुष्टि बॉक्स" (PENDING ACTION BOX) */}
      {/* ========================================================================= */}
      {activeSection === 'pending' && (
        <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 p-6 shadow-2xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-xl font-black text-white">
                    आज तक लंबित NSAP ग्राम पंचायतें (Pending Action Box)
                  </h3>
                  <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                    {filteredPendingBoxGps.length} लंबित
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {pendingScope === 'due'
                    ? `कट-ऑफ तिथि (${formatDateHi(asOfDate)}) तक जिन ${duePendingNsapGps.length} NSAP ग्राम पंचायतों की बैठक संपन्न हो चुकी है परंतु डेटा अभी एक्सेल/पोर्टल से दर्ज होना शेष है।`
                    : 'समस्त ग्राम पंचायतें जिनका NSAP सोशल ऑडिट डेटा अभी दर्ज नहीं हुआ है।'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Scope toggle */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setPendingScope('due')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    pendingScope === 'due' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  आज तक लंबित ({duePendingNsapGps.length})
                </button>
                <button
                  onClick={() => setPendingScope('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    pendingScope === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  समस्त लंबित ({allPendingNsapGps.length})
                </button>
              </div>

              {/* Block filter */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setPendingBlockFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  सभी ({pendingScope === 'due' ? duePendingNsapGps.length : allPendingNsapGps.length})
                </button>
                <button
                  onClick={() => setPendingBlockFilter('Baghpat')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'Baghpat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  बागपत ({pendingScope === 'due' ? duePendingNsapGps.filter(r => r.block === 'Baghpat').length : allPendingNsapGps.filter(r => r.block === 'Baghpat').length})
                </button>
                <button
                  onClick={() => setPendingBlockFilter('Baraut')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'Baraut' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  बड़ौत ({pendingScope === 'due' ? duePendingNsapGps.filter(r => r.block === 'Baraut').length : allPendingNsapGps.filter(r => r.block === 'Baraut').length})
                </button>
              </div>
            </div>
          </div>

          {/* Cards of Pending GPs */}
          {filteredPendingBoxGps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPendingBoxGps.map(r => {
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 hover:border-amber-400 transition-all space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            SR# {r.sno}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            NSAP पेंशन
                          </span>
                        </div>
                        <div className="text-base font-black text-white pt-1">
                          {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2 py-1 rounded-xl border text-amber-400 bg-amber-950/80 border-amber-700/50 flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>लंबित</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1.5 pt-1 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span>बैठक संपन्न तिथि:</span>
                        <strong className="text-white font-mono">{formatDateHi(r.meetingDate)}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>BRP:</span>
                        <span className="text-slate-300">{r.brpName} ({r.brpPhone})</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleOpenAddForGp(r.gpNameUnicode)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>डेटा दर्ज करें (Record NSAP Data)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">
                शाबाश! इस फ़िल्टर में कोई भी NSAP ग्राम पंचायत लंबित नहीं है।
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                सभी लक्षित पंचायतों का डेटा सिस्टम में सुरक्षित रूप से दर्ज है।
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: OFFICIAL MONTHLY PROGRESS REPORT (IMAGE FORMAT - BINDU 1 TO 9) */}
      {/* ========================================================================= */}
      {activeSection === 'report' && (
        <div className="rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  प्रारूप - क
                </span>
                <h2 className="text-lg md:text-xl font-black text-white">
                  राष्ट्रीय वृद्धावस्था पेंशन योजनान्तर्गत माह अक्टूबर तक सोशल ऑडिट की मासिक प्रगति रिपोर्ट हेतु प्रारूप
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                आधिकारिक निदेशालय प्रारूप के अनुरूप बिंदुवार सारांश (कट-ऑफ तिथि: {formatDateHi(asOfDate)})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                कुल रिकॉर्डेड: <strong className="text-emerald-400">{monthlyReportStats.point3_recordedCount}</strong> / {monthlyReportStats.point1_totalProposed}
              </span>
            </div>
          </div>

          {/* Official Format Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">क्र०सं०</th>
                  <th className="py-3.5 px-6">राष्ट्रीय वृद्धावस्था पेंशन योजनान्तर्गत सोशल ऑडिट का विवरण</th>
                  <th className="py-3.5 px-4 text-center">विकास खण्ड - बागपत</th>
                  <th className="py-3.5 px-4 text-center">विकास खण्ड - बड़ौत</th>
                  <th className="py-3.5 px-6 text-center bg-emerald-950/30 text-emerald-300 font-black">जनपद कुल योग</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium">
                {/* Point 1 (क) */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400 font-mono">1 (क)</td>
                  <td className="py-3.5 px-6 text-white font-semibold">
                    वित्तीय वर्ष 2026-27 में राष्ट्रीय वृद्धावस्था पेंशन योजनान्तर्गत कुल प्रस्तावित ग्राम पंचायतों की संख्या
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-200">{monthlyReportStats.baghpatProposed}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-200">{monthlyReportStats.barautProposed}</td>
                  <td className="py-3.5 px-6 text-center font-black text-emerald-300 bg-emerald-950/20 text-base">
                    {monthlyReportStats.point1_totalProposed}
                  </td>
                </tr>

                {/* Point 2 (ख) */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-slate-950/40">
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400 font-mono">2 (ख)</td>
                  <td className="py-3.5 px-6 text-slate-200 font-semibold">
                    माह अक्टूबर तक कुल प्रस्तावित ग्राम पंचायतों की संख्या
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-300">{monthlyReportStats.baghpatProposedUpToDate}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-300">{monthlyReportStats.barautProposedUpToDate}</td>
                  <td className="py-3.5 px-6 text-center font-black text-emerald-300 bg-emerald-950/20 text-base">
                    {monthlyReportStats.point2_proposedUpToDate}
                  </td>
                </tr>

                {/* Point 3 (ग) */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/10">
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400 font-mono">3 (ग)</td>
                  <td className="py-3.5 px-6 text-emerald-200 font-bold flex items-center justify-between">
                    <span>माह तक सम्पन्न सोशल ऑडिट ग्राम पंचायतों की संख्या (डेटा रिकॉर्डेड)</span>
                    <button
                      onClick={() => setActiveSection('completed')}
                      className="text-[11px] text-emerald-400 hover:text-white bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/40"
                    >
                      विवरण देखें →
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-300">{monthlyReportStats.baghpatRecorded}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-300">{monthlyReportStats.barautRecorded}</td>
                  <td className="py-3.5 px-6 text-center font-black text-emerald-300 bg-emerald-950/30 text-base">
                    {monthlyReportStats.point3_recordedCount}
                  </td>
                </tr>

                {/* Point 4 (घ) */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400 font-mono">4 (घ)</td>
                  <td className="py-3.5 px-6 text-white font-semibold">
                    सम्पन्न ग्राम पंचायतों में कुल पेंशन लाभार्थियों की संख्या
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-200">1,219</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-200">1,015</td>
                  <td className="py-3.5 px-6 text-center font-black text-white bg-slate-950/60 text-base">
                    {monthlyReportStats.point4_totalBeneficiaries.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* Point 5 (ङ) */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-teal-950/15">
                  <td className="py-3.5 px-4 text-center font-bold text-teal-400 font-mono">5 (ङ)</td>
                  <td className="py-3.5 px-6 text-teal-200 font-semibold">
                    सत्यापित पेंशन लाभार्थियों की संख्या जिनसे मुलाकात हुई (प्रत्यक्ष रूप से)
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-teal-300">1,010</td>
                  <td className="py-3.5 px-4 text-center font-bold text-teal-300">480</td>
                  <td className="py-3.5 px-6 text-center font-black text-teal-300 bg-teal-950/30 text-base">
                    {monthlyReportStats.point5_verifiedDirect.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* Point 6 (च) */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-indigo-950/15">
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-400 font-mono">6 (च)</td>
                  <td className="py-3.5 px-6 text-indigo-200 font-semibold">
                    पेंशन लाभार्थी के उपलब्ध न होने पर पारिवारिक सदस्यों के माध्यम से सत्यापन की संख्या
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-300">193</td>
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-300">139</td>
                  <td className="py-3.5 px-6 text-center font-black text-indigo-300 bg-indigo-950/30 text-base">
                    {monthlyReportStats.point6_verifiedFamily.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* Point 7 (छ) */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-amber-950/20">
                  <td className="py-3.5 px-4 text-center font-bold text-amber-400 font-mono">7 (छ)</td>
                  <td className="py-3.5 px-6 text-amber-200 font-bold flex items-center justify-between">
                    <span>अपात्र लाभार्थियों की संख्या (विस्तृत कारण एवं पंजीकरण संख्या सहित दर्ज)</span>
                    <button
                      onClick={() => { setBenCategoryFilter('ineligible'); setActiveSection('beneficiaries'); }}
                      className="text-[11px] text-amber-400 hover:text-white bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40"
                    >
                      सूची देखें →
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-amber-300">
                    <span className="bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      49 अपात्र
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-amber-300">
                    <span className="bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      5 अपात्र
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-black text-amber-300 bg-amber-950/40 text-base">
                    <span className="bg-amber-500/30 px-3 py-1 rounded-lg border border-amber-500/50">
                      {monthlyReportStats.point7_ineligible} अपात्र
                    </span>
                  </td>
                </tr>

                {/* Point 8 (ज) */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-rose-950/20">
                  <td className="py-3.5 px-4 text-center font-bold text-rose-400 font-mono">8 (ज)</td>
                  <td className="py-3.5 px-6 text-rose-200 font-bold flex items-center justify-between">
                    <span>सत्यापित लाभार्थियों में मृतक की संख्या (मृत्यु विवरण दर्ज)</span>
                    <button
                      onClick={() => { setBenCategoryFilter('deceased'); setActiveSection('beneficiaries'); }}
                      className="text-[11px] text-rose-400 hover:text-white bg-rose-950/80 px-2 py-0.5 rounded border border-rose-600/40"
                    >
                      सूची देखें →
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-rose-300">
                    <span className="bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30">
                      119 मृतक
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-rose-300">
                    <span className="bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30">
                      75 मृतक
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-black text-rose-300 bg-rose-950/40 text-base">
                    <span className="bg-rose-500/30 px-3 py-1 rounded-lg border border-rose-500/50">
                      {monthlyReportStats.point8_deceased} मृतक
                    </span>
                  </td>
                </tr>

                {/* Point 9 (झ) */}
                <tr className="hover:bg-slate-800/30 transition-colors bg-slate-950">
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400 font-mono">9 (झ)</td>
                  <td className="py-3.5 px-6 text-slate-200 font-semibold">
                    वित्तीय अनियमितता की धनराशि (₹ में)
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">₹ 0.00</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">₹ 0.00</td>
                  <td className="py-3.5 px-6 text-center font-mono font-black text-emerald-400 bg-emerald-950/30 text-base">
                    ₹ {monthlyReportStats.point9_financialIrregularity.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: FULL BENEFICIARIES TABLE (FILTER & SEARCH) */}
      {/* ========================================================================= */}
      {activeSection === 'beneficiaries' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>समस्त चिन्हित लाभार्थी सूची (अपात्र, मृतक एवं असत्यापित)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                कुल {filteredBeneficiaries.length} लाभार्थी प्रदर्शित (नाम, पंजीकरण संख्या एवं कारण सहित)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={benSearchQuery}
                  onChange={(e) => setBenSearchQuery(e.target.value)}
                  placeholder="सर्च करें (नाम / ID / कारण)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={benCategoryFilter}
                onChange={(e) => setBenCategoryFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="all">सभी श्रेणियां ({allBeneficiaries.length})</option>
                <option value="ineligible">⚠️ अपात्र लाभार्थी ({monthlyReportStats.point7_ineligible})</option>
                <option value="deceased">☠️ मृतक लाभार्थी ({monthlyReportStats.point8_deceased})</option>
                <option value="unverified">🔒 असत्यापित / ताला बंद ({monthlyReportStats.totalUnverified})</option>
              </select>

              {/* GP Filter */}
              <select
                value={benGpFilter}
                onChange={(e) => setBenGpFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="all">सभी ग्राम पंचायतें ({nsapRecords.length})</option>
                {nsapRecords.map(gp => (
                  <option key={gp.id} value={gp.gpNameUnicode}>
                    {gp.gpNameUnicode} ({gp.beneficiaries.length})
                  </option>
                ))}
              </select>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                title="CSV डाउनलोड करें"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Beneficiary Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center">क्र०सं०</th>
                  <th className="py-3 px-3">ब्लॉक</th>
                  <th className="py-3 px-4">ग्राम पंचायत</th>
                  <th className="py-3 px-4">लाभार्थी का नाम</th>
                  <th className="py-3 px-4 font-mono">पंजीकरण संख्या</th>
                  <th className="py-3 px-3 text-center">श्रेणी</th>
                  <th className="py-3 px-4">अपात्रता / मृत्यु का कारण</th>
                  <th className="py-3 px-3 text-center">एक्शन</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredBeneficiaries.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.block === 'Baghpat' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {b.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white text-xs">{b.gpNameUnicode}</td>
                    <td className="py-3 px-4 font-bold text-emerald-300 text-sm">
                      {renderText(b.nameUnicode, b.nameKrutiDev)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 font-semibold">{b.registrationId}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.category === 'ineligible'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : b.category === 'deceased'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {b.categoryHindi}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px] leading-relaxed">
                      {b.reason || b.deathDate || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => deleteNsapBeneficiary(b.gpId, b.id)}
                        className="text-[11px] text-rose-400 hover:text-white px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/40"
                      >
                        हटाएं
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: UPCOMING NSAP GRAM PANCHAYATS (24 GPs) */}
      {/* ========================================================================= */}
      {activeSection === 'upcoming' && (
        <div className="rounded-3xl bg-slate-900/90 border border-blue-500/30 p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  आगामी प्रस्तावित
                </span>
                <h3 className="text-lg md:text-xl font-black text-white">
                  आगामी ग्राम पंचायतें ({filteredUpcomingGps.length}) • नवम्बर-दिसम्बर 2026
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                इन 24 ग्राम पंचायतों की राष्ट्रीय वृद्धावस्था पेंशन सोशल ऑडिट बैठकें आगामी तिथियों में प्रस्तावित हैं।
              </p>
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPendingBlockFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                सभी ({upcomingNsapGps.length})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baghpat')}
                className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'Baghpat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                बागपत ({upcomingNsapGps.filter(r => r.block === 'Baghpat').length})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baraut')}
                className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'Baraut' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                बड़ौत ({upcomingNsapGps.filter(r => r.block === 'Baraut').length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredUpcomingGps.map(r => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        SR# {r.sno}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.block === 'Baghpat' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                    </div>
                    <div className="text-base font-black text-white pt-1">
                      {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl border text-blue-300 bg-blue-950/80 border-blue-700/50 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3" />
                    <span>आगामी</span>
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1.5 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span>प्रस्तावित बैठक तिथि:</span>
                    <strong className="text-blue-300 font-mono font-bold">{formatDateHi(r.meetingDate)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>BRP:</span>
                    <span className="text-slate-300">{r.brpName} ({r.brpPhone})</span>
                  </div>
                  {r.venueUnicode && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span>स्थान:</span>
                      <span className="text-slate-400 truncate max-w-[180px]">{r.venueUnicode}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: ADD / UPDATE NSAP GP DATA */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <Plus className="w-5 h-5" />
                <span>नया NSAP ग्राम पंचायत डेटा दर्ज करें</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGpRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ग्राम पंचायत चुनें (47 NSAP में से):</label>
                <select
                  value={selectedGpForAdd}
                  onChange={(e) => setSelectedGpForAdd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- ग्राम पंचायत चुनें --</option>
                  {allNsapRosterRecords.map(r => (
                    <option key={r.id} value={r.gpNameUnicode}>
                      {r.gpNameUnicode} ({r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'} - {formatDateHi(r.meetingDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">कुल पेंशन लाभार्थी:</label>
                  <input
                    type="number"
                    value={modalTotalBens}
                    onChange={(e) => setModalTotalBens(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">प्रत्यक्ष सत्यापित:</label>
                  <input
                    type="number"
                    value={modalVerDirect}
                    onChange={(e) => setModalVerDirect(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">परिवार के माध्यम से:</label>
                  <input
                    type="number"
                    value={modalVerFamily}
                    onChange={(e) => setModalVerFamily(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">असत्यापित संख्या:</label>
                  <input
                    type="number"
                    value={modalUnverCount}
                    onChange={(e) => setModalUnverCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">असत्यापित का कारण:</label>
                  <input
                    type="text"
                    value={modalUnverReason}
                    onChange={(e) => setModalUnverReason(e.target.value)}
                    placeholder="उदा० घर पर ताला बंद मिला"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  डेटा सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: ADD BENEFICIARY TO GP */}
      {/* ========================================================================= */}
      {isBenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <Plus className="w-5 h-5" />
                <span>लाभार्थी जोड़ें (कारण सहित)</span>
              </div>
              <button
                onClick={() => setIsBenModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSingleBeneficiary} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">लाभार्थी का नाम:</label>
                <input
                  type="text"
                  value={newBenName}
                  onChange={(e) => setNewBenName(e.target.value)}
                  placeholder="उदा० अनीता शर्मा"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">पंजीकरण संख्या (Registration ID):</label>
                <input
                  type="text"
                  value={newBenRegId}
                  onChange={(e) => setNewBenRegId(e.target.value)}
                  placeholder="उदा० 316510599211"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">श्रेणी:</label>
                  <select
                    value={newBenCategory}
                    onChange={(e) => setNewBenCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ineligible">अपात्र लाभार्थी</option>
                    <option value="deceased">सत्यापित में मृतक</option>
                    <option value="unverified">असत्यापित / ताला बंद</option>
                  </select>
                </div>

                {newBenCategory === 'deceased' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">मृत्यु तिथि (यदि ज्ञात हो):</label>
                    <input
                      type="date"
                      value={newBenDeathDate}
                      onChange={(e) => setNewBenDeathDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">कारण (Reason):</label>
                <input
                  type="text"
                  value={newBenReason}
                  onChange={(e) => setNewBenReason(e.target.value)}
                  placeholder="उदा० एक से अधिक पेंशन प्राप्त कर रहे हैं / गाँव से बाहर"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBenModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  लाभार्थी जोड़ें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
