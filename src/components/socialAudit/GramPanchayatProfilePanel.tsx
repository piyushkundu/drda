'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { 
  X, Building2, Calendar, User, Phone, ShieldCheck, CheckCircle2, 
  AlertTriangle, Clock, Edit3, Check, FileSpreadsheet, Smartphone, 
  Users, ChevronRight, History, ArrowLeft, Printer, ExternalLink,
  Layers, MapPin, AlertCircle, Lock
} from 'lucide-react';
import { SocialAuditRecord } from '@/types/socialAudit';

export default function GramPanchayatProfilePanel() {
  const { 
    selectedGPForProfile, 
    closeGPProfile, 
    asOfDate, 
    fontViewMode,
    isEditMode,
    openEditModal,
    openCompletionModal,
    canCompleteMeeting,
    markCompleted,
    updatePanchayatNirnayStatus,
    updateMisStatus,
    setActiveTab,
    nsapRecords,
    activityLogs
  } = useSocialAuditStore();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'meeting' | 'nirnay' | 'mis' | 'nsap' | 'history'>('overview');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedGPForProfile) {
        closeGPProfile();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGPForProfile, closeGPProfile]);

  // Lock body scroll when open
  useEffect(() => {
    if (selectedGPForProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedGPForProfile]);

  if (!selectedGPForProfile) return null;

  const r = selectedGPForProfile;

  // Determine meeting completion
  const isCompleted = r.status === 'completed' || 
    (r.meetingDate <= asOfDate && (!r.isAmended || r.gpNameUnicode?.includes('खेड़की') || r.gpNameUnicode?.includes('खड़की')));
  const isAmended = Boolean(r.isAmended);
  const isUpcoming = !isCompleted && r.meetingDate > asOfDate;
  const isOverdue = !isCompleted && r.meetingDate <= asOfDate;

  // Find related NSAP record
  const matchingNsap = nsapRecords.find(
    (n) => n.id === r.id || n.rosterRecordId === r.id || n.gpNameUnicode === r.gpNameUnicode
  );

  // Related Activity logs for this GP
  const relatedLogs = activityLogs.filter(
    (log) => log.recordId === r.id || (log.gpName && log.gpName.includes(r.gpNameUnicode))
  );

  const formatDateHi = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dStr;
    }
  };

  const copyPhone = (phone: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const renderText = (unicode: string, kruti: string) => {
    if (fontViewMode === 'krutidev') {
      return <span className="font-kruti">{kruti || unicode}</span>;
    }
    if (fontViewMode === 'dual' && kruti && kruti !== unicode) {
      return (
        <span className="flex flex-col">
          <span>{unicode}</span>
          <span className="text-[10px] text-slate-400 font-kruti font-normal">{kruti}</span>
        </span>
      );
    }
    return <span>{unicode}</span>;
  };

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      {/* Dimmed backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeGPProfile}
      />

      {/* Slide-over panel (Desktop: right side 640px, Mobile: full-screen) */}
      <div className="relative w-full max-w-full md:max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overflow-hidden">
        
        {/* =================================================================== */}
        {/* TOP HEADER BAR */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shrink-0 shadow-md">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={closeGPProfile}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="बंद करें (Esc)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs uppercase tracking-wider text-blue-300 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-300" />
                ग्राम पंचायत विवरण प्रोफाइल
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {!isEditMode ? (
                <button
                  disabled
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-not-allowed border border-white/20"
                  title="संपादन करने के लिए पहले Header से Edit Mode ON करें।"
                >
                  <Lock className="w-3 h-3 text-rose-300" />
                  <span>Read Only</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    closeGPProfile();
                    openEditModal(r);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>संपादित करें</span>
                </button>
              )}
              <button
                onClick={closeGPProfile}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Title & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  क्र० सं० {r.sno || '-'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/20">
                  {r.block === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-1 flex items-center gap-2">
                <span>वित्तीय वर्ष: <strong>2026-27</strong></span>
                <span>•</span>
                <span>जनपद: <strong>बागपत, उत्तर प्रदेश</strong></span>
              </p>
            </div>

            {/* Status Badge */}
            <div className="shrink-0 flex items-center gap-1.5">
              {isAmended && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/40">
                  संशोधित
                </span>
              )}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  सम्पन्न
                </span>
              ) : isOverdue ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/50">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  लंबित
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/50">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  प्रस्तावित
                </span>
              )}
            </div>
          </div>

          {/* Quick Sub-navigation tabs */}
          <div className="flex items-center gap-1 mt-4 pt-3 border-t border-white/10 overflow-x-auto scrollbar-none text-xs font-medium">
            {[
              { id: 'overview', label: 'सामान्य विवरण' },
              { id: 'meeting', label: 'बैठक व रोस्टर' },
              { id: 'nirnay', label: 'पंचायत निर्णय' },
              { id: 'mis', label: 'MIS फीडिंग' },
              { id: 'nsap', label: 'NSAP पेंशन' },
              { id: 'history', label: `इतिहास (${relatedLogs.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* =================================================================== */}
        {/* MAIN SCROLLABLE CONTENT BODY */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/70 scrollbar-thin">
          
          {/* TAB 1: OVERVIEW */}
          {(activeSubTab === 'overview' || activeSubTab === 'meeting') && (
            <div className="space-y-4">
              {/* Meeting Status Highlight Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    सोशल ऑडिट बैठक स्थिति
                  </span>
                  {!isEditMode ? (
                    <button
                      disabled
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                      title="संपादन करने के लिए पहले Header से Edit Mode ON करें।"
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                      <span>Read Only</span>
                    </button>
                  ) : isCompleted ? (
                    <button
                      onClick={() => {
                        if (confirm(`क्या आप ${r.gpNameUnicode} की बैठक को पुनः प्रस्तावित करना चाहते हैं?`)) {
                          markCompleted(r.id, false);
                        }
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                      title="सम्पन्न (पुनः प्रस्तावित करने हेतु क्लिक करें)"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>सम्पन्न चिन्हित है</span>
                    </button>
                  ) : (() => {
                    const dateCheck = canCompleteMeeting(r);
                    if (!dateCheck.canComplete) {
                      return (
                        <button
                          disabled
                          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                          title={dateCheck.errorMessage || 'निर्धारित तिथि से पूर्व सम्पन्न नहीं किया जा सकता'}
                        >
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>तिथि पूर्व लॉक (लंबित)</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => openCompletionModal(r)}
                        className="px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>सम्पन्न मार्क करें</span>
                      </button>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">बैठक तिथि</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                      {formatDateHi(r.meetingDate)}
                    </div>
                    {r.isAmended && r.originalMeetingDate && (
                      <div className="text-[10px] text-rose-500 line-through mt-0.5">
                        पूर्व: {formatDateHi(r.originalMeetingDate)}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">प्रारम्भ तिथि</div>
                    <div className="text-sm font-black text-slate-800 mt-0.5 font-mono">
                      {formatDateHi(r.startDate)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">अभिलेख सत्यापन</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">बैठक स्थल व समय</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {r.venueUnicode || 'ग्राम पंचायत सचिवालय'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {r.timeUnicode || 'प्रातः 11:00 बजे'}
                    </div>
                  </div>
                </div>

                {/* Amendment Alert if amended */}
                {r.isAmended && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>रोस्टर संशोधन विवरण</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      पूर्व बी०आर०पी० (हरिकिशन) के कार्यमुक्त होने के कारण मूल बैठक तिथि {formatDateHi(r.originalMeetingDate)} को संशोधित कर {formatDateHi(r.meetingDate)} नियत किया गया।
                    </p>
                  </div>
                )}
              </div>

              {/* BRP & Team Officers Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <User className="w-3.5 h-3.5 text-indigo-700" />
                  उत्तरदायी अधिकारी एवं बी०आर०पी०
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* BRP Details */}
                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                      ब्लॉक रिसोर्स पर्सन (BRP)
                    </div>
                    <div className="text-sm font-black text-indigo-950">
                      {r.brpName || r.brpUnicode}
                    </div>
                    {r.brpPhone ? (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${r.brpPhone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs shadow-xs"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{r.brpPhone}</span>
                        </a>
                        <button
                          onClick={() => copyPhone(r.brpPhone)}
                          className="text-[10px] text-indigo-700 hover:underline font-medium"
                        >
                          {copiedPhone ? 'कॉपी हुआ!' : 'कॉपी करें'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">फोन नंबर उपलब्ध नहीं</div>
                    )}
                  </div>

                  {/* Supervisor Details */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      जनपद स्तरीय पर्यवेक्षक अधिकारी
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {renderText(r.supervisorOfficerUnicode, r.supervisorOfficerKrutiDev)}
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    सोशल ऑडिट टीम सदस्य
                  </div>
                  <div className="text-xs font-medium text-slate-800 leading-relaxed">
                    {renderText(r.teamMembersUnicode, r.teamMembersKrutiDev)}
                  </div>
                </div>
              </div>

              {/* Covered Schemes */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                  आच्छादित शासकीय योजनाएं
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    r.hasNSAP 
                      ? 'bg-purple-50 text-purple-800 border-purple-200 shadow-2xs' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                  }`}>
                    {r.hasNSAP ? '✓ NSAP राष्ट्रीय सामाजिक सहायता' : '✕ NSAP'}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    r.hasMGNREGA 
                      ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-2xs' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                  }`}>
                    {r.hasMGNREGA ? '✓ महात्मा गांधी नरेगा' : '✕ नरेगा'}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    r.hasPMAYG 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                  }`}>
                    {r.hasPMAYG ? '✓ प्रधानमंत्री आवास योजना (ग्रा०)' : '✕ आवास'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PANCHAYAT NIRNAY */}
          {(activeSubTab === 'overview' || activeSubTab === 'nirnay') && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    पंचायत निर्णय ऐप स्थिति (R 9.6.2)
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  r.panchayatNirnayStatus === 'captured'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {r.panchayatNirnayStatus === 'captured' ? '🟢 अपलोड (Captured)' : '🟠 अपलोड लंबित'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-semibold">ऐप अपलोड दिनांक</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                    {r.panchayatNirnayCapturedDate ? formatDateHi(r.panchayatNirnayCapturedDate) : 'अभिलेख लंबित'}
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-semibold">अधिकारी मैपिंग</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {r.isMappedInPanchayatNirnay ? 'हाँ (सत्यापित)' : 'स्वचालित'}
                  </div>
                </div>
              </div>

              {/* Quick Nirnay Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                {!isEditMode ? (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                    title="संपादन करने के लिए पहले Header से Edit Mode ON करें।"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>स्थिति संपादन लॉक (Read Only)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => updatePanchayatNirnayStatus(
                      r.id, 
                      r.panchayatNirnayStatus === 'captured' ? 'pending' : 'captured'
                    )}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-colors"
                  >
                    {r.panchayatNirnayStatus === 'captured' ? 'लंबित में बदलें' : '✓ अपलोड चिन्हित करें'}
                  </button>
                )}
                <button
                  onClick={() => {
                    closeGPProfile();
                    setActiveTab('nirnay');
                  }}
                  className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
                >
                  <span>पंचायत निर्णय ट्रैकर में देखें</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MIS AUDIT FEEDING */}
          {(activeSubTab === 'overview' || activeSubTab === 'mis') && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    MIS सोशल ऑडिट फीडिंग स्थिति (R 9.1.3)
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  r.misStatus === 'fed'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {r.misStatus === 'fed' ? '🟢 पोर्टल पर फीडेड' : '🟠 फीडिंग लंबित'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-semibold">MIS फीडिंग दिनांक</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                    {r.misFedDate ? formatDateHi(r.misFedDate) : 'फीड होना शेष'}
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-semibold">कॉलम 8 ऑडिट काउंट</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                    {r.misAuditedCount || (r.misStatus === 'fed' ? '1' : '0')}
                  </div>
                </div>
              </div>

              {/* Quick MIS Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                {!isEditMode ? (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                    title="संपादन करने के लिए पहले Header से Edit Mode ON करें।"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>फीडिंग संपादन लॉक (Read Only)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => updateMisStatus(
                      r.id, 
                      r.misStatus === 'fed' ? 'pending' : 'fed'
                    )}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-colors"
                  >
                    {r.misStatus === 'fed' ? 'लंबित में बदलें' : '✓ पोर्टल पर फीडेड मार्क करें'}
                  </button>
                )}
                <button
                  onClick={() => {
                    closeGPProfile();
                    setActiveTab('mis-feeding');
                  }}
                  className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                >
                  <span>MIS फीडिंग ट्रैकर में देखें</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: NSAP PENSION DATA */}
          {(activeSubTab === 'overview' || activeSubTab === 'nsap') && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    NSAP पेंशन लाभार्थी विवरण
                  </span>
                </div>
                {matchingNsap && (
                  <span className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                    {matchingNsap.totalBeneficiaries} कुल लाभार्थी
                  </span>
                )}
              </div>

              {matchingNsap ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                      <div className="text-[10px] text-purple-900 font-semibold uppercase">कुल लाभार्थी</div>
                      <div className="text-base font-black text-purple-950 mt-0.5">{matchingNsap.totalBeneficiaries}</div>
                    </div>
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                      <div className="text-[10px] text-emerald-900 font-semibold uppercase">सत्यापित</div>
                      <div className="text-base font-black text-emerald-900 mt-0.5">{matchingNsap.verifiedTotal || matchingNsap.verifiedDirect}</div>
                    </div>
                    <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
                      <div className="text-[10px] text-rose-900 font-semibold uppercase">मृतक / अपात्र</div>
                      <div className="text-base font-black text-rose-900 mt-0.5">
                        {matchingNsap.beneficiaries.filter(b => b.category === 'deceased' || b.category === 'ineligible').length}
                      </div>
                    </div>
                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                      <div className="text-[10px] text-amber-900 font-semibold uppercase">अपुष्ट / शेष</div>
                      <div className="text-base font-black text-amber-900 mt-0.5">
                        {matchingNsap.unverifiedCount || 0}
                      </div>
                    </div>
                  </div>

                  {matchingNsap.financialIrregularityAmount && matchingNsap.financialIrregularityAmount > 0 ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                      वित्तीय अनियमितता: <strong>₹{matchingNsap.financialIrregularityAmount.toLocaleString('en-IN')}</strong> ({matchingNsap.irregularityNotes || 'वसूली योग्य'})
                    </div>
                  ) : null}

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      सत्यापन रजिस्टर में {matchingNsap.beneficiaries.length} लाभार्थी प्रविष्ट हैं
                    </span>
                    <button
                      onClick={() => {
                        closeGPProfile();
                        setActiveTab('nsap-data');
                      }}
                      className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                    >
                      <span>NSAP डेटा रजिस्टर खोलें</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    इस ग्राम पंचायत का विस्तृत NSAP पेंशन लाभार्थी डेटा अभी दर्ज नहीं हुआ है।
                  </p>
                  <button
                    onClick={() => {
                      closeGPProfile();
                      setActiveTab('nsap-data');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                  >
                    + NSAP डेटा प्रविष्टि करें
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTIVITY HISTORY */}
          {(activeSubTab === 'overview' || activeSubTab === 'history') && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    गतिविधि इतिहास एवं ऑडिट ट्रेल
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {relatedLogs.length} घटनाएं
                </span>
              </div>

              {relatedLogs.length > 0 ? (
                <div className="space-y-2.5">
                  {relatedLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-3 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          {log.actionLabel}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleString('hi-IN')}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {log.details}
                      </p>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>अधिकारी: <strong>{log.userName}</strong></span>
                        <span className="uppercase text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          {log.module}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
                  इस ग्राम पंचायत के लिए कोई पृथक गतिविधि लॉग अभी उपलब्ध नहीं है।
                </div>
              )}
            </div>
          )}

        </div>

        {/* =================================================================== */}
        {/* BOTTOM FOOTER BAR */}
        {/* =================================================================== */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="प्रिंट करें"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">प्रिंट प्रोफाइल</span>
          </button>

          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                title="संपादन करने के लिए पहले Header से Edit Mode ON करें।"
              >
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>संपादित करें (Lock)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  closeGPProfile();
                  openEditModal(r);
                }}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>विवरण संपादित करें</span>
              </button>
            )}
            <button
              onClick={closeGPProfile}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              बंद करें
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

