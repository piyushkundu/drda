'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { MisAuditStatus, SocialAuditRecord } from '@/types/socialAudit';
import { 
  getMisBookmarkletHref, 
  getMisBookmarkletScript, 
  MisSyncPayload 
} from '@/lib/misSyncBookmarklet';
import { 
  CheckCircle2, Clock, XCircle, Search, Filter, 
  Download, Sparkles, Building2, ShieldCheck, 
  FileSpreadsheet, RefreshCw, Layers, Landmark, 
  Zap, Copy, ExternalLink, HelpCircle, FileText,
  Calendar, Check, AlertTriangle, ArrowUpRight, Phone
} from 'lucide-react';

export default function MisFeedingTab() {
  const { 
    records, 
    asOfDate, 
    fontViewMode, 
    updateMisStatus,
    syncMisFromPayload,
    openEditModal 
  } = useSocialAuditStore();

  const [selectedBlockFilter, setSelectedBlockFilter] = useState<'all' | 'Baghpat' | 'Baraut'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'fed' | 'all_pending' | 'due_pending' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);

  // Dedicated Pending Box local filter & toggle for viewing upcoming schedule
  const [pendingViewScope, setPendingViewScope] = useState<'due' | 'all'>('due');
  const [pendingBlockFilter, setPendingBlockFilter] = useState<'all' | 'Baghpat' | 'Baraut'>('all');
  const [showUpcomingList, setShowUpcomingList] = useState(false);

  // 1-Click Bookmarklet & Sync Tool States
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState('');
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);

  // Ref for bookmarklet anchor tag (sets href imperatively to prevent React javascript: URL security error)
  const bookmarkletAnchorRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (bookmarkletAnchorRef.current) {
      bookmarkletAnchorRef.current.setAttribute('href', getMisBookmarkletHref());
    }
  }, []);

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

  // =========================================================================
  // BACKGROUND AUTO-SYNC LISTENER (Bookmarklet & API Polling)
  // =========================================================================
  useEffect(() => {
    // 1. Check URL parameters for ?misSync=...
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const syncParam = urlParams.get('misSync');
      if (syncParam) {
        try {
          const payload: MisSyncPayload = JSON.parse(decodeURIComponent(syncParam));
          const res = syncMisFromPayload(payload);
          setSyncToastMessage(`🎉 MIS लाइव सिंक सफल! ${res.blockMatched} की ${res.updatedCount} ग्राम पंचायतें अद्यतन हुईं।`);
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.warn('Failed to parse misSync URL param', e);
        }
      }
    }

    // 2. Poll /api/social-audit/sync-mis every 3 seconds for live bookmarklet updates
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/social-audit/sync-mis');
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.data && json.data.timestamp !== lastSyncTimestamp) {
          setLastSyncTimestamp(json.data.timestamp);
          const syncRes = syncMisFromPayload(json.data);
          if (syncRes.updatedCount > 0) {
            setSyncToastMessage(
              `🎉 सरकारी पोर्टल से लाइव MIS सिंक सफल! ${syncRes.blockMatched} की ${syncRes.updatedCount} ग्राम पंचायतें अद्यतन हुईं (${syncRes.updatedNames.slice(0, 3).join(', ')}${syncRes.updatedNames.length > 3 ? '...' : ''})`
            );
            setTimeout(() => setSyncToastMessage(null), 8000);
          }
        }
      } catch (err) {
        // silent
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [lastSyncTimestamp, syncMisFromPayload]);

  // Detailed Metrics computation strictly respecting asOfDate
  const metrics = useMemo(() => {
    const totalGps = records.length; // 88
    const baghpatTotal = records.filter(r => r.block === 'Baghpat').length; // 44
    const barautTotal = records.filter(r => r.block === 'Baraut').length; // 44

    const fedTotal = records.filter(r => r.misStatus === 'fed');
    const fedBaghpat = records.filter(r => r.block === 'Baghpat' && r.misStatus === 'fed');
    const fedBaraut = records.filter(r => r.block === 'Baraut' && r.misStatus === 'fed');

    // All Pending (Everything not yet fed on MIS: 46 total = 19 Baghpat + 27 Baraut)
    const allPendingTotal = records.filter(r => (r.misStatus || 'pending') !== 'fed');
    const allPendingBaghpat = records.filter(r => r.block === 'Baghpat' && (r.misStatus || 'pending') !== 'fed');
    const allPendingBaraut = records.filter(r => r.block === 'Baraut' && (r.misStatus || 'pending') !== 'fed');

    // Due Pending: Meeting date has arrived (meetingDate <= asOfDate) and status is pending (not yet fed on MIS)
    const duePendingTotal = records.filter(r => (r.misStatus || 'pending') !== 'fed' && r.meetingDate <= asOfDate);
    const duePendingBaghpat = records.filter(r => r.block === 'Baghpat' && (r.misStatus || 'pending') !== 'fed' && r.meetingDate <= asOfDate);
    const duePendingBaraut = records.filter(r => r.block === 'Baraut' && (r.misStatus || 'pending') !== 'fed' && r.meetingDate <= asOfDate);

    // Upcoming Scheduled: Future meetings (meetingDate > asOfDate) awaiting their meeting date
    const upcomingTotal = records.filter(r => (r.misStatus || 'pending') !== 'fed' && r.meetingDate > asOfDate);
    const upcomingBaghpat = records.filter(r => r.block === 'Baghpat' && (r.misStatus || 'pending') !== 'fed' && r.meetingDate > asOfDate);
    const upcomingBaraut = records.filter(r => r.block === 'Baraut' && (r.misStatus || 'pending') !== 'fed' && r.meetingDate > asOfDate);

    return {
      totalGps,
      baghpatTotal,
      barautTotal,
      fedTotalCount: fedTotal.length, // Baseline 42 (Screenshot: 25 Baghpat + 17 Baraut)
      fedBaghpatCount: fedBaghpat.length, // 25 (56.82%)
      fedBarautCount: fedBaraut.length, // 17 (38.64%)
      allPendingTotalCount: allPendingTotal.length, // Baseline 46 (19 in Baghpat + 27 in Baraut)
      allPendingBaghpatCount: allPendingBaghpat.length, // 19
      allPendingBarautCount: allPendingBaraut.length, // 27
      duePendingTotalCount: duePendingTotal.length, // Baseline 6 (4 in Baghpat + 2 in Baraut)
      duePendingBaghpatCount: duePendingBaghpat.length, // 4
      duePendingBarautCount: duePendingBaraut.length, // 2
      upcomingTotalCount: upcomingTotal.length, // Baseline 40 (15 in Baghpat + 25 in Baraut)
      upcomingBaghpatCount: upcomingBaghpat.length, // 15
      upcomingBarautCount: upcomingBaraut.length, // 25
      fedPercentage: totalGps > 0 ? ((fedTotal.length / totalGps) * 100).toFixed(2) : '0.00',
      baghpatFedPercentage: baghpatTotal > 0 ? ((fedBaghpat.length / baghpatTotal) * 100).toFixed(2) : '0.00',
      barautFedPercentage: barautTotal > 0 ? ((fedBaraut.length / barautTotal) * 100).toFixed(2) : '0.00',
    };
  }, [records, asOfDate]);

  // Pending Records for the dedicated Pending Box (Due only vs All pending)
  const pendingBoxRecords = useMemo(() => {
    return records
      .filter(r => {
        const isPending = (r.misStatus || 'pending') !== 'fed';
        if (!isPending) return false;
        if (pendingViewScope === 'due' && r.meetingDate > asOfDate) return false;
        if (pendingBlockFilter === 'all') return true;
        return r.block === pendingBlockFilter;
      })
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [records, asOfDate, pendingBlockFilter, pendingViewScope]);

  // Upcoming scheduled records awaiting meeting day
  const upcomingScheduledRecords = useMemo(() => {
    return records
      .filter(r => {
        const isPending = (r.misStatus || 'pending') !== 'fed';
        const isFuture = r.meetingDate > asOfDate;
        if (!isPending || !isFuture) return false;
        if (pendingBlockFilter === 'all') return true;
        return r.block === pendingBlockFilter;
      })
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [records, asOfDate, pendingBlockFilter]);

  // Main Table Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Block Filter
      if (selectedBlockFilter !== 'all' && r.block !== selectedBlockFilter) return false;

      // 2. Status Filter
      if (selectedStatusFilter === 'fed') {
        if (r.misStatus !== 'fed') return false;
      } else if (selectedStatusFilter === 'all_pending') {
        if (r.misStatus === 'fed') return false;
      } else if (selectedStatusFilter === 'due_pending') {
        if (r.misStatus === 'fed' || r.meetingDate > asOfDate) return false;
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

  // Copy Bookmarklet Code
  const handleCopyBookmarklet = () => {
    const code = getMisBookmarkletHref();
    navigator.clipboard.writeText(code);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2500);
  };

  // Handle Quick Paste JSON
  const handleQuickPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: MisSyncPayload = JSON.parse(quickPasteText);
      const res = syncMisFromPayload(payload);
      setSyncToastMessage(`🎉 पेस्ट सिंक सफल! ${res.blockMatched} की ${res.updatedCount} ग्राम पंचायतें अद्यतन हुईं।`);
      setIsQuickPasteOpen(false);
      setQuickPasteText('');
      setTimeout(() => setSyncToastMessage(null), 8000);
    } catch (err) {
      alert('अमान्य JSON प्रारूप! कृपया बुकमार्कलेट द्वारा कॉपी किया गया कोड ही पेस्ट करें।');
    }
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
      {/* LIVE SYNC CELEBRATION TOAST */}
      {/* ========================================================================= */}
      {syncToastMessage && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white font-bold flex items-center justify-between shadow-2xl animate-bounce border border-blue-300/40">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
            <span className="text-sm md:text-base">{syncToastMessage}</span>
          </div>
          <button
            onClick={() => setSyncToastMessage(null)}
            className="text-white hover:text-slate-200 text-sm font-bold bg-white/20 px-3 py-1 rounded-xl"
          >
            ✕ बंद करें
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OFFICIAL REPORT HEADER BANNER (R 9.1.3) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                R 9.1.3 Social Audit Calendar Vs Audits Completed
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                वित्तीय वर्ष 2026-2027 • उत्तर प्रदेश
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                जनपद: बागपत
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              एमआईएस सोशल ऑडिट फीडिंग स्थिति ट्रैकर
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              सरकारी पोर्टल R 9.1.3 रिपोर्ट के अनुसार बागपत में <strong className="text-blue-400 font-bold">25</strong> एवं बड़ौत में <strong className="text-indigo-400 font-bold">17</strong> ग्राम पंचायतों का सोशल ऑडिट डेटा वेबसाइट पर फीड हो चुका है (कुल <strong>42</strong>)।
              आज (<strong className="text-white">{formatDateHi(asOfDate)}</strong>) की तिथि तक जिन पंचायतों की बैठक हो चुकी है परंतु वेबसाइट पर फीड नहीं हुई हैं, वे नीचे <strong className="text-amber-300 font-bold">&apos;आज तक लंबित पुष्टि बॉक्स&apos;</strong> में निर्णय हेतु उपलब्ध हैं।
            </p>
          </div>

          {/* Quick Counter Highlight */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-4 rounded-2xl border border-blue-500/30 shadow-xl shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">कुल MIS फीडेड ऑडिट</div>
              <div className="text-3xl font-black text-blue-400 tracking-tight">
                {metrics.fedTotalCount} <span className="text-sm font-semibold text-slate-400">/ {metrics.totalGps} ({metrics.fedPercentage}%)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                बागपत: <strong className="text-blue-300">{metrics.fedBaghpatCount}/44 ({metrics.baghpatFedPercentage}%)</strong> | बड़ौत: <strong className="text-indigo-300">{metrics.fedBarautCount}/44 ({metrics.barautFedPercentage}%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⚡ 1-CLICK BOOKMARKLET SYNC TOOL (R 9.1.3 AUTO-SYNC) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-blue-950/40 border-2 border-blue-500/40 p-5 md:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black text-white">
                  1-क्लिक MIS पोर्टल ऑटो सिंक टूल (Bookmarklet Sync)
                </h3>
                <span className="text-[10px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/40 px-2 py-0.5 rounded-full uppercase">
                  R 9.1.3 सक्रिय
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                सरकारी वेबसाइट पर जाकर सिर्फ 1 क्लिक करें — R 9.1.3 रिपोर्ट तालिका का सारा डेटा स्वतः फेच होकर आपके पेज हिंदी में बिना टाइप किए अपडेट हो जाएगा!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="text-xs text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 px-3 py-1.5 rounded-xl border border-blue-800/40 flex items-center gap-1.5 transition-colors font-semibold"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{isGuideOpen ? 'गाइड छुपाएं' : 'कैसे उपयोग करें?'}</span>
            </button>
            <button
              onClick={() => setIsQuickPasteOpen(true)}
              className="text-xs text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/60 px-3 py-1.5 rounded-xl border border-amber-800/40 flex items-center gap-1.5 transition-colors font-semibold"
            >
              <FileText className="w-4 h-4" />
              <span>त्वरित पेस्ट (Quick Paste)</span>
            </button>
          </div>
        </div>

        {/* The Actionable Draggable Bookmarklet Link */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">बुकमार्क बार पर ड्रैग करें:</span>
            {/* Draggable Anchor Tag without javascript: in JSX */}
            <a
              ref={bookmarkletAnchorRef}
              draggable="true"
              onDragStart={(e) => {
                const href = getMisBookmarkletHref();
                e.dataTransfer.setData('text/uri-list', href);
                e.dataTransfer.setData('text/plain', href);
              }}
              onClick={(e) => {
                e.preventDefault();
                alert('कृपया इस नीले बटन को माउस से दबाकर (Drag) अपने ब्राउज़र के बुकमार्क बार (Bookmarks Bar) पर खींचकर छोड़ें!');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-blue-600/30 border border-blue-300 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:scale-105 transition-all select-none"
              title="इस बटन को खींचकर (Drag & Drop) अपने ब्राउज़र के बुकमार्क बार पर छोड़ें"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>⚡ MIS सिंक (R 9.1.3)</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBookmarklet}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
              title="यदि ड्रैग न कर सकें तो बुकमार्क URL कॉपी करें"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedBookmarklet ? '✓ कोड कॉपी हो गया!' : 'बुकमार्क कोड कॉपी करें'}</span>
            </button>
          </div>
        </div>

        {/* 3-Step Interactive Visual Guide */}
        {isGuideOpen && (
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-blue-500/30 text-xs space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 text-blue-300">
              <span>सरल 3-चरणीय उपयोग विधि:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-black uppercase text-blue-400">चरण 1</div>
                <div className="font-bold text-white">बुकमार्क बार में जोड़ें</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  ऊपर दिए गए नीले बटन <strong>&apos;⚡ MIS सिंक (R 9.1.3)&apos;</strong> को माउस से खींचकर अपने ब्राउज़र के बुकमार्क बार पर छोड़ दें। (<code>Ctrl+Shift+B</code> से बुकमार्क बार दिखेगा)।
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-black uppercase text-emerald-400">चरण 2</div>
                <div className="font-bold text-white">R 9.1.3 रिपोर्ट खोलें</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  मनरेगा पोर्टल पर <strong>R 9.1.3 Social Audit Calendar Vs Audits Completed</strong> रिपोर्ट (बागपत या बड़ौत ब्लॉक) खोलें।
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-black uppercase text-amber-400">चरण 3</div>
                <div className="font-bold text-white">1 क्लिक करें और सिंक!</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  सरकारी पेज पर रहते हुए अपने बुकमार्क बार के <strong>&apos;⚡ MIS सिंक (R 9.1.3)&apos;</strong> पर क्लिक करें। पूरा डेटा 1 सेकंड में एक्सट्रैक्ट होकर आपके पेज हिंदी पर स्वतः लाइव अपडेट हो जाएगा!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. QUICK PASTE MODAL */}
      {/* ========================================================================= */}
      {isQuickPasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                <FileText className="w-5 h-5" />
                <span>त्वरित पेस्ट (Quick Paste - R 9.1.3)</span>
              </div>
              <button
                onClick={() => setIsQuickPasteOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              यदि सरकारी पोर्टल पर क्लिक करने पर डायरेक्ट API कनेक्ट न हो, तो बुकमार्कलेट द्वारा क्लिपबोर्ड पर कॉपी किया गया कोड यहाँ पेस्ट करके सिंक करें:
            </p>

            <form onSubmit={handleQuickPasteSubmit} className="space-y-4">
              <textarea
                value={quickPasteText}
                onChange={(e) => setQuickPasteText(e.target.value)}
                placeholder='यहाँ JSON कोड पेस्ट करें {"source":"bookmarklet_r913", ...}'
                rows={5}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                required
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickPasteOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>सिंक लागू करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUMMARY METRIC CARDS (4 PILLARS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: कुल ग्राम पंचायतें */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">कुल ग्राम पंचायतें</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {metrics.totalGps}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>बागपत: <strong className="text-blue-400">{metrics.baghpatTotal}</strong></span>
            <span>बड़ौत: <strong className="text-indigo-400">{metrics.barautTotal}</strong></span>
          </div>
        </div>

        {/* Card 2: MIS पर फीडेड (पूर्ण) */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-500/40 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">MIS फीडेड (पूर्ण)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 tracking-tight">
            {metrics.fedTotalCount} <span className="text-sm font-semibold text-slate-400">/ {metrics.totalGps}</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-blue-900/40">
            <span>बागपत: <strong className="text-blue-300">{metrics.fedBaghpatCount} ({metrics.baghpatFedPercentage}%)</strong></span>
            <span>बड़ौत: <strong className="text-indigo-300">{metrics.fedBarautCount} ({metrics.barautFedPercentage}%)</strong></span>
          </div>
        </div>

        {/* Card 3: समस्त लंबित (All Pending) */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/40 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">समस्त लंबित (All Pending)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 tracking-tight">
            {metrics.allPendingTotalCount} <span className="text-sm font-semibold text-slate-400">/ {metrics.totalGps}</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-amber-900/40">
            <span>बागपत: <strong className="text-amber-300">{metrics.allPendingBaghpatCount}</strong></span>
            <span>बड़ौत: <strong className="text-amber-300">{metrics.allPendingBarautCount}</strong></span>
          </div>
        </div>

        {/* Card 4: आज तक लंबित (Due Pending) */}
        <div className={`rounded-2xl border p-5 shadow-lg space-y-2 transition-all ${
          metrics.duePendingTotalCount > 0 
            ? 'bg-gradient-to-br from-rose-950/60 to-slate-900 border-rose-500/50 shadow-rose-500/10' 
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-bold uppercase tracking-wider">आज तक लंबित (Due)</span>
            <Clock className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-rose-400 tracking-tight">
            {metrics.duePendingTotalCount} <span className="text-sm font-normal text-slate-400">पंचायतें</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-rose-900/40">
            <span>बागपत: <strong className="text-rose-300">{metrics.duePendingBaghpatCount}</strong></span>
            <span>बड़ौत: <strong className="text-rose-300">{metrics.duePendingBarautCount}</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DEDICATED "लंबित पुष्टि बॉक्स" (PENDING ACTION BOX) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 p-6 shadow-2xl space-y-4">
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
                  लंबित पुष्टि बॉक्स (MIS Feeding Action)
                </h3>
                <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                  {pendingBoxRecords.length} प्रदर्शित
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {pendingViewScope === 'due' 
                  ? `कट-ऑफ तिथि (${formatDateHi(asOfDate)}) तक जिन ग्राम पंचायतों की बैठक संपन्न हो चुकी है परंतु पोर्टल पर फीड नहीं हुई—वे यहाँ सूचीबद्ध हैं।`
                  : 'समस्त ग्राम पंचायतें जिनका ऑडिट अभी पोर्टल पर फीड होना शेष है।'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Scope Filter: Due (6) vs All Pending (46) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPendingViewScope('due')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingViewScope === 'due' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="केवल वे जिनकी बैठक आज तक संपन्न हो चुकी है"
              >
                आज तक लंबित ({metrics.duePendingTotalCount})
              </button>
              <button
                onClick={() => setPendingViewScope('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  pendingViewScope === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="समस्त लंबित ग्राम पंचायतें"
              >
                समस्त लंबित ({metrics.allPendingTotalCount})
              </button>
            </div>

            {/* Block Filter in Pending Box */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPendingBlockFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                सभी ({pendingViewScope === 'due' ? metrics.duePendingTotalCount : metrics.allPendingTotalCount})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baghpat')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'Baghpat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                बागपत ({pendingViewScope === 'due' ? metrics.duePendingBaghpatCount : metrics.allPendingBaghpatCount})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baraut')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  pendingBlockFilter === 'Baraut' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                बड़ौत ({pendingViewScope === 'due' ? metrics.duePendingBarautCount : metrics.allPendingBarautCount})
              </button>
            </div>

            {/* Toggle Upcoming Schedule */}
            <button
              onClick={() => setShowUpcomingList(!showUpcomingList)}
              className="text-xs text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 px-3 py-1.5 rounded-xl border border-indigo-800/40 flex items-center gap-1.5 font-bold transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{showUpcomingList ? 'आगामी सूची छुपाएं' : `आगामी (${metrics.upcomingTotalCount})`}</span>
            </button>
          </div>
        </div>

        {/* List of Pending Box GPs */}
        {pendingBoxRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingBoxRecords.map((r) => {
              const isPastMeeting = r.meetingDate <= asOfDate;
              return (
              <div
                key={r.id}
                className={`p-4 rounded-2xl bg-slate-950/90 border transition-all space-y-3 shadow-lg group ${
                  isPastMeeting ? 'border-amber-500/40 hover:border-amber-400' : 'border-indigo-500/30 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        SR# {r.sno}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {r.block === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'}
                      </span>
                    </div>
                    <div className="text-base font-black text-white pt-1">
                      {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-xl border ${
                    isPastMeeting 
                      ? 'text-amber-400 bg-amber-950/80 border-amber-700/50' 
                      : 'text-indigo-300 bg-indigo-950/80 border-indigo-700/50'
                  }`}>
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>{isPastMeeting ? 'आज तक लंबित' : 'आगामी लंबित'}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span>{isPastMeeting ? 'बैठक संपन्न तिथि:' : 'प्रस्तावित बैठक तिथि:'}</span>
                    <strong className="text-white font-mono">{formatDateHi(r.meetingDate)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>BRP:</span>
                    <span className="text-slate-300">{r.brpName} ({r.brpPhone})</span>
                  </div>
                </div>

                {/* 1-Click Action Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleStatusChange(r.id, 'fed')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
                  >
                    <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                    <span>MIS पर फीड हो चुका है</span>
                  </button>
                  <button
                    onClick={() => openEditModal(r)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                    title="विवरण संपादित करें"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );})}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">
              शाबाश! इस फ़िल्टर में कोई भी लंबित ग्राम पंचायत नहीं है।
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              सभी लक्षित बैठकें MIS पर अपडेट हैं।
            </p>
          </div>
        )}

        {/* Collapsible Upcoming Meetings Section */}
        {showUpcomingList && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>भविष्य की आगामी बैठकें ({upcomingScheduledRecords.length} पंचायतें) - अपनी तारीख पर स्वतः सक्रिय होंगी:</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {upcomingScheduledRecords.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200">
                      {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      SR# {r.sno} • {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-indigo-300 font-bold block">
                      {formatDateHi(r.meetingDate)}
                    </span>
                    <span className="text-[9px] text-slate-500">प्रस्तावित</span>
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
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 md:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>समस्त ग्राम पंचायतें • विस्तृत MIS फीडिंग विवरण</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Block Filter */}
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="all">सभी ब्लॉक (88)</option>
              <option value="Baghpat">विकास खण्ड बागपत (44)</option>
              <option value="Baraut">विकास खण्ड बड़ौत (44)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="all">सभी स्थितियां ({metrics.totalGps})</option>
              <option value="fed">✅ MIS पर फीडेड ({metrics.fedTotalCount})</option>
              <option value="all_pending">⏳ समस्त लंबित ({metrics.allPendingTotalCount})</option>
              <option value="due_pending">⚠️ आज तक लंबित - संपन्न ({metrics.duePendingTotalCount})</option>
              <option value="upcoming">📅 आगामी बैठकें ({metrics.upcomingTotalCount})</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
              title="CSV फ़ाइल डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span>एक्सपोर्ट CSV</span>
            </button>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredRecords.map((r) => {
                const isFed = r.misStatus === 'fed';
                const isDuePending = !isFed && r.meetingDate <= asOfDate;
                const isUpcoming = !isFed && r.meetingDate > asOfDate;
                const isRecentlyUpdated = justUpdatedId === r.id;

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isRecentlyUpdated ? 'bg-blue-500/20 animate-pulse' : ''
                    } ${isDuePending ? 'bg-amber-950/20' : ''}`}
                  >
                    <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                      {r.sno}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        r.block === 'Baghpat'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">
                        {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        BRP: {r.brpName} ({r.brpPhone})
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {formatDateHi(r.meetingDate)}
                    </td>

                    {/* Column 8 Value from Official R 9.1.3 */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold font-mono text-xs ${
                        isFed 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {isFed ? '1' : '0'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {isFed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>फीड हो चुका</span>
                        </span>
                      ) : isDuePending ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>आज तक लंबित</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>आगामी प्रस्तावित</span>
                        </span>
                      )}
                    </td>

                    {/* Manual Action Switch */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                        <button
                          onClick={() => handleStatusChange(r.id, 'fed')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            isFed
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
