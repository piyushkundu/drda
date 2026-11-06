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
  Loader2, RefreshCw, Eye, CheckCircle2, FileImage, MessageSquare,
  ChevronDown
} from 'lucide-react';

interface UpcomingMeetingsImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredUpcomingRecords?: SocialAuditRecord[];
  targetDate?: string;
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
  filteredUpcomingRecords,
  targetDate
}: UpcomingMeetingsImageModalProps) {
  const { records, asOfDate, fontViewMode, liveDelhiDate, liveDelhiTime } = useSocialAuditStore();

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

  // Distinct upcoming dates with count
  const availableUpcomingDates = useMemo(() => {
    const datesMap = new Map<string, number>();
    allUpcomingMeetings.forEach(r => {
      const d = getEffectiveMeetingDate(r);
      datesMap.set(d, (datesMap.get(d) || 0) + 1);
    });
    return Array.from(datesMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allUpcomingMeetings]);

  // Default next upcoming date: preferred targetDate prop, or earliest date in upcoming
  const defaultNextDate = useMemo(() => {
    if (targetDate && availableUpcomingDates.some(d => d.date === targetDate)) {
      return targetDate;
    }
    if (availableUpcomingDates.length > 0) {
      return availableUpcomingDates[0].date;
    }
    return asOfDate;
  }, [targetDate, availableUpcomingDates, asOfDate]);

  // Date selection filter: 'next_date' (DEFAULT) | specific date string | 'all_dates'
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('next_date');

  // Reset to 'next_date' whenever modal opens or targetDate changes
  useEffect(() => {
    if (isOpen) {
      setSelectedDateFilter('next_date');
    }
  }, [isOpen, targetDate]);

  // Active date being displayed
  const activeDate = useMemo(() => {
    if (selectedDateFilter === 'next_date') return defaultNextDate;
    if (selectedDateFilter === 'all_dates') return 'all';
    return selectedDateFilter;
  }, [selectedDateFilter, defaultNextDate]);

  const isAllDates = activeDate === 'all';
  const isTodayDate = activeDate === asOfDate;

  // Selected records to render: strictly for the selected date (or all if user chooses all)
  const targetMeetings = useMemo(() => {
    if (isAllDates) {
      return allUpcomingMeetings;
    }
    return allUpcomingMeetings.filter(r => getEffectiveMeetingDate(r) === activeDate);
  }, [allUpcomingMeetings, isAllDates, activeDate]);

  const baghpatCount = useMemo(() => targetMeetings.filter(r => r.block === 'Baghpat').length, [targetMeetings]);
  const barautCount = useMemo(() => targetMeetings.filter(r => r.block === 'Baraut').length, [targetMeetings]);
  const amendedCount = useMemo(() => targetMeetings.filter(r => isMeetingAmended(r)).length, [targetMeetings]);

  const blockSummaryText = useMemo(() => {
    const hasBaghpat = baghpatCount > 0;
    const hasBaraut = barautCount > 0;
    if (hasBaghpat && hasBaraut) return 'विकास खण्ड: बागपत एवं बड़ौत';
    if (hasBaghpat) return 'विकास खण्ड: बागपत';
    if (hasBaraut) return 'विकास खण्ड: बड़ौत';
    return 'जनपद बागपत';
  }, [baghpatCount, barautCount]);

  // Clean renderText helper respecting fontViewMode and stripping phone numbers
  const renderText = (unicodeText?: string, krutiText?: string) => {
    const cleanedUnicode = stripPhoneNumbers(unicodeText);
    const cleanedKruti = stripPhoneNumbers(krutiText);
    return renderAuditText(fontViewMode, cleanedUnicode, cleanedKruti);
  };

  // Generate Image via html2canvas-pro
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

      const { default: html2canvas } = await import('html2canvas-pro');

      const canvas = await html2canvas(posterRef.current, {
        scale: 2, // High resolution (2000px wide for crisp rendering)
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1000
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

  // Trigger generation whenever modal opens or active date changes
  useEffect(() => {
    if (isOpen && targetMeetings.length > 0) {
      setGeneratedImageUrl(null);
      setGeneratedBlob(null);
      setShareStatus(null);
      const timer = setTimeout(() => {
        generatePosterImage();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeDate, targetMeetings.length]);

  if (!isOpen) return null;

  const fileName = isAllDates
    ? `Social_Audit_Baghpat_All_Upcoming_${asOfDate}.png`
    : `Social_Audit_Baghpat_Meeting_${activeDate}.png`;

  // Handle Download
  const handleDownload = () => {
    if (!generatedBlob) return;
    saveAs(generatedBlob, fileName);
  };

  // Handle WhatsApp Sharing
  const handleShareWhatsApp = async () => {
    if (!generatedBlob) return;

    const file = new File([generatedBlob], fileName, { type: 'image/png' });
    const dateFormatted = isAllDates ? 'समस्त आगामी बैठकें' : formatDisplayDate(activeDate);
    const shareTitle = `सामाजिक ऑडिट जनपद बागपत - बैठक सूचना (${dateFormatted})`;
    const shareText = `सामाजिक ऑडिट जनपद बागपत: ${isTodayDate ? 'आज' : 'अगली निर्धारित तिथि'} (${dateFormatted}) की ग्राम सभा बैठकों का विवरण।`;

    // Check if browser supports Web Share API with file attachments
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file]
        });
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

    const meetingsListText = targetMeetings
      .map((m, i) => `${i + 1}. *ग्राम पंचायत ${m.gpNameUnicode}* (${m.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'})\n   ⏰ समय: ${m.timeUnicode || '1:00 बजे'} | 📍 स्थान: ${m.venueUnicode || 'पंचायत घर ' + m.gpNameUnicode}\n   👤 BRP: ${m.brpName || m.brpUnicode}\n   🛡️ पर्यवेक्षक: ${m.supervisorOfficerUnicode || 'पर्यवेक्षक अधिकारी'}`)
      .join('\n\n');

    const whatsappMessage = encodeURIComponent(
      `*सामाजिक ऑडिट – जनपद बागपत*\n` +
      `*ग्राम सभा बैठक सूचना पत्र*\n` +
      `📅 *बैठक दिनांक: ${dateFormatted}* ${isTodayDate ? '(आज की बैठक)' : ''}\n` +
      `🏛️ ${blockSummaryText}\n\n` +
      `📌 *निर्धारित बैठकें (कुल ${targetMeetings.length}):*\n` +
      meetingsListText +
      `\n\nकृपया विस्तृत कार्यक्रम एवं टीम सूची हेतु संलग्न पोस्टर का अवलोकन करें।`
    );

    window.open(`https://api.whatsapp.com/send?text=${whatsappMessage}`, '_blank');
  };

  const nextDateFormatted = formatDisplayDate(defaultNextDate);
  const nextDateCount = allUpcomingMeetings.filter(r => getEffectiveMeetingDate(r) === defaultNextDate).length;

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
                <span>
                  {isAllDates
                    ? 'समस्त आगामी बैठकों का पोस्टर'
                    : `${isTodayDate ? 'आज की बैठक' : 'अगली बैठक'} सूचना पोस्टर (${formatDisplayDate(activeDate)})`}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {targetMeetings.length} ग्राम पंचायतें
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {isAllDates 
                  ? 'जनपद बागपत की समस्त आगामी सोशल ऑडिट बैठकों का विस्तृत पोस्टर' 
                  : `दिनांक ${formatDisplayDate(activeDate)} को आयोजित होने वाली बैठकों का आधिकारिक WhatsApp-रेडी पोस्टर`}
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
          
          {/* Date Selector Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              <span>बैठक दिनांक:</span>
            </span>

            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="bg-white border-2 border-blue-600 text-blue-950 font-bold text-xs rounded-xl px-3 py-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="next_date">
                ⚡ {defaultNextDate === asOfDate ? 'आज की बैठक' : 'अगली बैठक'}: {nextDateFormatted} ({nextDateCount} ग्राम पंचायत)
              </option>
              
              {availableUpcomingDates.length > 1 && (
                <optgroup label="अन्य आगामी तिथियां">
                  {availableUpcomingDates
                    .filter(d => d.date !== defaultNextDate)
                    .map(({ date, count }) => (
                      <option key={date} value={date}>
                        दिनांक {formatDisplayDate(date)} ({count} बैठकें)
                      </option>
                    ))}
                </optgroup>
              )}

              <option value="all_dates">
                समस्त आगामी बैठकें ({allUpcomingMeetings.length} बैठकें)
              </option>
            </select>
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
                {isAllDates ? 'समस्त आगामी बैठकों का पोस्टर' : `दिनांक ${formatDisplayDate(activeDate)} का पोस्टर`} तैयार हो रहा है...
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {targetMeetings.length} ग्राम पंचायतों का विवरण, BRP, पर्यवेक्षक एवं टीम सदस्य संकलित किए जा रहे हैं।
              </p>
            </div>
          ) : generatedImageUrl ? (
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-300 p-2">
              <div className="p-2 text-center text-xs text-slate-500 border-b border-slate-100 font-medium flex items-center justify-between">
                <span>🔍 पोस्टर का पूर्वावलोकन (Preview)</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  दिनांक: {isAllDates ? 'समस्त तिथियां' : formatDisplayDate(activeDate)} | {targetMeetings.length} बैठकें | कोई फोन नंबर नहीं
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImageUrl}
                alt="Social Audit Baghpat Upcoming Meeting Poster"
                className="w-full h-auto object-contain block"
              />
            </div>
          ) : (
            <div className="my-auto text-center space-y-2 py-16 text-slate-500">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">चयनित दिनांक पर कोई आगामी बैठक उपलब्ध नहीं है।</p>
            </div>
          )}
        </div>

        {/* Modal Bottom Information Bar */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              गोपनीयता सुरक्षा: किसी भी BRP अथवा पर्यवेक्षक अधिकारी का मोबाइल नंबर इमेज में प्रदर्शित नहीं किया गया है।
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            सक्रिय संदर्भ तिथि: {formatDisplayDate(asOfDate)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFF-SCREEN CAPTURE CANVAS (1000px Fixed Width for Razor-Sharp Poster)     */}
      {/* ========================================================================= */}
      <div
        ref={posterRef}
        style={{
          position: 'absolute',
          left: '-99999px',
          top: 0,
          width: '1000px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif"
        }}
        className="p-8 bg-white text-slate-900"
      >
        {/* POSTER HEADER */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #0c2340 50%, #1e1b4b 100%)',
            borderColor: 'rgba(30, 58, 138, 0.8)'
          }}
          className="rounded-3xl text-white p-7 mb-6 shadow-md border-4 relative overflow-hidden"
        >
          <div className="relative z-10 flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider mb-2.5">
                <Shield className="w-3.5 h-3.5 text-blue-300" />
                <span>कार्यालय जिला विकास अधिकारी / परियोजना निदेशक, डी०आर०डी०ए० बागपत</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>सामाजिक ऑडिट – जनपद बागपत</span>
              </h1>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {isAllDates 
                  ? 'आगामी ग्राम सभा बैठकों का विस्तृत कार्यक्रम' 
                  : `ग्राम सभा खुली बैठक सूचना पत्र`}
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                वित्तीय वर्ष 2026–27 • {blockSummaryText}
              </p>
            </div>

            {/* Emblem/Official Stamp Representation */}
            <div className="text-right shrink-0 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
              <div className="text-[10px] font-bold text-slate-300 uppercase">आधिकारिक पत्र</div>
              <div className="text-sm font-black text-white font-mono mt-0.5">
                {isAllDates ? 'समस्त आगामी' : formatDisplayDate(activeDate)}
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">डी०आर०डी०ए० अनुश्रवण</div>
            </div>
          </div>

          {/* DATE & TIME HIGHLIGHT STRIP */}
          <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 bg-white/10 p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-300">
                  {isAllDates ? 'रोस्टर दायरा' : isTodayDate ? 'आज की बैठक दिनांक' : 'बैठक की निर्धारित तिथि'}
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {isAllDates ? 'समस्त आगामी बैठकें' : formatDisplayDate(activeDate)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-blue-200">
                <Clock className="w-4 h-4 text-blue-300" />
                <span>समय: <strong>1:00 बजे दोपहर</strong></span>
              </div>
              <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-400/30 font-bold">
                कुल बैठकें: {targetMeetings.length} ग्राम पंचायत
              </div>
            </div>
          </div>
        </div>

        {/* MEETINGS DISPLAY SECTION */}
        {targetMeetings.length === 1 ? (
          /* ========================================================================= */
          /* CASE 1: EXACTLY 1 MEETING ON THIS DATE -> PROMINENT LARGE HERO CARD       */
          /* ========================================================================= */
          (() => {
            const sabha = targetMeetings[0];
            const effDate = getEffectiveMeetingDate(sabha);
            const isAmended = isMeetingAmended(sabha);
            const origDate = getOriginalMeetingDate(sabha);
            const isBaghpat = sabha.block === 'Baghpat';

            return (
              <div
                style={{ breakInside: 'avoid' }}
                className={`rounded-3xl p-6 bg-white border-3 shadow-md space-y-5 ${
                  isAmended ? 'border-amber-400 bg-amber-50/20' : 'border-blue-400'
                }`}
              >
                {/* Card Top Banner: GP Name & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      ग्राम पंचायत (आयोजन स्थल)
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mt-0.5">
                      {renderText(sabha.gpNameUnicode, sabha.gpNameKrutiDev)}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isBaghpat
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                      }`}
                    >
                      {isBaghpat ? 'विकास खण्ड: बागपत' : 'विकास खण्ड: बड़ौत'}
                    </span>

                    {isAmended && (
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>संशोधित बैठक</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* If Amended Date Details */}
                {isAmended && origDate && origDate !== effDate && (
                  <div className="bg-amber-100/90 border border-amber-300 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-950 font-bold">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span>मूल रोस्टर में पूर्व निर्धारित तिथि: <span className="line-through text-slate-500 font-mono">{formatDisplayDate(origDate)}</span></span>
                    </div>
                    <div className="bg-amber-200 px-3 py-1 rounded-xl border border-amber-400 text-sm font-black font-mono">
                      ➔ नई संशोधित बैठक तिथि: {formatDisplayDate(effDate)}
                    </div>
                  </div>
                )}

                {/* Key Details Grid: Date/Time & Venue */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <Calendar className="w-4 h-4 text-blue-700" />
                      <span>बैठक दिनांक एवं समय</span>
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono pt-1">
                      {formatDisplayDate(effDate)} (समय: {renderText(sabha.timeUnicode, sabha.timeKrutiDev) || '1:00 बजे'})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      प्रारम्भ तिथि: {formatDisplayDate(sabha.startDate)}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <MapPin className="w-4 h-4 text-emerald-700" />
                      <span>बैठक का स्थान (Venue)</span>
                    </div>
                    <div className="text-base font-black text-slate-900 pt-1">
                      {renderText(sabha.venueUnicode, sabha.venueKrutiDev) || `पंचायत घर ${sabha.gpNameUnicode}`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ग्राम पंचायत {sabha.gpNameUnicode}, {sabha.block === 'Baghpat' ? 'वि०ख० बागपत' : 'वि०ख० बड़ौत'}
                    </div>
                  </div>
                </div>

                {/* Personnel Grid: BRP & Supervisor (STRICTLY NO PHONE NUMBERS) */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* BRP Box */}
                  <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-1">
                    <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      आवंटित बी०आर०पी० (BRP)
                    </div>
                    <div className="text-lg font-black text-blue-950 pt-0.5">
                      {renderText(sabha.brpName || sabha.brpUnicode, sabha.brpKrutiDev) || 'उपलब्ध नहीं'}
                    </div>
                    <div className="text-[11px] font-medium text-blue-800">
                      ब्लॉक रिसोर्स पर्सन (सोशल ऑडिट)
                    </div>
                  </div>

                  {/* Supervisor Box */}
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-1">
                    <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                      जनपद स्तरीय पर्यवेक्षक अधिकारी
                    </div>
                    <div className="text-lg font-black text-indigo-950 pt-0.5 leading-snug">
                      {renderText(sabha.supervisorOfficerUnicode, sabha.supervisorOfficerKrutiDev) || 'उपलब्ध नहीं'}
                    </div>
                    <div className="text-[11px] font-medium text-indigo-800">
                      प्रशासनिक पर्यवेक्षण अधिकारी
                    </div>
                  </div>
                </div>

                {/* Team Members Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Users className="w-4 h-4 text-blue-700" />
                    <span>सोशल ऑडिट टीम सदस्य (VRPs/सदस्य):</span>
                  </div>
                  <div className="text-slate-800 font-semibold leading-relaxed bg-white p-3 rounded-xl border border-slate-200 text-[13px]">
                    {renderText(sabha.teamMembersUnicode, sabha.teamMembersKrutiDev) || 'टीम सदस्य विवरण उपलब्ध नहीं'}
                  </div>
                </div>

                {/* Schemes */}
                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="text-slate-500 font-bold">संबद्ध ऑडिट योजनाएं:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs">
                    NSAP पेंशन ऑडिट (वृद्धावस्था, विधवा, दिव्यांग)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs">
                    महात्मा गांधी नरेगा योजना
                  </span>
                </div>

                {/* Mandatory Official Instruction */}
                <div className="bg-blue-900 text-white p-3.5 rounded-2xl text-xs font-medium text-center">
                  ⚠️ <strong>महत्वपूर्ण निर्देश:</strong> सभी संबंधित BRP, तकनीकी सहायक एवं सोशल ऑडिट टीम सदस्यों को निर्देशित किया जाता है कि निर्धारित तिथि, समय एवं स्थान पर अनिवार्य रूप से उपस्थित रहकर सोशल ऑडिट की समस्त कार्यवाही पूर्ण कराएं।
                </div>
              </div>
            );
          })()
        ) : (
          /* ========================================================================= */
          /* CASE 2: MULTIPLE MEETINGS ON THIS DATE -> CLEAN 2-COLUMN GRID              */
          /* ========================================================================= */
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
        )}

        {/* POSTER FOOTER */}
        <div
          style={{ backgroundColor: '#0f172a' }}
          className="mt-6 pt-5 border-t-2 border-slate-200 rounded-3xl text-white p-5 shadow-md text-center space-y-2"
        >
          <div className="text-sm font-black tracking-wide text-white">
            जनपद बागपत, उत्तर प्रदेश • कार्यालय जिला विकास अधिकारी / परियोजना निदेशक
          </div>
          <p className="text-[11px] text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            सभी संबंधित BRP, नोडल अधिकारी एवं सोशल ऑडिट टीम सदस्यों से अनुरोध है कि निर्धारित तिथि, समय एवं स्थान पर अनिवार्य रूप से उपस्थित रहकर सोशल ऑडिट की कार्यवाही पूर्ण कराएं।
          </p>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>आधिकारिक रूप से जनरेटेड: {liveDelhiDate || asOfDate} {liveDelhiTime || ''}</span>
            <span>सोशल ऑडिट अनुश्रवण प्रणाली • विकास भवन, बागपत</span>
            <span>आधिकारिक WhatsApp सूचना पोस्टर</span>
          </div>
        </div>

      </div>

    </div>
  );
}
