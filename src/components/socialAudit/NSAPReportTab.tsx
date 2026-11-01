'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { NSAPReportSummary, NSAPReportRow, SocialAuditRecord } from '@/types/socialAudit';
import { exportNSAPReportExcel } from '@/lib/exportSocialAuditExcel';
import { getDelhiDateString, formatDelhiDateHindi } from '@/lib/delhiTime';
import { 
  FileText, Calendar, Download, Printer, CheckCircle2, 
  Layers, ArrowUpRight, ShieldCheck, Landmark, Check,
  AlertTriangle, Filter, Eye, Phone, Users, Shield, Edit3
} from 'lucide-react';

export default function NSAPReportTab() {
  const { records, asOfDate, setAsOfDate, fontViewMode, openEditModal } = useSocialAuditStore();
  const [downloading, setDownloading] = useState(false);
  const [amendedFilter, setAmendedFilter] = useState<'nsap' | 'uptoDate' | 'all10'>('nsap');
  const [amendedBlockFilter, setAmendedBlockFilter] = useState<'all' | 'Baghpat' | 'Baraut'>('all');

  // Format date helper in Hindi e.g. 08 अक्टूबर, 2026
  const formatDateHiFull = (dStr: string) => {
    if (!dStr) return '';
    const months = [
      'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
      'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'
    ];
    try {
      const [y, m, d] = dStr.split('-');
      const mIdx = parseInt(m, 10) - 1;
      return `${d} ${months[mIdx] || m}, ${y}`;
    } catch {
      return dStr;
    }
  };

  const formatDateHiShort = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}.${m}.${y}`;
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
        <span className="flex flex-col">
          <span className="text-slate-900 font-semibold">{unicodeText}</span>
          <span className="text-[11px] text-amber-800 font-mono" style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>
            {krutiText}
          </span>
        </span>
      );
    }
    return <span>{unicodeText}</span>;
  };

  // Generate dynamic NSAP Report calculations based on asOfDate
  const reportSummary: NSAPReportSummary = useMemo(() => {
    const nsapRecords = records.filter((r) => r.hasNSAP);

    // Calculate block-wise
    const computeBlock = (blockName: 'Baghpat' | 'Baraut', sno: number, distHi: string, distKr: string, blkHi: string, blkKr: string): NSAPReportRow => {
      const blockAll = nsapRecords.filter((r) => r.block === blockName);
      
      // Proposed up to asOfDate:
      // Includes records whose original meeting date <= asOfDate OR whose current meeting date <= asOfDate
      const proposedUpTo = blockAll.filter((r) => {
        const origDate = r.amendmentDetails?.originalDate || r.originalMeetingDate || r.meetingDate;
        return origDate <= asOfDate || r.meetingDate <= asOfDate;
      });

      // Amended up to asOfDate:
      // A record that was amended, and either its original scheduled date <= asOfDate
      // (meaning it was due by now, but got rescheduled) OR its new date <= asOfDate
      const amendedUpTo = proposedUpTo.filter((r) => r.isAmended);

      // Completed up to asOfDate:
      // Must be physically completed on/before asOfDate. If it got amended to a future date > asOfDate, it's not completed yet!
      const completedUpTo = proposedUpTo.filter((r) => {
        if (r.isAmended && r.meetingDate > asOfDate) return false;
        return r.meetingDate <= asOfDate || r.status === 'completed';
      });

      // All amended in the whole session for this block
      const allAmendedInBlock = blockAll.filter((r) => r.isAmended);

      return {
        sno,
        districtHindi: distHi,
        districtKrutiDev: distKr,
        blockHindi: blkHi,
        blockKrutiDev: blkKr,
        totalProposedFY: blockAll.length, // 24 for Baghpat, 23 for Baraut
        proposedUpToDate: proposedUpTo.length,
        completedUpToDate: completedUpTo.length,
        amendedOrCancelled: amendedUpTo.length,
        totalAmendedInFY: allAmendedInBlock.length,
        amendedGramPanchayatsList: allAmendedInBlock,
        gramPanchayatsList: proposedUpTo
      };
    };

    const row1 = computeBlock('Baghpat', 1, 'बागपत', 'ckxir', 'बागपत', 'ckxir');
    const row2 = computeBlock('Baraut', 2, 'बागपत', 'ckxir', 'बड़ौत', 'cM+kSr');

    const rows = [row1, row2];

    const totals = {
      totalProposedFY: row1.totalProposedFY + row2.totalProposedFY, // 47
      proposedUpToDate: row1.proposedUpToDate + row2.proposedUpToDate,
      completedUpToDate: row1.completedUpToDate + row2.completedUpToDate,
      amendedOrCancelled: row1.amendedOrCancelled + row2.amendedOrCancelled,
      totalAmendedInFY: row1.totalAmendedInFY + row2.totalAmendedInFY // 7
    };

    const allAmendedNSAP = records.filter((r) => r.hasNSAP && r.isAmended);
    const allAmendedOverall = records.filter((r) => r.isAmended);

    return {
      asOfDate,
      asOfDateFormatted: formatDateHiShort(asOfDate),
      rows,
      totals,
      allAmendedNSAP,
      allAmendedOverall
    };
  }, [records, asOfDate]);

  // List of amended records to display based on user tab filter
  const displayedAmendedRecords = useMemo(() => {
    let list: SocialAuditRecord[] = [];
    if (amendedFilter === 'nsap') {
      list = reportSummary.allAmendedNSAP;
    } else if (amendedFilter === 'uptoDate') {
      list = reportSummary.rows.flatMap((r) => r.gramPanchayatsList.filter((g) => g.isAmended));
    } else {
      list = reportSummary.allAmendedOverall;
    }

    if (amendedBlockFilter !== 'all') {
      list = list.filter((r) => r.block === amendedBlockFilter);
    }
    return list;
  }, [reportSummary, amendedFilter, amendedBlockFilter]);

  // Handle Excel download
  const handleDownload = async (mode: 'krutidev' | 'unicode') => {
    setDownloading(true);
    try {
      await exportNSAPReportExcel(reportSummary, mode);
    } catch (err) {
      console.error(err);
      alert('NSAP रिपोर्ट डाउनलोड करने में त्रुटि आई।');
    } finally {
      setDownloading(false);
    }
  };

  // Quick preset dates with live dynamic current date
  const todayDelhi = getDelhiDateString();
  const presetDates = [
    { label: '08 अक्टूबर 2026 (मूल बेसलाइन)', value: '2026-10-08' },
    { label: `${formatDelhiDateHindi(todayDelhi)} (आज की लाइव तिथि)`, value: todayDelhi },
    { label: '31 अक्टूबर 2026 (माह अंत)', value: '2026-10-31' },
    { label: '30 नवम्बर 2026 (बागपत पूर्ण)', value: '2026-11-30' },
    { label: '31 दिसम्बर 2026 (वित्तीय वर्ष पूर्ण)', value: '2026-12-31' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                NSAP सामाजिक सहायता कार्यक्रम
              </span>
              <span className="text-xs text-slate-500 font-medium">स्वचालित प्रगति रिपोर्ट</span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 mt-1">
              वृद्धावस्था पेंशन / पारिवारिक लाभ सोशल ऑडिट रिपोर्ट
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              दिनांक के अनुसार वास्तविक समय में स्वतः तैयार होने वाली प्रगति रिपोर्ट (बागपत एवं बड़ौत)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownload('krutidev')}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all active:scale-95"
              title="शासकीय मुद्रण हेतु कृतिदेव 010 में Excel फाइल डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel (कृतिदेव 010)</span>
            </button>

            <button
              onClick={() => handleDownload('unicode')}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all active:scale-95"
              title="यूनिकोड / मंगल में Excel फाइल डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel (यूनिकोड)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट / PDF</span>
            </button>
          </div>
        </div>

        {/* Date Controls & Presets */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-700 font-semibold">कट-ऑफ दिनांक चुनें:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 mr-1 font-medium">त्वरित तिथियां:</span>
            {presetDates.map((p) => (
              <button
                key={p.value}
                onClick={() => setAsOfDate(p.value)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-all font-medium ${
                  asOfDate === p.value
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Official Document Sheet Preview (Government Format Replica) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="text-center space-y-1 mb-6 border-b border-slate-200 pb-5">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">
            कार्यालय जिला विकास अधिकारी / परियोजना निदेशक, डी०आर०डी०ए० बागपत
          </div>
          <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
            राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) के अन्तर्गत वृद्धावस्था पेंशन/पारिवारिक लाभ योजना से संबंधित सोशल ऑडिट रिपोर्ट
          </h1>
          <div className="text-xs text-amber-800 font-semibold">
            (दिनांक {formatDateHiFull(asOfDate)} तक प्रस्तावित/सम्पन्न सोशल ऑडिट के सापेक्ष)
          </div>
        </div>

        {/* The Official Report Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-center border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-2 border-r border-slate-200 w-12">क्रम सं०</th>
                <th className="py-3 px-3 border-r border-slate-200">जनपद का नाम</th>
                <th className="py-3 px-3 border-r border-slate-200">विकास खंड का नाम</th>
                <th className="py-3 px-3 border-r border-slate-200 leading-tight">
                  वित्तीय वर्ष 2026-27 में प्रस्तावित कुल<br />ग्राम पंचायतों/सोशल ऑडिट की संख्या
                </th>
                <th className="py-3 px-3 border-r border-slate-200 leading-tight text-blue-700">
                  दिनांक {formatDateHiShort(asOfDate)} तक प्रस्तावित कुल<br />ग्राम पंचायतों/सोशल ऑडिट की संख्या
                </th>
                <th className="py-3 px-3 border-r border-slate-200 leading-tight text-emerald-700">
                  दिनांक {formatDateHiShort(asOfDate)} तक सम्पन्न कुल<br />ग्राम पंचायतों/सोशल ऑडिट की संख्या
                </th>
                <th className="py-3 px-3 leading-tight text-amber-800">
                  संशोधित या निरस्त ग्राम पंचायतों/<br />सोशल ऑडिट की संख्या
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportSummary.rows.map((row) => (
                <tr key={row.sno} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2 border-r border-slate-200 font-bold text-slate-500">
                    {row.sno}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200 font-bold text-slate-900 text-left">
                    {row.districtHindi}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200 font-bold text-slate-900 text-left">
                    {row.blockHindi}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200 font-bold text-slate-700">
                    {row.totalProposedFY}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200 font-extrabold text-blue-700 text-sm">
                    {row.proposedUpToDate}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200 font-extrabold text-emerald-700 text-sm">
                    {row.completedUpToDate}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-amber-800 text-sm">
                    <div className="flex flex-col items-center">
                      <span className="text-base text-amber-800 font-black">
                        {row.amendedOrCancelled}
                      </span>
                      <span className="text-[10px] text-amber-700 font-normal">
                        (सत्र में कुल: {row.totalAmendedInFY})
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-slate-50 font-black text-sm border-t-2 border-slate-300">
                <td colSpan={3} className="py-3 px-4 border-r border-slate-200 text-center text-slate-900">
                  कुल योग (TOTAL)
                </td>
                <td className="py-3 px-3 border-r border-slate-200 text-slate-900 font-extrabold">
                  {reportSummary.totals.totalProposedFY}
                </td>
                <td className="py-3 px-3 border-r border-slate-200 text-blue-700 font-black text-base">
                  {reportSummary.totals.proposedUpToDate}
                </td>
                <td className="py-3 px-3 border-r border-slate-200 text-emerald-700 font-black text-base">
                  {reportSummary.totals.completedUpToDate}
                </td>
                <td className="py-3 px-3 text-amber-800 font-black text-base">
                  <div className="flex flex-col items-center">
                    <span className="text-lg text-amber-800 font-black">
                      {reportSummary.totals.amendedOrCancelled}
                    </span>
                    <span className="text-[10px] text-amber-700 font-normal">
                      (सत्र में कुल: {reportSummary.totals.totalAmendedInFY})
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Note on Amendments */}
        <div className="mt-3 text-[11px] text-slate-600 flex items-center justify-between bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
          <span className="flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              नोट: बी०आर०पी० (हरिकिशन) के कार्यमुक्त होने के कारण NSAP योजना में कुल <strong>7</strong> ग्राम पंचायतें (बागपत 4, बड़ौत 3) संशोधित की गईं।
            </span>
          </span>
          <span className="text-slate-600">
            कट-ऑफ तिथि ({formatDateHiShort(asOfDate)}) तक प्रभावी संशोधित: <strong className="text-amber-900">{reportSummary.totals.amendedOrCancelled}</strong>
          </span>
        </div>

        {/* Official Signatures Blocks */}
        <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="h-8" />
            <div className="font-bold text-slate-800">नोडल अधिकारी / बी०आर०पी०</div>
            <div className="text-[11px] text-slate-500">सोशल ऑडिट, जनपद बागपत</div>
          </div>
          <div className="hidden md:block">
            <div className="h-8" />
            <div className="font-bold text-slate-800">जिला विकास अधिकारी</div>
            <div className="text-[11px] text-slate-500">जनपद बागपत</div>
          </div>
          <div>
            <div className="h-8" />
            <div className="font-bold text-slate-800">मुख्य विकास अधिकारी</div>
            <div className="text-[11px] text-slate-500">जनपद बागपत</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIGHLIGHTED DEDICATED SECTION: SEPARATE LIST OF AMENDED GRAM PANCHAYATS */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-amber-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                अति महत्वपूर्ण • पृथक विवरण
              </span>
              <span className="text-xs text-amber-800 font-semibold">
                (बी०आर०पी० कार्यमुक्त / रोस्टर संशोधन)
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 mt-1">
              संशोधित या निरस्त ग्राम पंचायतों का पृथक एवं विस्तृत विवरण
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              बी०आर०पी० हरिकिशन के कार्यमुक्त होने पर बागपत एवं बड़ौत में संशोधित की गई ग्राम सभाओं का मूल व नया रोस्टर
            </p>
          </div>

          {/* Block Quick Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['all', 'Baghpat', 'Baraut'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setAmendedBlockFilter(b)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  amendedBlockFilter === b
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b === 'all' ? 'सभी ब्लॉक' : b === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
              </button>
            ))}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setAmendedFilter('nsap')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              amendedFilter === 'nsap'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>NSAP पेंशन योजना में संशोधित (7 ग्राम पंचायतें)</span>
            <span className="text-[10px] bg-amber-700 text-white px-1.5 py-0.2 rounded font-bold">
              बागपत: 4 | बड़ौत: 3
            </span>
          </button>

          <button
            onClick={() => setAmendedFilter('uptoDate')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              amendedFilter === 'uptoDate'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>कट-ऑफ दिनांक ({formatDateHiShort(asOfDate)}) तक प्रभावित संशोधित</span>
          </button>

          <button
            onClick={() => setAmendedFilter('all10')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              amendedFilter === 'all10'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>समस्त 10 संशोधित ग्राम पंचायतें (पूर्ण रोस्टर)</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
              NSAP 7 + मनरेगा 3
            </span>
          </button>
        </div>

        {/* Table of Amended Gram Panchayats */}
        <div className="overflow-x-auto rounded-2xl border border-amber-200 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-amber-50 text-amber-900 font-bold border-b border-amber-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">क्र०</th>
                <th className="py-3 px-3">विकास खंड</th>
                <th className="py-3 px-3">ग्राम पंचायत का नाम</th>
                <th className="py-3 px-3 text-center text-rose-700">मूल प्रस्तावित तिथि</th>
                <th className="py-3 px-3 text-center text-amber-800">संशोधित बैठक तिथि</th>
                <th className="py-3 px-3 text-slate-500">पूर्व बी०आर०पी०</th>
                <th className="py-3 px-3 text-emerald-700">नवीन आवंटित बी०आर०पी०</th>
                <th className="py-3 px-3">सोशल ऑडिट टीम सदस्य</th>
                <th className="py-3 px-3">पर्यवेक्षक अधिकारी</th>
                <th className="py-3 px-3 text-center">योजना</th>
                <th className="py-3 px-3 text-center">स्थिति</th>
                <th className="py-3 px-3 text-center">संशोधन</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {displayedAmendedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    चयनित फ़िल्टर में कोई संशोधित ग्राम पंचायत नहीं है।
                  </td>
                </tr>
              ) : (
                displayedAmendedRecords.map((gp, idx) => {
                  const origDate = gp.amendmentDetails?.originalDate || gp.originalMeetingDate || '';
                  const newDate = gp.meetingDate;
                  const isCompleted = newDate <= asOfDate;

                  return (
                    <tr
                      key={gp.id}
                      className="hover:bg-amber-50/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-amber-800 font-mono font-bold">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-black text-slate-900 whitespace-nowrap text-sm">
                        {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                      </td>

                      {/* Original Date */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="line-through text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200">
                          {formatDateHiShort(origDate)}
                        </span>
                      </td>

                      {/* Revised Date */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-amber-800 font-black bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 text-sm">
                          {formatDateHiShort(newDate)}
                        </span>
                      </td>

                      {/* Old BRP */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        <div className="line-through text-slate-500 font-semibold">
                          हरिकिशन
                        </div>
                        <span className="text-[10px] text-rose-600 font-mono">8859660315 (कार्यमुक्त)</span>
                      </td>

                      {/* New BRP */}
                      <td className="py-3 px-3 text-emerald-800 whitespace-nowrap font-bold">
                        <div>{renderText(gp.brpName || gp.brpUnicode, gp.brpKrutiDev)}</div>
                        {gp.brpPhone && (
                          <a href={`tel:${gp.brpPhone}`} className="text-[10px] text-blue-700 hover:underline font-mono">
                            📞 {gp.brpPhone}
                          </a>
                        )}
                      </td>

                      {/* Team */}
                      <td className="py-3 px-3 max-w-xs text-slate-700 leading-snug">
                        <div className="line-clamp-2" title={gp.teamMembersUnicode}>
                          {renderText(gp.teamMembersUnicode, gp.teamMembersKrutiDev)}
                        </div>
                      </td>

                      {/* Supervisor */}
                      <td className="py-3 px-3 max-w-xs text-slate-500 text-[11px] leading-snug">
                        <div className="line-clamp-2" title={gp.supervisorOfficerUnicode}>
                          {renderText(gp.supervisorOfficerUnicode, gp.supervisorOfficerKrutiDev)}
                        </div>
                      </td>

                      {/* Scheme */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {gp.hasNSAP ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            NSAP
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                            मनरेगा
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isCompleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            सम्पन्न
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            आगामी तिथि
                          </span>
                        )}
                      </td>

                      {/* Quick Edit */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(gp)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                          title="संशोधित रोस्टर संपादित करें"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
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

      {/* Breakdown: List of all NSAP Gram Panchayats up to Selected Date */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>कट-ऑफ दिनांक ({formatDateHiShort(asOfDate)}) तक आच्छादित समस्त NSAP ग्राम पंचायतों की सूची</span>
          </span>
          <span className="text-xs text-slate-500 font-normal">
            कुल {reportSummary.totals.proposedUpToDate} ग्राम पंचायतें (सम्पन्न: {reportSummary.totals.completedUpToDate}, संशोधित: {reportSummary.totals.amendedOrCancelled})
          </span>
        </h3>

        <div className="overflow-x-auto max-h-96 scrollbar-thin rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">क्र०</th>
                <th className="py-2.5 px-3">विकास खण्ड</th>
                <th className="py-2.5 px-3">ग्राम पंचायत</th>
                <th className="py-2.5 px-3 text-center">बैठक तिथि</th>
                <th className="py-2.5 px-3">बी०आर०पी०</th>
                <th className="py-2.5 px-3">पर्यवेक्षक अधिकारी</th>
                <th className="py-2.5 px-3 text-center">संशोधित?</th>
                <th className="py-2.5 px-3 text-center">स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportSummary.totals.proposedUpToDate === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    चयनित दिनांक तक कोई NSAP ऑडिट प्रस्तावित नहीं है। कृपया आगे की तिथि चुनें।
                  </td>
                </tr>
              ) : (
                reportSummary.rows.flatMap((r) =>
                  r.gramPanchayatsList.map((gp, i) => {
                    const isCompl = gp.meetingDate <= asOfDate;
                    return (
                      <tr key={gp.id} className={`hover:bg-slate-50 ${gp.isAmended ? 'bg-amber-50/50' : ''}`}>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{gp.blockHindi}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{gp.gpNameUnicode}</td>
                        <td className="py-2.5 px-3 text-center text-blue-700 font-medium">
                          {formatDateHiShort(gp.meetingDate)}
                        </td>
                        <td className="py-2.5 px-3 text-amber-800 font-semibold">{gp.brpUnicode}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={gp.supervisorOfficerUnicode}>
                          {gp.supervisorOfficerUnicode}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {gp.isAmended ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              हाँ (संशोधित)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">नहीं</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isCompl ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              सम्पन्न
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                              प्रस्तावित
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
