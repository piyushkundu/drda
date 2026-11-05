'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SocialAuditRecord } from '@/types/socialAudit';
import { getEffectiveMeetingDate, formatDisplayDate, isMeetingAmended, getOriginalMeetingDate } from '@/lib/dateResolution';
import { renderAuditText } from '@/lib/renderAuditText';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { saveAs } from 'file-saver';
import { 
  X, Download, Share2, Sparkles, AlertCircle, Calendar, 
  MapPin, Clock, Users, Shield, Building2, Check, 
  Loader2, RefreshCw, Eye, CheckCircle2, FileImage, MessageSquare
} from 'lucide-react';

interface UpcomingMeetingsImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredUpcomingRecords?: SocialAuditRecord[];
}

/**
 * Strips any phone numbers from text strings to ensure strict privacy.
 */
function stripPhoneNumbers(text?: string): string {
  if (!text) return '';
  return text
    .replace(/(?:\+91[\-\s]?)?[6-9]\d{9}/g, '')
    .replace(/📞\s*/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function UpcomingMeetingsImageModal({
  isOpen,
  onClose,
  filteredUpcomingRecords
}: UpcomingMeetingsImageModalProps) {
  const { records, asOfDate, fontViewMode, liveDelhiDate, liveDelhiTime } = useSocialAuditStore();

  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);

  // Compute all active upcoming meetings (strictly excluding cancelled, completed, and past)
  const allUpcomingMeetings = useMemo(() => {
    return records
      .filter((r) => {
        const effDate = getEffectiveMeetingDate(r);
        if (effDate < asOfDate || r.status === 'completed' || r.status === 'cancelled' || r.rescheduleStatus === 'pending') {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateComp = getEffectiveMeetingDate(a).localeCompare(getEffectiveMeetingDate(b));
        if (dateComp !== 0) return dateComp;
        return a.block.localeCompare(b.block);
      });
  }, [records, asOfDate]);

  // Selected records to render based on scope
  const targetMeetings = useMemo(() => {
    if (exportScope === 'filtered' && filteredUpcomingRecords && filteredUpcomingRecords.length > 0) {
      return [...filteredUpcomingRecords].sort((a, b) => {
        const dateComp = getEffectiveMeetingDate(a).localeCompare(getEffectiveMeetingDate(b));
        if (dateComp !== 0) return dateComp;
        return a.block.localeCompare(b.block);
      });
    }
    return allUpcomingMeetings;
  }, [exportScope, filteredUpcomingRecords, allUpcomingMeetings]);

  const baghpatCount = useMemo(() => targetMeetings.filter(r => r.block === 'Baghpat').length, [targetMeetings]);
  const barautCount = useMemo(() => targetMeetings.filter(r => r.block === 'Baraut').length, [targetMeetings]);
  const amendedCount = useMemo(() => targetMeetings.filter(r => isMeetingAmended(r)).length, [targetMeetings]);

  // Clean renderText helper respecting fontViewMode
  const renderText = (unicodeText?: string, krutiText?: string) => {
    const cleanedUnicode = stripPhoneNumbers(unicodeText);
    const cleanedKruti = stripPhoneNumbers(krutiText);
    return renderAuditText(fontViewMode, cleanedUnicode, cleanedKruti);
  };

  // Generate Image via html2canvas
  const generatePosterImage = async () => {
    if (!posterRef.current || targetMeetings.length === 0) return;
    setIsGenerating(true);
    setShareStatus(null);

    try {
      // Ensure all custom web fonts (Mangal, Kruti Dev, Inter) are fully loaded
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }

      // Small pause to allow offscreen DOM layout & CSS to settle
      await new Promise(resolve => setTimeout(resolve, 150));

      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(posterRef.current, {
        scale: 2, // High resolution (e.g. 2400px wide for crystal clarity)
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200
      });

      canvas.toBlob((blob) => {
        if (blob) {
          if (generatedImageUrl) {
            URL.revokeObjectURL(generatedImageUrl);
          }
          const url = URL.createObjectURL(blob);
          setGeneratedBlob(blob);
          setGeneratedImageUrl(url);
        }
        setIsGenerating(false);
      }, 'image/png', 1.0);

    } catch (err) {
      console.error('Error generating poster image:', err);
      alert('इमेज तैयार करने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      setIsGenerating(false);
    }
  };

  // Trigger generation whenever modal opens or scope changes
  useEffect(() => {
    if (isOpen) {
      setGeneratedImageUrl(null);
      setGeneratedBlob(null);
      setShareStatus(null);
      const timer = setTimeout(() => {
        generatePosterImage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, exportScope, targetMeetings.length]);

  if (!isOpen) return null;

  const fileName = `Social_Audit_Baghpat_Upcoming_Meetings_${asOfDate}.png`;

  // Handle Download
  const handleDownload = () => {
    if (!generatedBlob) return;
    saveAs(generatedBlob, fileName);
  };

  // Handle WhatsApp Sharing
  const handleShareWhatsApp = async () => {
    if (!generatedBlob) return;

    const file = new File([generatedBlob], fileName, { type: 'image/png' });
    const shareData = {
      title: 'सामाजिक ऑडिट जनपद बागपत - आगामी बैठकें',
      text: `सामाजिक ऑडिट जनपद बागपत: आगामी ग्राम सभा बैठकों का विस्तृत रोस्टर कार्यक्रम (कुल ${targetMeetings.length} बैठकें - विकास खण्ड बागपत एवं बड़ौत)।`,
      files: [file]
    };

    // Check if browser supports Web Share API with file attachments
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share(shareData);
        setShareStatus('इमेज सफलतापूर्वक शेयर की गई!');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back:', err);
        } else {
          return; // User cancelled share sheet
        }
      }
    }

    // Fallback: Download file automatically and open WhatsApp Web with prefilled message
    saveAs(generatedBlob, fileName);
    setShareStatus('इमेज डाउनलोड हो गई है! कृपया WhatsApp में इसे Attach करके शेयर करें।');

    const whatsappMessage = encodeURIComponent(
      `*सामाजिक ऑडिट – जनपद बागपत*\n` +
      `*आगामी ग्राम सभा बैठकों का विस्तृत कार्यक्रम*\n` +
      `वित्तीय वर्ष 2026-27 (विकास खण्ड बागपत एवं बड़ौत)\n\n` +
      `📌 कुल आगामी बैठकें: ${targetMeetings.length}\n` +
      `• बागपत खण्ड: ${baghpatCount} बैठकें\n` +
      `• बड़ौत खण्ड: ${barautCount} बैठकें\n` +
      `• संशोधित बैठकें: ${amendedCount}\n\n` +
      `कृपया विस्तृत कार्यक्रम देखने हेतु संलग्न पोस्टर इमेज का अवलोकन करें।`
    );

    window.open(`https://api.whatsapp.com/send?text=${whatsappMessage}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Dialog Shell */}
      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shadow-inner">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>आगामी बैठकों का संपूर्ण पोस्टर (Single Image Export)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {targetMeetings.length} बैठकें सम्मिलित
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                जनपद बागपत की समस्त आगामी सोशल ऑडिट बैठकों की एकल, उच्च-रिज़ॉल्यूशन WhatsApp-रेडी इमेज
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs">
          {/* Scope Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">निर्यात का दायरा:</span>
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <button
                onClick={() => setExportScope('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  exportScope === 'all'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                संपूर्ण जनपद ({allUpcomingMeetings.length} आगामी)
              </button>
              {filteredUpcomingRecords && filteredUpcomingRecords.length > 0 && filteredUpcomingRecords.length !== allUpcomingMeetings.length && (
                <button
                  onClick={() => setExportScope('filtered')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    exportScope === 'filtered'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  वर्तमान फ़िल्टर ({filteredUpcomingRecords.length} आगामी)
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={generatePosterImage}
              disabled={isGenerating}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-2xs disabled:opacity-50"
              title="पुनः इमेज बनाएं"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={handleDownload}
              disabled={!generatedBlob || isGenerating}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-200" />
              <span>इमेज डाउनलोड करें (PNG)</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={!generatedBlob || isGenerating}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-100" />
              <span>WhatsApp पर शेयर करें</span>
            </button>
          </div>
        </div>

        {/* Share Status Banner */}
        {shareStatus && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{shareStatus}</span>
            </div>
            <button onClick={() => setShareStatus(null)} className="text-emerald-700 hover:underline">
              हटाएं
            </button>
          </div>
        )}

        {/* Modal Center: Live Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex items-start justify-center">
          {isGenerating ? (
            <div className="my-auto text-center space-y-3 py-16">
              <Loader2 className="w-10 h-10 text-blue-700 animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                उच्च-रिज़ॉल्यूशन पोस्टर तैयार हो रहा है...
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {targetMeetings.length} ग्राम पंचायतों का विस्तृत विवरण, अधिकारी एवं टीम सूची संकलित की जा रही है।
              </p>
            </div>
          ) : generatedImageUrl ? (
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-300 p-2">
              <div className="p-2 text-center text-xs text-slate-500 border-b border-slate-100 font-medium flex items-center justify-between">
                <span>🔍 पोस्टर का पूर्वावलोकन (स्क्रॉल कर संपूर्ण विवरण देखें)</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {targetMeetings.length} बैठकें | कोई फोन नंबर नहीं
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImageUrl}
                alt="Social Audit Baghpat Upcoming Meetings Poster"
                className="w-full h-auto object-contain block"
              />
            </div>
          ) : (
            <div className="my-auto text-center space-y-2 py-16 text-slate-500">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">कोई आगामी बैठक उपलब्ध नहीं है।</p>
            </div>
          )}
        </div>

        {/* Modal Bottom Information Bar */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              गोपनीयता सुरक्षा: किसी भी अधिकारी अथवा बी०आर०पी० का मोबाइल नंबर इमेज में प्रदर्शित नहीं किया गया है।
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            पोर्टल संदर्भ तिथि: {formatDisplayDate(asOfDate)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFF-SCREEN CAPTURE CANVAS (1200px Fixed Width for Razor-Sharp Poster)     */}
      {/* ========================================================================= */}
      <div
        ref={posterRef}
        style={{
          position: 'absolute',
          left: '-99999px',
          top: 0,
          width: '1200px',
          minHeight: '1600px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif"
        }}
        className="p-10 bg-white text-slate-900"
      >
        {/* POSTER HEADER */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 mb-8 shadow-md border-4 border-blue-900/60 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider mb-2.5">
                <Shield className="w-3.5 h-3.5 text-blue-300" />
                <span>कार्यालय जिला विकास अधिकारी / परियोजना निदेशक, डी०आर०डी०ए० बागपत</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>सामाजिक ऑडिट – जनपद बागपत</span>
              </h1>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                आगामी ग्राम सभा बैठकों का विस्तृत कार्यक्रम (रोस्टर विवरण)
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                वित्तीय वर्ष 2026–27 • विकास खण्ड: बागपत एवं बड़ौत की समस्त आगामी ग्राम पंचायत बैठकें
              </p>
            </div>

            {/* Emblem/Official Stamp Representation */}
            <div className="text-right shrink-0 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
              <div className="text-[11px] font-bold text-slate-300 uppercase">संदर्भ तिथि</div>
              <div className="text-lg font-black text-white font-mono">{formatDisplayDate(asOfDate)}</div>
              <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">आधिकारिक अनुश्रवण पोस्टर</div>
            </div>
          </div>

          {/* Key Summary Strip inside Header */}
          <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
              <div className="text-[11px] font-bold text-slate-300">कुल आगामी बैठकें</div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">{targetMeetings.length}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
              <div className="text-[11px] font-bold text-blue-300">विकास खण्ड बागपत</div>
              <div className="text-2xl font-black text-blue-200 font-mono mt-0.5">{baghpatCount}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
              <div className="text-[11px] font-bold text-indigo-300">विकास खण्ड बड़ौत</div>
              <div className="text-2xl font-black text-indigo-200 font-mono mt-0.5">{barautCount}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
              <div className="text-[11px] font-bold text-amber-300">संशोधित रोस्टर बैठकें</div>
              <div className="text-2xl font-black text-amber-200 font-mono mt-0.5">{amendedCount}</div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN GRID OF ALL UPCOMING MEETINGS */}
        <div className="grid grid-cols-2 gap-4">
          {targetMeetings.map((sabha, idx) => {
            const effDate = getEffectiveMeetingDate(sabha);
            const isAmended = isMeetingAmended(sabha);
            const origDate = getOriginalMeetingDate(sabha);
            const isBaghpat = sabha.block === 'Baghpat';

            return (
              <div
                key={sabha.id}
                style={{ breakInside: 'avoid' }}
                className={`rounded-2xl p-4.5 bg-white border-2 flex flex-col justify-between shadow-xs ${
                  isAmended
                    ? 'border-amber-300 bg-amber-50/20'
                    : isBaghpat
                    ? 'border-blue-200'
                    : 'border-indigo-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: S.No, GP Name, Block Badge, Revised Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          ग्राम पंचायत
                        </div>
                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {renderText(sabha.gpNameUnicode, sabha.gpNameKrutiDev)}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isBaghpat
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}
                      >
                        {sabha.block === 'Baghpat' ? 'वि०ख० बागपत' : 'वि०ख० बड़ौत'}
                      </span>

                      {isAmended && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          संशोधित बैठक
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Section 1: Meeting Date & Time */}
                  <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1.5">
                    {isAmended && origDate && origDate !== effDate ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px] text-slate-500 font-medium">पुरानी तारीख:</span>
                          <span className="font-bold font-mono text-slate-500 line-through">
                            {formatDisplayDate(origDate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-amber-950 font-bold bg-amber-100/80 p-1.5 rounded-lg border border-amber-300">
                          <span className="text-xs">बैठक की नई तारीख:</span>
                          <span className="font-mono text-sm font-black text-amber-950">
                            {formatDisplayDate(effDate)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-800">
                        <span className="font-medium text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-700" />
                          <span>बैठक दिनांक:</span>
                        </span>
                        <span className="font-bold font-mono text-sm text-slate-900">
                          {formatDisplayDate(effDate)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                      <span className="font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>बैठक का समय:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {renderText(sabha.timeUnicode, sabha.timeKrutiDev) || '1:00 बजे'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                      <span className="font-medium text-slate-500 flex items-center gap-1 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>स्थान:</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-right truncate max-w-[280px]">
                        {renderText(sabha.venueUnicode, sabha.venueKrutiDev) || `पंचायत घर ${sabha.gpNameUnicode}`}
                      </span>
                    </div>
                  </div>

                  {/* Section 2: Key Personnel (BRP, Supervisor, Team) - STRICTLY NO PHONE NUMBERS */}
                  <div className="text-xs space-y-2 pt-1">
                    {/* BRP Name */}
                    <div className="flex items-start justify-between text-slate-700">
                      <span className="text-slate-500 font-medium shrink-0">संबंधित BRP:</span>
                      <span className="font-black text-blue-900 text-right">
                        {renderText(sabha.brpName || sabha.brpUnicode, sabha.brpKrutiDev) || 'उपलब्ध नहीं'}
                      </span>
                    </div>

                    {/* Supervisor Officer & Designation */}
                    <div className="flex items-start justify-between text-slate-700 gap-2">
                      <span className="text-slate-500 font-medium shrink-0">पर्यवेक्षक अधिकारी:</span>
                      <span className="font-bold text-slate-800 text-right text-[11px] leading-snug">
                        {renderText(sabha.supervisorOfficerUnicode, sabha.supervisorOfficerKrutiDev) || 'उपलब्ध नहीं'}
                      </span>
                    </div>

                    {/* Team Members */}
                    <div className="pt-1.5 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        सोशल ऑडिट टीम सदस्य:
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {renderText(sabha.teamMembersUnicode, sabha.teamMembersKrutiDev) || 'उपलब्ध नहीं'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Schemes */}
                {(sabha.hasNSAP || sabha.hasMGNREGA || sabha.hasPMAYG) && (
                  <div className="flex items-center gap-1.5 pt-2.5 mt-2.5 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium">योजनाएं:</span>
                    {sabha.hasNSAP && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        NSAP पेंशन
                      </span>
                    )}
                    {sabha.hasMGNREGA && (
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        मनरेगा
                      </span>
                    )}
                    {sabha.hasPMAYG && (
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
                        प्र०आ०ग्रा०
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* POSTER FOOTER */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200 rounded-3xl bg-slate-900 text-white p-6 shadow-md text-center space-y-2">
          <div className="text-base font-black tracking-wide text-white">
            जनपद बागपत, उत्तर प्रदेश
          </div>
          <p className="text-xs text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed">
            सभी संबंधित BRP persons एवं टीम सदस्यों से अनुरोध है कि निर्धारित तिथि, समय एवं स्थान पर अनिवार्य रूप से उपस्थित रहकर सोशल ऑडिट की कार्यवाही पूर्ण कराएं।
          </p>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>आधिकारिक रूप से जनरेटेड: {liveDelhiDate || asOfDate} {liveDelhiTime || ''}</span>
            <span>सोशल ऑडिट अनुश्रवण प्रणाली • विकास भवन, बागपत</span>
            <span>पृष्ठ: एकल विस्तृत रोस्टर पोस्टर</span>
          </div>
        </div>

      </div>

    </div>
  );
}

