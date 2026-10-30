'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { PanchayatNirnayStatus, SocialAuditRecord } from '@/types/socialAudit';
import { 
  CheckCircle2, Clock, XCircle, Search, Filter, 
  Download, Sparkles, Building2, ShieldCheck, 
  Smartphone, AlertCircle, ArrowUpRight, Check,
  Layers, Landmark, FileSpreadsheet, RefreshCw
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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | PanchayatNirnayStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);

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

  // Detailed Metrics computation
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

    const pendingTotal = records.filter(r => r.panchayatNirnayStatus === 'pending');
    const pendingBaghpat = records.filter(r => r.block === 'Baghpat' && r.panchayatNirnayStatus === 'pending');
    const pendingBaraut = records.filter(r => r.block === 'Baraut' && r.panchayatNirnayStatus === 'pending');

    const notCapturedTotal = records.filter(r => r.panchayatNirnayStatus === 'not_captured');

    return {
      totalGps,
      totalMapped,
      baghpatMapped,
      barautMapped,
      capturedTotalCount: capturedTotal.length,
      capturedBaghpatCount: capturedBaghpat.length,
      capturedBarautCount: capturedBaraut.length,
      pendingTotalCount: pendingTotal.length,
      pendingBaghpatCount: pendingBaghpat.length,
      pendingBarautCount: pendingBaraut.length,
      notCapturedTotalCount: notCapturedTotal.length,
      baghpatPercentage: ((capturedBaghpat.length / baghpatTotal) * 100).toFixed(2),
      barautPercentageTotal: ((capturedBaraut.length / barautTotal) * 100).toFixed(2),
      barautPercentageMapped: barautMapped > 0 ? ((capturedBaraut.length / barautMapped) * 100).toFixed(2) : '0.00',
      districtPercentage: ((capturedTotal.length / totalMapped) * 100).toFixed(2)
    };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Block
      if (selectedBlockFilter !== 'all' && r.block !== selectedBlockFilter) return false;
      // Status
      if (selectedStatusFilter !== 'all') {
        const status = r.panchayatNirnayStatus || 'pending';
        if (status !== selectedStatusFilter) return false;
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
      // Sort captured first, then by meetingDate
      if (a.panchayatNirnayStatus === 'captured' && b.panchayatNirnayStatus !== 'captured') return -1;
      if (b.panchayatNirnayStatus === 'captured' && a.panchayatNirnayStatus !== 'captured') return 1;
      return a.sno - b.sno;
    });
  }, [records, selectedBlockFilter, selectedStatusFilter, searchQuery]);

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
              पंचायत निर्णय ऐप (Panchayat Nirnay App) पर ग्राम सभा बैठकों के लाइव प्रपत्र एवं फोटोग्राफ्स अपलोड का आधिकारिक रिकॉर्ड।
              बागपत में <strong className="text-emerald-400 font-bold">6</strong> एवं बड़ौत में <strong className="text-emerald-400 font-bold">3</strong> ग्राम पंचायतें अपलोड हैं।
              शेष ग्राम पंचायतों की पुष्टि आप यहाँ व्यक्तिगत रूप से मैनुअल कर सकते हैं।
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
      {/* 2. STATS OVERVIEW CARDS */}
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

        {/* Card 2: Baghpat Block Status */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>विकास खण्ड - बागपत</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">
            {metrics.capturedBaghpatCount} <span className="text-xs font-normal text-slate-400">/ 44</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            मैप्ड: <strong className="text-white">44 (100%)</strong> • पूर्ण: <strong className="text-blue-300">{metrics.baghpatPercentage}%</strong>
          </div>
        </div>

        {/* Card 3: Baraut Block Status */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>विकास खण्ड - बड़ौत</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">
            {metrics.capturedBarautCount} <span className="text-xs font-normal text-slate-400">/ 44</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            मैप्ड: <strong className="text-white">22 (50%)</strong> • पूर्ण: <strong className="text-indigo-300">{metrics.barautPercentageMapped}%</strong>
          </div>
        </div>

        {/* Card 4: Pending Confirmation */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>सत्यापन हेतु लंबित (Pending)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {metrics.pendingTotalCount} <span className="text-xs font-normal text-slate-400">GPs</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300">
            मैनुअल पुष्टि प्रतीक्षित
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
                6.82% पूर्ण
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
      {/* 4. FILTER & SEARCH TOOLBAR */}
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
              onClick={() => setSelectedStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-400 hover:bg-amber-950/40'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>लंबित ({metrics.pendingTotalCount})</span>
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
      {/* 5. INTERACTIVE TABLE WITH 1-CLICK CONFIRMATION BUTTONS */}
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
                  पंचायत निर्णय ऐप स्थिति (मैनुअल पुष्टि)
                </th>
                <th className="py-3 px-3 text-center">अपलोड दिनांक</th>
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
                  const isJustUpdated = justUpdatedId === r.id;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        status === 'captured' ? 'bg-emerald-950/10' : ''
                      } ${isJustUpdated ? 'ring-2 ring-emerald-500/80 bg-emerald-950/30' : ''}`}
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
                          {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          पर्यवेक्षक: {r.supervisorOfficerUnicode || '—'}
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

                      {/* Interactive Manual Confirmation Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 shadow-inner">
                          {/* Button 1: Captured */}
                          <button
                            onClick={() => handleStatusChange(r.id, 'captured')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              status === 'captured'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 scale-105'
                                : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                            }`}
                            title="सत्यापित करें: पंचायत निर्णय ऐप पर अपलोड हो चुका है"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>सत्यापित (Captured)</span>
                          </button>

                          {/* Button 2: Pending */}
                          <button
                            onClick={() => handleStatusChange(r.id, 'pending')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              status === 'pending'
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40 scale-105'
                                : 'text-slate-400 hover:text-amber-300 hover:bg-amber-950/40'
                            }`}
                            title="लंबित: ऐप पर अपलोड की पुष्टि प्रतीक्षित है"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>लंबित (Pending)</span>
                          </button>

                          {/* Button 3: Not Captured */}
                          <button
                            onClick={() => handleStatusChange(r.id, 'not_captured')}
                            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              status === 'not_captured'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 scale-105'
                                : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/40'
                            }`}
                            title="अपलोड नहीं हुआ है"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>नहीं</span>
                          </button>
                        </div>
                      </td>

                      {/* Captured / Upload Date */}
                      <td className="py-3 px-3 text-center text-xs font-mono">
                        {status === 'captured' ? (
                          <span className="text-emerald-400 font-bold">
                            {formatDateHi(r.panchayatNirnayCapturedDate || r.meetingDate)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
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
