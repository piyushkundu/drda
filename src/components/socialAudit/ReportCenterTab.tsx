'use client';

import React, { useState, useMemo } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { 
  FileText, Download, Printer, Filter, Building2, Calendar, 
  Users, CheckCircle2, Clock, AlertTriangle, FileSpreadsheet,
  Smartphone, ShieldCheck, ChevronRight, RefreshCw, Layers,
  Search, ArrowUpDown, Info
} from 'lucide-react';
import { SocialAuditRecord, AuditBlock, ReportType, AuditStatus } from '@/types/socialAudit';
import { exportCalendarExcel } from '@/lib/exportSocialAuditExcel';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function ReportCenterTab() {
  const { 
    records, 
    nsapRecords, 
    asOfDate, 
    selectedBRP, 
    fontViewMode,
    openGPProfile
  } = useSocialAuditStore();

  const [selectedReport, setSelectedReport] = useState<ReportType>('district_summary');
  const [filterBlock, setFilterBlock] = useState<'all' | AuditBlock>('all');
  const [filterBRP, setFilterBRP] = useState<string>('all');
  const [filterScheme, setFilterScheme] = useState<'all' | 'nsap' | 'mgnrega' | 'pmayg'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'upcoming' | 'amended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Extract unique BRPs
  const brpList = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(r => {
      if (r.brpName && r.brpPhone) {
        map.set(r.brpPhone, r.brpName);
      }
    });
    return Array.from(map.entries()).map(([phone, name]) => ({ phone, name }));
  }, [records]);

  // Filtered records for reports
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterBlock !== 'all' && r.block !== filterBlock) return false;
      if (filterBRP !== 'all' && r.brpPhone !== filterBRP && !r.brpName?.includes(filterBRP)) return false;
      if (filterScheme === 'nsap' && !r.hasNSAP) return false;
      if (filterScheme === 'mgnrega' && !r.hasMGNREGA) return false;
      if (filterScheme === 'pmayg' && !r.hasPMAYG) return false;

      const isCompleted = r.status === 'completed' || 
        (r.meetingDate <= asOfDate && (!r.isAmended || r.gpNameUnicode?.includes('खेड़की') || r.gpNameUnicode?.includes('खड़की')));
      
      if (filterStatus === 'completed' && !isCompleted) return false;
      if (filterStatus === 'upcoming' && (isCompleted || r.meetingDate <= asOfDate)) return false;
      if (filterStatus === 'amended' && !r.isAmended) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesGP = r.gpNameUnicode?.toLowerCase().includes(q) || r.gpNameKrutiDev?.toLowerCase().includes(q);
        const matchesBRP = r.brpName?.toLowerCase().includes(q) || r.brpPhone?.includes(q);
        if (!matchesGP && !matchesBRP) return false;
      }

      return true;
    });
  }, [records, filterBlock, filterBRP, filterScheme, filterStatus, searchQuery, asOfDate]);

  const formatDateHi = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dStr;
    }
  };

  const renderText = (unicode: string, kruti: string) => {
    if (fontViewMode === 'krutidev') return <span className="font-kruti">{kruti || unicode}</span>;
    return <span>{unicode}</span>;
  };

  // Report Definitions
  const REPORTS: { id: ReportType; title: string; category: string; description: string; count: number }[] = [
    {
      id: 'district_summary',
      title: 'जनपद सारांश रिपोर्ट (District Summary)',
      category: 'कार्यकारी रिपोर्ट',
      description: 'जनपद बागपत की कुल 88 ग्राम पंचायतों, बैठक स्थिति, निर्णय, MIS एवं NSAP का समग्र सारांश।',
      count: 88
    },
    {
      id: 'block_wise',
      title: 'विकास खंड-वार तुलनात्मक रिपोर्ट (Block-wise)',
      category: 'प्रशासनिक रिपोर्ट',
      description: 'विकास खण्ड बागपत (44 GP) बनाम बड़ौत (44 GP) की सोशल ऑडिट प्रगति का तुलनात्मक विवरण।',
      count: 2
    },
    {
      id: 'gp_master',
      title: 'ग्राम पंचायत मास्टर रजिस्टर (GP Master Register)',
      category: 'विस्तृत पंजिका',
      description: 'सभी 88 ग्राम पंचायतों का सम्पूर्ण विवरण—बैठक तिथि, BRP, पर्यवेक्षक, योजनाएं एवं MIS स्थिति।',
      count: filteredRecords.length
    },
    {
      id: 'brp_wise',
      title: 'बी०आर०पी०-वार कार्य प्रगति रिपोर्ट (BRP Performance)',
      category: 'अधिकारी प्रगति',
      description: 'प्रत्येक बी०आर०पी० को आवंटित ग्राम पंचायतें, सम्पन्न बैठकें, निर्णय अपलोड एवं MIS फीडिंग स्थिति।',
      count: brpList.length
    },
    {
      id: 'meeting_progress',
      title: 'सोशल ऑडिट बैठक प्रगति रिपोर्ट (Meeting Progress)',
      category: 'रोस्टर रिपोर्ट',
      description: 'सम्पन्न, आगामी, संशोधित एवं लम्बित बैठकों की तिथि-वार पूर्ण सूची।',
      count: filteredRecords.length
    },
    {
      id: 'panchayat_nirnay',
      title: 'पंचायत निर्णय ऐप प्रगति रिपोर्ट (R 9.6.2)',
      category: 'मोबाइल ऐप ट्रैकर',
      description: 'पंचायत निर्णय ऐप पर कार्यवाही अपलोड होने वाली एवं लम्बित ग्राम पंचायतों का सत्यापन विवरण।',
      count: filteredRecords.filter(r => r.panchayatNirnayStatus === 'captured').length
    },
    {
      id: 'mis_feeding',
      title: 'एमआईएस सोशल ऑडिट फीडिंग रिपोर्ट (R 9.1.3)',
      category: 'वेबसाइट ट्रैकर',
      description: 'सम्पन्न 52 ग्राम पंचायतों के सापेक्ष वेबसाइट पर फीड 44 एवं देय 8 लम्बित ग्राम पंचायतों का विवरण।',
      count: filteredRecords.filter(r => r.misStatus === 'fed').length
    },
    {
      id: 'nsap_beneficiary',
      title: 'NSAP पेंशन लाभार्थी सत्यापन रिपोर्ट (Beneficiaries)',
      category: 'पेंशन सत्यापन',
      description: '16 ग्राम पंचायतों के 2,234 पेंशन लाभार्थियों के भौतिक सत्यापन, मृतक व अपात्रों का विवरण।',
      count: nsapRecords.length
    },
    {
      id: 'nsap_social_audit',
      title: 'NSAP सोशल ऑडिट मासिक प्रगति रिपोर्ट (प्रारूप-क)',
      category: 'निदेशालय प्रारूप',
      description: 'शासकीय प्रारूप के 9 बिंदुओं के अनुरूप NSAP सोशल ऑडिट की ब्लॉक-वार संकलित मासिक प्रगति।',
      count: 47
    }
  ];

  // Excel Export Handler using ExcelJS
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Social Audit Baghpat Management Portal';
      wb.created = new Date();

      const ws = wb.addWorksheet('सोशल ऑडिट रिपोर्ट 2026-27');

      // Title Row
      const activeReportObj = REPORTS.find(r => r.id === selectedReport);
      const title = activeReportObj?.title || 'सोशल ऑडिट रिपोर्ट';
      ws.addRow(['कार्यालय जिला विकास अधिकारी / डी०आर०डी०ए०, बागपत (उत्तर प्रदेश)']);
      ws.addRow([`${title} - वित्तीय वर्ष 2026-27`]);
      ws.addRow([`संदर्भ तिथि: ${formatDateHi(asOfDate)} | निर्यात दिनांक: ${new Date().toLocaleDateString('hi-IN')}`]);
      ws.addRow([]); // Blank row

      // Headers & Rows based on report type
      if (selectedReport === 'gp_master' || selectedReport === 'meeting_progress') {
        ws.addRow(['क्र० सं०', 'ग्राम पंचायत', 'विकास खंड', 'प्रारम्भ तिथि', 'बैठक तिथि', 'बी०आर०पी०', 'फोन', 'पर्यवेक्षक अधिकारी', 'स्थिति', 'Nirnay स्थिति', 'MIS स्थिति']);
        filteredRecords.forEach((r, idx) => {
          const isComp = r.status === 'completed' || r.meetingDate <= asOfDate;
          ws.addRow([
            idx + 1,
            r.gpNameUnicode,
            r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत',
            formatDateHi(r.startDate),
            formatDateHi(r.meetingDate),
            r.brpName,
            r.brpPhone,
            r.supervisorOfficerUnicode,
            isComp ? 'सम्पन्न' : (r.isAmended ? 'संशोधित' : 'प्रस्तावित'),
            r.panchayatNirnayStatus === 'captured' ? 'अपलोड' : 'लंबित',
            r.misStatus === 'fed' ? 'फीडेड' : 'लंबित'
          ]);
        });
      } else if (selectedReport === 'block_wise' || selectedReport === 'district_summary') {
        ws.addRow(['क्र० सं०', 'विकास खंड', 'कुल ग्राम पंचायतें', 'सम्पन्न बैठकें', 'आगामी बैठकें', 'पंचायत निर्णय अपलोड', 'MIS फीडेड (सम्पन्न में से)', 'NSAP ग्राम पंचायतें']);
        const baghpatRecords = filteredRecords.filter(r => r.block === 'Baghpat');
        const barautRecords = filteredRecords.filter(r => r.block === 'Baraut');

        const getStats = (list: SocialAuditRecord[]) => ({
          total: list.length,
          comp: list.filter(r => r.meetingDate <= asOfDate || r.status === 'completed').length,
          up: list.filter(r => r.meetingDate > asOfDate && r.status !== 'completed').length,
          nirnay: list.filter(r => r.panchayatNirnayStatus === 'captured').length,
          mis: list.filter(r => r.misStatus === 'fed').length,
          nsap: list.filter(r => r.hasNSAP).length
        });

        const bStats = getStats(baghpatRecords);
        const brStats = getStats(barautRecords);

        ws.addRow([1, 'विकास खण्ड बागपत', bStats.total, bStats.comp, bStats.up, bStats.nirnay, `${bStats.mis}/${bStats.comp}`, bStats.nsap]);
        ws.addRow([2, 'विकास खण्ड बड़ौत', brStats.total, brStats.comp, brStats.up, brStats.nirnay, `${brStats.mis}/${brStats.comp}`, brStats.nsap]);
        ws.addRow(['-', 'जनपद बागपत (कुल योग)', filteredRecords.length, bStats.comp + brStats.comp, bStats.up + brStats.up, bStats.nirnay + brStats.nirnay, `${bStats.mis + brStats.mis}/${bStats.comp + brStats.comp}`, bStats.nsap + brStats.nsap]);
      } else if (selectedReport === 'brp_wise') {
        ws.addRow(['क्र० सं०', 'BRP का नाम', 'मोबाइल नंबर', 'आवंटित ग्राम पंचायतें', 'सम्पन्न बैठकें', 'आगामी बैठकें', 'MIS फीडेड']);
        brpList.forEach((b, idx) => {
          const assigned = records.filter(r => r.brpPhone === b.phone || r.brpName?.includes(b.name));
          const comp = assigned.filter(r => r.meetingDate <= asOfDate || r.status === 'completed').length;
          const up = assigned.filter(r => r.meetingDate > asOfDate && r.status !== 'completed').length;
          const mis = assigned.filter(r => r.misStatus === 'fed').length;
          ws.addRow([idx + 1, b.name, b.phone, assigned.length, comp, up, mis]);
        });
      } else {
        // Generic fallback table
        ws.addRow(['क्र० सं०', 'ग्राम पंचायत', 'विकास खंड', 'बैठक तिथि', 'बी०आर०पी०', 'योजनाएं', 'स्थिति']);
        filteredRecords.forEach((r, idx) => {
          ws.addRow([
            idx + 1,
            r.gpNameUnicode,
            r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत',
            formatDateHi(r.meetingDate),
            r.brpName,
            [r.hasNSAP ? 'NSAP' : '', r.hasMGNREGA ? 'मनरेगा' : '', r.hasPMAYG ? 'आवास' : ''].filter(Boolean).join(', '),
            r.meetingDate <= asOfDate || r.status === 'completed' ? 'सम्पन्न' : 'प्रस्तावित'
          ]);
        });
      }

      // Auto-fit column widths
      ws.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell?.({ includeEmpty: false }, (cell) => {
          const len = String(cell.value || '').length;
          if (len > maxLen) maxLen = Math.min(len + 3, 40);
        });
        column.width = maxLen;
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Social_Audit_Report_${selectedReport}_${asOfDate}.xlsx`);
    } catch (err) {
      console.error('Excel Export error:', err);
      alert('Excel निर्यात में त्रुटि आई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsExporting(false);
    }
  };

  const activeReportMeta = REPORTS.find(r => r.id === selectedReport) || REPORTS[0];

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      
      {/* =================================================================== */}
      {/* 1. TOP HEADER BANNER */}
      {/* =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
                <FileText className="w-5 h-5 text-blue-700" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                केन्द्रीय रिपोर्ट सेंटर (Central Report Center)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                FY 2026-27
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              जनपद बागपत की समस्त सोशल ऑडिट बैठकों, निर्णयों, MIS फीडिंग एवं NSAP पेंशन की आधिकारिक शासकीय रिपोर्टें।
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'निर्यात हो रहा है...' : 'Excel (.xlsx) डाउनलोड'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट / PDF</span>
            </button>
          </div>
        </div>

        {/* Global Report Filters Bar */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Filter 1: Block */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">विकास खंड</label>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">सभी विकास खंड</option>
              <option value="Baghpat">विकास खण्ड बागपत (44 GP)</option>
              <option value="Baraut">विकास खण्ड बड़ौत (44 GP)</option>
            </select>
          </div>

          {/* Filter 2: BRP */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">बी०आर०पी०</label>
            <select
              value={filterBRP}
              onChange={(e) => setFilterBRP(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">सभी बी०आर०पी०</option>
              {brpList.map(b => (
                <option key={b.phone} value={b.phone}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Scheme */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">योजना</label>
            <select
              value={filterScheme}
              onChange={(e) => setFilterScheme(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">सभी योजनाएं</option>
              <option value="nsap">NSAP पेंशन (47 GP)</option>
              <option value="mgnrega">मनरेगा (88 GP)</option>
              <option value="pmayg">प्रधानमंत्री आवास (4 GP)</option>
            </select>
          </div>

          {/* Filter 4: Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">बैठक स्थिति</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">सभी स्थितियां</option>
              <option value="completed">🟢 सम्पन्न (Completed)</option>
              <option value="upcoming">🔵 आगामी (Upcoming)</option>
              <option value="amended">🟠 संशोधित (Amended)</option>
            </select>
          </div>

          {/* Filter 5: Search Query */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">ग्राम पंचायत या BRP खोजें</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="नाम लिखें..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. REPORT TYPE SELECTOR CARDS (9 PILLARS) */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map((rep) => {
          const isSelected = selectedReport === rep.id;
          return (
            <div
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-blue-50/90 border-blue-400 shadow-xs ring-1 ring-blue-500/30' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-blue-200/90 text-blue-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  {rep.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {rep.count} रिकॉर्ड
                </span>
              </div>
              <h3 className={`text-sm font-black tracking-tight ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                {rep.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                {rep.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* 3. REPORT LIVE PREVIEW TABLE */}
      {/* =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4 print:p-0 print:border-none print:shadow-none">
        
        {/* Report Preview Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                लाइव रिपोर्ट पूर्वावलोकन
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {activeReportMeta.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              प्रदर्शित रिकॉर्ड: <strong>{filteredRecords.length}</strong> (संदर्भ तिथि: {formatDateHi(asOfDate)})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              फ़िल्टर: {filterBlock !== 'all' ? (filterBlock === 'Baghpat' ? 'बागपत' : 'बड़ौत') : 'समस्त ब्लॉक'} • {filterStatus !== 'all' ? filterStatus : 'समस्त स्थितियां'}
            </span>
          </div>
        </div>

        {/* Live Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">क्र०</th>
                <th className="py-3 px-3">ग्राम पंचायत का नाम</th>
                <th className="py-3 px-3">विकास खंड</th>
                <th className="py-3 px-3 text-center">बैठक तिथि</th>
                <th className="py-3 px-3">बी०आर०पी० अधिकारी</th>
                <th className="py-3 px-3">पर्यवेक्षक अधिकारी</th>
                <th className="py-3 px-3 text-center">Nirnay (R 9.6.2)</th>
                <th className="py-3 px-3 text-center">MIS (R 9.1.3)</th>
                <th className="py-3 px-3 text-right">सोशल ऑडिट स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    चयनित फ़िल्टर के अनुसार कोई रिकॉर्ड उपलब्ध नहीं है।
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, index) => {
                  const isCompleted = r.status === 'completed' || r.meetingDate <= asOfDate;
                  const isAmended = Boolean(r.isAmended);

                  return (
                    <tr 
                      key={r.id} 
                      onClick={() => openGPProfile(r)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                      title="विस्तृत ग्राम पंचायत प्रोफाइल देखने हेतु क्लिक करें"
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                        {formatDateHi(r.meetingDate)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{r.brpName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.brpPhone}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                        {renderText(r.supervisorOfficerUnicode, r.supervisorOfficerKrutiDev)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.panchayatNirnayStatus === 'captured'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {r.panchayatNirnayStatus === 'captured' ? 'अपलोड' : 'लंबित'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.misStatus === 'fed'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {r.misStatus === 'fed' ? 'फीडेड' : 'लंबित'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isAmended
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {isCompleted ? 'सम्पन्न' : isAmended ? 'संशोधित' : 'प्रस्तावित'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Blocks for Print */}
        <div className="hidden print:grid grid-cols-3 gap-6 pt-10 text-center text-xs">
          <div>
            <div className="h-10" />
            <div className="font-bold">बी०आर०पी० / नोडल अधिकारी</div>
            <div className="text-[11px] text-slate-500">सोशल ऑडिट बागपत</div>
          </div>
          <div>
            <div className="h-10" />
            <div className="font-bold">जिला विकास अधिकारी</div>
            <div className="text-[11px] text-slate-500">जनपद बागपत</div>
          </div>
          <div>
            <div className="h-10" />
            <div className="font-bold">मुख्य विकास अधिकारी</div>
            <div className="text-[11px] text-slate-500">जनपद बागपत</div>
          </div>
        </div>

      </div>

    </div>
  );
}

