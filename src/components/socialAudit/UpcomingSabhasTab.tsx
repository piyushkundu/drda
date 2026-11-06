'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { renderAuditText } from '@/lib/renderAuditText';
import { SocialAuditRecord } from '@/types/socialAudit';
import { matchesBRP } from '@/lib/brpHelper';
import { getEffectiveMeetingDate } from '@/lib/dateResolution';
import { 
  Calendar, Clock, MapPin, Phone, Users, Shield, 
  AlertCircle, CheckCircle2, ChevronRight, Sparkles,
  Layers, Check, AlertTriangle, Search, Filter, 
  ChevronDown, BarChart3, ArrowRight, Lock, Ban, RotateCcw,
  FileImage
} from 'lucide-react';
import UpcomingMeetingsImageModal from './UpcomingMeetingsImageModal';

export default function UpcomingSabhasTab() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { 
    records, 
    selectedBRP,
    selectedBlock,
    dateRange,
    asOfDate, 
    isLiveSync,
    liveDelhiTime,
    liveDelhiDate,
    fontViewMode, 
    isEditMode,
    openEditModal, 
    openCompletionModal,
    openCancelModal,
    openRescheduleModal,
    canCompleteMeeting,
    markCompleted,
    setActiveTab,
    setSelectedBlock 
  } = useSocialAuditStore();

  const [activeSubView, setActiveSubView] = useState<'upcoming' | 'reschedule_pending'>('upcoming');
  const [isImageExportModalOpen, setIsImageExportModalOpen] = useState(false);
  const [filterBlock, setFilterBlock] = useState<'all' | 'Baghpat' | 'Baraut'>('all');
  const [filterScheme, setFilterScheme] = useState<'all' | 'nsap' | 'mgnrega'>('all');
  const [filterOnlyAmended, setFilterOnlyAmended] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Helper to calculate days diff from asOfDate with exact calendar boundaries
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

  // All upcoming meetings (effective meeting date >= asOfDate, not completed, and not cancelled) filtered by global filters (BRP, Block, Date Range)
  const allUpcoming = useMemo(() => {
    return records
      .filter((r) => {
        const effDate = getEffectiveMeetingDate(r);
        if (effDate < asOfDate || r.status === 'completed' || r.status === 'cancelled' || r.rescheduleStatus === 'pending') return false;
        if (!matchesBRP(r, selectedBRP)) return false;
        if (selectedBlock !== 'all' && r.block !== selectedBlock) return false;
        if (dateRange && (dateRange.startDate || dateRange.endDate)) {
          if (dateRange.startDate && effDate < dateRange.startDate) return false;
          if (dateRange.endDate && effDate > dateRange.endDate) return false;
        }
        return true;
      })
      .sort((a, b) => getEffectiveMeetingDate(a).localeCompare(getEffectiveMeetingDate(b)));
  }, [records, asOfDate, selectedBRP, selectedBlock, dateRange]);

  // Cancelled meetings awaiting reschedule (rescheduleStatus === 'pending' or status === 'cancelled')
  const cancelledMeetings = useMemo(() => {
    return records
      .filter((r) => {
        if (r.status !== 'cancelled' && r.rescheduleStatus !== 'pending') return false;
        if (!matchesBRP(r, selectedBRP)) return false;
        if (selectedBlock !== 'all' && r.block !== selectedBlock) return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = a.cancellationDetails?.cancelledAt || getEffectiveMeetingDate(a);
        const dateB = b.cancellationDetails?.cancelledAt || getEffectiveMeetingDate(b);
        return dateB.localeCompare(dateA);
      });
  }, [records, selectedBRP, selectedBlock]);

  // Counts
  const upcomingCountTotal = allUpcoming.length;
  const upcomingBaghpatCount = allUpcoming.filter(r => r.block === 'Baghpat').length;
  const upcomingBarautCount = allUpcoming.filter(r => r.block === 'Baraut').length;
  const upcomingAmendedCount = allUpcoming.filter(r => r.isAmended).length;

  // Filtered upcoming list
  const filteredUpcoming = useMemo(() => {
    return allUpcoming.filter(r => {
      // Block filter
      if (filterBlock !== 'all' && r.block !== filterBlock) return false;
      // Scheme filter
      if (filterScheme === 'nsap' && !r.hasNSAP) return false;
      if (filterScheme === 'mgnrega' && !r.hasMGNREGA) return false;
      // Only amended
      if (filterOnlyAmended && !r.isAmended) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchGp = r.gpNameUnicode.toLowerCase().includes(q) || r.gpNameRaw.toLowerCase().includes(q);
        const matchBrp = (r.brpName || '').toLowerCase().includes(q) || (r.brpPhone && r.brpPhone.includes(q));
        const matchOfficer = (r.supervisorOfficerUnicode || '').toLowerCase().includes(q);
        if (!matchGp && !matchBrp && !matchOfficer) return false;
      }
      return true;
    });
  }, [allUpcoming, filterBlock, filterScheme, filterOnlyAmended, searchQuery]);

  // Meetings scheduled today (asOfDate) that are active (derived directly from allUpcoming to strictly exclude cancelled and completed)
  const todayMeetings = useMemo(() => {
    return allUpcoming
      .filter((r) => getEffectiveMeetingDate(r) === asOfDate)
      .sort((a, b) => a.block.localeCompare(b.block));
  }, [allUpcoming, asOfDate]);

  // Primary batch to feature at top:
  // If today has active meetings, use todayMeetings.
  // Else, use the earliest upcoming active date meetings.
  const { primaryMeetings, isTodayBatch, targetDate } = useMemo(() => {
    if (todayMeetings.length > 0) {
      return {
        primaryMeetings: todayMeetings,
        isTodayBatch: true,
        targetDate: asOfDate
      };
    }

    if (allUpcoming.length > 0) {
      const earliestDate = getEffectiveMeetingDate(allUpcoming[0]);
      const earliestBatch = allUpcoming.filter(r => getEffectiveMeetingDate(r) === earliestDate);
      return {
        primaryMeetings: earliestBatch,
        isTodayBatch: earliestDate === asOfDate,
        targetDate: earliestDate
      };
    }

    return {
      primaryMeetings: [] as SocialAuditRecord[],
      isTodayBatch: false,
      targetDate: ''
    };
  }, [todayMeetings, allUpcoming, asOfDate]);

  // All subsequent meetings excluding the primaryMeetings
  const subsequentMeetings = useMemo(() => {
    const primaryIds = new Set(primaryMeetings.map(r => r.id));
    return filteredUpcoming.filter(m => !primaryIds.has(m.id));
  }, [filteredUpcoming, primaryMeetings]);

  // Universal font renderer respecting fontViewMode with bidirectional fallback
  const renderText = (unicodeText?: string, krutiText?: string) => {
    return renderAuditText(fontViewMode, unicodeText, krutiText);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. UPCOMING HEADER WITH STATS PILLS & QUICK DASHBOARD LINK */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white/90 border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>आगामी सोशल ऑडिट सभाएं</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {upcomingCountTotal} शेष
                </span>
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                विकास खण्ड बागपत एवं बड़ौत की आगामी ग्राम सभा बैठकों का प्रशासनिक विवरण
              </p>
            </div>
          </div>
        </div>

        {/* Quick Nav & Counters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span>बागपत:</span>
            <strong className="text-blue-700 font-bold">{upcomingBaghpatCount}</strong>
            <span className="text-slate-300 mx-1">|</span>
            <span>बड़ौत:</span>
            <strong className="text-indigo-700 font-bold">{upcomingBarautCount}</strong>
            <span className="text-slate-300 mx-1">|</span>
            <span>संशोधित:</span>
            <strong className="text-amber-700 font-bold">{upcomingAmendedCount}</strong>
            {cancelledMeetings.length > 0 && (
              <>
                <span className="text-slate-300 mx-1">|</span>
                <span className="text-rose-600 font-bold">निरस्त: {cancelledMeetings.length}</span>
              </>
            )}
          </div>

          <button
            onClick={() => setIsImageExportModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            title={targetDate ? `अगली बैठक दिनांक (${formatDateHi(targetDate)}) की इमेज बनाएं` : 'बैठक की इमेज बनाएं'}
          >
            <FileImage className="w-4 h-4 text-emerald-100" />
            <span>अगली बैठक की इमेज बनाएं</span>
            {targetDate && (
              <span className="text-[10px] bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded font-mono">
                {formatDateHi(targetDate)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <BarChart3 className="w-4 h-4" />
            <span>डैशबोर्ड एवं तुलनात्मक मैट्रिक्स</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-view Navigation Tabs: Active Upcoming vs Reschedule Pending */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubView('upcoming')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubView === 'upcoming'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>सक्रिय आगामी सभाएं</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
            activeSubView === 'upcoming' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {upcomingCountTotal}
          </span>
        </button>

        <button
          onClick={() => setActiveSubView('reschedule_pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubView === 'reschedule_pending'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>पुनर्निर्धारण लंबित (Reschedule Pending)</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
            cancelledMeetings.length > 0 
              ? activeSubView === 'reschedule_pending'
                ? 'bg-rose-800 text-white'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {cancelledMeetings.length}
          </span>
        </button>
      </div>

      {activeSubView === 'reschedule_pending' ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-950">पुनर्निर्धारण लंबित बैठकें (Awaiting Reschedule)</h3>
              <p className="mt-1 text-amber-800 leading-relaxed">
                ये वे ग्राम पंचायत बैठकें हैं जिन्हें किसी कारणवश निरस्त किया गया है। जब तक इनकी नई तिथि निर्धारित नहीं होती, ये आगामी सक्रिय बैठकों में प्रदर्शित नहीं होंगी और <strong>MIS फीडिंग हेतु देय नहीं होंगी</strong>। नई तिथि निर्धारित करते ही ये पुनः रोस्टर कैलेंडर व आगामी सूची में सम्मिलित हो जाएंगी।
              </p>
            </div>
          </div>

          {cancelledMeetings.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 shadow-sm space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-700">कोई भी पुनर्निर्धारण लंबित बैठक नहीं है।</p>
              <p className="text-xs text-slate-400">सभी निर्धारित बैठकें सक्रिय व रोस्टर के अनुरूप हैं।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cancelledMeetings.map((sabha) => (
                <div
                  key={sabha.id}
                  className="bg-white rounded-2xl border-2 border-rose-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <Ban className="w-3 h-3 text-rose-600" />
                        निरस्त बैठक
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {sabha.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ग्राम पंचायत</div>
                      <h3 className="text-lg font-black text-slate-900">
                        {renderText(sabha.gpNameUnicode, sabha.gpNameKrutiDev)}
                      </h3>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>पूर्व निर्धारित तिथि:</span>
                        <span className="font-bold text-slate-900 line-through">
                          {formatDateHi(sabha.cancellationDetails?.previousMeetingDate || sabha.cancellationDetails?.previousDate || sabha.meetingDate)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-slate-600 gap-2">
                        <span>निरस्तीकरण का कारण:</span>
                        <span className="font-bold text-rose-700 text-right">
                          {sabha.cancellationDetails?.reason || 'अपरिहार्य कारण'}
                        </span>
                      </div>
                      {sabha.cancellationDetails?.remarks && (
                        <div className="text-[11px] text-slate-500 italic border-t border-slate-200/80 pt-1">
                          टिप्पणी: "{sabha.cancellationDetails.remarks}"
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-1 flex items-center justify-between">
                        <span>निरस्त दिनांक:</span>
                        <span>{sabha.cancellationDetails?.cancelledAt || 'ज्ञात नहीं'}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">BRP:</span>
                        <span className="font-bold text-slate-800">
                          {renderText(sabha.brpName || sabha.brpUnicode, sabha.brpKrutiDev)}
                        </span>
                      </div>
                      {sabha.brpPhone && (
                        <div className="text-[11px] text-blue-700 font-mono font-bold">
                          📞 {sabha.brpPhone}
                        </div>
                      )}
                      <div className="text-[11px] truncate text-slate-500" title={sabha.teamMembersUnicode}>
                        टीम: {sabha.teamMembersUnicode}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => openRescheduleModal(sabha)}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                      <span>नई बैठक तिथि निर्धारित करें</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <>

      {/* ========================================================================= */}
      {/* 2. TODAY'S / NEXT UPCOMING MEETINGS SECTION */}
      {/* ========================================================================= */}
      {primaryMeetings.length === 1 ? (
        // CASE A: ONLY 1 MEETING TODAY -> SHOW LARGE HERO CARD
        (() => {
          const nextSabha = primaryMeetings[0];
          const diff = getDaysDiff(getEffectiveMeetingDate(nextSabha));
          return (
            <div className="relative overflow-hidden rounded-3xl bg-white/95 border border-slate-200/90 p-6 md:p-8 shadow-sm backdrop-blur-xl">
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Left: Meeting Details */}
                <div className="space-y-4 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      {diff === 0 ? 'आज होने वाली ग्राम सभा (TODAY)' : 'अगली होने वाली ग्राम सभा (NEXT UPCOMING)'}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      {nextSabha.blockHindi}
                    </span>

                    {nextSabha.isAmended && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        संशोधित रोस्टर
                      </span>
                    )}

                    {nextSabha.hasNSAP && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        NSAP पेंशन ऑडिट
                      </span>
                    )}
                  </div>

                  {/* Village Name & Meeting Date */}
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">ग्राम पंचायत</div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-0.5 tracking-tight flex items-center gap-3">
                      {renderText(nextSabha.gpNameUnicode, nextSabha.gpNameKrutiDev)}
                    </h2>
                    {nextSabha.isAmended && nextSabha.originalMeetingDate && (
                      <div className="mt-1 text-xs text-amber-800 flex items-center gap-2">
                        <span className="line-through text-slate-400">मूल तिथि: {formatDateHi(nextSabha.originalMeetingDate)}</span>
                        <span className="font-bold">→ नई संशोधित तिथि: {formatDateHi(getEffectiveMeetingDate(nextSabha))}</span>
                        <span className="text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          BRP कार्यमुक्त/परिवर्तन के कारण
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Key Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    {/* Date & Time */}
                    <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <Calendar className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">बैठक दिनांक एवं समय</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {formatDateHi(getEffectiveMeetingDate(nextSabha))} ({renderText(nextSabha.timeUnicode, nextSabha.timeKrutiDev)})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          प्रारम्भ: {formatDateHi(nextSabha.startDate)}
                        </div>
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <MapPin className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">बैठक का स्थान</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {renderText(nextSabha.venueUnicode, nextSabha.venueKrutiDev)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ग्राम पंचायत {nextSabha.gpNameUnicode}
                        </div>
                      </div>
                    </div>

                    {/* BRP with Phone */}
                    <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <Phone className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">आवंटित बी०आर०पी०</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {renderText(nextSabha.brpName || nextSabha.brpUnicode, nextSabha.brpKrutiDev)}
                        </div>
                        {nextSabha.brpPhone && (
                          <a 
                            href={`tel:${nextSabha.brpPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 mt-0.5 font-mono font-bold"
                          >
                            📞 {nextSabha.brpPhone}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Supervisory Officer */}
                    <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <Shield className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">जनपद स्तरीय पर्यवेक्षक अधिकारी</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
                          {renderText(nextSabha.supervisorOfficerUnicode, nextSabha.supervisorOfficerKrutiDev)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold mb-1">
                      <Users className="w-3.5 h-3.5 text-indigo-700" />
                      <span>सोशल ऑडिट टीम सदस्य (VRPs/सदस्य):</span>
                    </div>
                    <div className="text-slate-700 leading-relaxed font-medium">
                      {renderText(nextSabha.teamMembersUnicode, nextSabha.teamMembersKrutiDev)}
                    </div>
                  </div>

                  {/* Schemes */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 font-bold">ऑडिट योजनाएं:</span>
                    <span className="text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                      {renderText(nextSabha.schemeUnicode, nextSabha.schemeKrutiDev)}
                    </span>
                  </div>
                </div>

                {/* Right: Countdown & Quick Action Box */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 text-center w-full lg:w-72 shrink-0 shadow-sm">
                  <Clock className="w-8 h-8 text-blue-700 mb-2 animate-bounce" />
                  <div className="text-xs text-blue-900 font-bold uppercase tracking-wider">बैठक स्थिति</div>
                  
                  <div className="my-2">
                    {diff === 0 ? (
                      <>
                        <span className="text-3xl font-black text-rose-600 animate-pulse">आज है!</span>
                        <p className="text-xs text-slate-600 mt-1 font-medium">1:00 बजे बैठक प्रारम्भ होगी</p>
                      </>
                    ) : diff === 1 ? (
                      <>
                        <span className="text-3xl font-black text-amber-600">कल होगी!</span>
                        <p className="text-xs text-slate-600 mt-1 font-medium">तैयारी पूर्ण करें</p>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-black text-blue-700">{diff}</span>
                        <span className="text-sm font-bold text-slate-600 block">दिन शेष</span>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 mb-4 font-medium">
                    दिनांक: <span className="font-bold text-slate-900">{formatDateHi(getEffectiveMeetingDate(nextSabha))}</span>
                  </div>

                  {isEditMode && (
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => openEditModal(nextSabha)}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95"
                      >
                        संशोधित / संपादित करें
                      </button>

                      {(() => {
                        const dateCheck = canCompleteMeeting(nextSabha);
                        if (!dateCheck.canComplete) {
                          return (
                            <button
                              disabled
                              className="w-full bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold py-2 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                              title={dateCheck.errorMessage || 'निर्धारित तिथि से पहले बैठक को सम्पन्न नहीं किया जा सकता।'}
                            >
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                              <span>तिथि पूर्व लॉक (लंबित)</span>
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => openCompletionModal(nextSabha)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>सम्पन्न मार्क करें</span>
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => openCancelModal(nextSabha)}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        title="अपरिहार्य कारणों से बैठक निरस्त करें"
                      >
                        <Ban className="w-3.5 h-3.5 text-white" />
                        <span>बैठक निरस्त करें</span>
                      </button>

                      <button
                        onClick={() => setIsImageExportModalOpen(true)}
                        className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer mt-1"
                        title="इस बैठक का WhatsApp पोस्टर / इमेज बनाएं"
                      >
                        <FileImage className="w-3.5 h-3.5 text-emerald-400" />
                        <span>बैठक इमेज बनाएं</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      ) : primaryMeetings.length > 1 ? (
        // CASE B: MORE THAN 1 MEETING TODAY -> SHOW COMPACT CARDS GRID SO ALL ARE VISIBLE SIDE-BY-SIDE
        <div className="rounded-3xl bg-white/95 border border-slate-200/90 p-5 md:p-6 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center animate-pulse shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>
                    {isTodayBatch ? 'आज होने वाली ग्राम सभाएं (TODAY\'S MEETINGS)' : `अगली होने वाली ग्राम सभाएं (${formatDateHi(targetDate)})`}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                    {primaryMeetings.length} ग्राम पंचायतें {isTodayBatch ? 'आज निर्धारित' : 'निर्धारित'}
                  </span>
                  {!isTodayBatch && (
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <span>आज ({formatDateHi(asOfDate)}) बैठक नहीं है</span>
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {isTodayBatch ? (
                    <>आज दिनांक <strong className="text-slate-800">{formatDateHi(targetDate)}</strong> को आयोजित होने वाली समस्त बैठकें</>
                  ) : (
                    <>आज के उपरांत निकटतम तिथि <strong className="text-slate-800">{formatDateHi(targetDate)}</strong> को आयोजित होने वाली समस्त बैठकें</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-medium">
                बागपत: <strong className="text-blue-700 font-bold">{primaryMeetings.filter(r => r.block === 'Baghpat').length}</strong> | बड़ौत: <strong className="text-indigo-700 font-bold">{primaryMeetings.filter(r => r.block === 'Baraut').length}</strong>
              </span>

              <button
                onClick={() => setIsImageExportModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                title="आज की बैठकों की इमेज बनाएं"
              >
                <FileImage className="w-3.5 h-3.5 text-emerald-100" />
                <span>इमेज बनाएं</span>
              </button>
            </div>
          </div>

          {/* Grid of Compact Cards for Today's Meetings (Never squeezed: 1 col mobile, 2 col tablet, 3 col desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {primaryMeetings.map((sabha) => {
              const diff = getDaysDiff(sabha.meetingDate);
              return (
                <div
                  key={sabha.id}
                  className="social-audit-glass-card bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Top Status & Block Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        sabha.block === 'Baghpat' 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}>
                        {sabha.blockHindi}
                      </span>

                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 animate-pulse flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rose-600" />
                        <span>{diff === 0 ? 'आज है!' : diff === 1 ? 'कल है!' : `${diff} दिन शेष`}</span>
                      </span>
                    </div>

                    {/* Gram Panchayat Name */}
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">ग्राम पंचायत</div>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">
                        {renderText(sabha.gpNameUnicode, sabha.gpNameKrutiDev)}
                      </h3>
                    </div>

                    {/* Badges: Amended & Schemes */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {sabha.isAmended && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>संशोधित (मूल: {formatDateHi(sabha.originalMeetingDate || '')})</span>
                        </span>
                      )}
                      {sabha.hasNSAP && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          NSAP पेंशन
                        </span>
                      )}
                    </div>

                    {/* Meeting Meta */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>{formatDateHi(getEffectiveMeetingDate(sabha))} ({renderText(sabha.timeUnicode, sabha.timeKrutiDev)})</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{renderText(sabha.venueUnicode, sabha.venueKrutiDev)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-600">BRP: <strong className="text-slate-900 font-bold">{renderText(sabha.brpName || sabha.brpUnicode, sabha.brpKrutiDev)}</strong></span>
                        {sabha.brpPhone && (
                          <a 
                            href={`tel:${sabha.brpPhone}`}
                            className="text-blue-700 hover:text-blue-900 font-mono font-bold"
                          >
                            📞 {sabha.brpPhone}
                          </a>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 truncate" title={sabha.supervisorOfficerUnicode}>
                        पर्यवेक्षक: {sabha.supervisorOfficerUnicode}
                      </div>

                      <div className="text-[10px] text-slate-500 truncate" title={sabha.teamMembersUnicode}>
                        टीम: {sabha.teamMembersUnicode}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons (Visible only in Edit Mode) */}
                  {isEditMode && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openEditModal(sabha)}
                        className="flex-1 min-w-[80px] bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold py-2 px-2.5 rounded-xl transition-all text-center"
                      >
                        संशोधित
                      </button>
                      {(() => {
                        const dateCheck = canCompleteMeeting(sabha);
                        if (!dateCheck.canComplete) {
                          return (
                            <button
                              disabled
                              className="bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold py-2 px-2.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-1"
                              title={dateCheck.errorMessage || 'निर्धारित तिथि से पहले सम्पन्न नहीं किया जा सकता'}
                            >
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                              <span>लंबित</span>
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => openCompletionModal(sabha)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>सम्पन्न</span>
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => openCancelModal(sabha)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95"
                        title="बैठक निरस्त करें"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>निरस्त</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 shadow-sm">
          चयनित संदर्भ तिथि {formatDateHi(asOfDate)} के पश्चात कोई आगामी बैठकें शेष नहीं हैं।
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FILTER TOOLBAR FOR SUBSEQUENT UPCOMING SABHAS */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">
              आगामी ग्राम सभाओं की सूची ({filteredUpcoming.length} बैठकें)
            </h3>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsImageExportModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="समस्त आगामी बैठकों की इमेज बनाएं"
            >
              <FileImage className="w-3.5 h-3.5 text-emerald-600" />
              <span>इमेज बनाएं</span>
            </button>

            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ग्राम पंचायत, BRP या अधिकारी खोजें..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          {/* Block Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterBlock('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterBlock === 'all' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              समस्त ब्लॉक ({allUpcoming.length})
            </button>
            <button
              onClick={() => setFilterBlock('Baghpat')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterBlock === 'Baghpat' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              बागपत ({upcomingBaghpatCount})
            </button>
            <button
              onClick={() => setFilterBlock('Baraut')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterBlock === 'Baraut' ? 'bg-indigo-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              बड़ौत ({upcomingBarautCount})
            </button>
          </div>

          {/* Scheme Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterScheme('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterScheme === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सभी योजनाएं
            </button>
            <button
              onClick={() => setFilterScheme('nsap')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterScheme === 'nsap' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NSAP पेंशन
            </button>
            <button
              onClick={() => setFilterScheme('mgnrega')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterScheme === 'mgnrega' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मनरेगा
            </button>
          </div>

          {/* Only Amended Toggle */}
          <button
            onClick={() => setFilterOnlyAmended(!filterOnlyAmended)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              filterOnlyAmended
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>केवल संशोधित ({upcomingAmendedCount})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. UPCOMING SCHEDULE GRID (1 col mobile, 2 col tablet, 3 col desktop) */}
      {/* ========================================================================= */}
      {subsequentMeetings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subsequentMeetings.map((sabha) => {
            const diff = getDaysDiff(getEffectiveMeetingDate(sabha));
            return (
              <div
                key={sabha.id}
                className={`social-audit-glass-card p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${
                  sabha.isAmended
                    ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400'
                    : 'bg-white border-slate-200 hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {sabha.blockHindi}
                    </span>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      diff === 0 
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse'
                        : diff === 1
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {diff === 0 ? 'आज' : diff === 1 ? 'कल' : `${diff} दिन शेष`}
                    </span>
                  </div>

                  <div className="text-base font-black text-slate-900">
                    {renderText(sabha.gpNameUnicode, sabha.gpNameKrutiDev)}
                  </div>

                  <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>बैठक: {formatDateHi(getEffectiveMeetingDate(sabha))} ({renderText(sabha.timeUnicode, sabha.timeKrutiDev)})</span>
                  </div>

                  {sabha.isAmended && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-2 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>संशोधित (मूल: {formatDateHi(sabha.originalMeetingDate || '')})</span>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">BRP:</span>
                      <span className="font-bold text-slate-900">
                        {renderText(sabha.brpName || sabha.brpUnicode, sabha.brpKrutiDev)}
                      </span>
                    </div>
                    {sabha.brpPhone && (
                      <div className="text-[10px] text-blue-700 font-mono font-bold">
                        📞 {sabha.brpPhone}
                      </div>
                    )}
                    <div className="text-slate-600 truncate" title={sabha.teamMembersUnicode}>
                      टीम: {sabha.teamMembersUnicode}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      पर्यवेक्षक: {sabha.supervisorOfficerUnicode}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isEditMode && (
                      <>
                        <button
                          onClick={() => openEditModal(sabha)}
                          className="text-xs text-blue-700 hover:text-blue-900 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                        >
                          संशोधित करें
                        </button>
                        {(() => {
                          const dateCheck = canCompleteMeeting(sabha);
                          if (!dateCheck.canComplete) {
                            return (
                              <button
                                disabled
                                className="text-xs text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-not-allowed flex items-center gap-1"
                                title={dateCheck.errorMessage || 'निर्धारित तिथि से पहले सम्पन्न नहीं किया जा सकता'}
                              >
                                <Lock className="w-3 h-3 text-rose-400" />
                                <span>लंबित</span>
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => openCompletionModal(sabha)}
                              className="text-xs text-white font-bold bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3 h-3 text-white" />
                              <span>सम्पन्न</span>
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => openCancelModal(sabha)}
                          className="text-xs text-rose-700 hover:text-rose-900 font-bold bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 active:scale-95"
                          title="बैठक निरस्त करें"
                        >
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>निरस्त</span>
                        </button>
                      </>
                    )}
                  </div>

                  {sabha.hasNSAP && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                      NSAP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2 shadow-sm">
          <p>कोई आगामी बैठक इस फ़िल्टर में नहीं मिली।</p>
          <button
            onClick={() => {
              setFilterBlock('all');
              setFilterScheme('all');
              setFilterOnlyAmended(false);
              setSearchQuery('');
            }}
            className="text-xs text-blue-700 hover:underline font-bold"
          >
            फ़िल्टर रीसेट करें
          </button>
        </div>
      )}
      </>
      )}

      {/* Upcoming Meetings All-in-One High-Res Poster Image Modal */}
      <UpcomingMeetingsImageModal
        isOpen={isImageExportModalOpen}
        onClose={() => setIsImageExportModalOpen(false)}
        filteredUpcomingRecords={filteredUpcoming}
        targetDate={targetDate}
      />
    </div>
  );
}
